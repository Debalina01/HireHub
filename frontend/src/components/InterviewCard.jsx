import React, { useState, useMemo, useRef, useEffect } from 'react';
import CompanyLogo from './CompanyLogo';
import { getInterviewDisplay } from '../utils/timezoneHelper';

const POPULAR_TIMEZONES = [
  { id: 'America/New_York', label: 'America/New_York (EDT/EST)', city: 'New York' },
  { id: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)', city: 'India' },
  { id: 'Europe/London', label: 'Europe/London (BST/GMT)', city: 'London' },
  { id: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)', city: 'Tokyo' },
  { id: 'America/Los_Angeles', label: 'America/Los_Angeles (PDT/PST)', city: 'Los Angeles' },
  { id: 'America/Chicago', label: 'America/Chicago (CDT/CST)', city: 'Chicago' },
  { id: 'Europe/Berlin', label: 'Europe/Berlin (CEST/CET)', city: 'Berlin' },
  { id: 'Asia/Singapore', label: 'Asia/Singapore (SGT)', city: 'Singapore' },
  { id: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)', city: 'Sydney' }
];

export default function InterviewCard({ interview, onEdit, onDelete }) {
  const [meetingError, setMeetingError] = useState('');
  const [selectedViewTz, setSelectedViewTz] = useState(null);
  const [isTzDropdownOpen, setIsTzDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayInfo = useMemo(() => {
    return getInterviewDisplay(interview, selectedViewTz);
  }, [interview, selectedViewTz]);

  useEffect(() => {
    if (!isTzDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsTzDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsTzDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTzDropdownOpen]);

  const tzOptions = useMemo(() => {
    const list = [];
    const seen = new Set();

    if (displayInfo.scheduled?.timeZone) {
      const scheduledId = displayInfo.scheduled.timeZone;
      list.push({
        id: scheduledId,
        label: `Scheduled: ${scheduledId} (${displayInfo.scheduled.abbr})`,
        isScheduled: true
      });
      seen.add(scheduledId);
    }

    if (displayInfo.localTz && !seen.has(displayInfo.localTz)) {
      list.push({
        id: displayInfo.localTz,
        label: `My Local: ${displayInfo.localTz} (${displayInfo.localEquivalent?.abbr || 'Local'})`,
        isLocal: true
      });
      seen.add(displayInfo.localTz);
    }

    for (const item of POPULAR_TIMEZONES) {
      if (!seen.has(item.id)) {
        list.push({
          id: item.id,
          label: item.label
        });
        seen.add(item.id);
      }
    }

    return list;
  }, [displayInfo.scheduled, displayInfo.localTz, displayInfo.localEquivalent]);

  const {
    company,
    companyDomain,
    logo,
    role,
    round,
    interviewer,
    platform,
    prepTip,
    status
  } = interview;

  const rawMeetingLink = interview?.link || interview?.meetingLink || interview?.meetingUrl || interview?.url;

  const hasValidLink = Boolean(
    rawMeetingLink &&
    typeof rawMeetingLink === 'string' &&
    rawMeetingLink.trim() !== '' &&
    rawMeetingLink.trim() !== '#'
  );

  const formattedUrl = hasValidLink
    ? (rawMeetingLink.trim().startsWith('http://') || rawMeetingLink.trim().startsWith('https://')
        ? rawMeetingLink.trim()
        : `https://${rawMeetingLink.trim()}`)
    : '';

  const hasDifferentLocal = Boolean(
    displayInfo.localTz &&
    displayInfo.scheduled?.timeZone &&
    displayInfo.localTz !== displayInfo.scheduled.timeZone
  );

  const statusKey = (status || 'scheduled').toLowerCase();
  const statusLabel = statusKey === 'completed' || statusKey === 'conducted'
    ? 'Completed'
    : statusKey === 'cancelled'
    ? 'Cancelled'
    : 'Upcoming';

  return (
    <div className="interview-card">
      <div className="interview-card-header">
        <div className="interview-company-info">
          <div className="company-logo-wrap">
            <CompanyLogo
              logo={logo}
              company={company}
              companyDomain={companyDomain}
              className="company-logo-img"
            />
          </div>
          <div className="interview-title-block">
            <h4 className="interview-company" title={company}>{company}</h4>
            <div className="interview-role" title={role}>{role}</div>
          </div>
        </div>
        <span className="platform-pill">{platform || 'Google Meet'}</span>
      </div>

      {round && round.trim() && (
        <div className="interview-round-tag" title={round}>
          <span className="round-icon">🎯</span>
          <span className="round-text">{round}</span>
        </div>
      )}

      <div className="interview-time-box">
        <div className="interview-time-label-row">
          <span className="interview-time-label">Interview Time</span>
          <span className={`interview-status-tag status-${statusKey}`}>
            <span className="status-dot"></span>
            {statusLabel}
          </span>
        </div>
        <div className="interview-time-val-row">
          <svg className="clock-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <div className="schedule-datetime-group">
            <span className="schedule-date">{displayInfo.displayDate}</span>
            <span className="schedule-time-dot">·</span>
            <span className="schedule-time">{displayInfo.displayTime}</span>
          </div>
        </div>
      </div>

      <div className="interview-tz-compact-bar">
        <div className="tz-main-row">
          <div className="tz-dropdown-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className="tz-custom-select-trigger"
              onClick={() => setIsTzDropdownOpen(prev => !prev)}
              aria-expanded={isTzDropdownOpen}
              aria-haspopup="listbox"
              title="Change interview timezone"
            >
              <svg className="globe-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span className="schedule-tz">{displayInfo.displayTimezone}</span>
              <svg className={`select-arrow ${isTzDropdownOpen ? 'open' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isTzDropdownOpen && (
              <div className="tz-dropdown-menu" role="listbox">
                <div className="tz-dropdown-header">Select Timezone</div>
                {tzOptions.map((opt) => {
                  const currentActiveTz = selectedViewTz || displayInfo.scheduled.timeZone;
                  const isSelected = currentActiveTz === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`tz-dropdown-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedViewTz(opt.id === displayInfo.scheduled.timeZone ? null : opt.id);
                        setIsTzDropdownOpen(false);
                      }}
                    >
                      <span className="tz-check-icon">{isSelected ? '✓' : ''}</span>
                      <span className="tz-item-label">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {hasDifferentLocal && (
            displayInfo.isConverted ? (
              <button
                type="button"
                className="tz-reset-btn compact-tz-btn"
                onClick={() => setSelectedViewTz(null)}
                title="Reset to scheduled timezone"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <span>Scheduled</span>
              </button>
            ) : (
              <button
                type="button"
                className="tz-quick-switch-btn compact-tz-btn"
                onClick={() => setSelectedViewTz(displayInfo.localTz)}
                title="Switch to view in your local timezone"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <span>Local time</span>
              </button>
            )
          )}
        </div>

        {hasDifferentLocal && (
          displayInfo.isConverted ? (
            <div className="tz-converted-note compact-subnote">
              <span>Scheduled: <strong>{displayInfo.scheduled.time} {displayInfo.scheduled.abbr}</strong> ({displayInfo.scheduled.date})</span>
            </div>
          ) : displayInfo.localEquivalent ? (
            <div className="tz-local-equivalent-note compact-subnote">
              <span>Local time: <strong>{displayInfo.localEquivalent.time} {displayInfo.localEquivalent.abbr}</strong></span>
            </div>
          ) : null
        )}
      </div>

      {(interviewer || prepTip) && (
        <div className="interview-extra-info">
          {interviewer && interviewer.trim() && (
            <div className="compact-interviewer-row">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>With: <strong>{interviewer.trim()}</strong></span>
            </div>
          )}
          {prepTip && prepTip.trim() && (
            <div className="compact-tip-box">
              <span className="tip-badge">💡 Tip</span>
              <span className="tip-text">{prepTip.trim()}</span>
            </div>
          )}
        </div>
      )}

      <div className="interview-card-footer">
        <div className="footer-btn-row">
          {hasValidLink ? (
            <a
              href={formattedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-join-meeting"
              onClick={() => setMeetingError('')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
              <span>Join Meeting</span>
            </a>
          ) : (
            <button
              type="button"
              className="btn-join-meeting btn-join-disabled"
              onClick={() => setMeetingError('Meeting link is not available.')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
              <span>Join Meeting</span>
            </button>
          )}

          {(onEdit || onDelete) && (
            <div className="app-card-actions">
              {onEdit && (
                <button
                  type="button"
                  className="action-btn edit-btn"
                  onClick={() => onEdit(interview)}
                  title="Edit Interview"
                  aria-label="Edit Interview"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="action-btn delete-btn"
                  onClick={() => onDelete(interview)}
                  title="Delete Interview"
                  aria-label="Delete Interview"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {meetingError && (
          <p className="meeting-error-text">
            {meetingError}
          </p>
        )}
      </div>
    </div>
  );
}
