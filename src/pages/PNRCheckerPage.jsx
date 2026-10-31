import React, { useState } from 'react';
import { Train, ExternalLink, X, Search, Copy, CheckCheck } from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// urlFill  = true  → PNR URL mein directly jaata hai (auto-filled)
// urlFill  = false → PNR clipboard mein copy hoga, user paste karega
// ──────────────────────────────────────────────────────────────
const PNR_SITES = [
  {
    id: 'confirmtkt',
    name: 'ConfirmTkt',
    emoji: '🎫',
    color: '#7C3AED',
    colorBg: '#F5F3FF',
    colorBorder: 'rgba(124, 58, 237, 0.25)',
    getUrl: (pnr) => `https://www.confirmtkt.com/pnr-status/${pnr}`,
    urlFill: true,
    desc: 'URL se auto-fill • confirm chance bhi dikhata hai',
  },
  {
    id: 'indianrail',
    name: 'Indian Railways (Official)',
    emoji: '🏛️',
    color: '#047857',
    colorBg: '#F0FDF4',
    colorBorder: 'rgba(4, 120, 87, 0.25)',
    getUrl: () => 'https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en',
    urlFill: false,
    desc: 'PNR copy hoga → site pe paste karo',
  },
  {
    id: 'railyatri',
    name: 'RailYatri',
    emoji: '🚂',
    color: '#0369A1',
    colorBg: '#F0F9FF',
    colorBorder: 'rgba(3, 105, 161, 0.25)',
    getUrl: () => 'https://www.railyatri.in/pnr-status',
    urlFill: false,
    desc: 'PNR copy hoga → site pe paste karo',
  },
];

export default function PNRCheckerPage() {
  const [pnr, setPnr] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null); // which site was just clicked

  const handleInput = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPnr(val);
    if (error) setError('');
  };

  const handleClear = () => {
    setPnr('');
    setError('');
    setCopiedId(null);
  };

  const handleCheck = async (site) => {
    if (pnr.length !== 10) {
      setError('PNR 10 digit ka hona chahiye');
      return;
    }

    if (!site.urlFill) {
      // Copy PNR to clipboard, then open site
      try {
        await navigator.clipboard.writeText(pnr);
      } catch {
        // fallback — still open the site even if clipboard fails
      }
      setCopiedId(site.id);
      setTimeout(() => setCopiedId(null), 3000);
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

        {/* Counter / error */}
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

      {/* Clipboard toast */}
      {copiedId && (
        <div className="pnr-clipboard-toast">
          <CheckCheck size={15} />
          PNR <strong>{pnr}</strong> clipboard mein copy ho gaya — site pe <strong>Ctrl+V</strong> / paste karo
        </div>
      )}

      {/* Site Buttons */}
      <div className="pnr-sites-label">
        <Search size={14} />
        Kahan check karna hai?
      </div>

      <div className="pnr-sites-list">
        {PNR_SITES.map((site) => {
          const wasCopied = copiedId === site.id;
          return (
            <button
              key={site.id}
              className={`pnr-site-btn ${!isReady ? 'pnr-site-btn--disabled' : ''} ${wasCopied ? 'pnr-site-btn--copied' : ''}`}
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
              {site.urlFill
                ? <ExternalLink size={16} className="pnr-site-arrow" />
                : <Copy size={15} className="pnr-site-arrow" />
              }
            </button>
          );
        })}
      </div>

      {/* Info note */}
      <div className="pnr-info-note">
        🎫 <strong>ConfirmTkt</strong> pe PNR URL se directly fill hota hai.<br />
        🏛️ <strong>Indian Railways</strong> aur 🚂 <strong>RailYatri</strong> pe button dabate hi PNR copy ho jaata hai — site khulete hi bas <strong>Ctrl+V</strong> karo ya box mein paste karo.
      </div>
    </div>
  );
}
