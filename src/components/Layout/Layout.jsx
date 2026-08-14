import React from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import ToastContainer from '../UI/Toast';

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <div className="main-wrapper">
        <Header />
        <main className="main-content">
          {children}
        </main>
      </div>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
