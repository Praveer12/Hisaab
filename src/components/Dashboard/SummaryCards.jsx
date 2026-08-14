import React, { useMemo } from 'react';
import { Droplets, IndianRupee, CalendarCheck, AlertCircle } from 'lucide-react';
import { calculateMonthlyTotals } from '../../utils/calculations';
import { useApp } from '../../context/AppContext';

export default function SummaryCards({ entries, year, month }) {
  const { monthlyPayments } = useApp();
  const totals = useMemo(() => calculateMonthlyTotals(entries), [entries]);

  const pendingAmount = useMemo(() => {
    if (year === undefined || month === undefined) {
      return totals.paymentBreakdown['Pending'] || 0;
    }
    
    let totalPending = 0;
    const providerIds = [...new Set(entries.map(e => e.providerId))];
    
    providerIds.forEach(providerId => {
      const providerEntries = entries.filter(e => e.providerId === providerId);
      const providerTotals = calculateMonthlyTotals(providerEntries);
      
      const paymentKey = `${providerId}_${year}_${month}`;
      const paymentInfo = monthlyPayments[paymentKey] || { status: 'Pending' };
      
      if (paymentInfo.status !== 'Paid') {
        totalPending += providerTotals.totalAmount;
      }
    });
    return totalPending;
  }, [entries, monthlyPayments, year, month, totals]);

  const cards = [
    {
      label: 'Total Milk',
      value: `${totals.totalMilk.toFixed(1)} L`,
      icon: Droplets,
      color: 'primary',
    },
    {
      label: 'Total Amount',
      value: `₹${totals.totalAmount.toFixed(0)}`,
      icon: IndianRupee,
      color: 'accent',
    },
    {
      label: 'Days Delivered',
      value: `${totals.daysDelivered}`,
      icon: CalendarCheck,
      color: 'success',
      subtitle: `${totals.daysMissed} missed`,
    },
    {
      label: 'Pending Amount',
      value: `₹${pendingAmount.toFixed(0)}`,
      icon: AlertCircle,
      color: 'warning',
    },
  ];

  return (
    <div className="summary-cards-grid">
      {cards.map((card, idx) => (
        <div key={idx} className={`summary-card summary-card-${card.color}`}>
          <div className="summary-card-icon">
            <card.icon size={20} />
          </div>
          <div className="summary-card-content">
            <p className="summary-card-value">{card.value}</p>
            <p className="summary-card-label">{card.label}</p>
            {card.subtitle && <p className="summary-card-subtitle">{card.subtitle}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
