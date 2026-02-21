import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { driversAPI } from '../api/client';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth, canAccess } from '../context/AuthContext';
import { Search, Plus, User, Users, ShieldCheck, Coffee, Slash, AlertTriangle, AlertCircle, ExternalLink } from 'lucide-react';

const SW = 1.5;
const VEHICLE_TYPES = ['MINI_TRUCK', 'TRUCK', 'TRAILER', 'TANKER', 'CONTAINER', 'VAN'];

const DriversPage = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoad] = useState(true);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const LIMIT = 10;

  const load = async () => {
    setLoad(true);
    try {
      const [d, s] = await Promise.all([
        driversAPI.getAll({ search, status: statusF, page, limit: LIMIT }),
        driversAPI.getStats(),
      ]);
      setDrivers(d.data.drivers); setTotal(d.data.total); setStats(s.data);
    } catch { /* ignore */ } finally { setLoad(false); }
  };
  useEffect(() => { load(); }, [search, statusF, page]);



  const canManage = canAccess(user?.role, ['FLEET_MANAGER', 'SAFETY_OFFICER']);

  return (
    <div>
      {stats && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
          <div className="kpi-card">
            <div className="kpi-icon-row">
              <div className="kpi-icon-wrap" style={{ background: 'var(--primary-light)' }}>
                <Users size={18} strokeWidth={1.5} color="var(--primary)" />
              </div>
              <ExternalLink size={14} color="var(--text-4)" />
            </div>
            <div className="kpi-label">Total Drivers</div>
            <div className="kpi-value">{stats.total}</div>
            <div className="kpi-sub">Registered staff</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-row">
              <div className="kpi-icon-wrap" style={{ background: 'var(--green-bg)' }}>
                <ShieldCheck size={18} strokeWidth={1.5} color="var(--green)" />
              </div>
            </div>
            <div className="kpi-label">On Duty</div>
            <div className="kpi-value">{stats.onDuty}</div>
            <div className="kpi-sub">Active shift</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-row">
              <div className="kpi-icon-wrap" style={{ background: 'var(--orange-bg)' }}>
                <Coffee size={18} strokeWidth={1.5} color="var(--orange)" />
              </div>
            </div>
            <div className="kpi-label">Off Duty</div>
            <div className="kpi-value">{stats.offDuty}</div>
            <div className="kpi-sub">Resting / Standby</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-row">
              <div className="kpi-icon-wrap" style={{ background: 'var(--red-bg)' }}>
                <Slash size={18} strokeWidth={1.5} color="var(--red)" />
              </div>
            </div>
            <div className="kpi-label">Suspended</div>
            <div className="kpi-value">{stats.suspended}</div>
            <div className="kpi-sub">Needs attention</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-row">
              <div className="kpi-icon-wrap" style={{ background: 'var(--yellow-bg)' }}>
                <AlertTriangle size={18} strokeWidth={1.5} color="var(--yellow)" />
              </div>
            </div>
            <div className="kpi-label">License Alerts</div>
            <div className="kpi-value">{stats.expiringLicenses}</div>
            <div className="kpi-sub">Expiring soon</div>
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="search-wrap">
          <Search size={14} strokeWidth={SW} className="search-icon-pos" />
          <input className="search-input" placeholder="Search name, license, phone..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={statusF}
          onChange={e => { setStatusF(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="ON_DUTY">On Duty</option>
          <option value="OFF_DUTY">Off Duty</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        {canManage && (
          <button className="btn btn-primary" onClick={() => { setEditing(null); setModal(true); }}>
            <Plus size={15} strokeWidth={SW} /> Add Driver
          </button>
        )}
      </div>

      <div className="card" style={{ border: '2px solid var(--border)' }}>
        <div className="card-header">
          <div className="card-title" style={{ background: 'var(--green-bg)', color: 'var(--green)', padding: '4px 12px', borderRadius: '16px', display: 'inline-block', fontSize: 13, fontWeight: 600 }}>
            Active Drivers
          </div>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <div className="table-scroll">
            {loading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : drivers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><User size={36} strokeWidth={1} color="var(--text-4)" /></div>
                <div className="empty-title">No drivers found</div>
                <div className="empty-desc">Add a driver to get started</div>
              </div>
            ) : (
              <table>
                <thead><tr>
                  <th>Name</th><th>Phone</th><th>License No.</th>
                  <th>Expiry</th><th>Category</th><th>Safety</th>
                  <th>Status</th>{canManage && <th className="right">Actions</th>}
                </tr></thead>
                <tbody>
                  {drivers.map((d: any) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{d.name}</td>
                      <td className="text-muted">{d.phone}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{d.licenseNumber}</td>
                      <td>
                        <span style={{
                          color: d.isLicenseExpired ? 'var(--red-text)'
                            : d.licenseExpiresInDays < 30 ? 'var(--orange-text)'
                              : 'var(--text-1)',
                          fontWeight: d.licenseExpiresInDays < 60 ? 600 : 400,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          {d.licenseExpiresInDays < 30 && <AlertTriangle size={12} strokeWidth={SW} />}
                          {new Date(d.licenseExpiry).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td className="text-muted text-sm">{d.vehicleCategory.replace('_', ' ')}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 56, height: 5, background: 'var(--border)', borderRadius: 3 }}>
                            <div style={{
                              width: `${d.safetyScore}%`, height: '100%', borderRadius: 3,
                              background: d.safetyScore > 80 ? 'var(--green)' : d.safetyScore > 60 ? 'var(--orange)' : 'var(--red)',
                            }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{d.safetyScore}%</span>
                        </div>
                      </td>
                      <td><StatusBadge type="driver" status={d.status} /></td>
                      {canManage && (
                        <td className="right" style={{ whiteSpace: 'nowrap' }}>
                          <button className="btn btn-ghost btn-sm"
                            onClick={() => { setEditing(d); setModal(true); }}>Edit</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {total > LIMIT && (
            <div className="pagination" style={{ borderTop: '1px solid var(--border-light)' }}>
              <span className="pagination-info">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
              <div className="pagination-btns">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                <button className="page-btn" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && <DriverModal driver={editing} onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />}
    </div>
  );
};

const DriverModal = ({ driver, onClose, onSave }: any) => {
  const isEdit = !!driver;
  const [form, setForm] = useState({
    name: driver?.name || '', email: driver?.email || '',
    phone: driver?.phone || '', licenseNumber: driver?.licenseNumber || '',
    licenseExpiry: driver?.licenseExpiry ? driver.licenseExpiry.split('T')[0] : '',
    vehicleCategory: driver?.vehicleCategory || 'TRUCK',
  });
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoad(true);
    try {
      if (isEdit) await driversAPI.update(driver.id, form);
      else await driversAPI.create(form);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.errors?.[0]?.msg || 'Save failed.');
    } finally { setLoad(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Driver' : 'Add Driver'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color: 'var(--text-3)' }}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error"><AlertCircle size={14} strokeWidth={SW} />{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name <span className="req">*</span></label>
                <input className="form-input" required value={form.name} onChange={set('name')} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone <span className="req">*</span></label>
                <input className="form-input" required value={form.phone} onChange={set('phone')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={set('email')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">License No. <span className="req">*</span></label>
                <input className="form-input" required value={form.licenseNumber} onChange={set('licenseNumber')} />
              </div>
              <div className="form-group">
                <label className="form-label">License Expiry <span className="req">*</span></label>
                <input className="form-input" type="date" required value={form.licenseExpiry} onChange={set('licenseExpiry')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Category <span className="req">*</span></label>
              <select className="form-select" value={form.vehicleCategory} onChange={set('vehicleCategory')}>
                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Driver' : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriversPage;
