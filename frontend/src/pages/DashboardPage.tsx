import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI, tripsAPI } from '../api/client';
import {
  Truck, CheckCircle2, Navigation, Wrench,
  Activity, TrendingUp, AlertTriangle, ChevronRight,
} from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';

const S = 18;
const SW = 1.5;

const KpiCard = ({
  icon, label, value, sub, iconBg, iconColor,
}: { icon: React.ReactNode; label: string; value: string | number; sub?: string; iconBg: string; iconColor: string }) => (
  <div className="kpi-card">
    <div className="kpi-icon-row">
      <div className="kpi-icon-wrap" style={{ background: iconBg }}>
        {React.cloneElement(icon as React.ReactElement, { size: S, strokeWidth: SW, color: iconColor })}
      </div>
    </div>
    <div className="kpi-label">{label}</div>
    <div className="kpi-value">{value}</div>
    {sub && <div className="kpi-sub">{sub}</div>}
  </div>
);

const DashboardPage = () => {
  const [data, setData]         = useState<any>(null);
  const [recentTrips, setTrips] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([reportsAPI.dashboard(), tripsAPI.getAll({ limit: 7, page: 1 })])
      .then(([d, t]) => { setData(d.data.summary); setTrips(t.data.trips || []); })
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (error)   return <div className="alert alert-error"><AlertTriangle size={15} />{error}</div>;
  if (!data)   return null;

  const util = data.vehicles.total > 0
    ? Math.round(((data.vehicles.onTrip + data.vehicles.available) / data.vehicles.total) * 100) : 0;

  return (
    <div>
      {/* Alerts */}
      {data.expiringLicenses > 0 && (
        <div className="alert alert-warning">
          <AlertTriangle size={15} strokeWidth={SW} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>{data.expiringLicenses} driver license{data.expiringLicenses > 1 ? 's' : ''}</strong> expiring within 30 days.
            <Link to="/drivers" style={{ marginLeft: 8, fontWeight: 600, color: 'inherit', textDecoration: 'underline' }}>
              View Drivers →
            </Link>
          </span>
        </div>
      )}
      {data.maintenanceOpen > 0 && (
        <div className="alert alert-warning">
          <Wrench size={15} strokeWidth={SW} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>{data.maintenanceOpen} vehicle{data.maintenanceOpen > 1 ? 's' : ''}</strong> currently in maintenance.
            <Link to="/maintenance" style={{ marginLeft: 8, fontWeight: 600, color: 'inherit', textDecoration: 'underline' }}>
              View Maintenance →
            </Link>
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard icon={<Truck />}         label="Total Fleet"        value={data.vehicles.total}     sub={`${util}% utilization`} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard icon={<CheckCircle2 />}  label="Available"          value={data.vehicles.available} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard icon={<Navigation />}    label="On Trip"            value={data.vehicles.onTrip}    iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard icon={<Wrench />}        label="In Maintenance"     value={data.vehicles.inShop}    iconBg="#FFFBEB" iconColor="#B45309" />
        <KpiCard icon={<Activity />}      label="Active Trips"       value={data.activeTrips}        iconBg="#F5F3FF" iconColor="#6D28D9" />
        <KpiCard icon={<TrendingUp />}    label="Total Revenue"      value={`₹${(data.totalRevenue / 100000).toFixed(1)}L`} iconBg="#F0FDF4" iconColor="#16A34A" />
      </div>

      {/* Recent Trips */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Trips</div>
            <div className="card-subtitle">Latest fleet activity</div>
          </div>
          <Link to="/trips" className="btn btn-secondary btn-sm">
            View all <ChevronRight size={13} strokeWidth={SW} />
          </Link>
        </div>
        <div className="table-scroll">
          {recentTrips.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Truck size={36} strokeWidth={1} color="var(--text-4)" /></div>
              <div className="empty-title">No trips yet</div>
              <div className="empty-desc">Create your first trip to see it here</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Trip No.</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((t: any) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{t.tripNumber}</td>
                    <td>
                      {t.vehicle?.licensePlate}
                      <span className="text-muted text-sm"> · {t.vehicle?.make}</span>
                    </td>
                    <td>{t.driver?.name}</td>
                    <td className="text-muted" style={{ fontSize: 13 }}>{t.origin} → {t.destination}</td>
                    <td><StatusBadge type="trip" status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 16 }}>
        {[
          { to: '/trips',       icon: <Navigation size={20} strokeWidth={SW} color="var(--primary)" />,       title: 'Dispatch Trip',   desc: 'Assign vehicle & driver' },
          { to: '/vehicles',    icon: <Truck size={20} strokeWidth={SW} color="#16A34A" />,                    title: 'Add Vehicle',     desc: 'Register fleet asset' },
          { to: '/maintenance', icon: <Wrench size={20} strokeWidth={SW} color="var(--orange-text)" />,        title: 'Log Maintenance', desc: 'Record service entry' },
        ].map(a => (
          <Link key={a.to} to={a.to} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, transition: 'box-shadow 0.2s ease' }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {a.icon}
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)' }}>{a.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
