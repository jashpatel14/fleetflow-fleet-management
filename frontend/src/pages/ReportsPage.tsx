import React, { useState, useEffect } from 'react';
import { reportsAPI, vehiclesAPI } from '../api/client';

const ReportsPage = () => {
  const [year, setYear]         = useState(new Date().getFullYear());
  const [monthly, setMonthly]   = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [vehicleReport, setVehicleReport]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [vLoading, setVLoading] = useState(false);

  const YEARS = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [mRes, vRes] = await Promise.all([
          reportsAPI.monthly(year),
          vehiclesAPI.getAll({ limit: 100 }),
        ]);
        setMonthly(mRes.data.report.months);
        setVehicles(vRes.data.vehicles);
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    };
    load();
  }, [year]);

  useEffect(() => {
    if (!selectedVehicle) { setVehicleReport(null); return; }
    setVLoading(true);
    reportsAPI.vehicleReport(selectedVehicle)
      .then(r => setVehicleReport(r.data.report))
      .catch(() => setVehicleReport(null))
      .finally(() => setVLoading(false));
  }, [selectedVehicle]);

  const maxRevenue = Math.max(...(monthly.map(m => m.revenue) || [1]), 1);

  if (loading) return <div className="spinner-wrapper"><div className="spinner" /></div>;

  const totalRevenue  = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalExpenses = monthly.reduce((s, m) => s + m.fuelCost + m.maintCost, 0);
  const netPL         = totalRevenue - totalExpenses;

  return (
    <div>
      {/* Annual Summary KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>💰</div>
          <div className="kpi-content">
            <div className="kpi-label">Total Revenue ({year})</div>
            <div className="kpi-value">₹{(totalRevenue/100000).toFixed(2)}L</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>📉</div>
          <div className="kpi-content">
            <div className="kpi-label">Total Expenses ({year})</div>
            <div className="kpi-value">₹{(totalExpenses/100000).toFixed(2)}L</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: netPL >= 0 ? '#DCFCE7' : '#FEE2E2', color: netPL >= 0 ? '#16A34A' : '#DC2626' }}>📊</div>
          <div className="kpi-content">
            <div className="kpi-label">Net P&amp;L ({year})</div>
            <div className="kpi-value" style={{ color: netPL >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {netPL >= 0 ? '+' : ''}₹{(netPL/100000).toFixed(2)}L
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Monthly Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly P&L Breakdown</span>
            <select className="filter-select" value={year}
              onChange={e => setYear(+e.target.value)}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="table-container">
            <table>
              <thead><tr>
                <th>Month</th><th>Trips</th><th className="text-right">Revenue</th>
                <th className="text-right">Fuel Cost</th><th className="text-right">Maint.</th>
                <th className="text-right">Net P/L</th><th>Bar</th>
              </tr></thead>
              <tbody>
                {monthly.map((m: any) => (
                  <tr key={m.month}>
                    <td style={{ fontWeight: 600 }}>{m.monthName}</td>
                    <td>{m.trips}</td>
                    <td className="text-right font-mono">₹{m.revenue.toLocaleString()}</td>
                    <td className="text-right font-mono">₹{m.fuelCost.toLocaleString()}</td>
                    <td className="text-right font-mono">₹{m.maintCost.toLocaleString()}</td>
                    <td className="text-right font-mono" style={{ fontWeight: 600, color: m.netPL >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {m.netPL >= 0 ? '+' : ''}₹{m.netPL.toLocaleString()}
                    </td>
                    <td style={{ width: 80 }}>
                      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4 }}>
                        <div style={{ width: `${(m.revenue / maxRevenue) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Report Panel */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <span className="card-title">Vehicle Report</span>
          </div>
          <div className="card-body">
            <div className="form-group">
              <select className="form-select" value={selectedVehicle}
                onChange={e => setSelectedVehicle(e.target.value)}>
                <option value="">Select a vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} — {v.make} {v.model}</option>)}
              </select>
            </div>
            {vLoading ? (
              <div className="spinner-wrapper" style={{ padding: 30 }}><div className="spinner" /></div>
            ) : vehicleReport ? (
              <div>
                {[
                  { label: 'Completed Trips', value: vehicleReport.completedTrips },
                  { label: 'Total Distance',  value: `${vehicleReport.totalDistance?.toLocaleString()} km` },
                  { label: 'Total Revenue',   value: `₹${vehicleReport.totalRevenue?.toLocaleString()}` },
                  { label: 'Fuel Cost',       value: `₹${vehicleReport.totalFuelCost?.toLocaleString()}` },
                  { label: 'Maint. Cost',     value: `₹${vehicleReport.totalMaintCost?.toLocaleString()}` },
                  { label: 'Profit',          value: `₹${vehicleReport.profit?.toLocaleString()}`, color: vehicleReport.profit >= 0 ? 'var(--green)' : 'var(--red)' },
                  { label: 'Cost/km',         value: `₹${vehicleReport.costPerKm}` },
                  { label: 'Fuel Efficiency', value: `${vehicleReport.fuelEfficiency} km/L` },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontWeight: 600, color: (row as any).color || 'var(--text-primary)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="empty-icon" style={{ fontSize: 32 }}>📊</div>
                <div className="empty-desc">Select a vehicle to view its financial report</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
