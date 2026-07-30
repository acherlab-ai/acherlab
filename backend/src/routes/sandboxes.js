import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authMiddleware } from '../middleware/auth.js';
import DaytonaService from '../services/daytona.js';

const router = Router();
router.use(authMiddleware);

const PLANS = {
  free: { maxCpu: 2, maxRam: 2, maxDisk: 10, maxHours: 8, concurrency: 1, snapshots: ['daytona-small'], label: 'Free' },
  job: { maxCpu: 4, maxRam: 4, maxDisk: 20, maxHours: 12, concurrency: 1, snapshots: ['daytona-medium', 'daytona-small'], label: 'Job' },
  pro: { maxCpu: 4, maxRam: 8, maxDisk: 30, maxHours: 0, concurrency: 999, snapshots: ['daytona-large', 'daytona-medium', 'daytona-small'], label: 'Pro' },
};

const SNAPSHOT_MAP = {
  'daytona-small': { snapshot: 'daytona-small', cpu: 1, memory: 1, disk: 3 },
  'daytona-medium': { snapshot: 'daytona-medium', cpu: 2, memory: 4, disk: 8 },
  'daytona-large': { snapshot: 'daytona-large', cpu: 4, memory: 8, disk: 10 },
};

function getActiveApiKey() {
  const keys = db.prepare('SELECT * FROM api_keys WHERE is_active = 1 ORDER BY total_cpu ASC, total_ram ASC LIMIT 1').all();
  return keys[0] || null;
}

function checkApiCapacity(apiKey, cpu, ram, disk) {
  const usage = db.prepare(`
    SELECT COALESCE(SUM(s.cpu), 0) as used_cpu,
           COALESCE(SUM(s.ram), 0) as used_ram,
           COALESCE(SUM(s.disk), 0) as used_disk
    FROM sandboxes s
    WHERE s.api_key_id = ? AND s.status IN ('creating', 'started')
  `).get(apiKey.id);

  return (
    usage.used_cpu + cpu <= apiKey.max_cpu &&
    usage.used_ram + ram <= apiKey.max_ram &&
    usage.used_disk + disk <= apiKey.max_disk
  );
}

router.get('/specs', (req, res) => {
  res.json(SNAPSHOT_MAP);
});

router.get('/plans', (req, res) => {
  res.json(PLANS);
});

router.get('/running', (req, res) => {
  const sandboxes = db.prepare(
    `SELECT * FROM sandboxes WHERE user_id = ? AND status IN ('creating', 'started') ORDER BY started_at DESC`
  ).all(req.user.id);
  res.json(sandboxes);
});

router.get('/history', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const items = db.prepare(
    `SELECT * FROM sandboxes WHERE user_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?`
  ).all(req.user.id, limit, offset);
  const total = db.prepare(
    `SELECT COUNT(*) as count FROM sandboxes WHERE user_id = ?`
  ).get(req.user.id).count;
  res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
});

router.get('/stats', (req, res) => {
  const totalLabs = db.prepare('SELECT COUNT(*) as count FROM sandboxes WHERE user_id = ?').get(req.user.id).count;
  const runningLabs = db.prepare("SELECT COUNT(*) as count FROM sandboxes WHERE user_id = ? AND status IN ('creating','started')").get(req.user.id).count;
  res.json({ totalLabs, runningLabs });
});

router.post('/create', async (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const plan = PLANS[user.plan];
    if (!plan) return res.status(400).json({ error: 'Invalid plan' });

    const { config: configName } = req.body;
    const config = SNAPSHOT_MAP[configName];
    if (!config) return res.status(400).json({ error: 'Invalid config' });

    if (config.cpu > plan.maxCpu || config.memory > plan.maxRam) {
      return res.status(400).json({ error: `Your plan max: ${plan.maxCpu}vCPU / ${plan.maxRam}GB RAM` });
    }

    const running = db.prepare("SELECT COUNT(*) as count FROM sandboxes WHERE user_id = ? AND status IN ('creating','started')").get(user.id).count;
    if (running >= plan.concurrency) {
      return res.status(400).json({ error: `Your plan allows max ${plan.concurrency} concurrent lab(s)` });
    }

    const apiKey = getActiveApiKey();
    if (!apiKey) return res.status(500).json({ error: 'No API key available' });

    if (!checkApiCapacity(apiKey, config.cpu, config.memory, config.disk)) {
      return res.status(400).json({ error: 'System resources exhausted, try again later' });
    }

    const daytona = new DaytonaService(apiKey.key);
    const expiresAt = plan.maxHours > 0
      ? new Date(Date.now() + plan.maxHours * 60 * 60 * 1000).toISOString()
      : null;

    const sandbox = await daytona.createSandbox({
      snapshot: config.snapshot,
      autoStopInterval: plan.maxHours > 0 ? plan.maxHours * 60 : undefined
    });

    let sshData = null;
    try {
      sshData = await daytona.createSshAccess(sandbox.id);
    } catch (e) {
      console.error('SSH failed:', e.message);
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO sandboxes (id, user_id, api_key_id, daytona_id, name, plan, cpu, ram, disk, ssh_token, ssh_command, expires_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, user.id, apiKey.id, sandbox.id, sandbox.name || sandbox.id,
      user.plan, config.cpu, config.memory, config.disk,
      sshData?.token, sshData?.sshCommand, expiresAt, 'started'
    );

    const saved = db.prepare('SELECT * FROM sandboxes WHERE id = ?').get(id);
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/stop', async (req, res) => {
  try {
    const sbox = db.prepare('SELECT * FROM sandboxes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!sbox) return res.status(404).json({ error: 'Sandbox not found' });

    const apiKey = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(sbox.api_key_id);
    if (apiKey) {
      const daytona = new DaytonaService(apiKey.key);
      try { await daytona.deleteSandbox(sbox.daytona_id); } catch (e) {}
    }

    const plan = PLANS[sbox.plan];
    const shouldDelete = plan?.maxHours > 0;
    if (shouldDelete) {
      db.prepare("UPDATE sandboxes SET status = 'destroyed', stopped_at = datetime('now') WHERE id = ?").run(sbox.id);
      res.json({ message: 'Lab destroyed' });
    } else {
      db.prepare("UPDATE sandboxes SET status = 'stopped', stopped_at = datetime('now') WHERE id = ?").run(sbox.id);
      res.json({ message: 'Lab stopped' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/start', async (req, res) => {
  try {
    const sbox = db.prepare('SELECT * FROM sandboxes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!sbox) return res.status(404).json({ error: 'Sandbox not found' });

    const plan = PLANS[sbox.plan];
    if (plan?.maxHours === 0) {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      const apiKey = getActiveApiKey();
      if (!apiKey) return res.status(500).json({ error: 'No API key' });

      const daytona = new DaytonaService(apiKey.key);
      const snapshotKey = `daytona-${sbox.cpu <= 1 ? 'small' : sbox.cpu <= 2 ? 'medium' : 'large'}`;
      const sandbox = await daytona.createSandbox({
        snapshot: SNAPSHOT_MAP[snapshotKey]?.snapshot || 'daytona-small',
      });

      const sshData = await daytona.createSshAccess(sandbox.id);
      db.prepare(`
        UPDATE sandboxes SET daytona_id = ?, ssh_token = ?, ssh_command = ?, status = 'started', started_at = datetime('now'), stopped_at = NULL
        WHERE id = ?
      `).run(sandbox.id, sshData.token, sshData.sshCommand, sbox.id);

      res.json(db.prepare('SELECT * FROM sandboxes WHERE id = ?').get(sbox.id));
    } else {
      return res.status(400).json({ error: 'Cannot restart this plan' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const sbox = db.prepare('SELECT * FROM sandboxes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!sbox) return res.status(404).json({ error: 'Not found' });
  res.json(sbox);
});

export default router;
