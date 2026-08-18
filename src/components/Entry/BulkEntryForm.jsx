import React, { useState, useEffect } from 'react';
import { Save, X, Info } from 'lucide-react';
import Button from '../UI/Button';
import { calculateDailyMilkAmount } from '../../utils/calculations';

export default function BulkEntryForm({ providers, onSubmit, onCancel, currentProviderId }) {
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    providerId: '',
    morningQty: '',
    eveningQty: '',
    ratePerLitre: '',
    newspaperTaken: false,
    newspaperName: '',
    newspaperRate: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Auto-select provider: currentProvider first, then single provider fallback
  useEffect(() => {
    const autoProvider = providers.find(p => p.id === currentProviderId) || (providers.length === 1 ? providers[0] : null);
    if (autoProvider) {
      setForm((prev) => ({
        ...prev,
        providerId: autoProvider.id,
        ratePerLitre: autoProvider.ratePerLitre.toString(),
      }));
    }
  }, [providers, currentProviderId]);

  // Update rate when provider changes
  const handleProviderChange = (providerId) => {
    const provider = providers.find((p) => p.id === providerId);
    setForm((prev) => ({
      ...prev,
      providerId,
      ratePerLitre: provider ? provider.ratePerLitre.toString() : prev.ratePerLitre,
    }));
    if (errors.providerId) setErrors((prev) => ({ ...prev, providerId: '' }));
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Helper to generate dates array between start and end date
  const getDatesInRange = (startStr, endStr) => {
    const dates = [];
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    // Copy date
    let current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // Calculations for preview
  const daysList = form.startDate && form.endDate && form.startDate <= form.endDate
    ? getDatesInRange(form.startDate, form.endDate)
    : [];
  
  const totalDaysCount = daysList.length;
  const morning = parseFloat(form.morningQty) || 0;
  const evening = parseFloat(form.eveningQty) || 0;
  const rate = parseFloat(form.ratePerLitre) || 0;
  const singleDayMilkAmount = calculateDailyMilkAmount(morning, evening, rate);
  const singleDayNewspaperRate = form.newspaperTaken ? (parseFloat(form.newspaperRate) || 0) : 0;
  
  const estimatedTotalMilk = (morning + evening) * totalDaysCount;
  const estimatedTotalAmount = (singleDayMilkAmount + singleDayNewspaperRate) * totalDaysCount;

  const validate = () => {
    const newErrors = {};
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.endDate) newErrors.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      newErrors.endDate = 'End date must be on or after start date';
    }
    if (!form.providerId) newErrors.providerId = 'Please select a provider';
    if (morning <= 0 && evening <= 0) newErrors.quantity = 'At least one quantity is required';
    if (rate <= 0) newErrors.ratePerLitre = 'Valid rate is required';
    if (form.newspaperTaken && (!form.newspaperRate || parseFloat(form.newspaperRate) <= 0)) {
      newErrors.newspaperRate = 'Newspaper rate is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const dates = getDatesInRange(form.startDate, form.endDate);
    const entriesPayload = dates.map((date) => ({
      date,
      providerId: form.providerId,
      milk: {
        morning,
        evening,
        ratePerLitre: rate,
      },
      newspaper: {
        taken: form.newspaperTaken,
        name: form.newspaperName.trim(),
        rate: form.newspaperTaken ? (parseFloat(form.newspaperRate) || 0) : 0,
      },
      paymentMethod: 'Pending', // default status, managed monthly now
      notes: form.notes.trim(),
    }));

    onSubmit(entriesPayload, totalDaysCount);
  };

  return (
    <form onSubmit={handleSubmit} className="entry-form">
      {/* Date Range Fields */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Start Date *</label>
          <input
            type="date"
            className={`form-input ${errors.startDate ? 'form-input-error' : ''}`}
            value={form.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
          {errors.startDate && <p className="form-error">{errors.startDate}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">End Date *</label>
          <input
            type="date"
            className={`form-input ${errors.endDate ? 'form-input-error' : ''}`}
            value={form.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
          {errors.endDate && <p className="form-error">{errors.endDate}</p>}
        </div>
      </div>

      {/* Provider Selection */}
      <div className="form-group">
        <label className="form-label">Milk Provider *</label>
        <select
          className={`form-select ${errors.providerId ? 'form-input-error' : ''}`}
          value={form.providerId}
          onChange={(e) => handleProviderChange(e.target.value)}
        >
          <option value="">Select Provider</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (₹{p.ratePerLitre}/L)
            </option>
          ))}
        </select>
        {errors.providerId && <p className="form-error">{errors.providerId}</p>}
      </div>

      {/* Milk Quantities */}
      <div className="form-section">
        <h4 className="form-section-title">🥛 Milk Details (Per Day)</h4>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Morning (L)</label>
            <input
              className="form-input"
              type="number"
              step="0.25"
              min="0"
              placeholder="0"
              value={form.morningQty}
              onChange={(e) => handleChange('morningQty', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Evening (L)</label>
            <input
              className="form-input"
              type="number"
              step="0.25"
              min="0"
              placeholder="0"
              value={form.eveningQty}
              onChange={(e) => handleChange('eveningQty', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Rate (₹/L)</label>
            <input
              className={`form-input ${errors.ratePerLitre ? 'form-input-error' : ''}`}
              type="number"
              step="0.5"
              min="0"
              placeholder="60"
              value={form.ratePerLitre}
              onChange={(e) => handleChange('ratePerLitre', e.target.value)}
            />
          </div>
        </div>
        {errors.quantity && <p className="form-error">{errors.quantity}</p>}
        {errors.ratePerLitre && <p className="form-error">{errors.ratePerLitre}</p>}
      </div>

      {/* Newspaper Section */}
      <div className="form-section">
        <div className="form-section-header">
          <h4 className="form-section-title">📰 Newspaper</h4>
          <label className="form-toggle">
            <input
              type="checkbox"
              checked={form.newspaperTaken}
              onChange={(e) => handleChange('newspaperTaken', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">{form.newspaperTaken ? 'Yes' : 'No'}</span>
          </label>
        </div>
        {form.newspaperTaken && (
          <div className="form-row animate-fade-in">
            <div className="form-group">
              <label className="form-label">Newspaper Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Dainik Jagran"
                value={form.newspaperName}
                onChange={(e) => handleChange('newspaperName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rate (₹) *</label>
              <input
                className={`form-input ${errors.newspaperRate ? 'form-input-error' : ''}`}
                type="number"
                step="0.5"
                min="0"
                placeholder="8"
                value={form.newspaperRate}
                onChange={(e) => handleChange('newspaperRate', e.target.value)}
              />
              {errors.newspaperRate && <p className="form-error">{errors.newspaperRate}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="form-group">
        <label className="form-label">Notes (Optional)</label>
        <textarea
          className="form-textarea"
          placeholder="Notes to apply to all selected days..."
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={2}
        />
      </div>

      {/* Live Preview Box */}
      {totalDaysCount > 0 && (
        <div className="calc-display" style={{ display: 'block', padding: '1rem', backgroundColor: 'var(--color-primary-bg)', border: '1px solid rgba(13, 148, 136, 0.15)', borderRadius: '12px', color: 'var(--color-primary-dark)', marginTop: '1rem', marginBottom: '1rem' }}>
          <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
            <Info size={16} /> Bulk Entry Preview
          </h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', fontSize: '0.8125rem' }}>
            <div>Days: <strong>{totalDaysCount}</strong></div>
            <div>Daily: <strong>₹{(singleDayMilkAmount + singleDayNewspaperRate).toFixed(2)}</strong></div>
            <div>Total Milk: <strong>{estimatedTotalMilk.toFixed(1)} L</strong></div>
            <div style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Total: <strong>₹{estimatedTotalAmount.toFixed(2)}</strong></div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} icon={X}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" icon={Save}>
          Save Bulk Entries
        </Button>
      </div>
    </form>
  );
}
