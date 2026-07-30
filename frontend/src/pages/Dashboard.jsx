import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { sandboxes } from '../lib/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    sandboxes.stats().then(setStats).catch(() => {});
    sandboxes.history(1).then(setRecent).catch(() => {});
  }, []);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Welcome back, {user?.username}</h1>
        <p className="text-linear-muted mt-1">Here's your lab overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-linear-muted uppercase tracking-wider font-medium">Total Labs</p>
          <p className="text-3xl font-bold mt-2">{stats?.totalLabs ?? '—'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-linear-muted uppercase tracking-wider font-medium">Running Now</p>
          <p className="text-3xl font-bold mt-2">{stats?.runningLabs ?? '—'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-linear-muted uppercase tracking-wider font-medium">Your Plan</p>
          <p className={`text-3xl font-bold mt-2 capitalize ${
            user?.plan === 'pro' ? 'text-linear-accent' :
            user?.plan === 'job' ? 'text-linear-yellow' :
            'text-linear-muted'
          }`}>{user?.plan || 'free'}</p>
        </div>
      </div>

      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Quick Start</h2>
          <Link to="/labs" className="text-sm text-linear-accent hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: 'Ubuntu 1/1', desc: '1 vCPU · 1GB RAM · 3GB SSD', plan: 'free', snapshot: 'daytona-small' },
            { label: 'Ubuntu 2/4', desc: '2 vCPU · 4GB RAM · 8GB SSD', plan: 'job', snapshot: 'daytona-medium' },
            { label: 'Ubuntu 4/8', desc: '4 vCPU · 8GB RAM · 10GB SSD', plan: 'pro', snapshot: 'daytona-large' },
          ].map(cfg => (
            <Link
              key={cfg.snapshot}
              to="/labs"
              className="border border-linear-border rounded-xl p-4 hover:bg-linear-hover transition-all group"
            >
              <p className="font-medium group-hover:text-linear-accent transition-colors">{cfg.label}</p>
              <p className="text-xs text-linear-muted mt-1">{cfg.desc}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-2 inline-block ${
                cfg.plan === 'free' ? 'bg-linear-muted/20 text-linear-muted' :
                cfg.plan === 'job' ? 'bg-linear-yellow/20 text-linear-yellow' :
                'bg-linear-accent/20 text-linear-accent'
              }`}>{cfg.plan}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Recent Activity</h2>
        {recent?.items?.length > 0 ? (
          <div className="space-y-2">
            {recent.items.slice(0, 5).map(sbox => (
              <div key={sbox.id} className="flex items-center justify-between py-2 border-b border-linear-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{sbox.name?.slice(0, 12)}...</p>
                  <p className="text-xs text-linear-muted">{sbox.cpu}vCPU · {sbox.ram}GB RAM · {sbox.disk}GB SSD</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  sbox.status === 'started' ? 'bg-linear-green/20 text-linear-green' :
                  sbox.status === 'creating' ? 'bg-linear-yellow/20 text-linear-yellow' :
                  'bg-linear-muted/20 text-linear-muted'
                }`}>{sbox.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-linear-muted text-center py-8">No labs yet — create your first one!</p>
        )}
      </div>
    </div>
  );
}
