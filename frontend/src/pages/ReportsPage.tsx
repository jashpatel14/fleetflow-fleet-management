import React, { useState, useEffect } from 'react';
import { reportsAPI, vehiclesAPI } from '../api/client';
import { TrendingUp, TrendingDown, BarChart as BarChartIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const SW = 1.5;

const ReportsPage = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthly, setMonthly] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selVehicle, setSelVehicle] = useState('');
  const [vReport, setVReport] = useState<any>(null);
  const [loading, setLoad] = useState(true);
  const [vLoad, setVLoad] = useState(false);
  const YEARS = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    setLoad(true);
    Promise.all([reportsAPI.monthly(year), vehiclesAPI.getAll({ limit: 100 })])
      .then(([m, v]) => { setMonthly(m.data.report.months); setVehicles(v.data.vehicles); })
      .catch(() => { })
      .finally(() => setLoad(false));
  }, [year]);

  useEffect(() => {
    if (!selVehicle) { setVReport(null); return; }
    setVLoad(true);
    reportsAPI.vehicleReport(selVehicle)
      .then(r => setVReport(r.data.report))
      .catch(() => setVReport(null))
      .finally(() => setVLoad(false));
  }, [selVehicle]);

  const totalRev = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalExp = monthly.reduce((s, m) => s + m.fuelCost + m.maintCost, 0);
  const netPL = totalRev - totalExp;
  const maxRev = Math.max(...monthly.map(m => m.revenue), 1);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      {/* Annual KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="kpi-card">
          <div className="kpi-icon-row">
            <div className="kpi-icon-wrap" style={{ background: 'var(--green-bg)' }}>
              <TrendingUp size={18} strokeWidth={SW} color="var(--green-text)" />
            </div>
          </div>
          <div className="kpi-label">Total Revenue {year}</div>
          <div className="kpi-value" style={{ color: 'var(--green-text)' }}>
            ₹{(totalRev / 100000).toFixed(2)}L
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon-row">
            <div className="kpi-icon-wrap" style={{ background: 'var(--red-bg)' }}>
              <TrendingDown size={18} strokeWidth={SW} color="var(--red-text)" />
            </div>
          </div>
          <div className="kpi-label">Total Expenses {year}</div>
          <div className="kpi-value" style={{ color: 'var(--red-text)' }}>
            ₹{(totalExp / 100000).toFixed(2)}L
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon-row">
            <div className="kpi-icon-wrap" style={{ background: netPL >= 0 ? 'var(--green-bg)' : 'var(--red-bg)' }}>
              <BarChartIcon size={18} strokeWidth={SW} color={netPL >= 0 ? 'var(--green-text)' : 'var(--red-text)'} />
            </div>
          </div>
          <div className="kpi-label">Net P&amp;L {year}</div>
          <div className="kpi-value" style={{ color: netPL >= 0 ? 'var(--green-text)' : 'var(--red-text)' }}>
            {netPL >= 0 ? '+' : ''}₹{(netPL / 100000).toFixed(2)}L
          </div>
        </div>
      </div>

      <div className="reports-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Chart Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Financial Overview</div>
                <div className="card-subtitle">Monthly Revenue vs Expenses</div>
              </div>
              <select className="filter-select" value={year} onChange={e => setYear(+e.target.value)}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="card-body" style={{ height: 320, padding: '20px 20px 0 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-3)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-3)' }} dx={-10} tickFormatter={(v) => `₹${v >= 100000 ? (v / 100000).toFixed(1) + 'L' : v / 1000 + 'k'}`} />
                  <Tooltip
                    cursor={{ fill: 'var(--bg)' }}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, undefined]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, bottom: 0 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="var(--green)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="maintCost" name="Maintenance" fill="var(--orange)" stackId="exp" radius={[0, 0, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="fuelCost" name="Fuel" fill="var(--red)" stackId="exp" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Table */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Monthly Breakdown</div>
                <div className="card-subtitle">Detailed revenue and expenses table</div>
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr>
                  <th>Month</th><th className="right">Trips</th>
                  <th className="right">Revenue</th><th className="right">Fuel</th>
                  <th className="right">Maint.</th><th className="right">Net P/L</th>
                  <th style={{ width: 80 }}>Bar</th>
                </tr></thead>
                <tbody>
                  {monthly.map((m: any) => (
                    <tr key={m.month}>
                      <td style={{ fontWeight: 600 }}>{m.monthName}</td>
                      <td className="right text-muted">{m.trips}</td>
                      <td className="right mono">₹{m.revenue.toLocaleString()}</td>
                      <td className="right mono text-muted">₹{m.fuelCost.toLocaleString()}</td>
                      <td className="right mono text-muted">₹{m.maintCost.toLocaleString()}</td>
                      <td className="right mono" style={{ fontWeight: 600, color: m.netPL >= 0 ? 'var(--green-text)' : 'var(--red-text)' }}>
                        {m.netPL >= 0 ? '+' : ''}₹{m.netPL.toLocaleString()}
                      </td>
                      <td>
                        <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3 }}>
                          <div style={{ width: `${(m.revenue / maxRev) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: 3, transition: 'width 0.3s ease' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Vehicle Report Panel */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <div className="card-title">Vehicle Report</div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Select vehicle</label>
              <select className="form-select" value={selVehicle} onChange={e => setSelVehicle(e.target.value)}>
                <option value="">Choose a vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} — {v.make}</option>)}
              </select>
            </div>

            {vLoad ? (
              <div className="spinner-wrap" style={{ padding: '24px 0' }}><div className="spinner" /></div>
            ) : vReport ? (
              <div>
                {[
                  { label: 'Completed Trips', value: vReport.completedTrips },
                  { label: 'Total Distance', value: `${(vReport.totalDistance || 0).toLocaleString()} km` },
                  { label: 'Total Revenue', value: `₹${(vReport.totalRevenue || 0).toLocaleString()}`, color: 'var(--green-text)' },
                  { label: 'Fuel Cost', value: `₹${(vReport.totalFuelCost || 0).toLocaleString()}`, color: 'var(--red-text)' },
                  { label: 'Maintenance Cost', value: `₹${(vReport.totalMaintCost || 0).toLocaleString()}`, color: 'var(--red-text)' },
                  { label: 'Net Profit', value: `₹${(vReport.profit || 0).toLocaleString()}`, color: (vReport.profit || 0) >= 0 ? 'var(--green-text)' : 'var(--red-text)', bold: true },
                  { label: 'Cost / km', value: `₹${vReport.costPerKm}` },
                  { label: 'Fuel Efficiency', value: `${vReport.fuelEfficiency} km/L` },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13,
                  }}>
                    <span style={{ color: 'var(--text-3)' }}>{row.label}</span>
                    <span style={{ fontWeight: row.bold ? 700 : 600, color: (row as any).color || 'var(--text-1)' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '28px 0' }}>
                <div className="empty-icon"><BarChartIcon size={30} strokeWidth={1} color="var(--text-4)" /></div>
                <div className="empty-desc">Select a vehicle to view its report</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
