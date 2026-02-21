import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { vehiclesAPI } from '../api/client';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth, canAccess } from '../context/AuthContext';
import { Search, Plus, Truck, CheckCircle2, Navigation, Wrench, AlertCircle, ExternalLink } from 'lucide-react';

const SW = 1.5;
const VEHICLE_TYPES = ['MINI_TRUCK', 'TRUCK', 'TRAILER', 'TANKER', 'CONTAINER', 'VAN'];
const STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

const VehiclesPage = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
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
      const [v, s] = await Promise.all([
        vehiclesAPI.getAll({ search, status: statusF, page, limit: LIMIT }),
        vehiclesAPI.getStats(),
      ]);
      setVehicles(v.data.vehicles); setTotal(v.data.total); setStats(s.data);
    } catch { /* ignore */ } finally { setLoad(false); }
  };
  useEffect(() => { load(); }, [search, statusF, page]);

  const changeStatus = async (id: string, status: string) => {
    try { await vehiclesAPI.changeStatus(id, status); load(); }
    catch (e: any) { alert(e?.response?.data?.error || 'Status change failed.'); }
  };

  const canManage = canAccess(user?.role, ['FLEET_MANAGER', 'DISPATCHER']);

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
          <div className="kpi-card">
            <div className="kpi-icon-row">
              <div className="kpi-icon-wrap" style={{ background: 'var(--primary-light)' }}>
                <Truck size={18} strokeWidth={1.5} color="var(--primary)" />
              </div>
              <ExternalLink size={14} color="var(--text-4)" />
            </div>
            <div className="kpi-label">Total Fleet</div>
            <div className="kpi-value">{stats.total}</div>
            <div className="kpi-sub">Vehicles registered</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-row">
              <div className="kpi-icon-wrap" style={{ background: 'var(--green-bg)' }}>
                <CheckCircle2 size={18} strokeWidth={1.5} color="var(--green)" />
              </div>
            </div>
            <div className="kpi-label">Available</div>
            <div className="kpi-value">{stats.available}</div>
            <div className="kpi-sub">Ready for dispatch</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-row">
              <div className="kpi-icon-wrap" style={{ background: 'var(--blue-bg)' }}>
                <Navigation size={18} strokeWidth={1.5} color="var(--blue)" />
              </div>
            </div>
            <div className="kpi-label">On Trip</div>
            <div className="kpi-value">{stats.onTrip}</div>
            <div className="kpi-sub">Currently active</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-row">
              <div className="kpi-icon-wrap" style={{ background: 'var(--orange-bg)' }}>
                <Wrench size={18} strokeWidth={1.5} color="var(--orange)" />
              </div>
            </div>
            <div className="kpi-label">In Shop</div>
            <div className="kpi-value">{stats.inShop}</div>
            <div className="kpi-sub">Maintenance / Repair</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-row">
              <div className="kpi-icon-wrap" style={{ background: 'var(--gray-bg)' }}>
                <AlertCircle size={18} strokeWidth={1.5} color="var(--text-3)" />
              </div>
            </div>
            <div className="kpi-label">Retired</div>
            <div className="kpi-value">{stats.retired}</div>
            <div className="kpi-sub">Decommissioned</div>
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="search-wrap">
          <Search size={14} strokeWidth={SW} className="search-icon-pos" />
          <input className="search-input" placeholder="Search plate, make, model..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={statusF}
          onChange={e => { setStatusF(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        {canManage && (
          <button className="btn btn-primary" onClick={() => { setEditing(null); setModal(true); }}>
            <Plus size={15} strokeWidth={SW} /> Add Vehicle
          </button>
        )}
      </div>

      <div className="card" style={{ border: '2px solid var(--border)' }}>
        <div className="card-header">
          <div className="card-title" style={{ background: 'var(--blue-bg)', color: 'var(--blue)', padding: '4px 12px', borderRadius: '16px', display: 'inline-block', fontSize: 13, fontWeight: 600 }}>
            Fleet Vehicles
          </div>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <div className="table-scroll">
            {loading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : vehicles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Truck size={36} strokeWidth={1} color="var(--text-4)" /></div>
                <div className="empty-title">No vehicles found</div>
                <div className="empty-desc">Try adjusting your search or filters</div>
              </div>
            ) : (
              <table>
                <thead><tr>
                  <th>License Plate</th><th>Make / Model</th><th>Type</th>
                  <th className="right">Capacity</th><th className="right">Odometer</th>
                  <th>Status</th>{canManage && <th className="right">Actions</th>}
                </tr></thead>
                <tbody>
                  {vehicles.map((v: any) => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{v.licensePlate}</td>
                      <td>
                        {v.make} {v.model}
                        <span className="text-muted text-sm"> · {v.year}</span>
                      </td>
                      <td className="text-muted text-sm">{v.type.replace('_', ' ')}</td>
                      <td className="right mono">{v.capacityTons}t</td>
                      <td className="right mono">{v.currentOdometer.toLocaleString()} km</td>
                      <td><StatusBadge type="vehicle" status={v.status} /></td>
                      {canManage && (
                        <td className="right" style={{ whiteSpace: 'nowrap' }}>
                          <button className="btn btn-ghost btn-sm"
                            onClick={() => { setEditing(v); setModal(true); }}>Edit</button>
                          {v.status === 'IN_SHOP' && (
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--green-text)' }}
                              onClick={() => changeStatus(v.id, 'AVAILABLE')}>Release</button>
                          )}
                          {v.status === 'AVAILABLE' && (
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red-text)' }}
                              onClick={() => changeStatus(v.id, 'RETIRED')}>Retire</button>
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

      {modal && <VehicleModal vehicle={editing} onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />}
    </div>
  );
};

const VehicleModal = ({ vehicle, onClose, onSave }: any) => {
  const isEdit = !!vehicle;
  const [form, setForm] = useState({
    licensePlate: vehicle?.licensePlate || '', make: vehicle?.make || '',
    model: vehicle?.model || '', year: vehicle?.year || new Date().getFullYear(),
    type: vehicle?.type || 'TRUCK', capacityTons: vehicle?.capacityTons || '',
    currentOdometer: vehicle?.currentOdometer || 0, acquisitionCost: vehicle?.acquisitionCost || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoad(true);
    try {
      if (isEdit) await vehiclesAPI.update(vehicle.id, form);
      else await vehiclesAPI.create(form);
      onSave();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.errors?.[0]?.msg || 'Save failed.');
    } finally { setLoad(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Vehicle' : 'Register Vehicle'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: 18, color: 'var(--text-3)' }}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error"><AlertCircle size={14} strokeWidth={SW} />{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">License Plate <span className="req">*</span></label>
                <input className="form-input" required value={form.licensePlate} onChange={set('licensePlate')} placeholder="MH-12-AB-1234" />
              </div>
              <div className="form-group">
                <label className="form-label">Type <span className="req">*</span></label>
                <select className="form-select" value={form.type} onChange={set('type')}>
                  {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Make <span className="req">*</span></label>
                <input className="form-input" required placeholder="TATA" value={form.make} onChange={set('make')} />
              </div>
              <div className="form-group">
                <label className="form-label">Model <span className="req">*</span></label>
                <input className="form-input" required placeholder="LPT 1615" value={form.model} onChange={set('model')} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="form-input" type="number" min="1990" max="2030" value={form.year} onChange={set('year')} />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity (tons) <span className="req">*</span></label>
                <input className="form-input" type="number" required step="0.1" min="0.1" value={form.capacityTons} onChange={set('capacityTons')} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Odometer (km)</label>
                <input className="form-input" type="number" min="0" value={form.currentOdometer} onChange={set('currentOdometer')} />
              </div>
              <div className="form-group">
                <label className="form-label">Acquisition Cost (₹)</label>
                <input className="form-input" type="number" min="0" value={form.acquisitionCost} onChange={set('acquisitionCost')} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehiclesPage;
