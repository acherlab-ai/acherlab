import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import DaytonaService from '../services/daytona.js';

const router = Router();
router.use(authMiddleware, adminOnly);

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, username, email, plan, created_at, updated_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

router.patch('/users/:id/plan', (req, res) => {
  const { plan } = req.body;
  if (!['free', 'job', 'pro', 'admin'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }
  db.prepare("UPDATE users SET plan = ?, updated_at = datetime('now') WHERE id = ?").run(plan, req.params.id);
  const user = db.prepare('SELECT id, username, email, plan, created_at FROM users WHERE id = ?').get(req.params.id);
  res.json(user);
});

router.get('/api-keys', (req, res) => {
  const keys = db.prepare('SELECT * FROM api_keys ORDER BY created_at DESC').all();
  res.json(keys);
});

router.post('/api-keys', (req, res) => {
  const { label, key, max_cpu, max_ram, max_disk } = req.body;
  if (!label || !key) return res.status(400).json({ error: 'Missing fields' });
  const id = uuidv4();
  db.prepare(`
    INSERT INTO api_keys (id, label, key, max_cpu, max_ram, max_disk, total_cpu, total_ram, total_disk, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?)
  `).run(id, label, key, max_cpu || 10, max_ram || 10, max_disk || 30, req.user.username);
  res.json(db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id));
});

router.put('/api-keys/:id', (req, res) => {
  const { label, max_cpu, max_ram, max_disk, is_active } = req.body;
  const updates = [];
  const params = [];
  if (label !== undefined) { updates.push('label = ?'); params.push(label); }
  if (max_cpu !== undefined) { updates.push('max_cpu = ?'); params.push(max_cpu); }
  if (max_ram !== undefined) { updates.push('max_ram = ?'); params.push(max_ram); }
  if (max_disk !== undefined) { updates.push('max_disk = ?'); params.push(max_disk); }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  db.prepare(`UPDATE api_keys SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json(db.prepare('SELECT * FROM api_keys WHERE id = ?').get(req.params.id));
});

router.delete('/api-keys/:id', (req, res) => {
  db.prepare('DELETE FROM api_keys WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

router.get('/plan-limits', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE key LIKE ?').all('plan_%');
  const limits = {};
  for (const s of settings) {
    limits[s.key] = s.value;
  }
  res.json({
    free: { cpu: limits.free_cpu || '2', ram: limits.free_ram || '2', disk: limits.free_disk || '10', hours: limits.free_hours || '8' },
    job: { cpu: limits.job_cpu || '4', ram: limits.job_ram || '4', disk: limits.job_disk || '20', hours: limits.job_hours || '12' },
    pro: { cpu: limits.pro_cpu || '4', ram: limits.pro_ram || '8', disk: limits.pro_disk || '30' }
  });
});

router.post('/plan-limits', (req, res) => {
  const { plan, key, value } = req.body;
  const dbKey = `${plan}_${key}`;
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(dbKey, String(value));
  res.json({ message: 'Updated' });
});

router.get('/sandboxes', (req, res) => {
  const sandboxes = db.prepare('SELECT s.*, u.username FROM sandboxes s JOIN users u ON s.user_id = u.id ORDER BY s.started_at DESC').all();
  res.json(sandboxes);
});

router.get('/stats', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalLabs = db.prepare('SELECT COUNT(*) as count FROM sandboxes').get().count;
  const runningLabs = db.prepare("SELECT COUNT(*) as count FROM sandboxes WHERE status IN ('creating','started')").get().count;
  const planDist = db.prepare('SELECT plan, COUNT(*) as count FROM users GROUP BY plan').all();
  const keys = db.prepare('SELECT * FROM api_keys WHERE is_active = 1').all();

  const apiUsage = keys.map(k => {
    const usage = db.prepare(`
      SELECT COALESCE(SUM(cpu), 0) as used_cpu, COALESCE(SUM(ram), 0) as used_ram, COALESCE(SUM(disk), 0) as used_disk,
             COUNT(*) as sandbox_count
      FROM sandboxes WHERE api_key_id = ? AND status IN ('creating', 'started')
    `).get(k.id);
    return {
      id: k.id,
      label: k.label,
      max_cpu: k.max_cpu,
      max_ram: k.max_ram,
      max_disk: k.max_disk,
      used_cpu: usage.used_cpu,
      used_ram: usage.used_ram,
      used_disk: usage.used_disk,
      sandbox_count: usage.sandbox_count,
      cpu_pct: Math.round((usage.used_cpu / Math.max(k.max_cpu, 1)) * 100),
      ram_pct: Math.round((usage.used_ram / Math.max(k.max_ram, 1)) * 100),
      disk_pct: Math.round((usage.used_disk / Math.max(k.max_disk, 1)) * 100)
    };
  });

  const totalCapacity = keys.reduce((a, k) => ({
    cpu: a.cpu + k.max_cpu,
    ram: a.ram + k.max_ram,
    disk: a.disk + k.max_disk
  }), { cpu: 0, ram: 0, disk: 0 });

  res.json({
    totalUsers,
    totalLabs,
    runningLabs,
    planDist,
    apiKeys: apiUsage,
    totalCapacity,
    usedCapacity: apiUsage.reduce((a, u) => ({
      cpu: a.cpu + u.used_cpu,
      ram: a.ram + u.used_ram,
      disk: a.disk + u.used_disk
    }), { cpu: 0, ram: 0, disk: 0 })
  });
});

export default router;
