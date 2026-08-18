import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BillView from '../components/Billing/BillView';
import { useApp } from '../context/AppContext';
import { getMonthName } from '../utils/dateHelpers';

export default function BillingPage() {
  const { entries, providers, getEntriesByMonth, currentProviderId } = useApp();
  
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedProviderId, setSelectedProviderId] = useState(currentProviderId || providers[0]?.id || '');
  
  React.useEffect(() => {
    if (providers.length > 0 && (!selectedProviderId || !providers.some(p => p.id === selectedProviderId))) {
      setSelectedProviderId(currentProviderId || providers[0].id);
    }
  }, [providers, selectedProviderId, currentProviderId]);
  
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
          <p className="page-subtitle">Monthly bills & payments</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
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

        {/* Provider Selector as chips */}
        {providers.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {providers.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProviderId(p.id)}
                style={{
                  padding: '0.4rem 0.875rem',
                  borderRadius: '9999px',
                  border: selectedProviderId === p.id ? '1.5px solid #0D9488' : '1.5px solid #E2E8F0',
                  background: selectedProviderId === p.id ? '#F0FDFA' : '#FFFFFF',
                  color: selectedProviderId === p.id ? '#0D9488' : '#64748B',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                }}
              >
                {p.name}
              </button>
            ))}
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
