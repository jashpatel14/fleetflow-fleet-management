import React, { useState, useEffect, FormEvent } from 'react';
import { tripsAPI, vehiclesAPI, driversAPI } from '../api/client';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth, canAccess } from '../context/AuthContext';

const NEXT_STATUS: Record<string, string | null> = {
  DRAFT: 'SUBMITTED', SUBMITTED: 'APPROVED', APPROVED: 'DISPATCHED',
  DISPATCHED: 'COMPLETED', COMPLETED: null, CANCELLED: null,
};
const ACTION_LABEL: Record<string, string> = {
  SUBMITTED: 'Submit', APPROVED: 'Approve', DISPATCHED: 'Dispatch', COMPLETED: 'Complete',
};

const TripsPage = () => {
  const { user } = useAuth();
  const [trips, setTrips]     = useState<any[]>([]);
  const [stats, setStats]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [completing, setCompleting] = useState<any>(null); // trip being completed
  const LIMIT = 10;

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        tripsAPI.getAll({ status: statusFilter, search, page, limit: LIMIT }),
        tripsAPI.getStats(),
      ]);
      setTrips(tRes.data.trips); setTotal(tRes.data.total); setStats(sRes.data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter, search, page]);

  const advance = async (trip: any) => {
    const next = NEXT_STATUS[trip.status];
    if (!next) return;
    if (next === 'COMPLETED') { setCompleting(trip); return; }
    try { await tripsAPI.advance(trip.id, next, {}); await load(); }
    catch (err: any) { alert(err?.response?.data?.error || 'Action failed.'); }
  };

  const cancel = async (id: string) => {
    if (!confirm('Cancel this trip?')) return;
    try { await tripsAPI.advance(id, 'CANCELLED', {}); await load(); }
    catch (err: any) { alert(err?.response?.data?.error || 'Cancel failed.'); }
  };

  const canManage = canAccess(user?.role, ['FLEET_MANAGER', 'DISPATCHER']);

  return (
    <div>
      {/* Stats Row */}
      {stats && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 20 }}>
          {[
            { label: 'Draft',      value: stats.draft,      color: '#6B7280' },
            { label: 'Submitted',  value: stats.submitted,  color: '#F59E0B' },
            { label: 'Approved',   value: stats.approved,   color: '#8B5CF6' },
            { label: 'Dispatched', value: stats.dispatched, color: '#3B82F6' },
            { label: 'Completed',  value: stats.completed,  color: '#22C55E' },
            { label: 'Cancelled',  value: stats.cancelled,  color: '#EF4444' },
          ].map(s => (
            <div key={s.label} className="kpi-card" style={{ padding: 14, cursor: 'pointer' }}
              onClick={() => { setStatusFilter(s.label.toUpperCase()); setPage(1); }}>
              <div className="kpi-content">
                <div className="kpi-label">{s.label}</div>
                <div className="kpi-value" style={{ fontSize: 20, color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search trip number, origin, destination..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {['DRAFT','SUBMITTED','APPROVED','DISPATCHED','COMPLETED','CANCELLED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Trip</button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-container">
          {loading ? (
            <div className="spinner-wrapper"><div className="spinner" /></div>
          ) : trips.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No trips found</div>
              <div className="empty-desc">Create a new trip to get started</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Trip No.</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Cargo (t)</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {trips.map((trip: any) => {
                  const next = NEXT_STATUS[trip.status];
                  return (
                    <tr key={trip.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{trip.tripNumber}</td>
                      <td>{trip.vehicle?.licensePlate}<br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{trip.vehicle?.make} {trip.vehicle?.model}</span></td>
                      <td>{trip.driver?.name}</td>
                      <td style={{ fontSize: 13 }}>{trip.origin} → {trip.destination}</td>
                      <td>{trip.cargoWeightTons}t</td>
                      <td className="font-mono">₹{trip.revenue?.toLocaleString()}</td>
                      <td><StatusBadge type="trip" status={trip.status} /></td>
                      {canManage && (
                        <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                          {next && (
                            <button className="btn btn-primary btn-sm"
                              onClick={() => advance(trip)}>
                              {ACTION_LABEL[next]}
                            </button>
                          )}
                          {!['COMPLETED','CANCELLED'].includes(trip.status) && (
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', marginLeft: 4 }}
                              onClick={() => cancel(trip.id)}>Cancel</button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
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

      {showCreate && <CreateTripModal onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); load(); }} />}
      {completing  && <CompleteModal trip={completing} onClose={() => setCompleting(null)} onSave={() => { setCompleting(null); load(); }} />}
    </div>
  );
};

// ── Create Trip Modal ────────────────────────────────────────────────────────
const CreateTripModal = ({ onClose, onSave }: any) => {
  const [form, setForm] = useState({ vehicleId: '', driverId: '', origin: '', destination: '', cargoDescription: '', cargoWeightTons: '', revenue: '' });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers]   = useState<any[]>([]);
  const [error, setError]       = useState('');
  const [loading, setLoad]      = useState(false);

  useEffect(() => {
    Promise.all([
      vehiclesAPI.getAll({ status: 'AVAILABLE', limit: 100 }),
      driversAPI.getAll({ status: 'OFF_DUTY', limit: 100 }),
    ]).then(([v, d]) => { setVehicles(v.data.vehicles); setDrivers(d.data.drivers); });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoad(true);
    try { await tripsAPI.create(form); onSave(); }
    catch (err: any) { setError(err?.response?.data?.error || err?.response?.data?.errors?.[0]?.msg || 'Failed to create trip.'); }
    finally { setLoad(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">New Trip</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vehicle (Available) <span className="required">*</span></label>
                <select className="form-select" required value={form.vehicleId}
                  onChange={e => setForm(f => ({...f, vehicleId: e.target.value}))}>
                  <option value="">Select vehicle...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} — {v.make} {v.model} ({v.capacityTons}t)</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Driver (Off Duty) <span className="required">*</span></label>
                <select className="form-select" required value={form.driverId}
                  onChange={e => setForm(f => ({...f, driverId: e.target.value}))}>
                  <option value="">Select driver...</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.vehicleCategory}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Origin <span className="required">*</span></label>
                <input className="form-input" required placeholder="Mumbai" value={form.origin}
                  onChange={e => setForm(f => ({...f, origin: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Destination <span className="required">*</span></label>
                <input className="form-input" required placeholder="Pune" value={form.destination}
                  onChange={e => setForm(f => ({...f, destination: e.target.value}))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Cargo Description</label>
              <input className="form-input" placeholder="Electronics, Textiles..." value={form.cargoDescription}
                onChange={e => setForm(f => ({...f, cargoDescription: e.target.value}))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cargo Weight (tons) <span className="required">*</span></label>
                <input className="form-input" type="number" required step="0.1" min="0.01" value={form.cargoWeightTons}
                  onChange={e => setForm(f => ({...f, cargoWeightTons: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Revenue (₹)</label>
                <input className="form-input" type="number" min="0" value={form.revenue}
                  onChange={e => setForm(f => ({...f, revenue: e.target.value}))} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Complete Trip Modal (capture end odometer) ────────────────────────────────
const CompleteModal = ({ trip, onClose, onSave }: any) => {
  const [endOdo, setEndOdo]     = useState('');
  const [revenue, setRevenue]   = useState(trip.revenue || '');
  const [misc, setMisc]         = useState(trip.miscExpenses || '');
  const [error, setError]       = useState('');
  const [loading, setLoad]      = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoad(true);
    try {
      await tripsAPI.advance(trip.id, 'COMPLETED', { endOdometer: endOdo, revenue, miscExpenses: misc });
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Completion failed.');
    } finally { setLoad(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Complete Trip — {trip.tripNumber}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="alert alert-info">
              Start Odometer: <strong>{trip.startOdometer?.toLocaleString()} km</strong>
            </div>
            <div className="form-group">
              <label className="form-label">End Odometer (km) <span className="required">*</span></label>
              <input className="form-input" type="number" required value={endOdo}
                min={trip.startOdometer || 0}
                onChange={e => setEndOdo(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Final Revenue (₹)</label>
                <input className="form-input" type="number" value={revenue}
                  onChange={e => setRevenue(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Misc. Expenses (₹)</label>
                <input className="form-input" type="number" value={misc}
                  onChange={e => setMisc(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Completing...' : '✓ Mark Completed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripsPage;
