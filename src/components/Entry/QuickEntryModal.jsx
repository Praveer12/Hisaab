import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { formatDisplayDate, formatDate } from '../../utils/dateHelpers';

const PRESET_QUANTITIES = [
  { label: '1L', value: 1 },
  { label: '1.5L', value: 1.5 },
  { label: '2L', value: 2 },
];

export default function QuickEntryModal({ isOpen, onClose, date, providers, currentProvider, onSave }) {
  // Steps: 'initial' → 'provider' (if no current provider set) → 'presets' (if no default qty)
  const [step, setStep] = useState('initial');
  const [saving, setSaving] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Active providers (fallback when no current provider)
  const activeProviders = useMemo(() => providers.filter(p => p.isActive !== false), [providers]);

  // Reset step when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep('initial');
      setSaving(false);
      setSelectedProvider(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayDate = date ? formatDisplayDate(date) : formatDisplayDate(formatDate(new Date()));
  const targetDate = date || formatDate(new Date());

  // The provider to use: currentProvider (set in settings) > selectedProvider (chosen in modal)
  const resolvedProvider = currentProvider || selectedProvider;

  const handleQuickSave = async (quantity, provider) => {
    if (!provider) return;

    setSaving(true);
    await onSave({
      date: targetDate,
      providerId: provider.id,
      milk: {
        morning: quantity,
        evening: 0,
        ratePerLitre: provider.ratePerLitre,
        totalAmount: quantity * provider.ratePerLitre,
      },
      newspaper: { taken: false, name: '', rate: 0 },
      paymentMethod: 'Pending',
      totalAmount: quantity * provider.ratePerLitre,
      notes: '',
    });
    setSaving(false);
    onClose();
  };

  // When user clicks "Haan"
  const handleYes = () => {
    if (currentProvider) {
      // Current provider is set — use it directly
      if (currentProvider.defaultQuantity > 0) {
        // Has default qty → auto-save
        handleQuickSave(currentProvider.defaultQuantity, currentProvider);
      } else {
        // No default qty → show presets
        setStep('presets');
      }
    } else if (activeProviders.length === 1) {
      // Only 1 provider, auto-use it
      const provider = activeProviders[0];
      if (provider.defaultQuantity > 0) {
        handleQuickSave(provider.defaultQuantity, provider);
      } else {
        setSelectedProvider(provider);
        setStep('presets');
      }
    } else {
      // Multiple providers, no current set → ask which one
      setStep('provider');
    }
  };

  // When provider is selected (multi-provider flow, no current set)
  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    if (provider.defaultQuantity > 0) {
      handleQuickSave(provider.defaultQuantity, provider);
    } else {
      setStep('presets');
    }
  };

  // When preset qty is clicked
  const handlePresetClick = (quantity) => {
    const provider = resolvedProvider || activeProviders[0];
    if (provider) {
      handleQuickSave(quantity, provider);
    }
  };

  const handleNo = () => {
    onClose();
  };

  // Determine what hint to show
  const hintProvider = currentProvider || (activeProviders.length === 1 ? activeProviders[0] : null);
  const showDefaultHint = hintProvider && hintProvider.defaultQuantity > 0;

  return createPortal(
    <div className="modal-overlay quick-entry-overlay" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="quick-entry-modal" onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button className="quick-entry-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Date display */}
        <div className="quick-entry-date">
          {displayDate}
        </div>

        {/* Step 1: Aaj doodh aaya? */}
        {step === 'initial' && (
          <div className="quick-entry-content animate-fade-in">
            <div className="quick-entry-icon">
              🥛
            </div>
            <h3 className="quick-entry-question">Aaj doodh aaya?</h3>
            
            {showDefaultHint && (
              <p className="quick-entry-hint">
                {hintProvider.name} • {hintProvider.defaultQuantity}L • ₹{hintProvider.ratePerLitre}/L
              </p>
            )}
            {!showDefaultHint && hintProvider && (
              <p className="quick-entry-hint">
                {hintProvider.name} • ₹{hintProvider.ratePerLitre}/L
              </p>
            )}

            <div className="quick-entry-yn-buttons">
              <button
                className="quick-entry-btn quick-entry-yes"
                onClick={handleYes}
                disabled={saving}
              >
                <Check size={22} strokeWidth={3} />
                <span>Haan ✅</span>
              </button>
              <button
                className="quick-entry-btn quick-entry-no"
                onClick={handleNo}
                disabled={saving}
              >
                <X size={22} strokeWidth={3} />
                <span>Nahi ❌</span>
              </button>
            </div>

            {/* Show presets directly if single/current provider with no default qty */}
            {hintProvider && !showDefaultHint && (
              <>
                <p className="quick-entry-or">Ya quantity choose karo ↓</p>
                <div className="quick-entry-presets animate-fade-in">
                  {PRESET_QUANTITIES.map(({ label, value }) => (
                    <button
                      key={value}
                      className="quick-entry-preset-btn"
                      onClick={() => handleQuickSave(value, hintProvider)}
                      disabled={saving}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Provider Selection (only when no currentProvider set and multiple exist) */}
        {step === 'provider' && (
          <div className="quick-entry-content animate-fade-in">
            <h3 className="quick-entry-question">Kiska doodh aaya?</h3>
            <p className="quick-entry-or" style={{marginTop: 0}}>
              💡 Tip: Providers mein "Set as Delivering" karo toh ye step skip hoga
            </p>
            <div className="quick-entry-provider-list">
              {activeProviders.map(provider => (
                <button
                  key={provider.id}
                  className="quick-entry-provider-btn"
                  onClick={() => handleProviderSelect(provider)}
                  disabled={saving}
                >
                  <span className="quick-entry-provider-name">{provider.name}</span>
                  <span className="quick-entry-provider-rate">₹{provider.ratePerLitre}/L</span>
                  {provider.defaultQuantity > 0 && (
                    <span className="quick-entry-provider-default">{provider.defaultQuantity}L</span>
                  )}
                </button>
              ))}
            </div>
            <button className="quick-entry-back" onClick={() => setStep('initial')}>
              ← Back
            </button>
          </div>
        )}

        {/* Step 3: Quantity Presets */}
        {step === 'presets' && (
          <div className="quick-entry-content animate-fade-in">
            <h3 className="quick-entry-question">Kitna doodh aaya?</h3>
            {resolvedProvider && (
              <p className="quick-entry-hint">{resolvedProvider.name}</p>
            )}
            <div className="quick-entry-presets">
              {PRESET_QUANTITIES.map(({ label, value }) => (
                <button
                  key={value}
                  className="quick-entry-preset-btn"
                  onClick={() => handlePresetClick(value)}
                  disabled={saving}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="quick-entry-back" onClick={() => setStep(currentProvider ? 'initial' : 'provider')}>
              ← Back
            </button>
          </div>
        )}

        {saving && (
          <div className="quick-entry-saving">
            Saving...
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
