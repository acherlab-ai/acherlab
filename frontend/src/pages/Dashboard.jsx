import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { sandboxes } from '../lib/api';

const planColors = { free: 'bg-dark-600 text-dark-300', job: 'bg-amber-500/20 text-amber-400', pro: 'bg-accent-500/20 text-accent-400' };

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    sandboxes.stats().then(setStats).catch(() => {});
    sandboxes.history(1).then(setRecent).catch(() => {});
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Welcome back, <span className="gradient-text">{user?.username}</span></h1>
        <p className="text-dark-400 mt-1">Here's what's happening with your labs</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Labs', value: stats?.totalLabs ?? '—', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
          { label: 'Running Now', value: stats?.runningLabs ?? '—', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' },
          { label: 'Your Plan', value: user?.plan || 'free', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card-hover group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-dark-400 uppercase tracking-wider font-medium">{label}</p>
                <p className={`text-2xl md:text-3xl font-bold mt-2 ${label === 'Your Plan' ? 'capitalize' : ''}`}>{value}</p>
                {label === 'Your Plan' && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-2 inline-block ${planColors[user?.plan] || planColors.free}`}>{user?.plan}</span>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-400 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card-hover mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg">Quick Start</h2>
          <Link to="/labs" className="text-sm text-accent-400 hover:text-accent-300 transition-colors">View all →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Ubuntu 1/1', desc: '1 vCPU · 1GB RAM · 3GB SSD', plan: 'free', snapshot: 'daytona-small', icon: 'M1 1h22v22H1z' },
            { label: 'Ubuntu 2/4', desc: '2 vCPU · 4GB RAM · 8GB SSD', plan: 'job', snapshot: 'daytona-medium', icon: 'M1 1h22v22H1z' },
            { label: 'Ubuntu 4/8', desc: '4 vCPU · 8GB RAM · 10GB SSD', plan: 'pro', snapshot: 'daytona-large', icon: 'M1 1h22v22H1z' },
          ].map(cfg => (
            <Link key={cfg.snapshot} to="/labs" className="card-hover group">
              <p className="font-semibold group-hover:text-accent-400 transition-colors">{cfg.label}</p>
              <p className="text-xs text-dark-400 mt-1">{cfg.desc}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-3 inline-block ${planColors[cfg.plan]}`}>{cfg.plan}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-lg mb-5">Recent Activity</h2>
        {recent?.items?.length > 0 ? (
          <div className="space-y-2">
            {recent.items.slice(0, 5).map(sbox => (
              <div key={sbox.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${sbox.status === 'started' ? 'bg-emerald-400' : sbox.status === 'creating' ? 'bg-amber-400' : 'bg-dark-500'}`} />
                  <div>
                    <p className="text-sm font-medium">{sbox.name?.slice(0, 16)}...</p>
                    <p className="text-xs text-dark-400">{sbox.cpu}vCPU · {sbox.ram}GB · {sbox.disk}GB</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  sbox.status === 'started' ? 'bg-emerald-500/10 text-emerald-400' :
                  sbox.status === 'creating' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-dark-600 text-dark-300'
                }`}>{sbox.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-dark-400 text-sm">No labs yet</p>
            <Link to="/labs" className="btn-primary mt-4 inline-block">Create your first lab</Link>
          </div>
        )}
      </div>
    </div>
  );
}
