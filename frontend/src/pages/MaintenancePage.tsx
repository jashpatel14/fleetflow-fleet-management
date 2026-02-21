import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { maintenanceAPI, vehiclesAPI } from '../api/client';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth, canAccess } from '../context/AuthContext';
import { Plus, Wrench, Clipboard, Clock, CheckCircle2, DollarSign, AlertCircle, ExternalLink } from 'lucide-react';

const SW = 1.5;

const MaintenancePage = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoad] = useState(true);
  const [statusF, setStatusF] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [closing, setClosing] = useState<any>(null);
  const LIMIT = 10;

  const load = async () => {
    setLoad(true);
    try {
      const [lRes, sRes] = await Promise.all([
        maintenanceAPI.getAll({ status: statusF, page, limit: LIMIT }),
        maintenanceAPI.getStats(),
      ]);
      setLogs(lRes.data.logs); setTotal(lRes.data.total); setStats(sRes.data);
    } catch { /* ignore */ } finally { setLoad(false); }
  };
  useEffect(() => { load(); }, [statusF, page]);

  const canManage = canAccess(user?.role, ['FLEET_MANAGER', 'SAFETY_OFFICER', 'DISPATCHER']);
  const canClose = canAccess(user?.role, ['FLEET_MANAGER', 'SAFETY_OFFICER']);

  return (
    <div>
      {stats && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          <div className="kpi-card">
            <div className="kpi-icon-row">
              <div className="kpi-icon-wrap" style={{ background: 'var(--primary-light)' }}>
                <Clipboard size={18} strokeWidth={1.5} color="var(--primary)" />
              </div>
              <ExternalLink size={14} color="var(--text-4)" />
            </div>
            <div className="kpi-label">Total Records</div>
            <div className="kpi-value">{stats.total}</div>
            <div className="kpi-sub">Lifetime logs</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-row">
              <div className="kpi-icon-wrap" style={{ background: 'var(--orange-bg)' }}>
                <Clock size={18} strokeWidth={1.5} color="var(--orange)" />
              </div>
            </div>
            <div className="kpi-label">Open Tickets</div>
            <div className="kpi-value">{stats.open}</div>
            <div className="kpi-sub">Pending work</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-row">
              <div className="kpi-icon-wrap" style={{ background: 'var(--green-bg)' }}>
                <CheckCircle2 size={18} strokeWidth={1.5} color="var(--green)" />
              </div>
            </div>
            <div className="kpi-label">Closed</div>
            <div className="kpi-value">{stats.closed}</div>
            <div className="kpi-sub">Completed jobs</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-row">
              <div className="kpi-icon-wrap" style={{ background: 'var(--red-bg)' }}>
                <DollarSign size={18} strokeWidth={1.5} color="var(--red)" />
              </div>
            </div>
            <div className="kpi-label">Total Cost</div>
            <div className="kpi-value">₹{((stats.totalCost || 0) / 1000).toFixed(0)}K</div>
            <div className="kpi-sub">Maintenance spend</div>
          </div>
        </div>
      )}

      <div className="toolbar">
        <select className="filter-select" value={statusF}
          onChange={e => { setStatusF(e.target.value); setPage(1); }}>
          <option value="">All status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} strokeWidth={SW} /> Log Maintenance
          </button>
        )}
      </div>

      <div className="card" style={{ border: '2px solid var(--border)' }}>
        <div className="card-header">
          <div className="card-title" style={{ background: 'var(--orange-bg)', color: 'var(--orange)', padding: '4px 12px', borderRadius: '16px', display: 'inline-block', fontSize: 13, fontWeight: 600 }}>
            Maintenance Records
          </div>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <div className="table-scroll">
            {loading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : logs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Wrench size={36} strokeWidth={1} color="var(--text-4)" /></div>
                <div className="empty-title">No maintenance records</div>
                <div className="empty-desc">Log your first maintenance entry</div>
              </div>
            ) : (
              <table>
                <thead><tr>
                  <th>Vehicle</th><th>Type</th><th>Description</th>
                  <th className="right">Cost</th><th>Opened</th><th>Closed</th>
                  <th>Status</th>{canClose && <th className="right">Action</th>}
                </tr></thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>
                        {log.vehicle?.licensePlate}
                        <span className="text-muted text-sm"> · {log.vehicle?.make}</span>
                      </td>
                      <td>
                        <span className={`badge ${log.type === 'PREVENTIVE' ? 'badge-blue' : 'badge-orange'}`}>
                          <span className="badge-dot" />
                          {log.type === 'PREVENTIVE' ? 'Preventive' : 'Corrective'}
                        </span>
                      </td>
                      <td className="truncate text-muted" style={{ maxWidth: 200, fontSize: 13 }}>{log.description}</td>
                      <td className="right mono">₹{log.cost?.toLocaleString()}</td>
                      <td className="text-muted text-sm">{new Date(log.openedAt).toLocaleDateString('en-IN')}</td>
                      <td className="text-muted text-sm">
                        {log.closedAt ? new Date(log.closedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td><StatusBadge type="maintenance" status={log.status} /></td>
                      {canClose && (
                        <td className="right">
                          {log.status === 'OPEN' && (
                            <button className="btn btn-primary btn-sm" onClick={() => setClosing(log)}>Close</button>
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

      {showCreate && <CreateMaintenanceModal onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); load(); }} />}
      {closing && <CloseMaintenanceModal log={closing} onClose={() => setClosing(null)} onSave={() => { setClosing(null); load(); }} />}
    </div>
  );
};

const CreateMaintenanceModal = ({ onClose, onSave }: any) => {
  const [form, setForm] = useState({ vehicleId: '', type: 'PREVENTIVE', description: '', cost: '' });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    vehiclesAPI.getAll({ status: 'AVAILABLE', limit: 100 }).then(r => setVehicles(r.data.vehicles));
  }, []);

  const submit = async (e: FormEvent) => {
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
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color: 'var(--text-3)' }}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error"><AlertCircle size={14} strokeWidth={SW} />{error}</div>}
            <div className="form-group">
              <label className="form-label">Vehicle <span className="req">*</span></label>
              <select className="form-select" required value={form.vehicleId} onChange={set('vehicleId')}>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} — {v.make} {v.model}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={set('type')}>
                <option value="PREVENTIVE">Preventive (Scheduled)</option>
                <option value="CORRECTIVE">Corrective (Breakdown)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description <span className="req">*</span></label>
              <textarea className="form-textarea" required value={form.description} onChange={set('description')} placeholder="Describe the maintenance work..." />
            </div>
            <div className="form-group">
              <label className="form-label">Estimated Cost (₹)</label>
              <input className="form-input" type="number" min="0" value={form.cost} onChange={set('cost')} />
            </div>
            <div className="alert alert-warning">Vehicle status will be set to <strong>IN_SHOP</strong> until closed.</div>
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
  const [cost, setCost] = useState(log.cost || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);

  const submit = async (e: FormEvent) => {
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
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color: 'var(--text-3)' }}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error"><AlertCircle size={14} strokeWidth={SW} />{error}</div>}
            <div className="form-group">
              <label className="form-label">Final Cost (₹)</label>
              <input className="form-input" type="number" value={cost} onChange={e => setCost(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Closing Notes (optional)</label>
              <textarea className="form-textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="alert alert-info">Vehicle will be set back to <strong>AVAILABLE</strong>.</div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Closing...' : '✓ Close'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenancePage;
