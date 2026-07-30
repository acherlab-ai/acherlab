import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { sandboxes } from '../lib/api';

const PLANS = {
  free: { label: 'Free', maxHours: 8, color: 'text-dark-300' },
  job: { label: 'Job', maxHours: 12, color: 'text-amber-400' },
  pro: { label: 'Pro', maxHours: '∞', color: 'text-accent-400' },
};

export default function Labs() {
  const { user } = useAuth();
  const [running, setRunning] = useState([]);
  const [specs, setSpecs] = useState({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const [r, s] = await Promise.all([
        sandboxes.running().catch(() => []),
        sandboxes.specs().catch(() => ({})),
      ]);
      setRunning(r);
      setSpecs(s);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createLab = async (configName) => {
    setCreating(true);
    try {
      await sandboxes.create(configName);
      await load();
    } catch (err) { alert(err.message); }
    setCreating(false);
  };

  const stopLab = async (id) => {
    if (!confirm('Stop this lab?')) return;
    try {
      await sandboxes.stop(id);
      await load();
    } catch (err) { alert(err.message); }
  };

  const plan = PLANS[user?.plan] || PLANS.free;
  const availableSpecs = Object.entries(specs).filter(([key]) => {
    if (user?.plan === 'free') return key === 'daytona-small';
    if (user?.plan === 'job') return ['daytona-small', 'daytona-medium'].includes(key);
    return true;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-dark-400 text-sm">Loading labs...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Labs</h1>
        <p className="text-dark-400 mt-1">Create and manage your virtual machines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-semibold text-lg mb-5">Create Lab</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {availableSpecs.map(([key, spec]) => (
                <button
                  key={key}
                  onClick={() => createLab(key)}
                  disabled={creating}
                  className="card-hover text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400/20 to-accent-600/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    {creating && <div className="w-4 h-4 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />}
                  </div>
                  <p className="font-semibold group-hover:text-accent-400 transition-colors">Ubuntu {spec.cpu}/{spec.memory}</p>
                  <p className="text-xs text-dark-400 mt-1">{spec.cpu}vCPU · {spec.memory}GB RAM · {spec.disk}GB SSD</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-accent-500/10 text-accent-400">{plan.label}</span>
                    <span className="text-[10px] text-dark-400">max {plan.maxHours}h</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card mb-4">
            <h2 className="font-semibold mb-4">Your Plan</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold
                ${user?.plan === 'pro' ? 'bg-accent-500/20 text-accent-400' :
                  user?.plan === 'job' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-dark-600 text-dark-300'}`}
              >
                {user?.plan === 'pro' ? 'P' : user?.plan === 'job' ? 'J' : 'F'}
              </div>
              <div>
                <p className={`text-lg font-bold capitalize ${plan.color}`}>{plan.label}</p>
                <p className="text-xs text-dark-400">Current plan</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Max runtime', value: `${plan.maxHours}h` },
                { label: 'Concurrent labs', value: user?.plan === 'pro' ? 'Unlimited' : '1' },
                { label: 'Auto-delete', value: user?.plan === 'pro' ? 'No' : 'Yes' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                  <span className="text-dark-400">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-lg mb-5">Running Labs ({running.length})</h2>
        {running.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            </div>
            <p className="text-dark-400 text-sm">No running labs</p>
            <p className="text-dark-500 text-xs mt-1">Create one above to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {running.map(sbox => (
              <div key={sbox.id} className="card-hover">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                      sbox.status === 'started' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`} />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{sbox.name?.slice(0, 20)}...</p>
                      <p className="text-xs text-dark-400 mt-0.5">{sbox.cpu}vCPU · {sbox.ram}GB · {sbox.disk}GB</p>
                      {sbox.ssh_command && (
                        <div className="mt-2 flex items-center gap-2 bg-dark-800/50 rounded-lg px-3 py-1.5 border border-border">
                          <svg className="w-3.5 h-3.5 text-dark-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <code className="text-xs text-accent-400 font-mono truncate">{sbox.ssh_command}</code>
                        </div>
                      )}
                      {sbox.expires_at && (
                        <p className="text-xs text-amber-400/80 mt-1">
                          Expires {new Date(sbox.expires_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      sbox.status === 'started' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>{sbox.status}</span>
                    <button onClick={() => stopLab(sbox.id)} className="btn-danger text-xs px-3 py-1.5">
                      {user?.plan === 'pro' ? 'Stop' : 'Delete'}
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
