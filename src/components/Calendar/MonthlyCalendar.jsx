import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDaysInMonth, getFirstDayOfMonth, formatDate, getMonthName, isToday } from '../../utils/dateHelpers';
import { getDeliveryStatus } from '../../utils/calculations';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MonthlyCalendar({ year, month, onMonthChange, onDateClick, entries }) {
  const daysInMonth = getDaysInMonth(year, month);
  let firstDay = getFirstDayOfMonth(year, month);
  // Convert from Sun=0 to Mon=0 format
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const deliveryStatus = useMemo(() => getDeliveryStatus(entries, year, month), [entries, year, month]);

  // Build calendar grid
  // Previous month padding days
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthDays = getDaysInMonth(prevYear, prevMonth);

  const calendarDays = useMemo(() => {
    const days = [];

    // Padding from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      days.push({ day, isOtherMonth: true, dateStr: formatDate(new Date(prevYear, prevMonth, day)) });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(new Date(year, month, d));
      const status = deliveryStatus.get(dateStr) || 'no-data';
      const entry = entries.find(e => e.date === dateStr);
      days.push({ day: d, isOtherMonth: false, dateStr, status, isToday: isToday(dateStr), entry });
    }

    // Padding for next month
    const remaining = 42 - days.length; // 6 rows * 7
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isOtherMonth: true, dateStr: formatDate(new Date(nextYear, nextMonth, i)) });
    }

    return days;
  }, [year, month, entries, deliveryStatus, daysInMonth, firstDay, prevMonth, prevYear, prevMonthDays]);

  const handlePrev = () => {
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  };

  const handleNext = () => {
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="btn btn-icon" onClick={handlePrev} aria-label="Previous month">
          <ChevronLeft size={20} />
        </button>
        <h3 className="calendar-title">{getMonthName(month)} {year}</h3>
        <button className="btn btn-icon" onClick={handleNext} aria-label="Next month">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="calendar-grid">
        {WEEKDAYS.map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
        {calendarDays.map((dayObj, idx) => (
          <div
            key={idx}
            className={`calendar-day ${dayObj.isOtherMonth ? 'other-month' : ''} ${dayObj.status || ''} ${dayObj.isToday ? 'today' : ''}`}
            onClick={() => !dayObj.isOtherMonth && onDateClick(dayObj.dateStr)}
            role={!dayObj.isOtherMonth ? 'button' : undefined}
            tabIndex={!dayObj.isOtherMonth ? 0 : undefined}
            onKeyDown={(e) => {
              if (!dayObj.isOtherMonth && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onDateClick(dayObj.dateStr);
              }
            }}
          >
            <span className="calendar-day-number">{dayObj.day}</span>
            {dayObj.entry && !dayObj.isOtherMonth && (
              <span className="calendar-day-info">
                {(dayObj.entry.milk.morning + dayObj.entry.milk.evening).toFixed(1)}L
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
