import { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Labs from './pages/Labs';
import Admin from './pages/Admin';
import Sidebar from './components/Sidebar';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-linear-bg"><div className="animate-spin w-8 h-8 border-2 border-linear-accent border-t-transparent rounded-full" /></div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="flex min-h-screen">
        {user && <Sidebar />}
        <main className={`flex-1 ${user ? 'ml-60' : ''}`}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/labs" element={<ProtectedRoute><Labs /></ProtectedRoute>} />
            {user?.plan === 'admin' && (
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            )}
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
