import { useEffect, useState, cloneElement } from 'react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI, tripsAPI } from '../api/client';
import {
  Truck, CheckCircle2, Navigation, Wrench,
  Activity, TrendingUp, AlertTriangle, ChevronRight, Search,
} from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';

const S = 18;
const SW = 1.5;

const KpiCard = ({
  icon, label, value, sub, iconBg, iconColor,
}: {
  icon: ReactElement;
  label: string;
  value: string | number;
  sub?: string;
  iconBg: string;
  iconColor: string
}) => (
  <div className="kpi-card">
    <div className="kpi-icon-row">
      <div className="kpi-icon-wrap" style={{ background: iconBg }}>
        {cloneElement(icon as ReactElement<any>, { size: S, strokeWidth: SW, color: iconColor })}
      </div>
    </div>
    <div className="kpi-label">{label}</div>
    <div className="kpi-value">{value}</div>
    {sub && <div className="kpi-sub">{sub}</div>}
  </div>
);

const OperationalAlert = ({
  icon, title, link, linkText, color, bg
}: {
  icon: ReactElement;
  title: string;
  link: string;
  linkText: string;
  color: string;
  bg: string;
}) => (
  <Link to={link} className="card" style={{
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    border: `1.5px solid ${color}40`,
    background: `${bg}40`,
    textDecoration: 'none'
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 10, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      {cloneElement(icon as ReactElement<any>, { size: 20, strokeWidth: SW, color: color })}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>{title}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: color, marginTop: 2 }}>{linkText}</div>
    </div>
    <ChevronRight size={16} color="var(--text-4)" />
  </Link>
);

const DashboardPage = () => {
  const [data, setData] = useState<any>(null);
  const [recentTrips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      reportsAPI.dashboard(),
      tripsAPI.getAll({ limit: 7, page: 1, search, status: statusF })
    ])
      .then(([d, t]) => { setData(d.data.summary); setTrips(t.data.trips || []); })
      .catch(() => setError('Failed to load dashboard.'));
  }, [search, statusF]);

  useEffect(() => {
    if (!data) setLoading(true); // Initial load only
    // This is just to satisfy the initial fetch if needed, but the [search] one covers it.
    // However, if we want to separate dashboard summary from trips search, we can.
    // Let's keep it simple: fetch both on search change for now to ensure consistency.
  }, []);

  if (loading && !data) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (error && !data) return <div className="alert alert-error"><AlertTriangle size={15} />{error}</div>;
  if (!data) return null;

  const util = data.vehicles.total > 0
    ? Math.round(((data.vehicles.onTrip + data.vehicles.available) / data.vehicles.total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Critical Operational Alerts */}
      {(data.expiringLicenses > 0 || data.maintenanceOpen > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {data.expiringLicenses > 0 && (
            <OperationalAlert
              icon={<AlertTriangle />}
              title={`${data.expiringLicenses} Driver License${data.expiringLicenses > 1 ? 's' : ''} Expiring`}
              link="/drivers"
              linkText="Review Compliance & Renew →"
              color="var(--orange)"
              bg="var(--orange-bg)"
            />
          )}
          {data.maintenanceOpen > 0 && (
            <OperationalAlert
              icon={<Wrench />}
              title={`${data.maintenanceOpen} Vehicle${data.maintenanceOpen > 1 ? 's' : ''} in Maintenance`}
              link="/maintenance"
              linkText="Check Service Status →"
              color="var(--blue)"
              bg="var(--blue-bg)"
            />
          )}
        </div>
      )}

      {/* 2. Primary Actions (Prominent) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[
          { to: '/trips', icon: <Navigation size={20} strokeWidth={SW} color="var(--primary)" />, title: 'Dispatch Trip', desc: 'Assign vehicle & driver' },
          { to: '/vehicles', icon: <Truck size={20} strokeWidth={SW} color="#16A34A" />, title: 'Add Vehicle', desc: 'Register fleet asset' },
          { to: '/maintenance', icon: <Wrench size={20} strokeWidth={SW} color="var(--orange-text)" />, title: 'Log Maintenance', desc: 'Record service entry' },
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

      {/* 3. Fleet KPIs */}
      <div className="kpi-grid">
        <KpiCard icon={<Truck />} label="Total Fleet" value={data.vehicles.total} sub={`${util}% utilization`} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard icon={<CheckCircle2 />} label="Available" value={data.vehicles.available} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard icon={<Navigation />} label="On Trip" value={data.vehicles.onTrip} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard icon={<Wrench />} label="In Maintenance" value={data.vehicles.inShop} iconBg="#FFFBEB" iconColor="#B45309" />
        <KpiCard icon={<Activity />} label="Active Trips" value={data.activeTrips} iconBg="#F5F3FF" iconColor="#6D28D9" />
        <KpiCard icon={<TrendingUp />} label="Total Revenue" value={`₹${(data.totalRevenue / 100000).toFixed(1)}L`} iconBg="#F0FDF4" iconColor="#16A34A" />
      </div>

      {/* 4. Search & Filter Bar (Relocated for Visibility) */}
      <div className="toolbar" style={{ margin: 0, padding: '4px 0' }}>
        <div className="search-wrap" style={{ maxWidth: 400, flex: 1 }}>
          <Search size={14} strokeWidth={SW} className="search-icon-pos" />
          <input
            className="search-input"
            placeholder="Search trips, vehicles, or drivers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusF}
          onChange={e => setStatusF(e.target.value)}
          style={{ width: 140 }}
        >
          <option value="">All Status</option>
          {['DRAFT', 'SUBMITTED', 'APPROVED', 'DISPATCHED', 'COMPLETED', 'CANCELLED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
      </div>

      {/* 5. Recent Trips Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Activity</div>
            <div className="card-subtitle">Latest trips and updates</div>
          </div>
          <Link to="/trips" className="btn btn-secondary btn-sm">
            View all <ChevronRight size={13} strokeWidth={SW} />
          </Link>
        </div>
        <div className="table-scroll">
          {recentTrips.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Truck size={36} strokeWidth={1} color="var(--text-4)" /></div>
              <div className="empty-title">No matching trips</div>
              <div className="empty-desc">Try adjusting your search or filters</div>
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
    </div>
  );
};

export default DashboardPage;
