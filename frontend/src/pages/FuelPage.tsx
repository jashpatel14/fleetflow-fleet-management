import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { fuelAPI, vehiclesAPI, tripsAPI } from '../api/client';
import { Plus, Fuel, AlertCircle } from 'lucide-react';

const SW = 1.5;

const FuelPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoad] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState(false);
  const LIMIT = 10;

  const load = async () => {
    setLoad(true);
    try {
      const res = await fuelAPI.getAll({ page, limit: LIMIT });
      setLogs(res.data.logs); setTotal(res.data.total);
    } catch { /* ignore */ } finally { setLoad(false); }
  };
  useEffect(() => { load(); }, [page]);

  const totalCost = logs.reduce((s, l) => s + l.totalCost, 0);
  const totalLitre = logs.reduce((s, l) => s + l.liters, 0);

  return (
    <div>
      {logs.length > 0 && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <div className="kpi-card" style={{ border: '2px solid var(--border)' }}>
            <div className="kpi-label" style={{ color: 'var(--green)' }}>Records Found</div>
            <div className="kpi-value" style={{ color: 'var(--green)' }}>{logs.length}</div>
          </div>
          <div className="kpi-card" style={{ border: '2px solid var(--border)' }}>
            <div className="kpi-label" style={{ color: 'var(--green)' }}>Total Consumption</div>
            <div className="kpi-value" style={{ color: 'var(--green)' }}>{totalLitre.toFixed(0)}L</div>
          </div>
          <div className="kpi-card" style={{ border: '2px solid var(--border)' }}>
            <div className="kpi-label" style={{ color: 'var(--green)' }}>Total Expenditure</div>
            <div className="kpi-value" style={{ color: 'var(--green)' }}>₹{totalCost.toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div style={{ flex: 1, fontSize: 13, color: 'var(--text-3)' }}>Track fuel expenses per vehicle and trip</div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={15} strokeWidth={SW} /> Log Fuel
        </button>
      </div>

      <div className="card" style={{ border: '2px solid var(--border)' }}>
        <div className="card-header">
          <div className="card-title" style={{ background: 'var(--blue-bg)', color: 'var(--blue)', padding: '4px 12px', borderRadius: '16px', display: 'inline-block' }}>
            Recent Fuel Logs
          </div>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <div className="table-scroll">
            {loading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : logs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Fuel size={36} strokeWidth={1} color="var(--text-4)" /></div>
                <div className="empty-title">No fuel logs yet</div>
                <div className="empty-desc">Start logging fuel expenses</div>
              </div>
            ) : (
              <table>
                <thead><tr>
                  <th>Vehicle</th><th>Trip Number</th><th className="right">Volume</th>
                  <th className="right">Rate</th><th className="right">Total</th><th>Logged At</th>
                </tr></thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>
                        {log.vehicle?.licensePlate}
                        <span className="text-muted text-sm" style={{ fontWeight: 400 }}> · {log.vehicle?.make}</span>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {log.trip
                          ? <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{log.trip.tripNumber}</span>
                          : <span className="text-muted">Direct Fill</span>}
                      </td>
                      <td className="right mono">{log.liters}L</td>
                      <td className="right mono">₹{log.costPerLiter}</td>
                      <td className="right mono" style={{ fontWeight: 600 }}>₹{log.totalCost.toLocaleString()}</td>
                      <td className="text-muted text-sm">{new Date(log.loggedAt).toLocaleDateString('en-IN')}</td>
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

      {modal && <LogFuelModal onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />}
    </div>
  );
};

const LogFuelModal = ({ onClose, onSave }: any) => {
  const [form, setForm] = useState({ vehicleId: '', tripId: '', liters: '', costPerLiter: '' });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    Promise.all([
      vehiclesAPI.getAll({ limit: 100 }),
      tripsAPI.getAll({ status: 'DISPATCHED', limit: 100 }),
    ]).then(([v, t]) => { setVehicles(v.data.vehicles); setTrips(t.data.trips); });
  }, []);

  const total = form.liters && form.costPerLiter
    ? (parseFloat(form.liters) * parseFloat(form.costPerLiter)).toFixed(2) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoad(true);
    try { await fuelAPI.log(form); onSave(); }
    catch (err: any) { setError(err?.response?.data?.error || 'Failed.'); }
    finally { setLoad(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Log Fuel Expense</span>
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
              <label className="form-label">Link to Trip (optional)</label>
              <select className="form-select" value={form.tripId} onChange={set('tripId')}>
                <option value="">Standalone</option>
                {trips.map(t => <option key={t.id} value={t.id}>{t.tripNumber} — {t.origin}→{t.destination}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Litres <span className="req">*</span></label>
                <input className="form-input" type="number" required step="0.1" min="0.1" value={form.liters} onChange={set('liters')} />
              </div>
              <div className="form-group">
                <label className="form-label">Cost/Litre (₹) <span className="req">*</span></label>
                <input className="form-input" type="number" required step="0.01" min="0.01" value={form.costPerLiter} onChange={set('costPerLiter')} />
              </div>
            </div>
            {total && (
              <div className="alert alert-info">
                Total cost: <strong>₹{parseFloat(total).toLocaleString()}</strong>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Logging...' : 'Log Fuel'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FuelPage;
