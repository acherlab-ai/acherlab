import { useState, useEffect } from 'react';
import { admin } from '../lib/api';

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [planLimits, setPlanLimits] = useState({});
  const [newKey, setNewKey] = useState({ label: '', key: '', max_cpu: 10, max_ram: 10, max_disk: 30 });

  const loadData = async () => {
    try {
      const [s, u, k, l] = await Promise.all([
        admin.stats().catch(() => null),
        admin.users().catch(() => []),
        admin.apiKeys().catch(() => []),
        admin.planLimits().catch(() => ({})),
      ]);
      if (s) setStats(s);
      setUsers(u);
      setApiKeys(k);
      setPlanLimits(l);
    } catch {}
  };

  useEffect(() => { loadData(); }, []);

  const handleAddKey = async (e) => {
    e.preventDefault();
    try {
      await admin.addApiKey(newKey);
      setNewKey({ label: '', key: '', max_cpu: 10, max_ram: 10, max_disk: 30 });
      await loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteKey = async (id) => {
    if (!confirm('Delete this API key?')) return;
    await admin.deleteApiKey(id);
    await loadData();
  };

  const handlePlanChange = async (userId, plan) => {
    await admin.updatePlan(userId, plan);
    await loadData();
  };

  const tabs = ['overview', 'users', 'api-keys', 'settings'];

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-linear-muted text-sm mt-1">Manage platform</p>
      </div>

      <div className="flex gap-1 border-b border-linear-border mb-6">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              tab === t ? 'border-linear-accent text-linear-text' : 'border-transparent text-linear-muted hover:text-linear-text'
            }`}
          >
            {t === 'overview' ? 'Overview' : t === 'users' ? 'Users' : t === 'api-keys' ? 'API Keys' : 'Settings'}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card"><p className="text-xs text-linear-muted uppercase">Total Users</p><p className="text-2xl font-bold mt-1">{stats.totalUsers}</p></div>
            <div className="card"><p className="text-xs text-linear-muted uppercase">Total Labs</p><p className="text-2xl font-bold mt-1">{stats.totalLabs}</p></div>
            <div className="card"><p className="text-xs text-linear-muted uppercase">Running Now</p><p className="text-2xl font-bold mt-1">{stats.runningLabs}</p></div>
            <div className="card"><p className="text-xs text-linear-muted uppercase">API Keys</p><p className="text-2xl font-bold mt-1">{stats.apiKeys?.length || 0}</p></div>
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4">Resource Usage</h2>
            <div className="space-y-4">
              {stats.apiKeys?.map(key => (
                <div key={key.id} className="border border-linear-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{key.label}</p>
                    <p className="text-xs text-linear-muted">{key.sandbox_count} sandboxes</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'CPU', pct: key.cpu_pct, used: key.used_cpu, max: key.max_cpu, unit: 'vCPU' },
                      { label: 'RAM', pct: key.ram_pct, used: key.used_ram, max: key.max_ram, unit: 'GB' },
                      { label: 'Disk', pct: key.disk_pct, used: key.used_disk, max: key.max_disk, unit: 'GB' },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between text-xs text-linear-muted mb-1">
                          <span>{m.label}</span><span>{m.used}/{m.max} {m.unit}</span>
                        </div>
                        <div className="h-1.5 bg-linear-border rounded-full overflow-hidden">
                          <div className="h-full bg-linear-accent rounded-full transition-all" style={{ width: `${Math.min(m.pct, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4">Total Capacity</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'CPU', used: stats.usedCapacity?.cpu || 0, total: stats.totalCapacity?.cpu || 0, unit: 'vCPU' },
                { label: 'RAM', used: stats.usedCapacity?.ram || 0, total: stats.totalCapacity?.ram || 0, unit: 'GB' },
                { label: 'Disk', used: stats.usedCapacity?.disk || 0, total: stats.totalCapacity?.disk || 0, unit: 'GB' },
              ].map(m => (
                <div key={m.label} className="text-center border border-linear-border rounded-xl p-4">
                  <p className="text-sm text-linear-muted">{m.label}</p>
                  <p className="text-xl font-bold mt-1">{m.used}/{m.total} <span className="text-xs text-linear-muted font-normal">{m.unit}</span></p>
                  <div className="h-1.5 bg-linear-border rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-linear-accent rounded-full" style={{ width: `${Math.min((m.used / Math.max(m.total, 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-linear-muted uppercase border-b border-linear-border">
                <th className="text-left py-3 pr-4">Username</th>
                <th className="text-left py-3 pr-4">Email</th>
                <th className="text-left py-3 pr-4">Plan</th>
                <th className="text-left py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-linear-border last:border-0">
                  <td className="py-3 pr-4">{u.username}</td>
                  <td className="py-3 pr-4 text-linear-muted">{u.email}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.plan === 'pro' ? 'bg-linear-accent/20 text-linear-accent' :
                      u.plan === 'job' ? 'bg-linear-yellow/20 text-linear-yellow' :
                      u.plan === 'admin' ? 'bg-linear-red/20 text-linear-red' :
                      'bg-linear-muted/20 text-linear-muted'
                    }`}>{u.plan}</span>
                  </td>
                  <td className="py-3">
                    <select value={u.plan} onChange={e => handlePlanChange(u.id, e.target.value)}
                      className="text-xs py-1 px-2 rounded-lg bg-linear-surface border border-linear-border">
                      <option value="free">Free</option>
                      <option value="job">Job</option>
                      <option value="pro">Pro</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'api-keys' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold mb-4">Add API Key</h2>
            <form onSubmit={handleAddKey} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input placeholder="Label" value={newKey.label} onChange={e => setNewKey({...newKey, label: e.target.value})} required />
              <input placeholder="dtn_..." value={newKey.key} onChange={e => setNewKey({...newKey, key: e.target.value})} required className="md:col-span-2 font-mono text-xs" />
              <input type="number" placeholder="Max CPU" value={newKey.max_cpu} onChange={e => setNewKey({...newKey, max_cpu: +e.target.value})} />
              <button type="submit" className="btn-primary">Add Key</button>
            </form>
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4">API Keys ({apiKeys.length})</h2>
            <div className="space-y-3">
              {apiKeys.map(k => (
                <div key={k.id} className="flex items-center justify-between border border-linear-border rounded-xl p-4">
                  <div>
                    <p className="font-medium text-sm">{k.label}</p>
                    <p className="text-xs font-mono text-linear-muted mt-0.5">{k.key?.slice(0, 20)}...{k.key?.slice(-8)}</p>
                    <p className="text-xs text-linear-muted mt-0.5">{k.max_cpu}vCPU · {k.max_ram}GB RAM · {k.max_disk}GB SSD</p>
                  </div>
                  <button onClick={() => handleDeleteKey(k.id)} className="text-xs px-3 py-1.5 rounded-lg bg-linear-red/10 text-linear-red hover:bg-linear-red/20">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="card">
          <h2 className="font-semibold mb-4">Plan Limits</h2>
          <div className="space-y-4">
            {['free', 'job', 'pro'].map(p => {
              const limits = planLimits[p] || {};
              return (
                <div key={p} className="border border-linear-border rounded-xl p-4">
                  <p className="font-medium capitalize mb-3">{p} Plan</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['cpu', 'ram', 'disk', 'hours'].filter(k => p !== 'pro' || k !== 'hours').map(k => (
                      <div key={k}>
                        <label className="text-xs text-linear-muted uppercase">{k}</label>
                        <input type="number" defaultValue={limits[k]} className="w-full mt-1"
                          onBlur={e => admin.updatePlanLimit(p, k, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
