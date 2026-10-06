import React from 'react';
import CompanyLogo from './CompanyLogo';

export default function ApplicationCard({ application, onEdit, onDelete }) {
  const {
    id,
    company,
    companyDomain,
    logo,
    role,
    location,
    workMode,
    status,
    appliedDate,
    salary,
    stage
  } = application;

  const getStatusClass = (statusText) => {
    switch (statusText?.toLowerCase()) {
      case 'offer':
        return 'badge-offer';
      case 'interviewing':
        return 'badge-interviewing';
      case 'screening':
        return 'badge-screening';
      case 'applied':
        return 'badge-applied';
      case 'rejected':
        return 'badge-rejected';
      default:
        return 'badge-default';
    }
  };

  return (
    <div className="application-card">
      <div className="app-card-top">
        <div className="company-info-group">
          <div className="company-logo-wrap">
            <CompanyLogo
              logo={logo}
              company={company}
              companyDomain={companyDomain}
              className="company-logo-img"
            />
          </div>
          <div className="title-and-company">
            <h4 className="job-title">{role}</h4>
            <span className="company-name">{company}</span>
          </div>
        </div>

        <div className="app-card-badges">
          <span className={`status-badge ${getStatusClass(status)}`}>
            <span className="badge-dot"></span>
            {status}
          </span>
        </div>
      </div>

      <div className="app-card-details">
        <div className="detail-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>{location}</span>
        </div>

        <div className="detail-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <span className="workmode-pill">{workMode}</span>
        </div>

        {salary && (
          <div className="detail-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <span>{salary}</span>
          </div>
        )}

        {stage && (
          <div className="detail-item stage-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            <span>{stage}</span>
          </div>
        )}
      </div>

      <div className="app-card-footer">
        <span className="applied-date">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Applied: {appliedDate}
        </span>

        <div className="app-card-actions">
          <button
            className="action-btn edit-btn"
            onClick={() => onEdit(application)}
            title="Edit Application"
            aria-label="Edit Application"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Edit</span>
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => onDelete(id)}
            title="Delete Application"
            aria-label="Delete Application"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
