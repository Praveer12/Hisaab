import React, { useState, useEffect, useMemo } from 'react';
import { Save, X, Newspaper, Milk } from 'lucide-react';
import Button from '../UI/Button';
import { formatDisplayDate } from '../../utils/dateHelpers';
import { calculateDailyMilkAmount, calculateDailyTotal } from '../../utils/calculations';

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Pending'];

export default function DailyEntryForm({ entry, providers, onSubmit, onCancel, selectedDate, currentProviderId }) {
  const [form, setForm] = useState({
    providerId: '',
    morningQty: '',
    eveningQty: '',
    ratePerLitre: '',
    newspaperTaken: false,
    newspaperName: '',
    newspaperRate: '',
    paymentMethod: 'Cash',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  // Pre-fill when editing
  useEffect(() => {
    if (entry) {
      setForm({
        providerId: entry.providerId || '',
        morningQty: entry.milk?.morning?.toString() || '',
        eveningQty: entry.milk?.evening?.toString() || '',
        ratePerLitre: entry.milk?.ratePerLitre?.toString() || '',
        newspaperTaken: entry.newspaper?.taken || false,
        newspaperName: entry.newspaper?.name || '',
        newspaperRate: entry.newspaper?.rate?.toString() || '',
        paymentMethod: entry.paymentMethod || 'Cash',
        notes: entry.notes || '',
      });
    } else {
      // Auto-select: currentProvider first, then single provider fallback
      const autoProvider = providers.find(p => p.id === currentProviderId) || (providers.length === 1 ? providers[0] : null);
      if (autoProvider) {
        setForm(prev => ({
          ...prev,
          providerId: autoProvider.id,
          ratePerLitre: autoProvider.ratePerLitre.toString(),
        }));
      }
    }
  }, [entry, providers]);

  // Update rate when provider changes
  const handleProviderChange = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    setForm(prev => ({
      ...prev,
      providerId,
      ratePerLitre: provider ? provider.ratePerLitre.toString() : prev.ratePerLitre,
    }));
    if (errors.providerId) setErrors(prev => ({ ...prev, providerId: '' }));
  };

  // Auto-calculations
  const morning = parseFloat(form.morningQty) || 0;
  const evening = parseFloat(form.eveningQty) || 0;
  const rate = parseFloat(form.ratePerLitre) || 0;
  const milkAmount = calculateDailyMilkAmount(morning, evening, rate);
  const newspaperRate = form.newspaperTaken ? (parseFloat(form.newspaperRate) || 0) : 0;
  const dailyTotal = calculateDailyTotal(milkAmount, parseFloat(form.newspaperRate) || 0, form.newspaperTaken);

  const validate = () => {
    const newErrors = {};
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
    onSubmit({
      date: selectedDate,
      providerId: form.providerId,
      milk: {
        morning,
        evening,
        ratePerLitre: rate,
        totalAmount: milkAmount,
      },
      newspaper: {
        taken: form.newspaperTaken,
        name: form.newspaperName.trim(),
        rate: form.newspaperTaken ? (parseFloat(form.newspaperRate) || 0) : 0,
      },
      paymentMethod: form.paymentMethod,
      totalAmount: dailyTotal,
      notes: form.notes.trim(),
    });
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="entry-form">
      {/* Date Display */}
      <div className="entry-date-display">
        <span className="entry-date-label">Date</span>
        <span className="entry-date-value">{formatDisplayDate(selectedDate)}</span>
      </div>

      {/* Provider Selection */}
      <div className="form-group">
        <label className="form-label">Milk Provider *</label>
        <select
          className={`form-select ${errors.providerId ? 'form-input-error' : ''}`}
          value={form.providerId}
          onChange={e => handleProviderChange(e.target.value)}
        >
          <option value="">Select Provider</option>
          {providers.map(p => (
            <option key={p.id} value={p.id}>{p.name} (₹{p.ratePerLitre}/L)</option>
          ))}
        </select>
        {errors.providerId && <p className="form-error">{errors.providerId}</p>}
      </div>

      {/* Milk Quantities */}
      <div className="form-section">
        <h4 className="form-section-title">🥛 Milk Details</h4>
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
              onChange={e => handleChange('morningQty', e.target.value)}
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
              onChange={e => handleChange('eveningQty', e.target.value)}
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
              onChange={e => handleChange('ratePerLitre', e.target.value)}
            />
          </div>
        </div>
        {errors.quantity && <p className="form-error">{errors.quantity}</p>}
        <div className="calc-display">
          <span>Milk Total:</span>
          <span className="calc-value">₹{milkAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Newspaper Section */}
      <div className="form-section">
        <div className="form-section-header">
          <h4 className="form-section-title">📰 Newspaper</h4>
          <label className="form-toggle">
            <input
              type="checkbox"
              checked={form.newspaperTaken}
              onChange={e => handleChange('newspaperTaken', e.target.checked)}
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
                onChange={e => handleChange('newspaperName', e.target.value)}
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
                onChange={e => handleChange('newspaperRate', e.target.value)}
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
          placeholder="Any notes..."
          value={form.notes}
          onChange={e => handleChange('notes', e.target.value)}
          rows={2}
        />
      </div>

      {/* Daily Total */}
      <div className="daily-total">
        <span>Daily Total</span>
        <span className="daily-total-value">₹{dailyTotal.toFixed(2)}</span>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} icon={X}>Cancel</Button>
        <Button variant="primary" type="submit" icon={Save}>
          {entry ? 'Update' : 'Save'} Entry
        </Button>
      </div>
    </form>
  );
}
