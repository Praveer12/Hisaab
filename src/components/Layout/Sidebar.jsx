import React from 'react'; // Force reload
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Users, Receipt, TrendingUp, Calculator, DatabaseBackup, X } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/entry', label: 'Add Entry', icon: PlusCircle },
  { path: '/providers', label: 'Providers', icon: Users },
  { path: '/billing', label: 'Billing', icon: Receipt },
  { path: '/stats', label: 'Stats', icon: TrendingUp },
  { path: '/calculator', label: 'Calculator', icon: Calculator },
  { path: '/backup', label: 'Backup', icon: DatabaseBackup },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">📒</span>
            <h1 className="logo-text">Hisaab</h1>
          </div>
          <button className="btn btn-icon sidebar-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              end={item.path === '/'}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-version">Hisaab v1.0</p>
        </div>
      </aside>
    </>
  );
}
