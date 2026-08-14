import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import InstallPrompt from './components/UI/InstallPrompt';
import DashboardPage from './pages/DashboardPage';
import ProvidersPage from './pages/ProvidersPage';
import EntryPage from './pages/EntryPage';
import BillingPage from './pages/BillingPage';
import StatsPage from './pages/StatsPage';
import CalculatorPage from './pages/CalculatorPage';
import BackupPage from './pages/BackupPage';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
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
      <InstallPrompt />
    </AppProvider>
  );
}

export default App;
