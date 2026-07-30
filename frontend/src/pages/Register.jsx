import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { auth } from '../lib/api';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await auth.register(form.username, form.email, form.password);
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
          <p className="text-dark-400 text-sm mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5 animate-slide-up">
          <div>
            <label className="text-xs text-dark-300 font-medium uppercase tracking-wider block mb-1.5">Username</label>
            <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full" placeholder="Choose a username" required />
          </div>

          <div>
            <label className="text-xs text-dark-300 font-medium uppercase tracking-wider block mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full" placeholder="your@email.com" required />
          </div>

          <div>
            <label className="text-xs text-dark-300 font-medium uppercase tracking-wider block mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full" placeholder="Min. 6 characters" minLength={6} required />
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2.5 rounded-xl">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : 'Create account'}
          </button>

          <p className="text-sm text-dark-400 text-center">
            Already have an account? <Link to="/login" className="text-accent-400 hover:text-accent-300 font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
