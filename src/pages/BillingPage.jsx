import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BillView from '../components/Billing/BillView';
import { useApp } from '../context/AppContext';
import { getMonthName } from '../utils/dateHelpers';

export default function BillingPage() {
  const { entries, providers, getEntriesByMonth } = useApp();
  
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedProviderId, setSelectedProviderId] = useState(providers[0]?.id || '');
  
  // Keep selected provider in sync
  React.useEffect(() => {
    if (providers.length > 0 && (!selectedProviderId || !providers.some(p => p.id === selectedProviderId))) {
      setSelectedProviderId(providers[0].id);
    }
  }, [providers, selectedProviderId]);
  
  const filteredEntries = useMemo(() => {
    const monthEntries = getEntriesByMonth(year, month);
    return monthEntries.filter(entry => entry.providerId === selectedProviderId);
  }, [entries, year, month, selectedProviderId, getEntriesByMonth]);
  
  const handlePrev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  
  const handleNext = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  
  return (
    <div className="billing-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Billing</h2>
          <p className="page-subtitle">View and download monthly bills</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        {/* Month Navigator */}
        <div className="month-navigator" style={{ margin: 0 }}>
          <button className="btn btn-icon" onClick={handlePrev}>
            <ChevronLeft size={20} />
          </button>
          <h3 className="month-navigator-title">{getMonthName(month)} {year}</h3>
          <button className="btn btn-icon" onClick={handleNext}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Provider Selector */}
        {providers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label className="form-label" style={{ marginBottom: 0, fontWeight: 500 }}>Provider:</label>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '180px', padding: '0.5rem 2rem 0.5rem 1rem' }}
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
            >
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <BillView
        entries={filteredEntries}
        providers={providers}
        year={year}
        month={month}
        providerId={selectedProviderId}
      />
    </div>
  );
}
