import React from 'react';
import CompanyLogo from './CompanyLogo';

export default function JobDetailsModal({
  job,
  isSaved,
  onToggleSave,
  onApply,
  onClose
}) {
  if (!job) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card job-details-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="job-details-modal-header">
          <div className="job-details-company-hero">
            <div className="job-details-logo-wrap">
              <CompanyLogo
                logo={job.logo}
                company={job.company}
                companyDomain={job.companyDomain}
                size={48}
                className="job-details-company-logo"
              />
            </div>
            <div className="job-details-title-group">
              <h2 className="job-details-role">{job.role}</h2>
              <div className="job-details-company-meta">
                <span className="job-details-company-name">{job.company}</span>
                {job.department && <span className="job-details-dept">&bull; {job.department}</span>}
                {job.postedDate && <span className="job-details-posted">&bull; Posted {job.postedDate}</span>}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close job details modal"
          >
            &times;
          </button>
        </div>

        <div className="modal-body job-details-modal-body">
          <div className="job-details-chips-row">
            <div className="job-chip">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{job.location}</span>
            </div>

            <div className="job-chip">
              <span className="workmode-pill">{job.workMode}</span>
            </div>

            <div className="job-chip">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <span>{job.salary}</span>
            </div>

            {job.matchScore && (
              <div className="job-chip match-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>{job.matchScore}% Match</span>
              </div>
            )}
          </div>

          {job.description && (
            <div className="job-details-section">
              <h3 className="job-details-section-title">About the Role</h3>
              <p className="job-details-text">{job.description}</p>
            </div>
          )}

          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="job-details-section">
              <h3 className="job-details-section-title">Key Responsibilities</h3>
              <ul className="job-details-bullets">
                {job.responsibilities.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {job.requirements && job.requirements.length > 0 && (
            <div className="job-details-section">
              <h3 className="job-details-section-title">Qualifications & Requirements</h3>
              <ul className="job-details-bullets">
                {job.requirements.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {job.benefits && job.benefits.length > 0 && (
            <div className="job-details-section">
              <h3 className="job-details-section-title">Perks & Benefits</h3>
              <ul className="job-details-bullets benefits-list">
                {job.benefits.map((item, idx) => (
                  <li key={idx}>
                    <span className="benefit-check">&#10003;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.tags && job.tags.length > 0 && (
            <div className="job-details-section">
              <h3 className="job-details-section-title">Required Skills & Technologies</h3>
              <div className="job-tags-row">
                {job.tags.map((tag) => (
                  <span key={tag} className="job-tag">#{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer job-details-modal-footer">
          <button
            type="button"
            className={`btn-job-details-bookmark ${isSaved ? 'is-saved' : 'is-not-saved'}`}
            onClick={() => onToggleSave(job)}
            title={isSaved ? "Unsave Job" : "Save Job"}
          >
            {isSaved ? (
              <>
                <svg className="bookmark-icon filled" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Saved</span>
              </>
            ) : (
              <>
                <svg className="bookmark-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Save Job</span>
              </>
            )}
          </button>

          <div className="modal-footer-right-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onApply(job);
                onClose();
              }}
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
