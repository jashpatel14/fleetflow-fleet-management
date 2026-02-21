import React, { useState, useEffect, FormEvent } from 'react';
import { maintenanceAPI, vehiclesAPI } from '../api/client';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth, canAccess } from '../context/AuthContext';

const MaintenancePage = () => {
  const { user } = useAuth();
  const [logs, setLogs]         = useState<any[]>([]);
  const [stats, setStats]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [closing, setClosing]   = useState<any>(null);
  const LIMIT = 10;

  const load = async () => {
    setLoading(true);
    try {
      const [lRes, sRes] = await Promise.all([
        maintenanceAPI.getAll({ status: statusFilter, page, limit: LIMIT }),
        maintenanceAPI.getStats(),
      ]);
      setLogs(lRes.data.logs); setTotal(lRes.data.total); setStats(sRes.data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter, page]);

  const canManage = canAccess(user?.role, ['FLEET_MANAGER', 'SAFETY_OFFICER', 'DISPATCHER']);
  const canClose = canAccess(user?.role, ['FLEET_MANAGER', 'SAFETY_OFFICER']);

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
          {[
            { label: 'Total Records',   value: stats.total,   color: '#2563EB' },
            { label: 'Open',            value: stats.open,    color: '#F59E0B' },
            { label: 'Closed',          value: stats.closed,  color: '#22C55E' },
            { label: 'Total Cost',      value: `₹${(stats.totalCost/1000).toFixed(0)}K`, color: '#EF4444' },
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

      <div className="toolbar">
        <select className="filter-select" value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Log Maintenance</button>
        )}
      </div>

      <div className="table-wrapper">
        <div className="table-container">
          {loading ? (
            <div className="spinner-wrapper"><div className="spinner" /></div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔧</div>
              <div className="empty-title">No maintenance records</div>
              <div className="empty-desc">Log your first maintenance entry</div>
            </div>
          ) : (
            <table>
              <thead><tr>
                <th>Vehicle</th><th>Type</th><th>Description</th>
                <th>Cost (₹)</th><th>Opened</th><th>Closed</th><th>Status</th>
                {canClose && <th className="text-right">Actions</th>}
              </tr></thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 600 }}>{log.vehicle?.licensePlate}<br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.vehicle?.make} {log.vehicle?.model}</span></td>
                    <td><span className={`badge ${log.type === 'PREVENTIVE' ? 'badge-blue' : 'badge-orange'}`}>{log.type}</span></td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{log.description}</td>
                    <td className="font-mono">₹{log.cost?.toLocaleString()}</td>
                    <td style={{ fontSize: 13 }}>{new Date(log.openedAt).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontSize: 13, color: log.closedAt ? 'inherit' : 'var(--text-muted)' }}>
                      {log.closedAt ? new Date(log.closedAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td><StatusBadge type="maintenance" status={log.status} /></td>
                    {canClose && (
                      <td className="text-right">
                        {log.status === 'OPEN' && (
                          <button className="btn btn-primary btn-sm"
                            onClick={() => setClosing(log)}>Close</button>
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
              <button className="page-btn" disabled={page*LIMIT >= total} onClick={() => setPage(p => p+1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateMaintenanceModal onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); load(); }} />}
      {closing     && <CloseMaintenanceModal log={closing} onClose={() => setClosing(null)} onSave={() => { setClosing(null); load(); }} />}
    </div>
  );
};

const CreateMaintenanceModal = ({ onClose, onSave }: any) => {
  const [form, setForm] = useState({ vehicleId: '', type: 'PREVENTIVE', description: '', cost: '' });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);

  useEffect(() => {
    vehiclesAPI.getAll({ status: 'AVAILABLE', limit: 100 }).then(r => setVehicles(r.data.vehicles));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoad(true);
    try { await maintenanceAPI.create(form); onSave(); }
    catch (err: any) { setError(err?.response?.data?.error || 'Failed.'); }
    finally { setLoad(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Log Maintenance</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Vehicle <span className="required">*</span></label>
              <select className="form-select" required value={form.vehicleId}
                onChange={e => setForm(f => ({...f, vehicleId: e.target.value}))}>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} — {v.make} {v.model}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type}
                onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                <option value="PREVENTIVE">Preventive (Scheduled)</option>
                <option value="CORRECTIVE">Corrective (Breakdown)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description <span className="required">*</span></label>
              <textarea className="form-textarea" required rows={3} value={form.description}
                placeholder="Describe the maintenance work..."
                onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Estimated Cost (₹)</label>
              <input className="form-input" type="number" min="0" value={form.cost}
                onChange={e => setForm(f => ({...f, cost: e.target.value}))} />
            </div>
            <div className="alert alert-warning">Opening maintenance will set vehicle status to IN_SHOP.</div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Log Maintenance'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CloseMaintenanceModal = ({ log, onClose, onSave }: any) => {
  const [cost, setCost]       = useState(log.cost || '');
  const [notes, setNotes]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoad]    = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoad(true);
    try { await maintenanceAPI.close(log.id, { cost, description: notes || log.description }); onSave(); }
    catch (err: any) { setError(err?.response?.data?.error || 'Failed.'); }
    finally { setLoad(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Close Maintenance</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Final Cost (₹)</label>
              <input className="form-input" type="number" value={cost}
                onChange={e => setCost(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Closing Notes (optional)</label>
              <textarea className="form-textarea" rows={2} value={notes}
                onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="alert alert-info">Closing will restore vehicle to AVAILABLE status.</div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Closing...' : '✓ Close Maintenance'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenancePage;
