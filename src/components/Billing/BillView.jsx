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
              <th>Morning (L)</th>
              <th>Evening (L)</th>
              <th>Total Milk (L)</th>
              <th>Rate (₹)</th>
              <th>Milk Amt (₹)</th>
              <th>Paper (₹)</th>
              <th>Total (₹)</th>
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

        <div className="bill-payment-breakdown" style={{ marginTop: '2rem', padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
          <h5 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 600, color: '#1e293b' }}>
            💰 Monthly Payment Status
          </h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <button
              type="button"
              className={`btn ${paymentInfo.status === 'Pending' ? 'btn-danger' : 'btn-outline'}`}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}
              onClick={() => updateMonthlyPayment(providerId, year, month, { ...paymentInfo, status: 'Pending' })}
            >
              Pending
            </button>
            <button
              type="button"
              className={`btn ${paymentInfo.status === 'Paid' ? 'btn-success' : 'btn-outline'}`}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}
              onClick={() => updateMonthlyPayment(providerId, year, month, { ...paymentInfo, status: 'Paid' })}
            >
              Paid
            </button>

            {paymentInfo.status === 'Paid' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Payment Method:</span>
                {['Cash', 'UPI', 'Bank Transfer'].map(method => (
                  <button
                    key={method}
                    type="button"
                    className={`btn btn-sm ${paymentInfo.method === method ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s' }}
                    onClick={() => updateMonthlyPayment(providerId, year, month, { ...paymentInfo, method })}
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
