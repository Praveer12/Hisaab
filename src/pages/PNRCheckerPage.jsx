import React, { useState } from 'react';
import { Train, ExternalLink, X, Search } from 'lucide-react';

// Sites that accept PNR directly in the URL
const PNR_SITES = [
  {
    id: 'confirmtkt',
    name: 'ConfirmTkt',
    emoji: '🎫',
    color: '#7C3AED',
    colorBg: '#F5F3FF',
    colorBorder: 'rgba(124, 58, 237, 0.25)',
    getUrl: (pnr) => `https://www.confirmtkt.com/pnr-status/${pnr}`,
    desc: 'Seat confirm chance bhi dikhata hai',
  },
  {
    id: 'railyatri',
    name: 'RailYatri',
    emoji: '🚂',
    color: '#0369A1',
    colorBg: '#F0F9FF',
    colorBorder: 'rgba(3, 105, 161, 0.25)',
    getUrl: (pnr) => `https://www.railyatri.in/pnr-status?pnr=${pnr}`,
    desc: 'Train status + coach position',
  },
  {
    id: 'irctc',
    name: 'IRCTC Official',
    emoji: '🏛️',
    color: '#047857',
    colorBg: '#F0FDF4',
    colorBorder: 'rgba(4, 120, 87, 0.25)',
    getUrl: (pnr) => `https://www.irctc.co.in/online-charts/index.html?pnrNumber=${pnr}`,
    desc: 'Official Indian Railways',
  },
  {
    id: 'paytm',
    name: 'Paytm',
    emoji: '💳',
    color: '#0EA5E9',
    colorBg: '#F0F9FF',
    colorBorder: 'rgba(14, 165, 233, 0.25)',
    getUrl: (pnr) => `https://tickets.paytm.com/pnr-status/${pnr}`,
    desc: 'Fast aur simple',
  },
];

export default function PNRCheckerPage() {
  const [pnr, setPnr] = useState('');
  const [error, setError] = useState('');

  const handleInput = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPnr(val);
    if (error) setError('');
  };

  const handleClear = () => {
    setPnr('');
    setError('');
  };

  const handleCheck = (site) => {
    if (pnr.length !== 10) {
      setError('PNR 10 digit ka hona chahiye');
      return;
    }
    window.open(site.getUrl(pnr), '_blank', 'noopener,noreferrer');
  };

  const isReady = pnr.length === 10;

  return (
    <div className="pnr-page animate-fade-in">

      {/* Header */}
      <div className="pnr-header">
        <div className="pnr-header-icon">🚆</div>
        <h2 className="pnr-header-title">PNR Status</h2>
        <p className="pnr-header-sub">PNR daalo, site pe directly check karo</p>
      </div>

      {/* PNR Input Card */}
      <div className="pnr-input-card">
        <label className="pnr-input-label">
          <Train size={15} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
          PNR Number
        </label>
        <div className="pnr-input-wrap">
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            className={`pnr-input ${error ? 'pnr-input--error' : ''} ${isReady ? 'pnr-input--ready' : ''}`}
            placeholder="10 digit PNR daalo"
            value={pnr}
            onChange={handleInput}
            maxLength={10}
            autoFocus
          />
          {pnr.length > 0 && (
            <button className="pnr-clear-btn" onClick={handleClear} aria-label="Clear">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Character counter */}
        <div className="pnr-counter-row">
          {error ? (
            <span className="pnr-error">{error}</span>
          ) : (
            <span className="pnr-counter">
              {pnr.length}/10
              {isReady && <span className="pnr-counter--ready"> ✓ Ready!</span>}
            </span>
          )}
        </div>
      </div>

      {/* Site Buttons */}
      <div className="pnr-sites-label">
        <Search size={14} />
        Kahan check karna hai?
      </div>

      <div className="pnr-sites-list">
        {PNR_SITES.map((site) => (
          <button
            key={site.id}
            className={`pnr-site-btn ${!isReady ? 'pnr-site-btn--disabled' : ''}`}
            onClick={() => handleCheck(site)}
            disabled={!isReady}
            style={{
              '--site-color': site.color,
              '--site-bg': site.colorBg,
              '--site-border': site.colorBorder,
            }}
          >
            <div className="pnr-site-emoji">{site.emoji}</div>
            <div className="pnr-site-info">
              <span className="pnr-site-name">{site.name}</span>
              <span className="pnr-site-desc">{site.desc}</span>
            </div>
            <ExternalLink size={16} className="pnr-site-arrow" />
          </button>
        ))}
      </div>

      {/* Info note */}
      <div className="pnr-info-note">
        💡 PNR enter karte hi jo site choose karo, wahan tab mein PNR already filled hoga
      </div>
    </div>
  );
}
