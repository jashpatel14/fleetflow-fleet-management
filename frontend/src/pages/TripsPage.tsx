import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { tripsAPI, vehiclesAPI, driversAPI } from '../api/client';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth, canAccess } from '../context/AuthContext';
import { Search, Plus, Route, AlertCircle } from 'lucide-react';

const SW = 1.5;
const NEXT_STATUS: Record<string, string | null> = {
  DRAFT: 'SUBMITTED', SUBMITTED: 'APPROVED', APPROVED: 'DISPATCHED',
  DISPATCHED: 'COMPLETED', COMPLETED: null, CANCELLED: null,
};
const ACTION_LABEL: Record<string, string> = { SUBMITTED: 'Submit', APPROVED: 'Approve', DISPATCHED: 'Dispatch', COMPLETED: 'Complete' };

const TripsPage = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoad] = useState(true);
  const [statusF, setStatusF] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [completing, setCompleting] = useState<any>(null);
  const LIMIT = 10;

  const load = async () => {
    setLoad(true);
    try {
      const [tRes, sRes] = await Promise.all([
        tripsAPI.getAll({ status: statusF, search, page, limit: LIMIT }),
        tripsAPI.getStats(),
      ]);
      setTrips(tRes.data.trips); setTotal(tRes.data.total); setStats(sRes.data);
    } catch { /* ignore */ } finally { setLoad(false); }
  };
  useEffect(() => { load(); }, [statusF, search, page]);

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
      {stats && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(6,1fr)' }}>
          {(['draft', 'submitted', 'approved', 'dispatched', 'completed', 'cancelled'] as const).map(key => (
            <div key={key} className="kpi-card" style={{ padding: '14px 16px', cursor: 'pointer' }}
              onClick={() => { setStatusF(key.toUpperCase()); setPage(1); }}>
              <div className="kpi-label" style={{ textTransform: 'capitalize' }}>{key}</div>
              <div className="kpi-value" style={{
                fontSize: 22, color:
                  key === 'completed' ? 'var(--green-text)' : key === 'dispatched' ? 'var(--blue-text)'
                    : key === 'cancelled' ? 'var(--red-text)' : key === 'approved' ? '#6D28D9'
                      : key === 'submitted' ? 'var(--yellow-text)' : 'var(--text-3)'
              }}>{stats[key] || 0}</div>
            </div>
          ))}
        </div>
      )}

      <div className="toolbar">
        <div className="search-wrap">
          <Search size={14} strokeWidth={SW} className="search-icon-pos" />
          <input className="search-input" placeholder="Search trip, origin, destination..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={statusF}
          onChange={e => { setStatusF(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {['DRAFT', 'SUBMITTED', 'APPROVED', 'DISPATCHED', 'COMPLETED', 'CANCELLED'].map(s =>
            <option key={s} value={s}>{s}</option>)}
        </select>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} strokeWidth={SW} /> New Trip
          </button>
        )}
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : trips.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Route size={36} strokeWidth={1} color="var(--text-4)" /></div>
              <div className="empty-title">No trips found</div>
              <div className="empty-desc">Create a trip to get started</div>
            </div>
          ) : (
            <table>
              <thead><tr>
                <th>Trip No.</th><th>Vehicle</th><th>Driver</th>
                <th>Route</th><th className="right">Cargo</th>
                <th className="right">Revenue</th><th>Status</th>
                {canManage && <th className="right">Actions</th>}
              </tr></thead>
              <tbody>
                {trips.map((trip: any) => {
                  const next = NEXT_STATUS[trip.status];
                  return (
                    <tr key={trip.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{trip.tripNumber}</td>
                      <td>
                        {trip.vehicle?.licensePlate}
                        <span className="text-muted text-sm"> · {trip.vehicle?.make}</span>
                      </td>
                      <td>{trip.driver?.name}</td>
                      <td className="text-muted" style={{ fontSize: 13 }}>{trip.origin} → {trip.destination}</td>
                      <td className="right mono">{trip.cargoWeightTons}t</td>
                      <td className="right mono">₹{trip.revenue?.toLocaleString()}</td>
                      <td><StatusBadge type="trip" status={trip.status} /></td>
                      {canManage && (
                        <td className="right" style={{ whiteSpace: 'nowrap' }}>
                          {next && (
                            <button className="btn btn-primary btn-sm" onClick={() => advance(trip)}>
                              {ACTION_LABEL[next]}
                            </button>
                          )}
                          {!['COMPLETED', 'CANCELLED'].includes(trip.status) && (
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red-text)', marginLeft: 4 }}
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
            <span className="pagination-info">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
            <div className="pagination-btns">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              <button className="page-btn" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateTripModal onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); load(); }} />}
      {completing && <CompleteModal trip={completing} onClose={() => setCompleting(null)} onSave={() => { setCompleting(null); load(); }} />}
    </div>
  );
};

const CreateTripModal = ({ onClose, onSave }: any) => {
  const [form, setForm] = useState({ vehicleId: '', driverId: '', origin: '', destination: '', cargoDescription: '', cargoWeightTons: '', revenue: '' });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    Promise.all([
      vehiclesAPI.getAll({ status: 'AVAILABLE', limit: 100 }),
      driversAPI.getAll({ status: 'OFF_DUTY', limit: 100 }),
    ]).then(([v, d]) => { setVehicles(v.data.vehicles); setDrivers(d.data.drivers); });
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoad(true);
    try { await tripsAPI.create(form); onSave(); }
    catch (err: any) { setError(err?.response?.data?.error || err?.response?.data?.errors?.[0]?.msg || 'Failed.'); }
    finally { setLoad(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Dispatch New Trip</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color: 'var(--text-3)' }}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error"><AlertCircle size={14} strokeWidth={SW} />{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vehicle (Available) <span className="req">*</span></label>
                <select className="form-select" required value={form.vehicleId} onChange={set('vehicleId')}>
                  <option value="">Select vehicle...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} — {v.make} ({v.capacityTons}t)</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Driver (Off Duty) <span className="req">*</span></label>
                <select className="form-select" required value={form.driverId} onChange={set('driverId')}>
                  <option value="">Select driver...</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.vehicleCategory}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Origin <span className="req">*</span></label>
                <input className="form-input" required placeholder="Mumbai" value={form.origin} onChange={set('origin')} />
              </div>
              <div className="form-group">
                <label className="form-label">Destination <span className="req">*</span></label>
                <input className="form-input" required placeholder="Pune" value={form.destination} onChange={set('destination')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Cargo Description</label>
              <input className="form-input" placeholder="Electronics, Textiles..." value={form.cargoDescription} onChange={set('cargoDescription')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cargo Weight (tons) <span className="req">*</span></label>
                <input className="form-input" type="number" required step="0.1" min="0.01" value={form.cargoWeightTons} onChange={set('cargoWeightTons')} />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Revenue (₹)</label>
                <input className="form-input" type="number" min="0" value={form.revenue} onChange={set('revenue')} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Trip'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CompleteModal = ({ trip, onClose, onSave }: any) => {
  const [endOdo, setEndOdo] = useState('');
  const [revenue, setRevenue] = useState(trip.revenue || '');
  const [misc, setMisc] = useState(trip.miscExpenses || 0);
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoad(true);
    try { await tripsAPI.advance(trip.id, 'COMPLETED', { endOdometer: endOdo, revenue, miscExpenses: misc }); onSave(); }
    catch (err: any) { setError(err?.response?.data?.error || 'Failed.'); }
    finally { setLoad(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Complete Trip — {trip.tripNumber}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color: 'var(--text-3)' }}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error"><AlertCircle size={14} strokeWidth={SW} />{error}</div>}
            <div className="alert alert-info">Start odometer: <strong>{trip.startOdometer?.toLocaleString()} km</strong></div>
            <div className="form-group">
              <label className="form-label">End Odometer (km) <span className="req">*</span></label>
              <input className="form-input" type="number" required value={endOdo} min={trip.startOdometer || 0} onChange={e => setEndOdo(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Final Revenue (₹)</label>
                <input className="form-input" type="number" value={revenue} onChange={e => setRevenue(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Misc. Expenses (₹)</label>
                <input className="form-input" type="number" value={misc} onChange={e => setMisc(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Completing...' : '✓ Mark Completed'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripsPage;
