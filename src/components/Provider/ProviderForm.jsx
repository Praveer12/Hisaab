import React, { useState, useEffect } from 'react';
import Button from '../UI/Button';
import { Save, X } from 'lucide-react';

export default function ProviderForm({ provider, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    contact: '',
    ratePerLitre: '',
    address: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (provider) {
      setForm({
        name: provider.name || '',
        contact: provider.contact || '',
        ratePerLitre: provider.ratePerLitre?.toString() || '',
        address: provider.address || '',
      });
    }
  }, [provider]);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.ratePerLitre || parseFloat(form.ratePerLitre) <= 0) newErrors.ratePerLitre = 'Valid rate is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: form.name.trim(),
      contact: form.contact.trim(),
      ratePerLitre: parseFloat(form.ratePerLitre),
      address: form.address.trim(),
      isActive: true,
    });
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="provider-form">
      <div className="form-group">
        <label className="form-label">Provider Name *</label>
        <input
          className={`form-input ${errors.name ? 'form-input-error' : ''}`}
          type="text"
          placeholder="e.g. Ramesh Dairy"
          value={form.name}
          onChange={e => handleChange('name', e.target.value)}
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Contact Number</label>
          <input
            className="form-input"
            type="tel"
            placeholder="e.g. 9876543210"
            value={form.contact}
            onChange={e => handleChange('contact', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Rate per Litre (₹) *</label>
          <input
            className={`form-input ${errors.ratePerLitre ? 'form-input-error' : ''}`}
            type="number"
            step="0.5"
            min="0"
            placeholder="e.g. 60"
            value={form.ratePerLitre}
            onChange={e => handleChange('ratePerLitre', e.target.value)}
          />
          {errors.ratePerLitre && <p className="form-error">{errors.ratePerLitre}</p>}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Address</label>
        <textarea
          className="form-textarea"
          placeholder="Provider address (optional)"
          value={form.address}
          onChange={e => handleChange('address', e.target.value)}
          rows={2}
        />
      </div>
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} icon={X}>Cancel</Button>
        <Button variant="primary" type="submit" icon={Save}>{provider ? 'Update' : 'Add'} Provider</Button>
      </div>
    </form>
  );
}
