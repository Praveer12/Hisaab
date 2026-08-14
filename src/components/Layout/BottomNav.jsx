import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Plus, Receipt, Menu } from 'lucide-react';

export default function BottomNav({ onMenuClick }) {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} end>
        <div className="bottom-nav-item-icon"><LayoutDashboard size={20} /></div>
        <span>Home</span>
      </NavLink>
      
      <NavLink to="/providers" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <div className="bottom-nav-item-icon"><Users size={20} /></div>
        <span>Providers</span>
      </NavLink>
      
      <NavLink to="/entry" className={({ isActive }) => `bottom-nav-item add-btn ${isActive ? 'active' : ''}`}>
        <div className="bottom-nav-item-icon"><Plus size={24} strokeWidth={2.5} /></div>
        <span>Add</span>
      </NavLink>
      
      <NavLink to="/billing" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <div className="bottom-nav-item-icon"><Receipt size={20} /></div>
        <span>Bills</span>
      </NavLink>
      
      <button className="bottom-nav-item" onClick={onMenuClick}>
        <div className="bottom-nav-item-icon"><Menu size={20} /></div>
        <span>More</span>
      </button>
    </nav>
  );
}
