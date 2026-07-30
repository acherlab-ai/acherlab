import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { auth } from '../lib/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await auth.login(username, password);
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">acher<span className="text-linear-accent">lab</span></h1>
          <p className="text-linear-muted text-sm mt-1">virtual labs platform</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-lg font-semibold">Sign in</h2>
          {error && <p className="text-linear-red text-sm bg-linear-red/10 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="text-xs text-linear-muted font-medium uppercase tracking-wider">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full mt-1" placeholder="username" required />
          </div>

          <div>
            <label className="text-xs text-linear-muted font-medium uppercase tracking-wider">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-1" placeholder="••••••••" required />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-sm text-linear-muted text-center">
            No account? <Link to="/register" className="text-linear-accent hover:underline">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
