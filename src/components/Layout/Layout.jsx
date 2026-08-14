import React from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import ToastContainer from '../UI/Toast';
import { useApp } from '../../context/AppContext';

export default function Layout({ children }) {
  const { loading } = useApp();

  return (
    <div className="app-layout">
      <div className="main-wrapper">
        <Header />
        <main className="main-content">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: 'var(--text-secondary)' }}>
              <div className="loading-spinner" style={{
                width: '40px', height: '40px',
                border: '3px solid var(--color-primary-bg)',
                borderTop: '3px solid var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Syncing Database...</p>
              <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              `}</style>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
