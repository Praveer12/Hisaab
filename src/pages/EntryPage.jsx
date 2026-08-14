import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CalendarDays, Edit, Trash2 } from 'lucide-react';
import DailyEntryForm from '../components/Entry/DailyEntryForm';
import BulkEntryForm from '../components/Entry/BulkEntryForm';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import { useApp } from '../context/AppContext';
import { formatDate, formatDisplayDate } from '../utils/dateHelpers';

export default function EntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { providers, entries, addEntry, updateEntry, deleteEntry, saveBulkEntries, getEntryByDate, showToast } = useApp();
  
  const dateParam = searchParams.get('date');
  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(dateParam || today);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryMode, setEntryMode] = useState('single');
  
  const existingEntry = useMemo(
    () => getEntryByDate(selectedDate),
    [selectedDate, entries, getEntryByDate]
  );
  
  const [isEditing, setIsEditing] = useState(!existingEntry);
  
  React.useEffect(() => {
    setIsEditing(!existingEntry);
  }, [existingEntry]);
  
  const handleSubmit = (data) => {
    if (existingEntry) {
      updateEntry(existingEntry.id, data);
      showToast('Entry updated successfully!', 'success');
    } else {
      addEntry(data);
      showToast('Entry saved successfully!', 'success');
    }
    setIsEditing(false);
  };

  const handleBulkSubmit = (bulkData, daysCount) => {
    saveBulkEntries(bulkData);
    showToast(`Successfully saved ${daysCount} entries!`, 'success');
    navigate('/');
  };
  
  const handleDelete = () => {
    if (existingEntry) {
      deleteEntry(existingEntry.id);
      showToast('Entry deleted', 'success');
      setShowDeleteConfirm(false);
      setIsEditing(true);
    }
  };
  
  const handleCancel = () => {
    if (existingEntry) {
      setIsEditing(false);
    } else {
      navigate('/');
    }
  };
  
  const getProviderName = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.name : 'Unknown';
  };
  
  if (providers.length === 0) {
    return (
      <div className="entry-page animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">Add Entry</h2>
            <p className="page-subtitle">First, add a milk provider</p>
          </div>
        </div>
        <div className="empty-state">
          <CalendarDays size={48} />
          <h3>No Providers Found</h3>
          <p>You need to add at least one milk provider before creating entries.</p>
          <Button variant="primary" onClick={() => navigate('/providers')}>
            Add Provider
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="entry-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">{existingEntry && !isEditing ? 'Entry Details' : (existingEntry ? 'Edit Entry' : 'New Entry')}</h2>
          <p className="page-subtitle">{formatDisplayDate(selectedDate)}</p>
        </div>
        <div className="page-header-actions">
          <div className="date-selector">
            <label className="form-label" htmlFor="entry-date-picker">Date</label>
            <input
              id="entry-date-picker"
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={today}
            />
          </div>
        </div>
      </div>
      
      {existingEntry && !isEditing ? (
        <div className="entry-view card">
          <div className="entry-view-header">
            <h3>Entry for {formatDisplayDate(selectedDate)}</h3>
            <div className="entry-view-actions">
              <Button variant="secondary" size="sm" icon={Edit} onClick={() => setIsEditing(true)}>Edit</Button>
              <Button variant="danger" size="sm" icon={Trash2} onClick={() => setShowDeleteConfirm(true)}>Delete</Button>
            </div>
          </div>
          
          <div className="entry-view-grid">
            <div className="entry-view-section">
              <h4>🥛 Milk Details</h4>
              <div className="entry-detail-row">
                <span className="detail-label">Provider</span>
                <span className="detail-value">{getProviderName(existingEntry.providerId)}</span>
              </div>
              <div className="entry-detail-row">
                <span className="detail-label">Morning</span>
                <span className="detail-value">{existingEntry.milk.morning} L</span>
              </div>
              <div className="entry-detail-row">
                <span className="detail-label">Evening</span>
                <span className="detail-value">{existingEntry.milk.evening} L</span>
              </div>
              <div className="entry-detail-row">
                <span className="detail-label">Rate</span>
                <span className="detail-value">₹{existingEntry.milk.ratePerLitre}/L</span>
              </div>
              <div className="entry-detail-row highlight">
                <span className="detail-label">Milk Amount</span>
                <span className="detail-value">₹{existingEntry.milk.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="entry-view-section">
              <h4>📰 Newspaper</h4>
              {existingEntry.newspaper.taken ? (
                <>
                  <div className="entry-detail-row">
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{existingEntry.newspaper.name || '-'}</span>
                  </div>
                  <div className="entry-detail-row">
                    <span className="detail-label">Rate</span>
                    <span className="detail-value">₹{existingEntry.newspaper.rate}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted">No newspaper today</p>
              )}
            </div>
            
            {existingEntry.notes && (
              <div className="entry-view-section">
                <h4>📝 Notes</h4>
                <p className="text-muted" style={{ marginTop: '0.5rem' }}>{existingEntry.notes}</p>
              </div>
            )}
          </div>
          
          <div className="entry-view-total">
            <span>Daily Total</span>
            <span className="entry-total-value">₹{existingEntry.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <div className="card">
          {!existingEntry && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setEntryMode('single')}
                style={{
                  flex: 1,
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  background: entryMode === 'single' ? '#0D9488' : '#F1F5F9',
                  color: entryMode === 'single' ? '#FFFFFF' : '#64748B',
                }}
              >
                📅 Single Entry
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('bulk')}
                style={{
                  flex: 1,
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  background: entryMode === 'bulk' ? '#0D9488' : '#F1F5F9',
                  color: entryMode === 'bulk' ? '#FFFFFF' : '#64748B',
                }}
              >
                🔄 Bulk Entry
              </button>
            </div>
          )}

          {entryMode === 'single' || existingEntry ? (
            <DailyEntryForm
              entry={existingEntry}
              providers={providers}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              selectedDate={selectedDate}
            />
          ) : (
            <BulkEntryForm
              providers={providers}
              onSubmit={handleBulkSubmit}
              onCancel={handleCancel}
            />
          )}
        </div>
      )}
      
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Entry"
        size="sm"
        footer={
          <div className="flex-between">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="danger" icon={Trash2} onClick={handleDelete}>Delete</Button>
          </div>
        }
      >
        <p>Are you sure you want to delete the entry for <strong>{formatDisplayDate(selectedDate)}</strong>?</p>
      </Modal>
    </div>
  );
}
