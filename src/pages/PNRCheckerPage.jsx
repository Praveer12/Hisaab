import React, { useState, useCallback } from 'react';
import { Train, ExternalLink, X, Search, Trash2, Clock, RefreshCw, Copy, CheckCheck, AlertCircle, ChevronRight } from 'lucide-react';

// ── localStorage helpers ────────────────────────────────────────
const LS_HISTORY = 'hisaab_pnr_history';   // [{pnr, addedAt}]
const LS_RESULTS = 'hisaab_pnr_results';   // {pnr: {data, fetchedAt}}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); } catch { return []; }
}
function loadResults() {
  try { return JSON.parse(localStorage.getItem(LS_RESULTS) || '{}'); } catch { return {}; }
}
function saveHistory(h) {
  try { localStorage.setItem(LS_HISTORY, JSON.stringify(h)); } catch {}
}
function saveResults(r) {
  try { localStorage.setItem(LS_RESULTS, JSON.stringify(r)); } catch {}
}

// ── External sites ──────────────────────────────────────────────
const SITES = [
  {
    id: 'confirmtkt',
    name: 'ConfirmTkt',
    emoji: '🎫',
    color: '#7C3AED',
    colorBg: '#F5F3FF',
    colorBorder: 'rgba(124,58,237,0.25)',
    getUrl: (pnr) => `https://www.confirmtkt.com/pnr-status/${pnr}`,
    urlFill: true,
    desc: 'URL se auto-fill',
  },
  {
    id: 'indianrail',
    name: 'Indian Railways (Official)',
    emoji: '🏛️',
    color: '#047857',
    colorBg: '#F0FDF4',
    colorBorder: 'rgba(4,120,87,0.25)',
    getUrl: () => 'https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en',
    urlFill: false,
    desc: 'PNR clipboard mein copy hoga',
  },
];

// ── Status color helper ─────────────────────────────────────────
function getStatusStyle(status = '') {
  const s = status.toUpperCase();
  if (s.includes('CNF') || /^[A-Z]\d/.test(s)) {
    return { bg: '#DCFCE7', color: '#166534', border: 'rgba(34,197,94,0.35)', label: '✓ Confirm' };
  }
  if (s.includes('RAC')) {
    return { bg: '#FEF9C3', color: '#854D0E', border: 'rgba(234,179,8,0.35)', label: '~ RAC' };
  }
  if (s.includes('WL') || s.includes('WAIT')) {
    return { bg: '#FEE2E2', color: '#991B1B', border: 'rgba(239,68,68,0.35)', label: '✗ Waitlist' };
  }
  return { bg: '#F1F5F9', color: '#475569', border: 'rgba(100,116,139,0.25)', label: status };
}

// ── Relative time ───────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Abhi abhi';
  if (mins < 60) return `${mins} min pehle`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ghante pehle`;
  return `${Math.floor(hrs / 24)} din pehle`;
}

// ── PNR Result Card ─────────────────────────────────────────────
function PNRResultCard({ pnr, result, onDelete }) {
  if (!result?.data) return null;
  const d = result.data;

  const passengers = d.PassengerList || d.passengerList || [];
  const trainName = d.TrainName || d.trainName || '—';
  const trainNo   = d.TrainNo   || d.trainNo   || '';
  const from      = d.FromStation   || d.fromStation   || d.From || '—';
  const to        = d.ToStation     || d.toStation     || d.To   || '—';
  const doj       = d.Doj || d.doj || d.DateOfJourney || '';

  return (
    <div className="pnr-result-card">
      <div className="pnr-result-header">
        <div className="pnr-result-title-row">
          <span className="pnr-result-train">🚂 {trainNo} · {trainName}</span>
          <button className="pnr-result-del" onClick={onDelete} title="Delete"><Trash2 size={14} /></button>
        </div>
        <div className="pnr-result-meta">
          <span className="pnr-result-route">{from} → {to}</span>
          {doj && <span className="pnr-result-doj">· {doj}</span>}
        </div>
        <div className="pnr-result-pnr-row">
          <span className="pnr-result-pnrno">PNR: {pnr}</span>
          <span className="pnr-result-age">{timeAgo(result.fetchedAt)}</span>
        </div>
      </div>

      {passengers.length > 0 ? (
        <div className="pnr-result-passengers">
          {passengers.map((p, i) => {
            const current = p.CurrentStatus || p.currentStatus || p.BookingStatus || '—';
            const booked  = p.BookingStatus  || p.bookingStatus  || '—';
            const style   = getStatusStyle(current);
            return (
              <div
                key={i}
                className="pnr-passenger-row"
                style={{ '--ps-bg': style.bg, '--ps-color': style.color, '--ps-border': style.border }}
              >
                <span className="pnr-passenger-num">Passenger {i + 1}</span>
                <div className="pnr-passenger-status">
                  <span className="pnr-passenger-current">{current}</span>
                  {booked !== current && (
                    <span className="pnr-passenger-booked">Booked: {booked}</span>
                  )}
                </div>
                <span className="pnr-passenger-badge">{style.label}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="pnr-result-empty">Passenger info nahi mili</div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function PNRCheckerPage() {
  const [pnr, setPnr]               = useState('');
  const [error, setError]           = useState('');
  const [fetching, setFetching]     = useState(false);
  const [fetchErr, setFetchErr]     = useState('');
  const [copiedId, setCopiedId]     = useState(null);

  const [history, setHistory]       = useState(loadHistory);
  const [results, setResults]       = useState(loadResults);

  const isReady = pnr.length === 10;

  // ── Input ───────────────────────────────────────────────────
  const handleInput = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPnr(val);
    setError(''); setFetchErr('');
  };

  const handleClear = () => { setPnr(''); setError(''); setFetchErr(''); };

  // ── Save to history ─────────────────────────────────────────
  const addToHistory = useCallback((pnrNum) => {
    setHistory(prev => {
      const filtered = prev.filter(p => p.pnr !== pnrNum);
      const updated  = [{ pnr: pnrNum, addedAt: new Date().toISOString() }, ...filtered].slice(0, 8);
      saveHistory(updated);
      return updated;
    });
  }, []);

  // ── Fetch PNR status ─────────────────────────────────────────
  const fetchStatus = useCallback(async (pnrNum) => {
    if ((pnrNum || pnr).length !== 10) { setError('PNR 10 digit ka hona chahiye'); return; }
    const target = pnrNum || pnr;
    setFetching(true); setFetchErr('');

    const apiUrl = `https://www.confirmtkt.com/pnr/api/pnr-status?pnrNo=${target}`;
    let data = null;

    // Try direct fetch first
    try {
      const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('bad status');
      data = await res.json();
    } catch {
      // CORS blocked — try via allorigins proxy
      try {
        const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
        const res2  = await fetch(proxy);
        data = await res2.json();
      } catch {
        setFetchErr('Status load nahi ho saka. Network check karo ya neeche site pe dekho.');
        setFetching(false);
        return;
      }
    }

    if (!data || data.ErrorMessage) {
      setFetchErr(data?.ErrorMessage || 'Invalid PNR ya data nahi mila.');
      setFetching(false);
      return;
    }

    const entry = { data, fetchedAt: new Date().toISOString() };
    setResults(prev => {
      const updated = { ...prev, [target]: entry };
      saveResults(updated);
      return updated;
    });
    addToHistory(target);
    setPnr(target); // keep in input
    setFetching(false);
  }, [pnr, addToHistory]);

  // ── Delete result ───────────────────────────────────────────
  const deleteResult = (pnrNum) => {
    setResults(prev => {
      const updated = { ...prev };
      delete updated[pnrNum];
      saveResults(updated);
      return updated;
    });
  };

  // ── Delete from history ─────────────────────────────────────
  const deleteFromHistory = (pnrNum) => {
    setHistory(prev => {
      const updated = prev.filter(p => p.pnr !== pnrNum);
      saveHistory(updated);
      return updated;
    });
    deleteResult(pnrNum);
  };

  // ── Open external site ──────────────────────────────────────
  const handleSite = async (site) => {
    if (!isReady) { setError('PNR 10 digit ka hona chahiye'); return; }
    if (!site.urlFill) {
      try { await navigator.clipboard.writeText(pnr); } catch {}
      setCopiedId(site.id);
      setTimeout(() => setCopiedId(null), 4000);
    }
    window.open(site.getUrl(pnr), '_blank', 'noopener,noreferrer');
  };

  // ── Saved results to show ───────────────────────────────────
  const savedResultPNRs = Object.keys(results).filter(p => results[p]?.data);

  return (
    <div className="pnr-page animate-fade-in">

      {/* Header */}
      <div className="pnr-header">
        <div className="pnr-header-icon">🚆</div>
        <h2 className="pnr-header-title">PNR Status</h2>
        <p className="pnr-header-sub">PNR daalo, status seedha yahan dekho</p>
      </div>

      {/* Input Card */}
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
            <button className="pnr-clear-btn" onClick={handleClear} aria-label="Clear"><X size={16} /></button>
          )}
        </div>
        <div className="pnr-counter-row">
          {error
            ? <span className="pnr-error">{error}</span>
            : <span className="pnr-counter">{pnr.length}/10{isReady && <span className="pnr-counter--ready"> ✓ Ready!</span>}</span>
          }
        </div>

        {/* Primary: Fetch in-app */}
        <button
          className={`pnr-fetch-btn ${!isReady || fetching ? 'pnr-fetch-btn--disabled' : ''}`}
          onClick={() => fetchStatus()}
          disabled={!isReady || fetching}
        >
          {fetching
            ? <><RefreshCw size={16} className="pnr-spin" /> Loading...</>
            : <><Search size={16} /> Status Check Karo</>
          }
        </button>

        {fetchErr && (
          <div className="pnr-fetch-err">
            <AlertCircle size={13} />
            {fetchErr}
          </div>
        )}
      </div>

      {/* Clipboard toast */}
      {copiedId && (
        <div className="pnr-clipboard-toast">
          <CheckCheck size={15} />
          PNR <strong>{pnr}</strong> copy hua — site pe <strong>Ctrl+V</strong> ya paste karo
        </div>
      )}

      {/* Saved Results */}
      {savedResultPNRs.length > 0 && (
        <div className="pnr-section">
          <div className="pnr-section-label">📋 Saved Results</div>
          {savedResultPNRs.map(p => (
            <PNRResultCard
              key={p}
              pnr={p}
              result={results[p]}
              onDelete={() => deleteResult(p)}
            />
          ))}
        </div>
      )}

      {/* Recent PNRs */}
      {history.length > 0 && (
        <div className="pnr-section">
          <div className="pnr-section-label">🕐 Recent PNRs</div>
          <div className="pnr-history-list">
            {history.map(item => (
              <div key={item.pnr} className="pnr-history-item">
                <button
                  className="pnr-history-pnr"
                  onClick={() => { setPnr(item.pnr); setError(''); setFetchErr(''); }}
                >
                  <span className="pnr-history-num">{item.pnr}</span>
                  <span className="pnr-history-time">{timeAgo(item.addedAt)}</span>
                  <ChevronRight size={14} className="pnr-history-arrow" />
                </button>
                <button
                  className="pnr-history-refresh"
                  onClick={() => fetchStatus(item.pnr)}
                  title="Refresh"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  className="pnr-history-del"
                  onClick={() => deleteFromHistory(item.pnr)}
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External Sites */}
      <div className="pnr-sites-label">
        <ExternalLink size={14} />
        Site pe detail mein dekho
      </div>
      <div className="pnr-sites-list">
        {SITES.map(site => (
          <button
            key={site.id}
            className={`pnr-site-btn ${!isReady ? 'pnr-site-btn--disabled' : ''} ${copiedId === site.id ? 'pnr-site-btn--copied' : ''}`}
            onClick={() => handleSite(site)}
            disabled={!isReady}
            style={{ '--site-color': site.color, '--site-bg': site.colorBg, '--site-border': site.colorBorder }}
          >
            <div className="pnr-site-emoji">{site.emoji}</div>
            <div className="pnr-site-info">
              <div className="pnr-site-name-row">
                <span className="pnr-site-name">{site.name}</span>
                <span className={`pnr-site-badge ${site.urlFill ? 'pnr-site-badge--auto' : 'pnr-site-badge--copy'}`}>
                  {site.urlFill ? <ExternalLink size={10} /> : <Copy size={10} />}
                  {site.urlFill ? 'Auto-fill' : 'Clipboard'}
                </span>
              </div>
              <span className="pnr-site-desc">{site.desc}</span>
            </div>
          </button>
        ))}
      </div>

    </div>
  );
}
