import React, { useState, useEffect, useRef } from 'react';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_FULL_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseDate(val) {
  if (!val || typeof val !== 'string') return null;
  const str = val.trim();
  if (!str || str.toLowerCase() === 'present') return null;

  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    if (!isNaN(year) && month >= 0 && month < 12 && day >= 1 && day <= 31) {
      return { year, month, day, originalFormat: 'iso' };
    }
  }

  const stdMatch = str.match(/(?:[a-zA-Z]+,\s*)?([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (stdMatch) {
    const mStr = stdMatch[1].toLowerCase().slice(0, 3);
    const month = MONTH_NAMES.findIndex((m) => m.toLowerCase() === mStr);
    const day = parseInt(stdMatch[2], 10);
    const year = parseInt(stdMatch[3], 10);
    if (month !== -1 && !isNaN(year) && day >= 1 && day <= 31) {
      return { year, month, day, originalFormat: 'standard' };
    }
  }

  const myMatch = str.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (myMatch) {
    const mStr = myMatch[1].toLowerCase().slice(0, 3);
    const month = MONTH_NAMES.findIndex((m) => m.toLowerCase() === mStr);
    const year = parseInt(myMatch[2], 10);
    if (month !== -1 && !isNaN(year)) {
      return { year, month, day: 1, originalFormat: 'month-year' };
    }
  }

  const yMatch = str.match(/^(\d{4})$/);
  if (yMatch) {
    const year = parseInt(yMatch[1], 10);
    return { year, month: 0, day: 1, originalFormat: 'year' };
  }

  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      originalFormat: 'standard'
    };
  }

  return null;
}

function formatDate(year, month, day, format = 'standard') {
  const pad = (n) => String(n).padStart(2, '0');
  if (format === 'iso') {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  }
  if (format === 'month-year') {
    return `${MONTH_NAMES[month]} ${year}`;
  }
  return `${MONTH_NAMES[month]} ${day}, ${year}`;
}

export default function DatePicker({
  value = '',
  onChange,
  placeholder = 'Select date...',
  disabled = false,
  required = false,
  name,
  id,
  className = '',
  format,
  allowClear = true,
  minYear = 1950,
  maxYear = 2050,
  ariaLabel = 'Date picker'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const parsedValue = parseDate(value);

  const [viewYear, setViewYear] = useState(() => (parsedValue ? parsedValue.year : currentYear));
  const [viewMonth, setViewMonth] = useState(() => (parsedValue ? parsedValue.month : currentMonth));

  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const outputFormat = format || (parsedValue?.originalFormat === 'iso' ? 'iso' : 'standard');

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day, isOtherMonth, otherMonthDir) => {
    let targetYear = viewYear;
    let targetMonth = viewMonth;

    if (isOtherMonth) {
      if (otherMonthDir === 'prev') {
        if (targetMonth === 0) {
          targetMonth = 11;
          targetYear -= 1;
        } else {
          targetMonth -= 1;
        }
      } else if (otherMonthDir === 'next') {
        if (targetMonth === 11) {
          targetMonth = 0;
          targetYear += 1;
        } else {
          targetMonth += 1;
        }
      }
    }

    const formatted = formatDate(targetYear, targetMonth, day, outputFormat);
    if (onChange) {
      onChange(formatted, new Date(targetYear, targetMonth, day));
    }
    setIsOpen(false);
  };

  const handleSelectToday = (e) => {
    e.stopPropagation();
    const formatted = formatDate(currentYear, currentMonth, currentDay, outputFormat);
    if (onChange) {
      onChange(formatted, new Date(currentYear, currentMonth, currentDay));
    }
    setViewYear(currentYear);
    setViewMonth(currentMonth);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange('');
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isOtherMonth: true,
      otherMonthDir: 'prev'
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isSelected =
      parsedValue &&
      parsedValue.year === viewYear &&
      parsedValue.month === viewMonth &&
      parsedValue.day === d;

    const isToday =
      currentYear === viewYear &&
      currentMonth === viewMonth &&
      currentDay === d;

    calendarDays.push({
      day: d,
      isOtherMonth: false,
      isSelected,
      isToday
    });
  }

  const totalSlots = calendarDays.length <= 35 ? 35 : 42;
  const remainingSlots = totalSlots - calendarDays.length;
  for (let n = 1; n <= remainingSlots; n++) {
    calendarDays.push({
      day: n,
      isOtherMonth: true,
      otherMonthDir: 'next'
    });
  }

  const yearsList = [];
  for (let y = maxYear; y >= minYear; y--) {
    yearsList.push(y);
  }

  return (
    <div
      ref={containerRef}
      className={`hirehub-datepicker-container ${disabled ? 'is-disabled' : ''} ${className}`}
    >
      <div
        className={`hirehub-datepicker-input ${isOpen ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''}`}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        role="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <span className="datepicker-calendar-icon" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </span>

        <span className={`datepicker-value-text ${!value ? 'is-placeholder' : ''}`}>
          {value || placeholder}
        </span>

        {value && allowClear && !disabled && (
          <button
            type="button"
            className="datepicker-clear-btn"
            onClick={handleClear}
            title="Clear date"
            aria-label="Clear date"
          >
            &times;
          </button>
        )}
      </div>

      {name && (
        <input
          type="hidden"
          name={name}
          id={id}
          value={value || ''}
          required={required}
        />
      )}

      {isOpen && (
        <div className="hirehub-datepicker-popup" role="dialog" aria-modal="false">
          <div className="datepicker-header">
            <button
              type="button"
              className="datepicker-nav-btn"
              onClick={handlePrevMonth}
              title="Previous month"
              aria-label="Previous month"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div className="datepicker-selectors-wrap">
              <select
                className="datepicker-select datepicker-month-select"
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                onClick={(e) => e.stopPropagation()}
                aria-label="Select month"
              >
                {MONTH_FULL_NAMES.map((monthName, idx) => (
                  <option key={idx} value={idx}>
                    {monthName}
                  </option>
                ))}
              </select>

              <select
                className="datepicker-select datepicker-year-select"
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                onClick={(e) => e.stopPropagation()}
                aria-label="Select year"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="datepicker-nav-btn"
              onClick={handleNextMonth}
              title="Next month"
              aria-label="Next month"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <div className="datepicker-weekdays">
            {WEEK_DAYS.map((wd) => (
              <span key={wd} className="datepicker-weekday-cell">
                {wd}
              </span>
            ))}
          </div>

          <div className="datepicker-days-grid">
            {calendarDays.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className={`datepicker-day-cell ${
                  item.isOtherMonth ? 'is-other-month' : ''
                } ${item.isSelected ? 'is-selected' : ''} ${
                  item.isToday ? 'is-today' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectDay(item.day, item.isOtherMonth, item.otherMonthDir);
                }}
              >
                <span className="day-number">{item.day}</span>
              </button>
            ))}
          </div>

          <div className="datepicker-footer">
            <button
              type="button"
              className="datepicker-footer-btn btn-today"
              onClick={handleSelectToday}
            >
              Today
            </button>
            {value && allowClear && (
              <button
                type="button"
                className="datepicker-footer-btn btn-clear"
                onClick={handleClear}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className="datepicker-footer-btn btn-close"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
