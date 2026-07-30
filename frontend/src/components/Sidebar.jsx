import { NavLink } from 'react-router-dom';
import { useAuth } from '../App';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◉' },
  { path: '/labs', label: 'Labs', icon: '▣' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-linear-surface border-r border-linear-border flex flex-col z-50">
      <div className="px-5 py-5 border-b border-linear-border">
        <h1 className="text-lg font-semibold tracking-tight text-linear-text">
          acher<span className="text-linear-accent">lab</span>
        </h1>
        <p className="text-xs text-linear-muted mt-0.5">virtual labs platform</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-linear-accent/10 text-linear-accent font-medium'
                  : 'text-linear-muted hover:text-linear-text hover:bg-linear-hover'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {user?.plan === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-linear-accent/10 text-linear-accent font-medium'
                  : 'text-linear-muted hover:text-linear-text hover:bg-linear-hover'
              }`
            }
          >
            <span className="text-lg">⚙</span>
            Admin
          </NavLink>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-linear-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-linear-text">{user?.username}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              user?.plan === 'pro' ? 'bg-linear-accent/20 text-linear-accent' :
              user?.plan === 'job' ? 'bg-linear-yellow/20 text-linear-yellow' :
              user?.plan === 'admin' ? 'bg-linear-red/20 text-linear-red' :
              'bg-linear-muted/20 text-linear-muted'
            }`}>
              {user?.plan}
            </span>
          </div>
          <button onClick={logout} className="text-linear-muted hover:text-linear-text text-lg" title="Logout">⏻</button>
        </div>
      </div>
    </aside>
  );
}
