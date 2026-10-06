import React, { useState, useEffect, useRef } from 'react';
import CompanyLogo from './CompanyLogo';
import { fetchCompanySuggestions, getCachedSuggestions } from '../utils/companyLogo';

export default function CompanySearchInput({
  value = '',
  onChange,
  onSelectCompany,
  placeholder = 'e.g. Google, Microsoft, Amazon',
  required = false,
  className = 'form-input',
  id,
  name = 'company',
  compact = false,
  showIcon = false,
  showClear = false
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isSelectingRef = useRef(false);
  const selectedCompanyRef = useRef('');

  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      setIsOpen(false);
      setSuggestions([]);
      return;
    }

    const trimmed = (value || '').trim();

    if (selectedCompanyRef.current && trimmed.toLowerCase() === selectedCompanyRef.current.trim().toLowerCase()) {
      setIsOpen(false);
      setSuggestions([]);
      return;
    }

    if (trimmed.length < 2) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    const cached = getCachedSuggestions(trimmed);
    if (cached && cached.length > 0) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setSuggestions(cached);
      setIsLoading(false);
      setIsOpen(true);
      setHighlightedIndex(-1);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const results = await fetchCompanySuggestions(trimmed, controller.signal);
        if (!controller.signal.aborted) {
          if (selectedCompanyRef.current && (value || '').trim().toLowerCase() === selectedCompanyRef.current.trim().toLowerCase()) {
            setSuggestions([]);
            setIsLoading(false);
            setIsOpen(false);
            return;
          }
          setSuggestions(results);
          setIsLoading(false);
          if (results.length > 0) {
            setIsOpen(true);
            setHighlightedIndex(-1);
          } else {
            setIsOpen(false);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          setSuggestions([]);
          setIsLoading(false);
          setIsOpen(false);
        }
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (item) => {
    isSelectingRef.current = true;
    selectedCompanyRef.current = item.name;
    setIsOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
    if (onChange) {
      onChange(item.name);
    }
    if (onSelectCompany) {
      onSelectCompany({
        companyName: item.name,
        companyDomain: item.domain,
        logo: item.logo
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSuggestions([]);
      return;
    }

    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    }
  };

  const hasValue = Boolean((value || '').trim());
  const inputPaddingLeft = showIcon ? '2.3rem' : undefined;

  let inputPaddingRight;
  if (showClear && hasValue && isLoading) {
    inputPaddingRight = '3.8rem';
  } else if ((showClear && hasValue) || isLoading) {
    inputPaddingRight = '2.4rem';
  }

  return (
    <div
      ref={containerRef}
      className={`company-search-container ${compact ? 'company-search-compact' : ''}`}
      style={{ position: 'relative', width: '100%' }}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        {showIcon && (
          <div
            className="search-icon-wrap"
            style={{
              position: 'absolute',
              left: '0.8rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              zIndex: 2,
              color: 'var(--text-light, #94a3b8)'
            }}
            aria-hidden="true"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (selectedCompanyRef.current && val.trim().toLowerCase() !== selectedCompanyRef.current.trim().toLowerCase()) {
              selectedCompanyRef.current = '';
            }
            if (onChange) onChange(val);
          }}
          onFocus={() => {
            if (!selectedCompanyRef.current && suggestions.length > 0 && (value || '').trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className={`${className} ${compact ? 'compact-search-input' : ''}`}
          autoComplete="off"
          style={{
            paddingLeft: inputPaddingLeft,
            paddingRight: inputPaddingRight
          }}
        />

        {showClear && hasValue && (
          <button
            type="button"
            className="search-clear compact-search-clear"
            onClick={() => {
              selectedCompanyRef.current = '';
              isSelectingRef.current = false;
              setIsOpen(false);
              setSuggestions([]);
              if (onChange) onChange('');
              if (onSelectCompany) {
                onSelectCompany({ companyName: '', companyDomain: '', logo: '' });
              }
              if (inputRef.current) inputRef.current.focus();
            }}
            title="Clear company search"
            aria-label="Clear company search"
            style={{
              position: 'absolute',
              right: isLoading ? '2rem' : '0.65rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              fontSize: '1.15rem',
              color: 'var(--text-light, #94a3b8)',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              zIndex: 2
            }}
          >
            &times;
          </button>
        )}

        {isLoading && (
          <span
            className="company-search-spinner"
            aria-label="Searching companies..."
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              border: '2px solid rgba(99, 102, 241, 0.25)',
              borderTopColor: 'var(--primary, #4f46e5)',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              pointerEvents: 'none',
              zIndex: 2
            }}
          />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          className="company-suggestions-dropdown"
          role="listbox"
          aria-label="Company suggestions"
        >
          {suggestions.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={`${item.domain}-${idx}`}
                role="option"
                aria-selected={isHighlighted}
                className={`company-suggestion-item ${
                  isHighlighted ? 'highlighted' : ''
                }`}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => handleSelect(item)}
              >
                <div className="suggestion-logo-wrap">
                  <CompanyLogo
                    logo={item.logo}
                    company={item.name}
                    companyDomain={item.domain}
                    className="suggestion-logo-img"
                  />
                </div>
                <div className="suggestion-details">
                  <div className="suggestion-company-name">{item.name}</div>
                  <div className="suggestion-company-domain">{item.domain}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
