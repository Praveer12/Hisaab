import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Plus, Receipt, MoreHorizontal, TrendingUp, Calculator, DatabaseBackup, LayoutDashboard, ChefHat, ContactRound } from 'lucide-react';

const moreItems = [
  { path: '/stats', label: 'Statistics', icon: TrendingUp, color: '#8B5CF6' },
  { path: '/calculator', label: 'Calculator', icon: Calculator, color: '#0EA5E9' },
  { path: '/backup', label: 'Backup', icon: DatabaseBackup, color: '#F97316' },
];

// Milk section paths
const milkPaths = ['/milk', '/providers', '/entry', '/billing', '/stats', '/calculator', '/backup'];

export default function BottomNav() {
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isMilkSection = milkPaths.includes(location.pathname);
  const isCookSection = location.pathname === '/cook';
  const isContactsSection = location.pathname === '/contacts';
  const isHome = location.pathname === '/';

  // Close popup on outside click
  useEffect(() => {
    if (!showMore) return;
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setShowMore(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [showMore]);

  const handleMoreItemClick = (path) => {
    setShowMore(false);
    navigate(path);
  };

  // Home page — simple two-tab nav
  if (isHome) {
    return (
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} end>
          <div className="bottom-nav-item-icon"><Home size={20} /></div>
          <span>Home</span>
        </NavLink>
        <NavLink to="/contacts" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <div className="bottom-nav-item-icon"><ContactRound size={20} /></div>
          <span>Contacts</span>
        </NavLink>
      </nav>
    );
  }

  // Cook section nav
  if (isCookSection) {
    return (
      <nav className="bottom-nav">
        <NavLink to="/" className="bottom-nav-item">
          <div className="bottom-nav-item-icon"><Home size={20} /></div>
          <span>Home</span>
        </NavLink>
        <NavLink to="/cook" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <div className="bottom-nav-item-icon"><ChefHat size={20} /></div>
          <span>Cook</span>
        </NavLink>
      </nav>
    );
  }

  // Service Contacts section nav
  if (isContactsSection) {
    return (
      <nav className="bottom-nav">
        <NavLink to="/" className="bottom-nav-item">
          <div className="bottom-nav-item-icon"><Home size={20} /></div>
          <span>Home</span>
        </NavLink>
        <NavLink to="/contacts" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <div className="bottom-nav-item-icon"><ContactRound size={20} /></div>
          <span>Contacts</span>
        </NavLink>
      </nav>
    );
  }

  // Milk section nav (same as before, but Home → /, milk dashboard → /milk)
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className="bottom-nav-item">
        <div className="bottom-nav-item-icon"><Home size={20} /></div>
        <span>Home</span>
      </NavLink>

      <NavLink to="/milk" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <div className="bottom-nav-item-icon"><LayoutDashboard size={20} /></div>
        <span>Dashboard</span>
      </NavLink>

      <NavLink to="/entry" className={({ isActive }) => `bottom-nav-item add-btn ${isActive ? 'active' : ''}`}>
        <div className="bottom-nav-item-icon"><Plus size={24} strokeWidth={2.5} /></div>
        <span>Add</span>
      </NavLink>

      <NavLink to="/billing" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <div className="bottom-nav-item-icon"><Receipt size={20} /></div>
        <span>Bills</span>
      </NavLink>

      <div className="bottom-nav-more-wrapper" ref={moreRef}>
        {showMore && (
          <div className="bottom-nav-popup">
            {moreItems.map(item => (
              <button
                key={item.path}
                className="bottom-nav-popup-item"
                onClick={() => handleMoreItemClick(item.path)}
              >
                <div className="bottom-nav-popup-icon" style={{ background: item.color + '15', color: item.color }}>
                  <item.icon size={18} />
                </div>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
        <button
          className={`bottom-nav-item ${showMore ? 'active' : ''}`}
          onClick={() => setShowMore(prev => !prev)}
        >
          <div className="bottom-nav-item-icon"><MoreHorizontal size={20} /></div>
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
