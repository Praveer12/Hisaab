import React, { useState, useCallback } from 'react';
import {
  Train, ExternalLink, X, Search, Trash2, Clock,
  RefreshCw, Copy, CheckCheck, AlertCircle, ChevronRight,
  Key, Eye, EyeOff, Settings, Check, Calendar, MapPin
} from 'lucide-react';

// ── Default RapidAPI key ─────────────────────────────────────────
const DEFAULT_API_KEY = '1227072abfmshe6bd6083e17ab60p1b350ejsn771ebd1d7efd';
const API_HOST        = 'irctc-api9.p.rapidapi.com';

// ── localStorage helpers ────────────────────────────────────────
const LS_HISTORY  = 'hisaab_pnr_history';
const LS_RESULTS  = 'hisaab_pnr_results';
const LS_APIKEY   = 'hisaab_pnr_apikey';

const load = (k, def) => {
  try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? def; } catch { return def; }
};
const save = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
};

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

// ── Status style helper ─────────────────────────────────────────
function getStatusStyle(status = '') {
  const s = String(status || '').toUpperCase();
  if (s.includes('CNF') || s.includes('CONFIRM') || /^[A-Z]\d+/.test(s)) {
    return { bg: '#DCFCE7', color: '#166534', border: 'rgba(34,197,94,0.35)', badge: '✓ Confirm' };
  }
  if (s.includes('RAC')) {
    return { bg: '#FEF9C3', color: '#854D0E', border: 'rgba(234,179,8,0.35)',  badge: '~ RAC' };
  }
  if (s.includes('WL') || s.includes('WAIT') || s.includes('RLWL') || s.includes('PQWL') || s.includes('GNWL')) {
    return { bg: '#FEE2E2', color: '#991B1B', border: 'rgba(239,68,68,0.35)',  badge: '✗ Waitlist' };
  }
  return { bg: '#F1F5F9', color: '#475569', border: 'rgba(100,116,139,0.25)', badge: status || 'Pending' };
}

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Abhi abhi';
  if (mins < 60) return `${mins} min pehle`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ghante pehle`;
  return `${Math.floor(hrs / 24)} din pehle`;
}

// ── Result Card ────────────────────────────────────────────────
function PNRResultCard({ pnr, result, onDelete }) {
  const resp = result?.data?.pnrResponse || result?.data?.data?.pnrResponse || result?.data;
  if (!resp) return null;

  const trainNo   = resp.trainNo || resp.TrainNo || resp.TrainNumber || '';
  const trainName = resp.trainName || resp.TrainName || 'Train';
  const from      = resp.sourceName || resp.from || resp.From || '—';
  const to        = resp.destinationName || resp.to || resp.To || '—';
  const doj       = resp.doj || resp.DateOfJourney || resp.Doj || '';
  const travelCls = resp.class || resp.Class || '';
  const chartPrep = resp.chartPrepared ?? false;
  const depTime   = resp.departureTime || '';
  const arrTime   = resp.arrivalTime || '';

  const passengers = resp.passengerStatus || resp.PassengerStatus || resp.PassengerList || [];

  return (
    <div className="pnr-result-card">
      <div className="pnr-result-header">
        <div className="pnr-result-title-row">
          <span className="pnr-result-train">
            🚆 {trainNo ? `${trainNo} · ` : ''}{trainName}
          </span>
          <button className="pnr-result-del" onClick={onDelete} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>

        <div className="pnr-result-meta">
          <span className="pnr-result-route">
            <MapPin size={12} style={{ display: 'inline', marginRight: 2 }} />
            {from} → {to}
          </span>
          {travelCls && <span className="pnr-result-cls">· Class: {travelCls}</span>}
        </div>

        {(doj || depTime) && (
          <div className="pnr-result-timing">
            {doj && (
              <span>
                <Calendar size={12} style={{ display: 'inline', marginRight: 3 }} />
                {doj}
              </span>
            )}
            {depTime && <span>· Dep: {depTime}</span>}
            {arrTime && <span>· Arr: {arrTime}</span>}
          </div>
        )}

        <div className="pnr-result-pnr-row">
          <span className="pnr-result-pnrno">PNR: {pnr}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`pnr-chart-badge ${chartPrep ? 'pnr-chart-badge--yes' : 'pnr-chart-badge--no'}`}>
              {chartPrep ? '✓ Chart Prepared' : 'Chart Not Prepared'}
            </span>
            <span className="pnr-result-age">{timeAgo(result.fetchedAt)}</span>
          </div>
        </div>
      </div>

      {passengers.length > 0 ? (
        <div className="pnr-result-passengers">
          {passengers.map((p, i) => {
            const current = p.currentStatus || p.CurrentStatus || p.bookingStatus || '—';
            const booked  = p.bookingStatus  || p.BookingStatus  || '';
            const coach   = p.coach || p.bookingCoach || '';
            const berth   = p.berth || p.bookingBerth || '';
            const style   = getStatusStyle(current);

            return (
              <div
                key={i}
                className="pnr-passenger-row"
                style={{ '--ps-bg': style.bg, '--ps-color': style.color, '--ps-border': style.border }}
              >
                <span className="pnr-passenger-num">
                  P{p.number || p.Number || i + 1}
                </span>

                <div className="pnr-passenger-status">
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span className="pnr-passenger-current">{current}</span>
                    {(coach || berth) && (
                      <span className="pnr-passenger-seat">
                        ({coach ? `Coach: ${coach}` : ''}{coach && berth ? ', ' : ''}{berth ? `Berth: ${berth}` : ''})
                      </span>
                    )}
                  </div>
                  {booked && booked !== current && (
                    <span className="pnr-passenger-booked">Booked: {booked}</span>
                  )}
                </div>

                <span className="pnr-passenger-badge">{style.badge}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="pnr-result-empty">Passenger details nahi mili</div>
      )}
    </div>
  );
}

// ── API Key Setup Panel ────────────────────────────────────────
function ApiKeyPanel({ apiKey, onSave }) {
  const [val, setVal]   = useState(apiKey || '');
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(val.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setVal(DEFAULT_API_KEY);
    onSave(DEFAULT_API_KEY);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="pnr-apikey-panel">
      <div className="pnr-apikey-title"><Key size={14} /> RapidAPI Key Settings</div>
      <p className="pnr-apikey-desc">
        Host: <code>{API_HOST}</code><br />
        Default key already configured hai. Agar apni key use karni ho toh yahan update kar sakte ho.
      </p>
      <div className="pnr-apikey-input-row">
        <input
          type={show ? 'text' : 'password'}
          className="pnr-apikey-input"
          placeholder="RapidAPI key"
          value={val}
          onChange={e => setVal(e.target.value)}
        />
        <button className="pnr-apikey-eye" onClick={() => setShow(s => !s)} type="button">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button
          className={`pnr-apikey-save ${saved ? 'pnr-apikey-save--done' : ''}`}
          onClick={handleSave}
          disabled={!val.trim()}
          type="button"
        >
          {saved ? <><Check size={14} /> Saved!</> : 'Save Key'}
        </button>
        <button
          className="pnr-apikey-clear"
          onClick={handleReset}
          type="button"
        >
          Reset Default
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function PNRCheckerPage() {
  const [pnr, setPnr]           = useState('');
  const [error, setError]       = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  const [apiKey, setApiKey]     = useState(() => load(LS_APIKEY, DEFAULT_API_KEY));
  const [history, setHistory]   = useState(() => load(LS_HISTORY, []));
  const [results, setResults]   = useState(() => load(LS_RESULTS, {}));

  const isReady = pnr.length === 10;

  const handleInput = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPnr(val);
    setError('');
    setFetchErr('');
  };

  const handleClear = () => {
    setPnr('');
    setError('');
    setFetchErr('');
  };

  const saveApiKey = (key) => {
    setApiKey(key);
    save(LS_APIKEY, key);
  };

  const addToHistory = useCallback((pnrNum) => {
    setHistory(prev => {
      const filtered = prev.filter(p => p.pnr !== pnrNum);
      const updated  = [{ pnr: pnrNum, addedAt: new Date().toISOString() }, ...filtered].slice(0, 8);
      save(LS_HISTORY, updated);
      return updated;
    });
  }, []);

  // ── Fetch PNR Status ─────────────────────────────────────────
  const fetchStatus = useCallback(async (pnrNum) => {
    const target = pnrNum || pnr;
    if (target.length !== 10) {
      setError('PNR 10 digit ka hona chahiye');
      return;
    }

    setFetching(true);
    setFetchErr('');

    try {
      const keyToUse = apiKey || DEFAULT_API_KEY;
      const formData = new FormData();
      formData.append('pnr', target);

      const res = await fetch(`https://${API_HOST}/pnr-status.php`, {
        method: 'POST',
        headers: {
          'X-RapidAPI-Key': keyToUse,
          'X-RapidAPI-Host': API_HOST,
        },
        body: formData,
      });

      if (res.status === 403 || res.status === 401) {
        setFetchErr('RapidAPI key invalid ya expired hai. Settings mein check karo.');
        setFetching(false);
        return;
      }
      if (res.status === 429) {
        setFetchErr('Rate limit hit ho gayi. Kripya thodi der baad try karo.');
        setFetching(false);
        return;
      }

      const json = await res.json();
      const pnrData = json?.data?.pnrResponse || json?.data || json;

      if (pnrData?.error) {
        setFetchErr(pnrData.error);
        setFetching(false);
        return;
      }

      if (!pnrData || (!pnrData.trainNo && !pnrData.trainName && !pnrData.passengerStatus)) {
        setFetchErr('PNR data nahi mila ya flushed ho gaya hai.');
        setFetching(false);
        return;
      }

      const entry = { data: json, fetchedAt: new Date().toISOString() };
      setResults(prev => {
        const updated = { ...prev, [target]: entry };
        save(LS_RESULTS, updated);
        return updated;
      });
      addToHistory(target);
      setPnr(target);
    } catch (err) {
      console.error('PNR fetch error:', err);
      setFetchErr('Request fail hui. Internet connection check karo.');
    } finally {
      setFetching(false);
    }
  }, [pnr, apiKey, addToHistory]);

  const deleteResult = (p) => {
    setResults(prev => {
      const u = { ...prev };
      delete u[p];
      save(LS_RESULTS, u);
      return u;
    });
  };

  const deleteFromHistory = (p) => {
    setHistory(prev => {
      const u = prev.filter(x => x.pnr !== p);
      save(LS_HISTORY, u);
      return u;
    });
    deleteResult(p);
  };

  const handleSite = async (site) => {
    if (!isReady) {
      setError('PNR 10 digit ka hona chahiye');
      return;
    }
    if (!site.urlFill) {
      try { await navigator.clipboard.writeText(pnr); } catch {}
      setCopiedId(site.id);
      setTimeout(() => setCopiedId(null), 4000);
    }
    window.open(site.getUrl(pnr), '_blank', 'noopener,noreferrer');
  };

  const savedPNRs = Object.keys(results).filter(p => results[p]?.data);

  return (
    <div className="pnr-page animate-fade-in">

      {/* Header */}
      <div className="pnr-header">
        <div className="pnr-header-icon">🚆</div>
        <h2 className="pnr-header-title">PNR Status</h2>
        <p className="pnr-header-sub">PNR daalo, status live card mein dekho</p>
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
            <button className="pnr-clear-btn" onClick={handleClear} aria-label="Clear">
              <X size={16} />
            </button>
          )}
        </div>
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

        {/* Primary Check Button */}
        <button
          className={`pnr-fetch-btn ${(!isReady || fetching) ? 'pnr-fetch-btn--disabled' : ''}`}
          onClick={() => fetchStatus()}
          disabled={!isReady || fetching}
          type="button"
        >
          {fetching ? (
            <><RefreshCw size={16} className="pnr-spin" /> Fetching Status...</>
          ) : (
            <><Search size={16} /> Status Check Karo</>
          )}
        </button>

        {fetchErr && (
          <div className="pnr-fetch-err">
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{fetchErr}</span>
          </div>
        )}

        {/* Settings toggle */}
        <button
          className="pnr-apikey-hint"
          onClick={() => setShowSetup(s => !s)}
          type="button"
        >
          <Key size={12} />
          <span>IRCTC RapidAPI Connected</span>
          <Settings size={12} style={{ marginLeft: 'auto' }} />
        </button>
      </div>

      {/* API Key Settings */}
      {showSetup && (
        <ApiKeyPanel
          apiKey={apiKey}
          onSave={(k) => { saveApiKey(k); setShowSetup(false); }}
        />
      )}

      {/* Clipboard toast */}
      {copiedId && (
        <div className="pnr-clipboard-toast">
          <CheckCheck size={15} />
          PNR <strong>{pnr}</strong> copy hua — site pe <strong>Ctrl+V</strong> karo
        </div>
      )}

      {/* Saved Result Cards */}
      {savedPNRs.length > 0 && (
        <div className="pnr-section">
          <div className="pnr-section-label">📋 PNR Results ({savedPNRs.length})</div>
          {savedPNRs.map(p => (
            <PNRResultCard
              key={p}
              pnr={p}
              result={results[p]}
              onDelete={() => deleteResult(p)}
            />
          ))}
        </div>
      )}

      {/* Recent PNRs List */}
      {history.length > 0 && (
        <div className="pnr-section">
          <div className="pnr-section-label">🕐 Recent PNRs</div>
          <div className="pnr-history-list">
            {history.map(item => (
              <div key={item.pnr} className="pnr-history-item">
                <button
                  className="pnr-history-pnr"
                  onClick={() => { setPnr(item.pnr); setError(''); setFetchErr(''); }}
                  type="button"
                >
                  <span className="pnr-history-num">{item.pnr}</span>
                  <span className="pnr-history-time">{timeAgo(item.addedAt)}</span>
                  <ChevronRight size={14} className="pnr-history-arrow" />
                </button>
                <button
                  className="pnr-history-refresh"
                  onClick={() => fetchStatus(item.pnr)}
                  title="Check / Refresh Status"
                  type="button"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  className="pnr-history-del"
                  onClick={() => deleteFromHistory(item.pnr)}
                  title="Delete"
                  type="button"
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
        <ExternalLink size={14} /> Site pe detail mein dekho
      </div>
      <div className="pnr-sites-list">
        {SITES.map(site => (
          <button
            key={site.id}
            className={`pnr-site-btn ${!isReady ? 'pnr-site-btn--disabled' : ''} ${copiedId === site.id ? 'pnr-site-btn--copied' : ''}`}
            onClick={() => handleSite(site)}
            disabled={!isReady}
            type="button"
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
