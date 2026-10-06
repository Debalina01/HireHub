import React from 'react';

export default function StatCard({ stat, onClick, isLoading = false }) {
  const { title, value, change, isPositive, icon, color } = stat;

  const renderIcon = () => {
    switch (icon) {
      case 'briefcase':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        );
      case 'clock':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        );
      case 'calendar':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        );
      case 'award':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
          </svg>
        );
      default:
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
        );
    }
  };

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`stat-card stat-${color} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={onClick ? `Click to view ${title}` : undefined}
      aria-label={onClick ? `${title}: ${isLoading ? 'Loading...' : value}, ${change}. Click to view records.` : undefined}
    >
      <div className="stat-card-header">
        <span className="stat-title">{title}</span>
        <div className={`stat-icon-wrapper stat-icon-${color}`}>
          {renderIcon()}
        </div>
      </div>
      <div className="stat-card-body">
        {isLoading ? (
          <>
            <div className="stat-skeleton stat-skeleton-value" aria-hidden="true"></div>
            <div className="stat-meta">
              <div className="stat-skeleton stat-skeleton-meta" aria-hidden="true"></div>
            </div>
          </>
        ) : (
          <>
            <h3 className="stat-value">{value}</h3>
            <div className="stat-meta">
              <span className={`stat-trend ${isPositive ? 'positive' : 'negative'}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
                {change}
              </span>
              {onClick && (
                <span className="stat-card-badge-clickable" aria-hidden="true">
                  View &rarr;
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
