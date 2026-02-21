import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, canAccess, ROLE_LABELS } from '../context/AuthContext';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',   icon: '▦',  label: 'Dashboard',       roles: ['FLEET_MANAGER','DISPATCHER','SAFETY_OFFICER','FINANCIAL_ANALYST'] },
  { path: '/vehicles',    icon: '🚛', label: 'Vehicles',         roles: ['FLEET_MANAGER','DISPATCHER'] },
  { path: '/drivers',     icon: '👤', label: 'Driver Profiles',  roles: ['FLEET_MANAGER','SAFETY_OFFICER'] },
  { path: '/trips',       icon: '📋', label: 'Trip Dispatcher',  roles: ['FLEET_MANAGER','DISPATCHER'] },
  { path: '/maintenance', icon: '🔧', label: 'Maintenance',      roles: ['FLEET_MANAGER','SAFETY_OFFICER','DISPATCHER'] },
  { path: '/fuel',        icon: '⛽', label: 'Expense & Fuel',   roles: ['FLEET_MANAGER','DISPATCHER'] },
  { path: '/reports',     icon: '📊', label: 'Analytics',        roles: ['FLEET_MANAGER','FINANCIAL_ANALYST'] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const visibleItems = NAV_ITEMS.filter(item =>
    canAccess(user?.role, item.roles)
  );

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'FF';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">F</div>
        <div>
          <div className="brand-name">FleetFlow</div>
          <div className="brand-sub">Core v1.0</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          {visibleItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User info + logout */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div className="user-role">{ROLE_LABELS[user?.role || '']}</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm"
            title="Logout"
            style={{ padding: '4px 6px', fontSize: 16 }}
          >
            ⎋
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
