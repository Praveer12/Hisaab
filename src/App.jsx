import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import DashboardPage from './pages/DashboardPage';
import ProvidersPage from './pages/ProvidersPage';
import EntryPage from './pages/EntryPage';
import BillingPage from './pages/BillingPage';
import StatsPage from './pages/StatsPage';
import CalculatorPage from './pages/CalculatorPage';
import BackupPage from './pages/BackupPage';

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <AppProvider>
      <Router>
        <Layout theme={theme} toggleTheme={toggleTheme}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/providers" element={<ProvidersPage />} />
            <Route path="/entry" element={<EntryPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/backup" element={<BackupPage />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
