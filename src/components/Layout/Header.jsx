import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/entry': 'Add Entry',
  '/providers': 'Providers',
  '/billing': 'Billing',
};

export default function Header({ onMenuClick, theme, toggleTheme }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Hisaab';
  
  return (
    <header className="header">
      <button className="btn btn-icon header-menu hamburger" onClick={onMenuClick}>
        <Menu size={24} />
      </button>
      <h2 className="header-title">{title}</h2>
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-icon" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <span className="header-date mobile-hidden">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
      <style>{`@media (max-width: 768px) { .mobile-hidden { display: none !important; } }`}</style>
    </header>
  );
}
