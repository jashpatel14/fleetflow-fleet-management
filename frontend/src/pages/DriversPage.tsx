import React, { useState, useEffect, FormEvent } from 'react';
import { driversAPI } from '../api/client';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth, canAccess } from '../context/AuthContext';

const VEHICLE_TYPES = ['MINI_TRUCK','TRUCK','TRAILER','TANKER','CONTAINER','VAN'];

const DriversPage = () => {
  const { user } = useAuth();
  const [drivers, setDrivers]   = useState<any[]>([]);
  const [stats, setStats]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState<any>(null);
  const LIMIT = 10;

  const load = async () => {
    setLoading(true);
    try {
      const [dRes, sRes] = await Promise.all([
        driversAPI.getAll({ search, status: statusFilter, page, limit: LIMIT }),
        driversAPI.getStats(),
      ]);
      setDrivers(dRes.data.drivers);
      setTotal(dRes.data.total);
      setStats(sRes.data);
    } catch { /* fail silently */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, statusFilter, page]);

  const handleStatusChange = async (id: string, status: string) => {
    try { await driversAPI.changeStatus(id, status); await load(); }
    catch (err: any) { alert(err?.response?.data?.error || 'Status change failed.'); }
  };

  const canManage = canAccess(user?.role, ['FLEET_MANAGER', 'SAFETY_OFFICER']);

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
          {[
            { label: 'Total Drivers',  value: stats.total,            color: '#2563EB' },
            { label: 'On Duty',        value: stats.onDuty,           color: '#22C55E' },
            { label: 'Off Duty',       value: stats.offDuty,          color: '#F59E0B' },
            { label: 'Suspended',      value: stats.suspended,        color: '#EF4444' },
            { label: 'License Alert',  value: stats.expiringLicenses, color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="kpi-card" style={{ padding: 16 }}>
              <div className="kpi-content">
                <div className="kpi-label">{s.label}</div>
                <div className="kpi-value" style={{ fontSize: 22, color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search by name, license, phone..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="ON_DUTY">On Duty</option>
          <option value="OFF_DUTY">Off Duty</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        {canManage && (
          <button className="btn btn-primary" onClick={() => { setEditDriver(null); setShowModal(true); }}>
            + Add Driver
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-container">
          {loading ? (
            <div className="spinner-wrapper"><div className="spinner" /></div>
          ) : drivers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <div className="empty-title">No drivers found</div>
              <div className="empty-desc">Add a driver to get started</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>License No.</th>
                  <th>License Expiry</th>
                  <th>Category</th>
                  <th>Safety Score</th>
                  <th>Status</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {drivers.map((d: any) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>{d.phone}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{d.licenseNumber}</td>
                    <td>
                      <span style={{ color: d.isLicenseExpired ? 'var(--red)' : d.licenseExpiresInDays < 30 ? 'var(--orange)' : 'var(--text-primary)', fontWeight: d.licenseExpiresInDays < 30 ? 600 : 400 }}>
                        {new Date(d.licenseExpiry).toLocaleDateString('en-IN')}
                        {d.isLicenseExpired && ' ⚠ EXPIRED'}
                        {!d.isLicenseExpired && d.licenseExpiresInDays < 30 && ` (${d.licenseExpiresInDays}d)`}
                      </span>
                    </td>
                    <td>{d.vehicleCategory.replace('_', ' ')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, maxWidth: 80 }}>
                          <div style={{ width: `${d.safetyScore}%`, height: '100%', borderRadius: 3,
                            background: d.safetyScore > 80 ? 'var(--green)' : d.safetyScore > 60 ? 'var(--orange)' : 'var(--red)' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{d.safetyScore}%</span>
                      </div>
                    </td>
                    <td><StatusBadge type="driver" status={d.status} /></td>
                    {canManage && (
                      <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => { setEditDriver(d); setShowModal(true); }}>Edit</button>
                        {d.status === 'SUSPENDED' ? (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--green)' }}
                            onClick={() => handleStatusChange(d.id, 'OFF_DUTY')}>Reinstate</button>
                        ) : (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}
                            onClick={() => handleStatusChange(d.id, 'SUSPENDED')}>Suspend</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {total > LIMIT && (
          <div className="pagination">
            <span className="pagination-info">Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT, total)} of {total}</span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p-1)}>‹</button>
              <button className="page-btn" disabled={page * LIMIT >= total} onClick={() => setPage(p => p+1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <DriverModal driver={editDriver} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
};

// ── Driver Modal ──────────────────────────────────────────────────────────────
const DriverModal = ({ driver, onClose, onSave }: any) => {
  const isEdit = !!driver;
  const [form, setForm] = useState({
    name: driver?.name || '',
    email: driver?.email || '',
    phone: driver?.phone || '',
    licenseNumber: driver?.licenseNumber || '',
    licenseExpiry: driver?.licenseExpiry ? driver.licenseExpiry.split('T')[0] : '',
    vehicleCategory: driver?.vehicleCategory || 'TRUCK',
  });
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
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
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input className="form-input" required value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone <span className="required">*</span></label>
                <input className="form-input" required value={form.phone}
                  onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email}
                onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">License Number <span className="required">*</span></label>
                <input className="form-input" required value={form.licenseNumber}
                  onChange={e => setForm(f => ({...f, licenseNumber: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">License Expiry <span className="required">*</span></label>
                <input className="form-input" type="date" required value={form.licenseExpiry}
                  onChange={e => setForm(f => ({...f, licenseExpiry: e.target.value}))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Category <span className="required">*</span></label>
              <select className="form-select" value={form.vehicleCategory}
                onChange={e => setForm(f => ({...f, vehicleCategory: e.target.value}))}>
                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriversPage;
