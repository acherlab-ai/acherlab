import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { sandboxes } from '../lib/api';

const PLANS_CONFIG = {
  free: { label: 'Free', maxHours: 8, color: 'text-linear-muted', bg: 'bg-linear-muted/10' },
  job: { label: 'Job', maxHours: 12, color: 'text-linear-yellow', bg: 'bg-linear-yellow/10' },
  pro: { label: 'Pro', maxHours: '∞', hoursLabel: '24/7', color: 'text-linear-accent', bg: 'bg-linear-accent/10' },
};

export default function Labs() {
  const { user } = useAuth();
  const [running, setRunning] = useState([]);
  const [specs, setSpecs] = useState({});
  const [plansData, setPlansData] = useState({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const [r, s, p] = await Promise.all([
        sandboxes.running(),
        sandboxes.specs().catch(() => ({})),
        sandboxes.plans().catch(() => ({})),
      ]);
      setRunning(r);
      setSpecs(s);
      setPlansData(p);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createLab = async (configName) => {
    setCreating(true);
    try {
      await sandboxes.create(configName);
      await load();
    } catch (err) {
      alert(err.message);
    }
    setCreating(false);
  };

  const stopLab = async (id) => {
    if (!confirm('Stop this lab?')) return;
    try {
      await sandboxes.stop(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const plan = PLANS_CONFIG[user?.plan] || PLANS_CONFIG.free;
  const availableSpecs = Object.entries(specs).filter(([key]) => {
    if (user?.plan === 'free') return key === 'daytona-small';
    if (user?.plan === 'job') return ['daytona-small', 'daytona-medium'].includes(key);
    return true;
  });

  if (loading) return <div className="p-8"><div className="animate-spin w-6 h-6 border-2 border-linear-accent border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Labs</h1>
        <p className="text-linear-muted text-sm mt-1">Create and manage your virtual machines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-semibold mb-4">Create Lab</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {availableSpecs.map(([key, spec]) => (
                <button
                  key={key}
                  onClick={() => createLab(key)}
                  disabled={creating}
                  className="border border-linear-border rounded-xl p-4 hover:border-linear-accent/50 hover:bg-linear-hover transition-all text-left group disabled:opacity-50"
                >
                  <p className="font-medium group-hover:text-linear-accent transition-colors">
                    Ubuntu {spec.cpu}/{spec.memory}
                  </p>
                  <p className="text-xs text-linear-muted mt-1">{spec.cpu}vCPU · {spec.memory}GB RAM · {spec.disk}GB SSD</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${plan.bg} ${plan.color}`}>{plan.label}</span>
                    <span className="text-[10px] text-linear-muted">max {plan.maxHours}h</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card mb-4">
            <h2 className="font-semibold mb-3">Your Plan</h2>
            <p className={`text-lg font-bold ${plan.color}`}>{plan.label}</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-linear-muted">Max runtime</span><span>{plan.maxHours}h</span></div>
              <div className="flex justify-between"><span className="text-linear-muted">Concurrent labs</span><span>{user?.plan === 'pro' ? '∞' : '1'}</span></div>
              <div className="flex justify-between"><span className="text-linear-muted">Auto-delete</span><span>{user?.plan === 'pro' ? 'No' : 'Yes'}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Running Labs ({running.length})</h2>
        {running.length === 0 ? (
          <p className="text-sm text-linear-muted text-center py-8">No running labs</p>
        ) : (
          <div className="space-y-3">
            {running.map(sbox => (
              <div key={sbox.id} className="border border-linear-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{sbox.name?.slice(0, 16)}...</p>
                    <p className="text-xs text-linear-muted mt-0.5">{sbox.cpu}vCPU · {sbox.ram}GB RAM · {sbox.disk}GB SSD</p>
                    {sbox.ssh_command && (
                      <p className="text-xs font-mono text-linear-accent mt-1 bg-linear-accent/5 px-2 py-1 rounded inline-block">
                        {sbox.ssh_command}
                      </p>
                    )}
                    {sbox.expires_at && (
                      <p className="text-xs text-linear-yellow mt-1">Expires: {new Date(sbox.expires_at).toLocaleTimeString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sbox.status === 'started' ? 'bg-linear-green/20 text-linear-green' : 'bg-linear-yellow/20 text-linear-yellow'
                    }`}>{sbox.status}</span>
                    <button onClick={() => stopLab(sbox.id)} className="text-xs px-3 py-1.5 rounded-lg bg-linear-red/10 text-linear-red hover:bg-linear-red/20 transition-all">
                      Stop
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
