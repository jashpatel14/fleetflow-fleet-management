import React, { useState, useEffect, FormEvent } from 'react';
import { vehiclesAPI } from '../api/client';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth, canAccess } from '../context/AuthContext';

const VEHICLE_TYPES = ['MINI_TRUCK','TRUCK','TRAILER','TANKER','CONTAINER','VAN'];
const STATUSES = ['AVAILABLE','ON_TRIP','IN_SHOP','RETIRED'];

const VehiclesPage = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [stats, setStats]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<any>(null);
  const LIMIT = 10;

  const load = async () => {
    setLoading(true);
    try {
      const [vRes, sRes] = await Promise.all([
        vehiclesAPI.getAll({ search, status: statusFilter, page, limit: LIMIT }),
        vehiclesAPI.getStats(),
      ]);
      setVehicles(vRes.data.vehicles);
      setTotal(vRes.data.total);
      setStats(sRes.data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, statusFilter, page]);

  const handleStatusChange = async (id: string, status: string) => {
    try { await vehiclesAPI.changeStatus(id, status); await load(); }
    catch (err: any) { alert(err?.response?.data?.error || 'Status change failed.'); }
  };

  const canManage = canAccess(user?.role, ['FLEET_MANAGER', 'DISPATCHER']);

  return (
    <div>
      {/* Stats Row */}
      {stats && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
          {[
            { label: 'Total', value: stats.total, color: '#2563EB' },
            { label: 'Available', value: stats.available, color: '#22C55E' },
            { label: 'On Trip', value: stats.onTrip, color: '#3B82F6' },
            { label: 'In Shop', value: stats.inShop, color: '#F59E0B' },
            { label: 'Retired', value: stats.retired, color: '#6B7280' },
          ].map(s => (
            <div key={s.label} className="kpi-card" style={{ padding: 16, gap: 12 }}>
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
          <input className="search-input" placeholder="Search by plate, make, model..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        {canManage && (
          <button className="btn btn-primary" onClick={() => { setEditVehicle(null); setShowModal(true); }}>
            + Add Vehicle
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-container">
          {loading ? (
            <div className="spinner-wrapper"><div className="spinner" /></div>
          ) : vehicles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚛</div>
              <div className="empty-title">No vehicles found</div>
              <div className="empty-desc">Try adjusting your filters</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>License Plate</th>
                  <th>Make / Model</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Odometer</th>
                  <th>Status</th>
                  {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v: any) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.licensePlate}</td>
                    <td>{v.make} {v.model} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({v.year})</span></td>
                    <td><span style={{ fontSize: 12 }}>{v.type.replace('_', ' ')}</span></td>
                    <td>{v.capacityTons}t</td>
                    <td className="font-mono">{v.currentOdometer.toLocaleString()} km</td>
                    <td><StatusBadge type="vehicle" status={v.status} /></td>
                    {canManage && (
                      <td className="text-right">
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => { setEditVehicle(v); setShowModal(true); }}>Edit</button>
                        {v.status === 'IN_SHOP' && (
                          <button className="btn btn-ghost btn-sm"
                            onClick={() => handleStatusChange(v.id, 'AVAILABLE')}
                            style={{ color: 'var(--green)' }}>Release</button>
                        )}
                        {v.status === 'AVAILABLE' && (
                          <button className="btn btn-ghost btn-sm"
                            onClick={() => handleStatusChange(v.id, 'RETIRED')}
                            style={{ color: 'var(--red)' }}>Retire</button>
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

      {/* Modal */}
      {showModal && (
        <VehicleModal
          vehicle={editVehicle}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
};

// ── Vehicle Form Modal ─────────────────────────────────────────────
const VehicleModal = ({ vehicle, onClose, onSave }: any) => {
  const isEdit = !!vehicle;
  const [form, setForm] = useState({
    licensePlate: vehicle?.licensePlate || '',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    type: vehicle?.type || 'TRUCK',
    capacityTons: vehicle?.capacityTons || '',
    currentOdometer: vehicle?.currentOdometer || 0,
    acquisitionCost: vehicle?.acquisitionCost || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
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
          <span className="modal-title">{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">License Plate <span className="required">*</span></label>
                <input className="form-input" required value={form.licensePlate}
                  onChange={e => setForm(f => ({...f, licensePlate: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Type <span className="required">*</span></label>
                <select className="form-select" value={form.type}
                  onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                  {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Make <span className="required">*</span></label>
                <input className="form-input" required placeholder="TATA" value={form.make}
                  onChange={e => setForm(f => ({...f, make: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Model <span className="required">*</span></label>
                <input className="form-input" required placeholder="LPT 1615" value={form.model}
                  onChange={e => setForm(f => ({...f, model: e.target.value}))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="form-input" type="number" min="1990" max="2030" value={form.year}
                  onChange={e => setForm(f => ({...f, year: +e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity (tons) <span className="required">*</span></label>
                <input className="form-input" type="number" required step="0.1" min="0.1" value={form.capacityTons}
                  onChange={e => setForm(f => ({...f, capacityTons: e.target.value}))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Current Odometer (km)</label>
                <input className="form-input" type="number" min="0" value={form.currentOdometer}
                  onChange={e => setForm(f => ({...f, currentOdometer: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Acquisition Cost (₹)</label>
                <input className="form-input" type="number" min="0" value={form.acquisitionCost}
                  onChange={e => setForm(f => ({...f, acquisitionCost: e.target.value}))} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehiclesPage;
