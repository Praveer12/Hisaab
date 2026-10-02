import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Sun, Moon, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getDaysInMonth, getFirstDayOfMonth, formatDate, getMonthName, isToday, isFutureDate } from '../utils/dateHelpers';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Day Detail Popup ───────────────────────────────────────────────────────
function DayPopup({ cell, onToggle, onClose }) {
  const [canClose, setCanClose] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setCanClose(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!cell) return null;
  const date = new Date(cell.dateStr + 'T00:00:00');
  const label = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const handleBackdrop = (e) => {
    if (canClose && e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className="cook-popup-overlay" onClick={handleBackdrop}>
      <div className="cook-popup" onClick={e => e.stopPropagation()}>
        <div className="cook-popup-header">
          <span className="cook-popup-date">{label}</span>
          <button className="cook-popup-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="cook-popup-sessions">
          <button
            className={`cook-popup-session-btn ${cell.morning ? 'cook-popup-session-btn--on' : 'cook-popup-session-btn--off'}`}
            onClick={() => onToggle(cell.dateStr, 'morning')}
          >
            <Sun size={26} />
            <span className="cook-popup-session-label">Subah</span>
            <span className="cook-popup-session-status">
              {cell.morning ? '✓ Aayi' : '✗ Nahi aayi'}
            </span>
          </button>

          <button
            className={`cook-popup-session-btn ${cell.evening ? 'cook-popup-session-btn--on' : 'cook-popup-session-btn--off'}`}
            onClick={() => onToggle(cell.dateStr, 'evening')}
          >
            <Moon size={26} />
            <span className="cook-popup-session-label">Shaam</span>
            <span className="cook-popup-session-status">
              {cell.evening ? '✓ Aayi' : '✗ Nahi aayi'}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function CookDashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  // attendance: Map of dateStr -> { morning, evening }
  const [attendance, setAttendance] = useState({});
  // paid: boolean for current month
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);

  // DB month is 1-indexed
  const dbMonth = month + 1;

  // ── Fetch data when year/month changes ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchMonthData() {
      setLoading(true);
      const monthPrefix = `${year}-${String(dbMonth).padStart(2, '0')}`;

      const [attRes, salRes] = await Promise.all([
        supabase
          .from('cook_attendance')
          .select('date, morning, evening')
          .gte('date', `${monthPrefix}-01`)
          .lte('date', `${monthPrefix}-31`),
        supabase
          .from('cook_salary')
          .select('paid')
          .eq('year', year)
          .eq('month', dbMonth)
          .maybeSingle()
      ]);

      if (cancelled) return;

      if (attRes.error) console.error('cook_attendance fetch:', attRes.error);
      if (salRes.error) console.error('cook_salary fetch:', salRes.error);

      // Build attendance map
      const map = {};
      (attRes.data || []).forEach(row => {
        map[row.date] = { morning: row.morning, evening: row.evening };
      });
      setAttendance(map);
      setPaid(salRes.data?.paid ?? false);
      setLoading(false);
    }

    fetchMonthData();
    return () => { cancelled = true; };
  }, [year, month, dbMonth]);

  // ── Toggle attendance ──────────────────────────────────────────────────────
  const toggleSession = useCallback(async (dateStr, session) => {
    const current = attendance[dateStr] || { morning: false, evening: false };
    const updated = { ...current, [session]: !current[session] };

    // Optimistic UI
    setAttendance(prev => ({ ...prev, [dateStr]: updated }));

    // Update selectedCell live
    setSelectedCell(prev =>
      prev?.dateStr === dateStr ? { ...prev, [session]: updated[session] } : prev
    );

    // Upsert to Supabase
    const { error } = await supabase
      .from('cook_attendance')
      .upsert({ date: dateStr, morning: updated.morning, evening: updated.evening },
        { onConflict: 'date' });

    if (error) {
      console.error('cook_attendance upsert:', error);
      // Rollback on error
      setAttendance(prev => ({ ...prev, [dateStr]: current }));
    }
  }, [attendance]);

  // ── Toggle paid ────────────────────────────────────────────────────────────
  const togglePaid = useCallback(async () => {
    const newPaid = !paid;
    setPaid(newPaid); // optimistic

    const { error } = await supabase
      .from('cook_salary')
      .upsert({ year, month: dbMonth, paid: newPaid },
        { onConflict: 'year,month' });

    if (error) {
      console.error('cook_salary upsert:', error);
      setPaid(!newPaid); // rollback
    }
  }, [paid, year, dbMonth]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handlePrev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const handleNext = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  // ── Attendance summary ─────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    let attendedSessions = 0;
    let pastDaysCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(new Date(year, month, d));
      if (isFutureDate(dateStr) || isToday(dateStr)) continue;
      pastDaysCount++;
      const dayData = attendance[dateStr] || { morning: false, evening: false };
      if (dayData.morning) attendedSessions++;
      if (dayData.evening) attendedSessions++;
    }

    const totalSessions = pastDaysCount * 2;
    const missedSessions = totalSessions - attendedSessions;
    const daysPresent = attendedSessions / 2;
    const daysMissed = missedSessions / 2;

    const formatDays = (val) => {
      const whole = Math.floor(val);
      const half = val % 1 !== 0;
      if (whole === 0 && half) return '½';
      if (half) return `${whole}½`;
      return `${whole}`;
    };

    return { pastDaysCount, daysPresent, daysMissed, displayPresent: formatDays(daysPresent), displayMissed: formatDays(daysMissed) };
  }, [attendance, year, month]);

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    let firstDay = getFirstDayOfMonth(year, month);
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthDays = getDaysInMonth(prevYear, prevMonth);

    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--)
      cells.push({ day: prevMonthDays - i, isOtherMonth: true });

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(new Date(year, month, d));
      const dayData = attendance[dateStr] || { morning: false, evening: false };
      const future = isFutureDate(dateStr);
      const today = isToday(dateStr);
      cells.push({ day: d, dateStr, isOtherMonth: false, future, today, ...dayData });
    }

    const remaining = 42 - cells.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let i = 1; i <= remaining; i++)
      cells.push({ day: i, isOtherMonth: true });

    return cells;
  }, [year, month, attendance]);

  const handleDayClick = (cell) => {
    if (cell.isOtherMonth || cell.future) return;
    setSelectedCell(cell);
  };

  return (
    <div className="cook-page animate-fade-in">

      {/* Month navigator */}
      <div className="calendar-header" style={{ background: 'transparent', boxShadow: 'none', padding: '0.25rem 0 0.75rem' }}>
        <button className="btn btn-icon" onClick={handlePrev}><ChevronLeft size={20} /></button>
        <h3 className="calendar-title">{getMonthName(month)} {year}</h3>
        <button className="btn btn-icon" onClick={handleNext}><ChevronRight size={20} /></button>
      </div>

      {/* Attendance summary card */}
      {!loading && summary.pastDaysCount > 0 && (
        <div className="cook-attend-card">
          <div className="cook-attend-stat cook-attend-stat--present">
            <span className="cook-attend-num">{summary.displayPresent}</span>
            <span className="cook-attend-label">Din aayi</span>
          </div>
          <div className="cook-attend-divider" />
          <div className="cook-attend-stat cook-attend-stat--missed">
            <span className="cook-attend-num">{summary.displayMissed}</span>
            <span className="cook-attend-label">Din miss</span>
          </div>
          <div className="cook-attend-divider" />
          <div className="cook-attend-stat cook-attend-stat--total">
            <span className="cook-attend-num">{summary.pastDaysCount}</span>
            <span className="cook-attend-label">Kul din</span>
          </div>
          <div className="cook-attend-note">
            (Subah + Shaam = 1 din · sirf ek = ½ din)
          </div>
        </div>
      )}

      {/* Paid / Unpaid buttons */}
      <div className="cook-salary-section">
        <span className="cook-salary-label">Is mahine ke paise</span>
        <div className="cook-salary-btns">
          <button
            className={`cook-salary-toggle ${paid ? 'cook-salary-toggle--active-paid' : 'cook-salary-toggle--idle'}`}
            onClick={() => !paid && togglePaid()}
          >
            <CheckCircle2 size={17} />
            Paid
          </button>
          <button
            className={`cook-salary-toggle ${!paid ? 'cook-salary-toggle--active-unpaid' : 'cook-salary-toggle--idle'}`}
            onClick={() => paid && togglePaid()}
          >
            <XCircle size={17} />
            Unpaid
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="calendar cook-calendar-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
            Loading...
          </div>
        ) : (
          <div className="calendar-grid">
            {WEEKDAYS.map(d => (
              <div key={d} className="calendar-weekday">{d}</div>
            ))}
            {calendarDays.map((cell, idx) => {
              if (cell.isOtherMonth) {
                return (
                  <div key={idx} className="calendar-day other-month">
                    <span className="calendar-day-number">{cell.day}</span>
                  </div>
                );
              }
              const isPast = !cell.today && !cell.future;
              return (
                <div
                  key={idx}
                  className={`calendar-day cook-day ${cell.today ? 'today' : ''} ${cell.future ? 'cook-day--future' : ''}`}
                  onClick={() => handleDayClick(cell)}
                  role="button"
                  tabIndex={cell.future ? -1 : 0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleDayClick(cell); }}
                >
                  <span className="calendar-day-number">{cell.day}</span>
                  {!cell.future && (
                    <div className="cook-day-sessions">
                      <span className={`cook-session-dot ${cell.morning ? 'dot-came' : isPast ? 'dot-missed' : 'dot-pending'}`} />
                      <span className={`cook-session-dot ${cell.evening ? 'dot-came' : isPast ? 'dot-missed' : 'dot-pending'}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="calendar-legend" style={{ justifyContent: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#22C55E' }} />
          <span>Aayi ✓</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#F87171' }} />
          <span>Nahi aayi ✗</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#CBD5E1' }} />
          <span>Abhi baki</span>
        </div>
      </div>

      {/* Day detail popup */}
      {selectedCell && (
        <DayPopup
          cell={selectedCell}
          onToggle={toggleSession}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  );
}
