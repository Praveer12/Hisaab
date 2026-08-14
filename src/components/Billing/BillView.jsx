import React, { useMemo } from 'react';
import { Download, FileText } from 'lucide-react';
import Button from '../UI/Button';
import { calculateMonthlyTotals } from '../../utils/calculations';
import { getMonthName } from '../../utils/dateHelpers';
import { generateBillPDF } from '../../utils/pdfGenerator';
import { useApp } from '../../context/AppContext';

export default function BillView({ entries, providers, year, month, providerId }) {
  const { monthlyPayments, updateMonthlyPayment } = useApp();

  const sortedEntries = useMemo(() =>
    [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );

  const totals = useMemo(() => calculateMonthlyTotals(entries), [entries]);

  const getProviderName = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.name : 'Unknown';
  };

  const paymentInfo = useMemo(() => {
    return monthlyPayments[`${providerId}_${year}_${month}`] || { status: 'Pending', method: 'Cash' };
  }, [monthlyPayments, providerId, year, month]);

  const handleDownloadPDF = () => {
    generateBillPDF(sortedEntries, totals, providers, year, month, paymentInfo);
  };

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <FileText size={48} />
        <h3>No Entries</h3>
        <p>No entries found for {getMonthName(month)} {year}</p>
      </div>
    );
  }

  return (
    <div className="bill-container">
      <div className="bill-header-section">
        <div className="bill-title-row">
          <div>
            <h3 className="bill-title">Monthly Bill</h3>
            <p className="bill-period">{getMonthName(month)} {year}</p>
          </div>
          <div className="bill-actions">
            <Button variant="primary" icon={Download} onClick={handleDownloadPDF}>
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="bill-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Provider</th>
              <th>Morning</th>
              <th>Evening</th>
              <th>Total</th>
              <th>Rate</th>
              <th>Milk ₹</th>
              <th>Paper ₹</th>
              <th>Total ₹</th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map(entry => (
              <tr key={entry.id}>
                <td>
                  {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </td>
                <td>{getProviderName(entry.providerId)}</td>
                <td>{entry.milk.morning}</td>
                <td>{entry.milk.evening}</td>
                <td>{(entry.milk.morning + entry.milk.evening).toFixed(1)}</td>
                <td>₹{entry.milk.ratePerLitre}</td>
                <td>₹{entry.milk.totalAmount.toFixed(2)}</td>
                <td>{entry.newspaper.taken ? `₹${entry.newspaper.rate}` : '-'}</td>
                <td className="text-bold">₹{entry.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bill-summary">
        <h4>Bill Summary</h4>
        <div className="bill-summary-grid">
          <div className="bill-summary-item">
            <span>Total Milk</span>
            <span className="bill-summary-value">{totals.totalMilk.toFixed(1)} L</span>
          </div>
          <div className="bill-summary-item">
            <span>Milk Amount</span>
            <span className="bill-summary-value">₹{totals.totalMilkAmount.toFixed(2)}</span>
          </div>
          <div className="bill-summary-item">
            <span>Newspaper Amount</span>
            <span className="bill-summary-value">₹{totals.totalNewspaper.toFixed(2)}</span>
          </div>
          <div className="bill-summary-item bill-grand-total">
            <span>Grand Total</span>
            <span className="bill-summary-value">₹{totals.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Status */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-surface-raised)', borderRadius: '12px' }}>
          <h5 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            💰 Payment Status
          </h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => updateMonthlyPayment(providerId, year, month, { ...paymentInfo, status: 'Pending' })}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '9999px',
                border: 'none',
                background: paymentInfo.status === 'Pending' ? '#EF4444' : '#F1F5F9',
                color: paymentInfo.status === 'Pending' ? '#FFFFFF' : '#64748B',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => updateMonthlyPayment(providerId, year, month, { ...paymentInfo, status: 'Paid' })}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '9999px',
                border: 'none',
                background: paymentInfo.status === 'Paid' ? '#10B981' : '#F1F5F9',
                color: paymentInfo.status === 'Paid' ? '#FFFFFF' : '#64748B',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              ✓ Paid
            </button>

            {paymentInfo.status === 'Paid' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
                {['Cash', 'UPI', 'Bank Transfer'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => updateMonthlyPayment(providerId, year, month, { ...paymentInfo, method })}
                    style={{
                      padding: '0.3rem 0.625rem',
                      borderRadius: '8px',
                      border: paymentInfo.method === method ? '1.5px solid #0D9488' : '1.5px solid #E2E8F0',
                      background: paymentInfo.method === method ? '#F0FDFA' : '#FFFFFF',
                      color: paymentInfo.method === method ? '#0D9488' : '#94A3B8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                  >
                    {method}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
