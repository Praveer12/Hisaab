import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Clock } from 'lucide-react';
import MonthlyCalendar from '../components/Calendar/MonthlyCalendar';
import SummaryCards from '../components/Dashboard/SummaryCards';
import Button from '../components/UI/Button';
import { useApp } from '../context/AppContext';
import { formatDisplayDate } from '../utils/dateHelpers';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { entries, providers, getEntriesByMonth } = useApp();
  
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  
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
    navigate(`/entry?date=${dateStr}`);
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
          <p className="page-subtitle">Track your daily milk deliveries</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => navigate('/entry')}>
          Add Entry
        </Button>
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
              <span>Missed</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-no-data"></span>
              <span>No Data</span>
            </div>
          </div>
        </div>
        
        <div className="dashboard-recent-section">
          <div className="section-header">
            <h3 className="section-title">
              <Clock size={20} />
              Recent Entries
            </h3>
          </div>
          
          {recentEntries.length === 0 ? (
            <div className="empty-state empty-state-small">
              <TrendingUp size={32} />
              <p>No entries yet</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/entry')}>
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
    </div>
  );
}
