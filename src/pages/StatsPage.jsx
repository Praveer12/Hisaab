import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, Landmark, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getMonthName } from '../utils/dateHelpers';

export default function StatsPage() {
  const { entries, providers, getEntriesByMonth } = useApp();
  const [selectedProviderId, setSelectedProviderId] = useState('all');

  const last12MonthsList = useMemo(() => {
    const months = [];
    const d = new Date();
    for (let i = 11; i >= 0; i--) {
      const tempDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
      months.push({
        year: tempDate.getFullYear(),
        month: tempDate.getMonth(),
        label: `${getMonthName(tempDate.getMonth()).substring(0, 3)} '${String(tempDate.getFullYear()).substring(2)}`,
        key: `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}`,
      });
    }
    return months;
  }, []);

  const chartData = useMemo(() => {
    return last12MonthsList.map((m) => {
      const prefix = m.key;
      let monthEntries = entries.filter((e) => e.date && e.date.startsWith(prefix));
      if (selectedProviderId !== 'all') {
        monthEntries = monthEntries.filter((e) => e.providerId === selectedProviderId);
      }
      const totalAmount = monthEntries.reduce((sum, e) => sum + (parseFloat(e.totalAmount) || 0), 0);
      return { ...m, amount: parseFloat(totalAmount.toFixed(2)) };
    });
  }, [entries, selectedProviderId, last12MonthsList]);

  const summaryStats = useMemo(() => {
    const totalSpend = chartData.reduce((sum, d) => sum + d.amount, 0);
    const averageSpend = totalSpend / 12;
    let highestMonth = { label: 'N/A', amount: 0 };
    chartData.forEach((d) => {
      if (d.amount > highestMonth.amount) {
        highestMonth = { label: d.label, amount: d.amount };
      }
    });
    return { totalSpend, averageSpend, highestMonth };
  }, [chartData]);

  // SVG Chart Config
  const chartWidth = 900;
  const chartHeight = 350;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 50;
  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  const maxAmount = useMemo(() => {
    const peak = Math.max(...chartData.map((d) => d.amount), 0);
    return peak === 0 ? 1000 : Math.ceil(peak / 500) * 500;
  }, [chartData]);

  const points = useMemo(() => {
    return chartData.map((d, index) => {
      const x = paddingLeft + (index * graphWidth) / 11;
      const y = paddingTop + graphHeight - (d.amount * graphHeight) / maxAmount;
      return { x, y, amount: d.amount, label: d.label };
    });
  }, [chartData, graphWidth, graphHeight, maxAmount]);

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const startX = points[0].x;
    const endX = points[points.length - 1].x;
    const baseY = paddingTop + graphHeight;
    return `M ${startX} ${baseY} L ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${endX} ${baseY} Z`;
  }, [points]);

  const horizontalGridLines = useMemo(() => {
    const lines = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const value = (maxAmount / steps) * i;
      const y = paddingTop + graphHeight - (value * graphHeight) / maxAmount;
      lines.push({ y, value });
    }
    return lines;
  }, [maxAmount, graphHeight]);

  return (
    <div className="stats-page animate-fade-in" style={{ paddingBottom: '2rem', width: '100%', minWidth: 0 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title">Statistics</h2>
          <p className="page-subtitle">Monthly spend analysis</p>
        </div>

        {providers.length > 0 && (
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '160px', padding: '0.5rem 2rem 0.5rem 0.75rem', fontSize: '0.8125rem' }}
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
          >
            <option value="all">All Providers</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-primary-bg)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Landmark size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block' }}>Total (12 Months)</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{summaryStats.totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-violet-bg)', color: 'var(--color-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block' }}>Avg Monthly</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{summaryStats.averageSpend.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent-bg)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block' }}>Peak Month</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{summaryStats.highestMonth.label}</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', display: 'block' }}>₹{summaryStats.highestMonth.amount.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="card" style={{ padding: '1.25rem', width: '100%', overflow: 'hidden' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} style={{ color: 'var(--color-primary)' }} /> Expenditure Trend
        </h3>

        {summaryStats.totalSpend === 0 ? (
          <div className="empty-state" style={{ padding: '3rem 1rem' }}>
            <TrendingUp size={40} />
            <p>No expenditure data yet</p>
            <p style={{ fontSize: '0.75rem' }}>Add deliveries to see your spend trends</p>
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" style={{ display: 'block', minWidth: '600px' }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D9488" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0D9488" stopOpacity="0.00" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0D9488" floodOpacity="0.25" />
                </filter>
              </defs>

              {horizontalGridLines.map((line, idx) => (
                <g key={idx}>
                  <line x1={paddingLeft} y1={line.y} x2={chartWidth - paddingRight} y2={line.y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray={idx === 0 ? '0' : '4 4'} />
                  <text x={paddingLeft - 12} y={line.y + 4} textAnchor="end" fill="#94A3B8" fontSize="11" fontWeight="500" fontFamily="Poppins, sans-serif">
                    ₹{line.value.toFixed(0)}
                  </text>
                </g>
              ))}

              {points.map((p, idx) => (
                <line key={idx} x1={p.x} y1={paddingTop} x2={p.x} y2={paddingTop + graphHeight} stroke="#F8FAFC" strokeWidth="1" />
              ))}

              <path d={areaPath} fill="url(#chartGradient)" />

              <path d={linePath} fill="none" stroke="#0D9488" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {points.map((p, idx) => (
                <g key={idx} className="chart-point-group">
                  <circle cx={p.x} cy={p.y} r={5.5} fill="#0D9488" stroke="#ffffff" strokeWidth="2.5" filter="url(#shadow)" />
                  {p.amount > 0 && (
                    <g>
                      <rect x={p.x - 26} y={p.y - 24} width="52" height="16" rx="6" fill="#1E293B" opacity="0.85" />
                      <text x={p.x} y={p.y - 13} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="600" fontFamily="Poppins, sans-serif">
                        ₹{p.amount.toFixed(0)}
                      </text>
                    </g>
                  )}
                </g>
              ))}

              {points.map((p, idx) => (
                <text key={idx} x={p.x} y={chartHeight - 16} textAnchor="middle" fill="#94A3B8" fontSize="11" fontWeight="600" fontFamily="Poppins, sans-serif">
                  {p.label}
                </text>
              ))}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
