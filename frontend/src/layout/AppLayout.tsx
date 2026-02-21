import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':   { title: 'Main Dashboard',     subtitle: 'Fleet overview and live KPIs' },
  '/vehicles':    { title: 'Vehicle Registry',   subtitle: 'Manage your fleet assets' },
  '/drivers':     { title: 'Driver Profiles',    subtitle: 'Driver performance and compliance' },
  '/trips':       { title: 'Trip Dispatcher',    subtitle: 'Manage and track fleet trips' },
  '/maintenance': { title: 'Maintenance Logs',   subtitle: 'Service and repair tracking' },
  '/fuel':        { title: 'Expense & Fuel',     subtitle: 'Fuel and expense logging' },
  '/reports':     { title: 'Analytics & Reports', subtitle: 'Financial and operational reports' },
};

const AppLayout = () => {
  const location = useLocation();
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'FleetFlow', subtitle: '' };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        {/* Top Header */}
        <header className="top-header">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{pageInfo.title}</div>
            {pageInfo.subtitle && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{pageInfo.subtitle}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--green)', boxShadow: '0 0 0 2px var(--green-bg)',
            }} title="System Online" />
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
