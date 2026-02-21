import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../api/client';
import { tripsAPI } from '../api/client';

interface DashboardData {
  vehicles: { total: number; available: number; onTrip: number; inShop: number; retired: number };
  activeTrips: number;
  maintenanceOpen: number;
  expiringLicenses: number;
  totalRevenue: number;
}

const KpiCard = ({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string }) => (
  <div className="kpi-card">
    <div className="kpi-icon" style={{ background: color + '20', color }}>{icon}</div>
    <div className="kpi-content">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-trend">{sub}</div>}
    </div>
  </div>
);

const DashboardPage = () => {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [recentTrips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, tripRes] = await Promise.all([
          reportsAPI.dashboard(),
          tripsAPI.getAll({ limit: 7, page: 1 }),
        ]);
        setData(dashRes.data.summary);
        setTrips(tripRes.data.trips || []);
      } catch (e: any) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="spinner-wrapper"><div className="spinner" /></div>;
  if (error)   return <div className="alert alert-error">{error}</div>;
  if (!data)   return null;

  const utilization = data.vehicles.total > 0
    ? Math.round(((data.vehicles.onTrip + data.vehicles.available) / data.vehicles.total) * 100)
    : 0;

  const TRIP_STATUS_COLORS: Record<string, string> = {
    DRAFT: 'badge badge-gray', SUBMITTED: 'badge badge-yellow',
    APPROVED: 'badge badge-purple', DISPATCHED: 'badge badge-blue',
    COMPLETED: 'badge badge-green', CANCELLED: 'badge badge-red',
  };

  return (
    <div>
      {/* Alerts */}
      {data.expiringLicenses > 0 && (
        <div className="alert alert-warning">
          ⚠ <strong>{data.expiringLicenses} driver license(s)</strong> expiring within 30 days.
          <Link to="/drivers" style={{ marginLeft: 8, fontWeight: 600, color: 'var(--orange)' }}>View Drivers →</Link>
        </div>
      )}
      {data.maintenanceOpen > 0 && (
        <div className="alert alert-warning">
          🔧 <strong>{data.maintenanceOpen} vehicle(s)</strong> currently in maintenance.
          <Link to="/maintenance" style={{ marginLeft: 8, fontWeight: 600, color: 'var(--orange)' }}>View Maintenance →</Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard icon="🚛" label="Total Fleet"      value={data.vehicles.total}     color="#2563EB" sub={`${utilization}% utilization`} />
        <KpiCard icon="✅" label="Available"         value={data.vehicles.available} color="#22C55E" />
        <KpiCard icon="🛣️" label="On Trip"          value={data.vehicles.onTrip}    color="#3B82F6" />
        <KpiCard icon="🔧" label="In Maintenance"   value={data.vehicles.inShop}    color="#F59E0B" />
        <KpiCard icon="📋" label="Active Trips"      value={data.activeTrips}        color="#8B5CF6" />
        <KpiCard icon="💰" label="Total Revenue"     value={`₹${(data.totalRevenue/100000).toFixed(1)}L`} color="#22C55E" />
      </div>

      {/* Recent Trips Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Trips</span>
          <Link to="/trips" className="btn btn-secondary btn-sm">View All →</Link>
        </div>
        <div className="table-container">
          {recentTrips.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No trips yet</div>
              <div className="empty-desc">Create your first trip to get started</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Trip No.</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Origin → Destination</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((trip: any) => (
                  <tr key={trip.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{trip.tripNumber}</td>
                    <td>{trip.vehicle?.licensePlate} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({trip.vehicle?.make})</span></td>
                    <td>{trip.driver?.name}</td>
                    <td>{trip.origin} → {trip.destination}</td>
                    <td><span className={TRIP_STATUS_COLORS[trip.status] || 'badge badge-gray'}>{trip.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 20 }}>
        <Link to="/trips" className="card" style={{ padding: '20px', display: 'block', textAlign: 'center', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🚛</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>New Trip</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Dispatch a vehicle</div>
        </Link>
        <Link to="/vehicles" className="card" style={{ padding: '20px', display: 'block', textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔩</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Add Vehicle</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Register new asset</div>
        </Link>
        <Link to="/maintenance" className="card" style={{ padding: '20px', display: 'block', textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔧</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Maintenance</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Log service record</div>
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
