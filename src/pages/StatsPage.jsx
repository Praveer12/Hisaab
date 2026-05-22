import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Calendar, Landmark, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getMonthName } from '../utils/dateHelpers';

export default function StatsPage() {
  const { entries, providers, getEntriesByMonth } = useApp();
  const [selectedProviderId, setSelectedProviderId] = useState('all');

  // 1. Generate list of last 12 months (up to current calendar month)
  const last12MonthsList = useMemo(() => {
    const months = [];
    const d = new Date();
    for (let i = 11; i >= 0; i--) {
      const tempDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
      months.push({
        year: tempDate.getFullYear(),
        month: tempDate.getMonth(), // 0-indexed
        label: `${getMonthName(tempDate.getMonth()).substring(0, 3)} '${String(tempDate.getFullYear()).substring(2)}`,
        key: `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}`,
      });
    }
    return months;
  }, []);

  // 2. Compute stats and data points
  const chartData = useMemo(() => {
    return last12MonthsList.map((m) => {
      // Get all entries for this year and month
      const prefix = m.key;
      let monthEntries = entries.filter((e) => e.date && e.date.startsWith(prefix));

      // Filter by provider if a specific one is selected
      if (selectedProviderId !== 'all') {
        monthEntries = monthEntries.filter((e) => e.providerId === selectedProviderId);
      }

      // Sum the total spends
      const totalAmount = monthEntries.reduce((sum, e) => sum + (parseFloat(e.totalAmount) || 0), 0);

      return {
        ...m,
        amount: parseFloat(totalAmount.toFixed(2)),
      };
    });
  }, [entries, selectedProviderId, last12MonthsList]);

  // Summary Metrics
  const summaryStats = useMemo(() => {
    const totalSpend = chartData.reduce((sum, d) => sum + d.amount, 0);
    const averageSpend = totalSpend / 12;

    let highestMonth = { label: 'N/A', amount: 0 };
    chartData.forEach((d) => {
      if (d.amount > highestMonth.amount) {
        highestMonth = { label: d.label, amount: d.amount };
      }
    });

    return {
      totalSpend,
      averageSpend,
      highestMonth,
    };
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
    return peak === 0 ? 1000 : Math.ceil(peak / 500) * 500; // round up to multiple of 500
  }, [chartData]);

  // Calculate coordinates for SVG points
  const points = useMemo(() => {
    return chartData.map((d, index) => {
      const x = paddingLeft + (index * graphWidth) / 11;
      const y = paddingTop + graphHeight - (d.amount * graphHeight) / maxAmount;
      return { x, y, amount: d.amount, label: d.label };
    });
  }, [chartData, graphWidth, graphHeight, maxAmount]);

  // Generate SVG path for the Line
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
  }, [points]);

  // Generate SVG path for the filled Area
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const startX = points[0].x;
    const endX = points[points.length - 1].x;
    const baseY = paddingTop + graphHeight;
    return `M ${startX} ${baseY} L ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${endX} ${baseY} Z`;
  }, [points]);

  // Generate Horizontal Grid lines
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <h2 className="page-title">Statistics</h2>
          <p className="page-subtitle">Visual analysis of your monthly spends</p>
        </div>

        {/* Provider Filter */}
        {providers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label className="form-label" style={{ marginBottom: 0, fontWeight: 500 }}>Filter Provider:</label>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '180px', padding: '0.5rem 2rem 0.5rem 1rem' }}
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
            >
              <option value="all">All Providers</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metrics Cards Grid */}
      <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Metric 1 */}
        <div className="card summary-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div className="summary-card-icon" style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Landmark size={24} />
          </div>
          <div>
            <span className="summary-card-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Total Spend (12 Months)</span>
            <span className="summary-card-value" style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rs. {summaryStats.totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card summary-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div className="summary-card-icon" style={{ backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="summary-card-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Average Monthly Spend</span>
            <span className="summary-card-value" style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rs. {summaryStats.averageSpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card summary-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div className="summary-card-icon" style={{ backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={24} />
          </div>
          <div>
            <span className="summary-card-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Peak Spending Month</span>
            <span className="summary-card-value" style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>{summaryStats.highestMonth.label}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.1rem' }}>Rs. {summaryStats.highestMonth.amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="card" style={{ padding: '2rem', width: '100%', overflow: 'hidden' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} style={{ color: 'var(--color-primary)' }} /> 12-Month Expenditure Line Graph
        </h3>

        {summaryStats.totalSpend === 0 ? (
          <div style={{ padding: '4rem 1rem', textCenter: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <TrendingUp size={48} style={{ strokeWidth: 1, marginBottom: '1rem' }} />
            <p style={{ fontWeight: 500 }}>No expenditure data available for the last 12 months.</p>
            <p style={{ fontSize: '0.85rem' }}>Add some deliveries to visualize your spend analysis.</p>
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              width="100%"
              height="100%"
              style={{ display: 'block', minWidth: '750px', overflow: 'visible' }}
            >
              <defs>
                {/* Emerald Gradient under the Line */}
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                </linearGradient>

                {/* Drop shadow for points */}
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Horizontal Grid lines and Y Axis Labels */}
              {horizontalGridLines.map((line, idx) => (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={line.y}
                    x2={chartWidth - paddingRight}
                    y2={line.y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray={idx === 0 ? '0' : '4 4'}
                  />
                  <text
                    x={paddingLeft - 12}
                    y={line.y + 4}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="11"
                    fontWeight="500"
                  >
                    ₹{line.value.toFixed(0)}
                  </text>
                </g>
              ))}

              {/* Vertical Tick lines */}
              {points.map((p, idx) => (
                <line
                  key={idx}
                  x1={p.x}
                  y1={paddingTop}
                  x2={p.x}
                  y2={paddingTop + graphHeight}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              ))}

              {/* Filled Area path under the curve */}
              <path d={areaPath} fill="url(#chartGradient)" />

              {/* Glowing Line stroke */}
              <path
                d={linePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Circular Point Markers, hover-enabled */}
              {points.map((p, idx) => (
                <g key={idx} className="chart-point-group">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={6.5}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    filter="url(#shadow)"
                    style={{ transition: 'all 0.15s ease' }}
                  />
                  
                  {/* Total monthly amount text on top of points */}
                  {p.amount > 0 && (
                    <g>
                      {/* Text Background Badge */}
                      <rect
                        x={p.x - 28}
                        y={p.y - 25}
                        width="56"
                        height="16"
                        rx="4"
                        fill="#1e293b"
                        opacity="0.9"
                      />
                      <text
                        x={p.x}
                        y={p.y - 14}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight="600"
                      >
                        ₹{p.amount.toFixed(0)}
                      </text>
                    </g>
                  )}
                </g>
              ))}

              {/* X Axis Month Labels */}
              {points.map((p, idx) => (
                <text
                  key={idx}
                  x={p.x}
                  y={chartHeight - 16}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="11.5"
                  fontWeight="600"
                >
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
