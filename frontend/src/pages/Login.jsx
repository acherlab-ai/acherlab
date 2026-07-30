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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">acherlab</h1>
          <p className="text-dark-400 text-sm mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5 animate-slide-up">
          <div>
            <label className="text-xs text-dark-300 font-medium uppercase tracking-wider block mb-1.5">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full" placeholder="Enter your username" required />
          </div>

          <div>
            <label className="text-xs text-dark-300 font-medium uppercase tracking-wider block mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full" placeholder="••••••••" required />
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2.5 rounded-xl">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : 'Sign in'}
          </button>

          <p className="text-sm text-dark-400 text-center">
            Don't have an account? <Link to="/register" className="text-accent-400 hover:text-accent-300 font-medium">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
