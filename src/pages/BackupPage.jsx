import React, { useMemo, useCallback } from 'react';
import { Download, FileText, Database, ShieldCheck, HardDrive } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generatePDFReport } from '../utils/pdfExport';

export default function BackupPage() {
  const { entries, providers, monthlyPayments, showToast } = useApp();

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

  // ── JSON Export ──
  const handleJSONExport = useCallback(() => {
    try {
      const backupData = {
        _app: 'Hisaab',
        _version: '2.0',
        _exportedAt: new Date().toISOString(),
        providers: providers,
        entries: entries,
        monthlyPayments: monthlyPayments,
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
      
      showToast('JSON backup downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export JSON backup', 'error');
    }
  }, [providers, entries, monthlyPayments, showToast]);

  // ── PDF Export ──
  const handlePDFExport = useCallback(() => {
    try {
      showToast('Generating PDF Report...', 'success');
      generatePDFReport(providers, entries, monthlyPayments);
    } catch (err) {
      console.error(err);
      showToast('Failed to generate PDF', 'error');
    }
  }, [providers, entries, monthlyPayments, showToast]);

  return (
    <div className="backup-page animate-fade-in pb-24">
      <div className="page-header">
        <div>
          <h2 className="page-title">Export Data</h2>
          <p className="page-subtitle">Download your records as PDF or JSON</p>
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
        <p className="text-xs text-[var(--text-secondary)] mt-2 text-center">
          Data is safely synced and stored in the cloud.
        </p>
      </div>

      {/* Action Cards */}
      <div className="backup-actions-grid mt-6">
        {/* PDF Export */}
        <div className="backup-action-card">
          <div className="backup-action-icon backup-action-export" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)' }}>
            <FileText size={28} />
          </div>
          <h3>Export as PDF</h3>
          <p>Download a printable PDF report containing your providers, monthly payments, and daily entries.</p>
          <button className="btn backup-export-btn w-full" onClick={handlePDFExport}>
            <FileText size={18} />
            Generate PDF
          </button>
        </div>

        {/* JSON Export */}
        <div className="backup-action-card">
          <div className="backup-action-icon backup-action-export">
            <Download size={28} />
          </div>
          <h3>Export as JSON</h3>
          <p>Download a raw data backup file in JSON format for safekeeping or developer use.</p>
          <button className="btn backup-export-btn w-full" onClick={handleJSONExport}>
            <Download size={18} />
            Download JSON
          </button>
        </div>
      </div>
    </div>
  );
}
