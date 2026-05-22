import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Download, Upload, Database, Trash2, ShieldCheck, AlertTriangle, Check, HardDrive } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function BackupPage() {
  const { entries, providers, monthlyPayments } = useApp();
  const fileInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState(null); // 'success' | 'error' | null
  const [importMessage, setImportMessage] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Data stats
  const stats = useMemo(() => {
    const entriesSize = JSON.stringify(entries).length;
    const providersSize = JSON.stringify(providers).length;
    const paymentsSize = JSON.stringify(monthlyPayments).length;
    const totalBytes = entriesSize + providersSize + paymentsSize;

    return {
      entries: entries.length,
      providers: providers.length,
      payments: Object.keys(monthlyPayments).length,
      totalSize: totalBytes,
      sizeLabel: totalBytes < 1024
        ? `${totalBytes} B`
        : totalBytes < 1024 * 1024
          ? `${(totalBytes / 1024).toFixed(1)} KB`
          : `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`,
      capacityPercent: Math.min(100, (totalBytes / (5 * 1024 * 1024)) * 100),
    };
  }, [entries, providers, monthlyPayments]);

  // ── Export ──
  const handleExport = useCallback(() => {
    const backupData = {
      _app: 'Hisaab',
      _version: '1.0',
      _exportedAt: new Date().toISOString(),
      providers: JSON.parse(localStorage.getItem('doodhbook_providers') || '[]'),
      entries: JSON.parse(localStorage.getItem('doodhbook_entries') || '[]'),
      monthlyPayments: JSON.parse(localStorage.getItem('doodhbook_monthly_payments') || '{}'),
    };

    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `Hisaab_Backup_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // ── Import ──
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        // Validate structure
        if (!data.providers || !data.entries) {
          throw new Error('Invalid backup file — missing providers or entries.');
        }

        if (!Array.isArray(data.providers) || !Array.isArray(data.entries)) {
          throw new Error('Invalid backup file — providers and entries must be arrays.');
        }

        // Restore data
        localStorage.setItem('doodhbook_providers', JSON.stringify(data.providers));
        localStorage.setItem('doodhbook_entries', JSON.stringify(data.entries));
        if (data.monthlyPayments && typeof data.monthlyPayments === 'object') {
          localStorage.setItem('doodhbook_monthly_payments', JSON.stringify(data.monthlyPayments));
        }

        setImportStatus('success');
        setImportMessage(
          `Restored ${data.providers.length} providers, ${data.entries.length} entries successfully! Reloading...`
        );

        // Reload to pick up new data
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        setImportStatus('error');
        setImportMessage(err.message || 'Failed to read backup file.');
      }
    };

    reader.onerror = () => {
      setImportStatus('error');
      setImportMessage('Failed to read the file.');
    };

    reader.readAsText(file);
    // Reset so same file can be selected again
    e.target.value = '';
  }, []);

  // ── Clear All Data ──
  const handleClearData = useCallback(() => {
    localStorage.removeItem('doodhbook_providers');
    localStorage.removeItem('doodhbook_entries');
    localStorage.removeItem('doodhbook_monthly_payments');
    setShowConfirmClear(false);
    window.location.reload();
  }, []);

  return (
    <div className="backup-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Data Backup</h2>
          <p className="page-subtitle">Export, import, or manage your app data</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="backup-stats-grid">
        <div className="backup-stat-card">
          <Database size={22} />
          <div className="backup-stat-info">
            <span className="backup-stat-value">{stats.entries}</span>
            <span className="backup-stat-label">Entries</span>
          </div>
        </div>
        <div className="backup-stat-card">
          <HardDrive size={22} />
          <div className="backup-stat-info">
            <span className="backup-stat-value">{stats.providers}</span>
            <span className="backup-stat-label">Providers</span>
          </div>
        </div>
        <div className="backup-stat-card">
          <ShieldCheck size={22} />
          <div className="backup-stat-info">
            <span className="backup-stat-value">{stats.sizeLabel}</span>
            <span className="backup-stat-label">Data Size</span>
          </div>
        </div>
      </div>

      {/* Storage Bar */}
      <div className="backup-storage-bar-container">
        <div className="backup-storage-header">
          <span className="backup-storage-title">Storage Used</span>
          <span className="backup-storage-percent">{stats.capacityPercent.toFixed(2)}% of 5 MB</span>
        </div>
        <div className="backup-storage-bar">
          <div
            className="backup-storage-fill"
            style={{ width: `${Math.max(1, stats.capacityPercent)}%` }}
          />
        </div>
      </div>

      {/* Action Cards */}
      <div className="backup-actions-grid">
        {/* Export */}
        <div className="backup-action-card">
          <div className="backup-action-icon backup-action-export">
            <Download size={28} />
          </div>
          <h3>Export Data</h3>
          <p>Download all your data as a JSON backup file. Keep it safe on your phone or cloud drive.</p>
          <button className="btn backup-export-btn" onClick={handleExport}>
            <Download size={18} />
            Download Backup
          </button>
        </div>

        {/* Import */}
        <div className="backup-action-card">
          <div className="backup-action-icon backup-action-import">
            <Upload size={28} />
          </div>
          <h3>Import Data</h3>
          <p>Restore data from a previously exported backup file. This will replace your current data.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button className="btn backup-import-btn" onClick={handleImportClick}>
            <Upload size={18} />
            Upload Backup
          </button>
        </div>

        {/* Clear */}
        <div className="backup-action-card">
          <div className="backup-action-icon backup-action-danger">
            <Trash2 size={28} />
          </div>
          <h3>Clear All Data</h3>
          <p>Permanently delete all entries, providers, and payment records. This cannot be undone.</p>
          {!showConfirmClear ? (
            <button
              className="btn backup-clear-btn"
              onClick={() => setShowConfirmClear(true)}
            >
              <Trash2 size={18} />
              Clear Data
            </button>
          ) : (
            <div className="backup-confirm-row">
              <button className="btn backup-confirm-yes" onClick={handleClearData}>
                Yes, Delete Everything
              </button>
              <button
                className="btn backup-confirm-no"
                onClick={() => setShowConfirmClear(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Import Status Toast */}
      {importStatus && (
        <div className={`backup-toast backup-toast-${importStatus}`}>
          {importStatus === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
          <span>{importMessage}</span>
          <button
            className="backup-toast-close"
            onClick={() => setImportStatus(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
