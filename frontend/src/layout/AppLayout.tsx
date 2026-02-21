import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const PAGE_META: Record<string, { title: string; sub: string }> = {
  '/dashboard':   { title: 'Dashboard',         sub: 'Fleet overview and live KPIs' },
  '/vehicles':    { title: 'Vehicle Registry',  sub: 'Manage your fleet assets' },
  '/drivers':     { title: 'Driver Profiles',   sub: 'Driver compliance and performance' },
  '/trips':       { title: 'Trip Dispatcher',   sub: 'Manage and track trips' },
  '/maintenance': { title: 'Maintenance Logs',  sub: 'Service and repair tracking' },
  '/fuel':        { title: 'Expense & Fuel',    sub: 'Fuel cost and expense logging' },
  '/reports':     { title: 'Analytics',         sub: 'Financial and operational reports' },
};

const AppLayout = () => {
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || { title: 'FleetFlow', sub: '' };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <header className="top-header">
          <div style={{ flex: 1 }}>
            <div className="header-title">{meta.title}</div>
            {meta.sub && <div className="header-sub">{meta.sub}</div>}
          </div>
          <div className="header-pill">
            <span className="status-dot" />
            System Online
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 4 }}>
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
