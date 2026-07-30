import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { admin } from '../lib/api';

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [keys, setKeys] = useState([]);
  const [sandboxes, setSandboxes] = useState([]);
  const [addKey, setAddKey] = useState({ key: '', label: '', max_cpu: 4, max_ram: 8, max_disk: 30 });
  const [editPlan, setEditPlan] = useState({ userId: '', plan: 'free' });
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [u, k, s] = await Promise.all([
        admin.users().catch(() => []),
        admin.keys().catch(() => []),
        admin.sandboxes().catch(() => []),
      ]);
      setUsers(u); setKeys(k); setSandboxes(s);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const addApiKey = async (e) => {
    e.preventDefault(); setMessage('');
    try {
      await admin.addKey(addKey);
      setAddKey({ key: '', label: '', max_cpu: 4, max_ram: 8, max_disk: 30 });
      await load();
      setMessage('API key added');
    } catch (err) { setMessage(err.message); }
  };

  const toggleKey = async (id, active) => {
    try {
      await admin.toggleKey(id, active);
      await load();
    } catch (err) { setMessage(err.message); }
  };

  const deleteKey = async (id) => {
    if (!confirm('Delete this API key?')) return;
    try {
      await admin.deleteKey(id);
      await load();
    } catch (err) { setMessage(err.message); }
  };

  const updatePlan = async () => {
    if (!editPlan.userId) return;
    try {
      await admin.updateUser(editPlan.userId, { plan: editPlan.plan });
      setMessage('Plan updated');
      await load();
    } catch (err) { setMessage(err.message); }
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
    { id: 'keys', label: 'API Keys', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
    { id: 'labs', label: 'All Labs', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ];

  if (!user || user.plan !== 'admin') return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" />
          </svg>
        </div>
        <p className="text-dark-400">Admin access required</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
        <p className="text-dark-400 mt-1">Manage users, API keys, and labs</p>
      </div>

      <div className="flex gap-1 mb-6 bg-dark-800 rounded-2xl p-1 border border-border overflow-x-auto">
        {tabs.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              tab === id ? 'bg-accent-500/20 text-accent-400 shadow-sm' : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
            </svg>
            {label}
          </button>
        ))}
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-accent-500/10 text-accent-400 text-sm border border-accent-500/20">{message}</div>
      )}

      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-4 text-dark-400 font-medium">User</th>
                  <th className="px-6 py-4 text-dark-400 font-medium">Plan</th>
                  <th className="px-6 py-4 text-dark-400 font-medium">Plan End</th>
                  <th className="px-6 py-4 text-dark-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium">{u.username}</p>
                      <p className="text-xs text-dark-400">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                        u.plan === 'pro' ? 'bg-accent-500/10 text-accent-400' :
                        u.plan === 'job' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-dark-600 text-dark-300'
                      }`}>{u.plan}</span>
                    </td>
                    <td className="px-6 py-4 text-dark-400 text-xs">{u.plan_end || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select value={u.plan || 'free'}
                          onChange={e => { setEditPlan({ userId: u.id, plan: e.target.value }); setTimeout(updatePlan, 100); }}
                          className="text-xs bg-dark-700 border border-border rounded-lg px-2 py-1.5"
                        >
                          <option value="free">Free</option><option value="job">Job</option><option value="pro">Pro</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'keys' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold mb-5">Add API Key</h2>
            <form onSubmit={addApiKey} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <input type="text" placeholder="Key (dtn_...)" value={addKey.key} onChange={e => setAddKey({...addKey, key: e.target.value})} className="sm:col-span-2" required />
              <input type="text" placeholder="Label" value={addKey.label} onChange={e => setAddKey({...addKey, label: e.target.value})} required />
              <div className="flex gap-2">
                <input type="number" placeholder="Max CPU" value={addKey.max_cpu} onChange={e => setAddKey({...addKey, max_cpu: +e.target.value})} className="w-full" />
                <input type="number" placeholder="Max RAM" value={addKey.max_ram} onChange={e => setAddKey({...addKey, max_ram: +e.target.value})} className="w-full" />
                <input type="number" placeholder="Max Disk" value={addKey.max_disk} onChange={e => setAddKey({...addKey, max_disk: +e.target.value})} className="w-full" />
              </div>
              <button type="submit" className="btn-primary whitespace-nowrap">Add Key</button>
            </form>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-6 py-4 text-dark-400 font-medium">Label</th>
                    <th className="px-6 py-4 text-dark-400 font-medium">Key (masked)</th>
                    <th className="px-6 py-4 text-dark-400 font-medium">Limits</th>
                    <th className="px-6 py-4 text-dark-400 font-medium">Usage</th>
                    <th className="px-6 py-4 text-dark-400 font-medium">Status</th>
                    <th className="px-6 py-4 text-dark-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {keys.map(k => (
                    <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium">{k.label || '—'}</td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-dark-800 px-2 py-1 rounded font-mono text-accent-400">
                          {k.key?.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="px-6 py-4 text-xs text-dark-400">{k.max_cpu}cpu / {k.max_ram}ram / {k.max_disk}disk</td>
                      <td className="px-6 py-4 text-xs text-dark-400">{k.total_cpu}cpu / {k.total_ram}ram</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${k.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-dark-600 text-dark-300'}`}>
                          {k.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleKey(k.id, !k.is_active)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium ${k.is_active ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                          >{k.is_active ? 'Deactivate' : 'Activate'}</button>
                          <button onClick={() => deleteKey(k.id)} className="btn-danger text-xs px-2.5 py-1.5">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'labs' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-4 text-dark-400 font-medium">Name</th>
                  <th className="px-6 py-4 text-dark-400 font-medium">User</th>
                  <th className="px-6 py-4 text-dark-400 font-medium">Resources</th>
                  <th className="px-6 py-4 text-dark-400 font-medium">Status</th>
                  <th className="px-6 py-4 text-dark-400 font-medium">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sandboxes.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-dark-400">No labs</td></tr>
                ) : sandboxes.map(s => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-xs">{s.name?.slice(0, 24)}...</td>
                    <td className="px-6 py-4 text-dark-400 text-xs">{s.plan}</td>
                    <td className="px-6 py-4 text-dark-400 text-xs">{s.cpu}vCPU / {s.ram}GB</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        s.status === 'started' ? 'bg-emerald-500/10 text-emerald-400' :
                        s.status === 'creating' ? 'bg-amber-500/10 text-amber-400' :
                        s.status === 'stopped' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-dark-600 text-dark-300'
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-6 py-4 text-dark-400 text-xs">{s.started_at || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
