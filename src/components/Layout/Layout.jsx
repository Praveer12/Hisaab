import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import ToastContainer from '../UI/Toast';

export default function Layout({ children, theme, toggleTheme }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-wrapper">
        <Header onMenuClick={() => setSidebarOpen(true)} theme={theme} toggleTheme={toggleTheme} />
        <main className="main-content">
          {children}
        </main>
      </div>
      <BottomNav onMenuClick={() => setSidebarOpen(true)} />
      <ToastContainer />
      <style>{`@media (min-width: 769px) { .bottom-nav { display: none !important; } }`}</style>
    </div>
  );
}
