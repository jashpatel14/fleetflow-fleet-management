import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, User, Route, Wrench,
  Fuel, BarChart3, LogOut,
} from 'lucide-react';
import { useAuth, canAccess, ROLE_LABELS } from '../context/AuthContext';

const ICON_SIZE = 18;
const ICON_STROKE = 1.5;

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  roles: string[];
}

const makeItem = (
  path: string, label: string,
  Icon: React.ComponentType<any>,
  roles: string[]
): NavItem => ({
  path, label, roles,
  icon: <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} color="var(--text-3)" />,
  activeIcon: <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} color="var(--primary)" />,
});

const NAV_ITEMS: NavItem[] = [
  makeItem('/dashboard', 'Dashboard', LayoutDashboard, ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']),
  makeItem('/vehicles', 'Vehicles', Truck, ['FLEET_MANAGER', 'DISPATCHER']),
  makeItem('/drivers', 'Driver Profiles', User, ['FLEET_MANAGER', 'SAFETY_OFFICER']),
  makeItem('/trips', 'Trip Dispatcher', Route, ['FLEET_MANAGER', 'DISPATCHER']),
  makeItem('/maintenance', 'Maintenance', Wrench, ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER']),
  makeItem('/fuel', 'Expense & Fuel', Fuel, ['FLEET_MANAGER', 'DISPATCHER']),
  makeItem('/reports', 'Analytics', BarChart3, ['FLEET_MANAGER', 'FINANCIAL_ANALYST']),
];

const Sidebar = ({ mobileOpen, isCollapsed, onClose }: { mobileOpen?: boolean, isCollapsed?: boolean, onClose?: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const visible = NAV_ITEMS.filter(item => canAccess(user?.role, item.roles));
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'FF';

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-mark">F</div>
        <div className="brand-name-wrap">
          <div className="brand-name">FleetFlow</div>
          <div className="brand-version">Core v1.0</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {visible.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            {({ isActive }) => (
              <>
                <span className="nav-icon">
                  {isActive ? item.activeIcon : item.icon}
                </span>
                <span className="nav-text">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name truncate">{user?.name}</div>
            <div className="user-role">{ROLE_LABELS[user?.role || '']}</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-icon"
            title="Sign out"
            style={{ padding: 6, color: 'var(--text-3)', display: isCollapsed ? 'none' : 'flex' }}
          >
            <LogOut size={15} strokeWidth={ICON_STROKE} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
