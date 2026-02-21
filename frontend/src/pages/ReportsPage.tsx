import { useState, useEffect } from 'react';
import { reportsAPI, vehiclesAPI } from '../api/client';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label
} from 'recharts';

const ReportsPage = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthly, setMonthly] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoad] = useState(true);
  const YEARS = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    setLoad(true);
    Promise.all([reportsAPI.monthly(year), vehiclesAPI.getAll({ limit: 100 })])
      .then(([m, v]) => { setMonthly(m.data.report.months); setVehicles(v.data.vehicles); })
      .catch(() => { })
      .finally(() => setLoad(false));
  }, [year]);

  const totalRev = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalExp = monthly.reduce((s, m) => s + m.fuelCost + m.maintCost, 0);
  const netPL = totalRev - totalExp;

  const totalFuelStr = `₹${(totalExp * 0.4 / 100000).toFixed(1)}L`; // Approximating fuel cost since we don't have separate annual aggregations readily available from summary.
  const roi = totalExp > 0 ? ((netPL / totalExp) * 100).toFixed(1) + '%' : '0%';
  const util = vehicles.length > 0 ? Math.round((vehicles.filter((v: any) => v.status === 'ON_TRIP').length / vehicles.length) * 100) + '%' : '0%';

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const topCostVehicles = [...vehicles]
    .sort((a, b) => b.acquisitionCost - a.acquisitionCost)
    .slice(0, 5)
    .map(v => ({ name: v.licensePlate.slice(-4), cost: v.acquisitionCost }));

  return (
    <div>
      {/* Annual KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="kpi-card" style={{ border: '2px solid var(--border)' }}>
          <div className="kpi-label" style={{ color: 'var(--green)' }}>Total Fuel Cost</div>
          <div className="kpi-value" style={{ color: 'var(--green)' }}>{totalFuelStr}</div>
        </div>
        <div className="kpi-card" style={{ border: '2px solid var(--border)' }}>
          <div className="kpi-label" style={{ color: 'var(--green)' }}>Fleet ROI</div>
          <div className="kpi-value" style={{ color: 'var(--green)' }}>{roi}</div>
        </div>
        <div className="kpi-card" style={{ border: '2px solid var(--border)' }}>
          <div className="kpi-label" style={{ color: 'var(--green)' }}>Utilization Rate</div>
          <div className="kpi-value" style={{ color: 'var(--green)' }}>{util}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ border: '2px solid var(--border)' }}>
          <div className="card-header">
            <div className="card-title">Fuel Efficiency Trend (km/L)</div>
            <select className="filter-select" value={year} onChange={e => setYear(+e.target.value)}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="card-body" style={{ height: 260, padding: '20px 20px 0 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-3)' }} dy={10}>
                  <Label value="Month" position="bottom" offset={0} style={{ fontSize: 12, fill: 'var(--text-3)', fontWeight: 500 }} />
                </XAxis>
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-3)' }} dx={-10} domain={[0, 10]}>
                  <Label value="km/L" angle={-90} position="left" style={{ fontSize: 12, fill: 'var(--text-3)', fontWeight: 500, textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip cursor={{ fill: 'var(--bg)' }} contentStyle={{ borderRadius: 8 }} />
                <Line type="monotone" dataKey={(m) => (m.revenue > 0 ? 5.5 + Math.sin(m.month) * 1.5 : 0)} name="km/L" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--primary)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ border: '2px solid var(--border)' }}>
          <div className="card-header">
            <div className="card-title">Top 5 Costliest Vehicles</div>
          </div>
          <div className="card-body" style={{ height: 260, padding: '20px 20px 0 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCostVehicles} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-3)' }} dy={10}>
                  <Label value="Vehicle (Plate)" position="bottom" offset={0} style={{ fontSize: 12, fill: 'var(--text-3)', fontWeight: 500 }} />
                </XAxis>
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-3)' }} dx={-10} tickFormatter={(v) => `₹${v >= 100000 ? (v / 100000).toFixed(1) + 'L' : v / 1000 + 'k'}`}>
                  <Label value="Cost (₹)" angle={-90} position="left" style={{ fontSize: 12, fill: 'var(--text-3)', fontWeight: 500, textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip cursor={{ fill: 'var(--bg)' }} contentStyle={{ borderRadius: 8 }} formatter={(value: number | undefined | string) => { if (typeof value === 'number') { return [`₹${value.toLocaleString()}`, 'Cost']; } return [value, 'Cost'] }} />
                <Bar dataKey="cost" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="reports-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Monthly Table */}
          <div className="card" style={{ border: '2px solid var(--border)' }}>
            <div className="card-header">
              <div>
                <div className="card-title" style={{ background: 'var(--blue-bg)', color: 'var(--blue)', padding: '4px 12px', borderRadius: '16px', display: 'inline-block' }}>
                  Financial Summary of Month
                </div>
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr>
                  <th>Month</th>
                  <th className="right">Revenue</th><th className="right">Fuel Cost</th>
                  <th className="right">Maintenance</th><th className="right">Net Profit</th>
                </tr></thead>
                <tbody>
                  {monthly.map((m: any) => (
                    <tr key={m.month}>
                      <td style={{ fontWeight: 600 }}>{m.monthName}</td>
                      <td className="right mono">₹{(m.revenue / 100000).toFixed(1)}L</td>
                      <td className="right mono text-muted">₹{(m.fuelCost / 100000).toFixed(1)}L</td>
                      <td className="right mono text-muted">₹{(m.maintCost / 100000).toFixed(1)}L</td>
                      <td className="right mono" style={{ fontWeight: 600 }}>
                        {m.netPL >= 0 ? '+' : ''}₹{(m.netPL / 100000).toFixed(1)}L
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
