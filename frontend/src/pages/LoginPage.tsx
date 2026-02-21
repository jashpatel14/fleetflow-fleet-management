import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, Lock, Mail, AlertCircle } from 'lucide-react';

const ROLES = [
  { value: 'FLEET_MANAGER', label: 'Fleet Manager' },
  { value: 'DISPATCHER', label: 'Dispatcher' },
  { value: 'SAFETY_OFFICER', label: 'Safety Officer' },
  { value: 'FINANCIAL_ANALYST', label: 'Financial Analyst' },
];

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoad(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid email or password.');
    } finally { setLoad(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo Block */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44,
            background: 'var(--primary)',
            borderRadius: 10,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}>
            <Truck size={22} color="#fff" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>FleetFlow Core</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Fleet Operations Management</p>
        </div>

        {/* Card */}
        <div className="card" style={{ borderRadius: 14 }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1, padding: '12px 16px',
                  fontSize: 13.5, fontWeight: 600,
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: tab === t ? 'var(--primary)' : 'var(--text-3)',
                  borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'color 0.15s',
                }}>
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <div style={{ padding: '24px 24px 20px' }}>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <AlertCircle size={15} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} strokeWidth={1.5} color="var(--text-4)"
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                    <input className="form-input" type="email" required
                      style={{ paddingLeft: 32 }}
                      placeholder="manager@fleetflow.com"
                      value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} strokeWidth={1.5} color="var(--text-4)"
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                    <input className="form-input" type="password" required
                      style={{ paddingLeft: 32 }}
                      placeholder="Enter password"
                      value={password} onChange={e => setPass(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                  disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>


              </form>
            ) : (
              <RegisterForm onSuccess={() => setTab('login')} roles={ROLES} />
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-4)', marginTop: 20 }}>
          FleetFlow Core v1.0 — Internal use only
        </p>
      </div>
    </div>
  );
};

const RegisterForm = ({ onSuccess, roles }: { onSuccess: () => void; roles: typeof ROLES }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DISPATCHER' });
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoad(true);
    try {
      const { authAPI } = await import('../api/client');
      await authAPI.register(form);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed.');
    } finally { setLoad(false); }
  };

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error"><AlertCircle size={15} strokeWidth={1.5} />{error}</div>}
      <div className="form-group">
        <label className="form-label">Full name <span className="req">*</span></label>
        <input className="form-input" required placeholder="John Doe" value={form.name} onChange={set('name')} />
      </div>
      <div className="form-group">
        <label className="form-label">Email <span className="req">*</span></label>
        <input className="form-input" type="email" required placeholder="email@company.com" value={form.email} onChange={set('email')} />
      </div>
      <div className="form-group">
        <label className="form-label">Role <span className="req">*</span></label>
        <select className="form-select" value={form.role} onChange={set('role')}>
          {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Password <span className="req">*</span></label>
        <input className="form-input" type="password" required placeholder="Min. 6 characters" value={form.password} onChange={set('password')} />
      </div>
      <button type="submit" className="btn btn-primary btn-lg"
        style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
};

export default LoginPage;
