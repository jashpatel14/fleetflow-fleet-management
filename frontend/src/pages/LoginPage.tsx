import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [tab, setTab]       = useState<'login' | 'register'>('login');
  const [email, setEmail]   = useState('');
  const [password, setPass] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoad]  = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoad(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoad(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-main)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--primary)',
            borderRadius: 14, display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white',
            marginBottom: 12,
          }}>F</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>FleetFlow Core</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Fleet Operations Control System</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1, padding: '14px',
                  fontSize: 14, fontWeight: 600,
                  border: 'none', background: 'transparent',
                  color: tab === t ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: -1, cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >{t === 'login' ? 'Sign In' : 'Register'}</button>
            ))}
          </div>

          <div style={{ padding: '28px 28px' }}>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                ⚠ {error}
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email Address <span className="required">*</span></label>
                  <input
                    className="form-input" type="email" required
                    placeholder="manager@fleetflow.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password <span className="required">*</span></label>
                  <input
                    className="form-input" type="password" required
                    placeholder="••••••••"
                    value={password} onChange={e => setPass(e.target.value)}
                  />
                </div>
                <button
                  type="submit" className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
                <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg-main)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong>Demo accounts</strong> (password: FleetFlow@123)<br />
                  manager@fleetflow.com · dispatcher@fleetflow.com<br />
                  safety@fleetflow.com · analyst@fleetflow.com
                </div>
              </form>
            ) : (
              <RegisterForm onSuccess={() => setTab('login')} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Register sub-form ───────────────────────────────────────────────────────
const ROLES = [
  { value: 'FLEET_MANAGER',     label: 'Fleet Manager' },
  { value: 'DISPATCHER',        label: 'Dispatcher' },
  { value: 'SAFETY_OFFICER',    label: 'Safety Officer' },
  { value: 'FINANCIAL_ANALYST', label: 'Financial Analyst' },
];

const RegisterForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'DISPATCHER' });
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoad(true);
    try {
      const { authAPI } = await import('../api/client');
      await authAPI.register(form);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed.');
    } finally { setLoad(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-group">
        <label className="form-label">Full Name <span className="required">*</span></label>
        <input className="form-input" required placeholder="John Doe"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="form-group">
        <label className="form-label">Email <span className="required">*</span></label>
        <input className="form-input" type="email" required placeholder="email@company.com"
          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      </div>
      <div className="form-group">
        <label className="form-label">Role <span className="required">*</span></label>
        <select className="form-select"
          value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Password <span className="required">*</span></label>
        <input className="form-input" type="password" required placeholder="Min. 6 characters"
          value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
      </div>
      <button type="submit" className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '10px' }} disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
};

export default LoginPage;
