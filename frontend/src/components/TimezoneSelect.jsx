import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getAllSupportedTimezones, getTimezoneAbbr } from '../utils/timezoneHelper';

export default function TimezoneSelect({ value, date, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedTz = value || 'America/New_York';
  const referenceDate = useMemo(() => {
    if (!date) return new Date();
    try {
      const [y, m, d] = String(date).split('-').map(Number);
      return y && m && d ? new Date(y, m - 1, d) : new Date();
    } catch {
      return new Date();
    }
  }, [date]);

  const { priorityList, otherList } = useMemo(() => {
    return getAllSupportedTimezones(referenceDate);
  }, [referenceDate]);

  const currentAbbr = useMemo(() => {
    return getTimezoneAbbr(referenceDate, selectedTz);
  }, [referenceDate, selectedTz]);

  // Outside click listener to close dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filtered lists
  const query = searchQuery.trim().toLowerCase();
  const filteredPriority = useMemo(() => {
    if (!query) return priorityList;
    return priorityList.filter(
      (item) =>
        item.id.toLowerCase().includes(query) ||
        item.label.toLowerCase().includes(query) ||
        item.abbr.toLowerCase().includes(query) ||
        item.fullText.toLowerCase().includes(query)
    );
  }, [priorityList, query]);

  const filteredOther = useMemo(() => {
    if (!query) return otherList;
    return otherList.filter(
      (item) =>
        item.id.toLowerCase().includes(query) ||
        item.label.toLowerCase().includes(query) ||
        item.abbr.toLowerCase().includes(query) ||
        item.fullText.toLowerCase().includes(query)
    );
  }, [otherList, query]);

  const handleSelect = (tzId) => {
    onChange(tzId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`timezone-select-container ${className}`} ref={containerRef}>
      <button
        type="button"
        className="timezone-select-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="tz-trigger-globe">🌐</span>
        <span className="tz-trigger-label">
          <strong>{selectedTz}</strong> <span className="tz-abbr-pill">({currentAbbr})</span>
        </span>
        <svg
          className={`tz-chevron ${isOpen ? 'open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="timezone-dropdown-menu" role="listbox">
          <div className="tz-search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search city, country, or timezone (e.g. India, Tokyo, London)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tz-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="tz-clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          <div className="tz-options-list">
            {filteredPriority.length > 0 && (
              <div className="tz-group">
                <div className="tz-group-header">Common Timezones</div>
                {filteredPriority.map((item) => {
                  const isSelected = item.id === selectedTz;
                  return (
                    <div
                      key={item.id}
                      className={`tz-option-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(item.id)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="tz-option-main">
                        <span className="tz-option-name">{item.label}</span>
                        <span className="tz-option-id">{item.id}</span>
                      </div>
                      <div className="tz-option-meta">
                        <span className="tz-badge">{item.abbr}</span>
                        {item.offset && <span className="tz-offset">{item.offset}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredOther.length > 0 && (
              <div className="tz-group">
                <div className="tz-group-header">All Worldwide Timezones</div>
                {filteredOther.slice(0, 80).map((item) => {
                  const isSelected = item.id === selectedTz;
                  return (
                    <div
                      key={item.id}
                      className={`tz-option-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(item.id)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="tz-option-main">
                        <span className="tz-option-id">{item.id}</span>
                      </div>
                      <div className="tz-option-meta">
                        <span className="tz-badge">{item.abbr}</span>
                        {item.offset && <span className="tz-offset">{item.offset}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredPriority.length === 0 && filteredOther.length === 0 && (
              <div className="tz-no-results">
                No matching timezones found for "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
