import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Clock, ArrowRight } from 'lucide-react';
import MonthlyCalendar from '../components/Calendar/MonthlyCalendar';
import SummaryCards from '../components/Dashboard/SummaryCards';
import QuickEntryModal from '../components/Entry/QuickEntryModal';
import VoiceEntry from '../components/Entry/VoiceEntry';
import Button from '../components/UI/Button';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/dateHelpers';

const LAST_PROMPT_KEY = 'doodhbook_last_prompt_date';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { entries, providers, loading, currentProvider, getEntriesByMonth, addEntry, updateEntry, showToast, getEntryByDate } = useApp();
  
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  
  // Quick Entry Modal state
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [quickEntryDate, setQuickEntryDate] = useState(null);
  
  // Voice Entry ref
  const voiceRef = useRef(null);

  // Auto-popup: show "Aaj doodh aaya?" on first app open of the day
  useEffect(() => {
    if (loading || providers.length === 0) return; // Wait for data to load

    const today = formatDate(new Date());
    const lastPromptDate = localStorage.getItem(LAST_PROMPT_KEY);
    
    if (lastPromptDate === today) return; // Already prompted today

    // Mark as prompted for today (regardless of whether user fills entry or not)
    localStorage.setItem(LAST_PROMPT_KEY, today);

    // Check if today already has an entry
    const todayEntry = getEntryByDate(today);
    if (todayEntry) return; // Already has entry, no need to prompt

    // Small delay so the dashboard renders first
    const timer = setTimeout(() => {
      setQuickEntryDate(today);
      setShowQuickEntry(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [loading, providers, entries, getEntryByDate]);
  
  const monthEntries = useMemo(
    () => getEntriesByMonth(year, month),
    [entries, year, month, getEntriesByMonth]
  );
  
  // Recent entries (last 5)
  const recentEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [entries]);
  
  const handleMonthChange = (newYear, newMonth) => {
    setYear(newYear);
    setMonth(newMonth);
  };
  
  const handleDateClick = (dateStr) => {
    const existing = getEntryByDate(dateStr);
    if (existing) {
      // Has entry — go to detail/edit page
      navigate(`/entry?date=${dateStr}`);
    } else {
      // No entry — open quick entry modal
      setQuickEntryDate(dateStr);
      setShowQuickEntry(true);
    }
  };

  const handleAddEntryClick = () => {
    setQuickEntryDate(formatDate(new Date()));
    setShowQuickEntry(true);
  };

  const handleQuickSave = async (entryData) => {
    await addEntry(entryData);
    showToast('Entry saved! ✅', 'success');
  };
  
  const getProviderName = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.name : 'Unknown';
  };
  
  return (
    <div className="dashboard-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Your milk delivery overview</p>
        </div>
        <button className="voice-header-btn" onClick={() => voiceRef.current?.start()}>
          <Mic size={18} />
          <span>Voice Entry</span>
        </button>
      </div>
      
      <SummaryCards entries={monthEntries} year={year} month={month} />
      
      <div className="dashboard-grid">
        <div className="dashboard-calendar-section">
          <MonthlyCalendar
            year={year}
            month={month}
            onMonthChange={handleMonthChange}
            onDateClick={handleDateClick}
            entries={monthEntries}
          />
          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot legend-delivered"></span>
              <span>Delivered</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-missed"></span>
              <span>Absent</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-no-data"></span>
              <span>Upcoming</span>
            </div>
          </div>
        </div>
        
        <div className="dashboard-recent-section">
          <div className="section-header">
            <h3 className="section-title">
              <Clock size={18} />
              Recent Entries
            </h3>
          </div>
          
          {recentEntries.length === 0 ? (
            <div className="empty-state empty-state-small">
              <p>No entries yet. Start tracking!</p>
              <Button variant="primary" size="sm" onClick={handleAddEntryClick}>
                Add First Entry
              </Button>
            </div>
          ) : (
            <div className="recent-entries-list">
              {recentEntries.map(entry => (
                <div
                  key={entry.id}
                  className="recent-entry-card"
                  onClick={() => navigate(`/entry?date=${entry.date}`)}
                >
                  <div className="recent-entry-date">
                    <span className="recent-date-day">
                      {new Date(entry.date + 'T00:00:00').getDate()}
                    </span>
                    <span className="recent-date-month">
                      {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </div>
                  <div className="recent-entry-info">
                    <span className="recent-entry-provider">{getProviderName(entry.providerId)}</span>
                    <span className="recent-entry-milk">
                      {(entry.milk.morning + entry.milk.evening).toFixed(1)}L
                      {entry.newspaper.taken && ' + 📰'}
                    </span>
                  </div>
                  <div className="recent-entry-amount">
                    <span className="recent-amount-value">₹{entry.totalAmount.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Entry Modal */}
      <QuickEntryModal
        isOpen={showQuickEntry}
        onClose={() => setShowQuickEntry(false)}
        date={quickEntryDate}
        providers={providers}
        currentProvider={currentProvider}
        onSave={handleQuickSave}
      />

      {/* Voice Entry */}
      <VoiceEntry
        ref={voiceRef}
        currentProvider={currentProvider}
        onSave={({ quantity, provider }) => {
          const today = formatDate(new Date());
          const existingEntry = getEntryByDate(today);
          const entryData = {
            date: today,
            providerId: provider.id,
            milk: {
              morning: quantity,
              evening: 0,
              ratePerLitre: provider.ratePerLitre,
              totalAmount: quantity * provider.ratePerLitre,
            },
            newspaper: existingEntry?.newspaper || { taken: false, name: '', rate: 0 },
            paymentMethod: existingEntry?.paymentMethod || 'Pending',
            totalAmount: quantity * provider.ratePerLitre + (existingEntry?.newspaper?.taken ? (existingEntry?.newspaper?.rate || 0) : 0),
            notes: 'Voice entry 🎤',
          };

          if (existingEntry) {
            updateEntry(existingEntry.id, entryData);
            showToast(`${quantity}L — entry updated! 🎤`, 'success');
          } else {
            addEntry(entryData);
            showToast(`${quantity}L — entry saved! 🎤`, 'success');
          }
        }}
      />
    </div>
  );
}
