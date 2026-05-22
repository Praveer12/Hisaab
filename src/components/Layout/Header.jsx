import React from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/entry': 'Add Entry',
  '/providers': 'Providers',
  '/billing': 'Billing',
};

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Hisaab';
  
  return (
    <header className="header">
      <button className="btn btn-icon header-menu" onClick={onMenuClick}>
        <Menu size={24} />
      </button>
      <h2 className="header-title">{title}</h2>
      <div className="header-right">
        <span className="header-date">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
    </header>
  );
}
