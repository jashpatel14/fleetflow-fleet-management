import React, { useState, useEffect, FormEvent } from 'react';
import { fuelAPI, vehiclesAPI, tripsAPI } from '../api/client';

const FuelPage = () => {
  const [logs, setLogs]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [showModal, setShowModal] = useState(false);
  const LIMIT = 10;

  const load = async () => {
    setLoading(true);
    try {
      const res = await fuelAPI.getAll({ page, limit: LIMIT });
      setLogs(res.data.logs); setTotal(res.data.total);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Track fuel expenses per vehicle and trip
          </span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Log Fuel</button>
      </div>

      <div className="table-wrapper">
        <div className="table-container">
          {loading ? (
            <div className="spinner-wrapper"><div className="spinner" /></div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⛽</div>
              <div className="empty-title">No fuel logs yet</div>
              <div className="empty-desc">Start logging fuel expenses for your fleet</div>
            </div>
          ) : (
            <table>
              <thead><tr>
                <th>Vehicle</th><th>Trip</th><th>Liters</th>
                <th>Cost/Liter</th><th>Total Cost</th><th>Date</th>
              </tr></thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 600 }}>{log.vehicle?.licensePlate}<br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.vehicle?.make}</span></td>
                    <td style={{ fontSize: 13 }}>{log.trip ? `${log.trip.tripNumber} (${log.trip.origin}→${log.trip.destination})` : <span style={{ color: 'var(--text-muted)' }}>Standalone</span>}</td>
                    <td className="font-mono">{log.liters}L</td>
                    <td className="font-mono">₹{log.costPerLiter}</td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>₹{log.totalCost.toLocaleString()}</td>
                    <td style={{ fontSize: 13 }}>{new Date(log.loggedAt).toLocaleDateString('en-IN')}</td>
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

      {showModal && <LogFuelModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />}
    </div>
  );
};

const LogFuelModal = ({ onClose, onSave }: any) => {
  const [form, setForm] = useState({ vehicleId: '', tripId: '', liters: '', costPerLiter: '' });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trips, setTrips]       = useState<any[]>([]);
  const [error, setError]       = useState('');
  const [loading, setLoad]      = useState(false);

  useEffect(() => {
    Promise.all([
      vehiclesAPI.getAll({ limit: 100 }),
      tripsAPI.getAll({ status: 'DISPATCHED', limit: 100 }),
    ]).then(([v, t]) => { setVehicles(v.data.vehicles); setTrips(t.data.trips); });
  }, []);

  const total = form.liters && form.costPerLiter
    ? (parseFloat(form.liters) * parseFloat(form.costPerLiter)).toFixed(2) : null;

  const handleSubmit = async (e: FormEvent) => {
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
              <label className="form-label">Trip (optional — link to active trip)</label>
              <select className="form-select" value={form.tripId}
                onChange={e => setForm(f => ({...f, tripId: e.target.value}))}>
                <option value="">Standalone (no trip)</option>
                {trips.map(t => <option key={t.id} value={t.id}>{t.tripNumber} — {t.origin}→{t.destination}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Liters <span className="required">*</span></label>
                <input className="form-input" type="number" required step="0.1" min="0.1" value={form.liters}
                  onChange={e => setForm(f => ({...f, liters: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Cost/Liter (₹) <span className="required">*</span></label>
                <input className="form-input" type="number" required step="0.01" min="0.01" value={form.costPerLiter}
                  onChange={e => setForm(f => ({...f, costPerLiter: e.target.value}))} />
              </div>
            </div>
            {total && (
              <div className="alert alert-info">
                <strong>Total Cost: ₹{parseFloat(total).toLocaleString()}</strong>
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
