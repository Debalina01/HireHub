import React, { useState, useEffect } from 'react';
import CompanyLogo from './CompanyLogo';
import { isJobSaved } from '../utils/savedJobsStorage';
import { fetchJobs } from '../utils/jobsApi';

export default function JobsPage({
  currentUser,
  applications = [],
  savedJobs = [],
  onSaveJob,
  onUnsaveJob,
  onApplyJob,
  onOpenJobDetails,
  onNavigateToDashboard,
  onNavigateToSavedJobs
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedWorkMode, setSelectedWorkMode] = useState('All');
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadJobs = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const data = await fetchJobs({
        search: debouncedSearch,
        workMode: selectedWorkMode,
        userEmail: currentUser?.email || 'debalina@example.com'
      });
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs from backend:', err);
      setError('Unable to load jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [debouncedSearch, selectedWorkMode, currentUser?.email]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedWorkMode('All');
  };

  return (
    <div className="jobs-page-wrapper">
      <div className="jobs-page-header">
        <div className="jobs-header-top-row">
          <button
            type="button"
            className="btn-back-dashboard"
            onClick={onNavigateToDashboard}
            title="Return to Dashboard"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Dashboard</span>
          </button>

          <button
            type="button"
            className="btn-header-saved-shortcut"
            onClick={onNavigateToSavedJobs}
            title="View Saved Jobs"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Saved Jobs ({savedJobs.length})</span>
          </button>
        </div>

        <div className="jobs-header-title-block">
          <h1 className="jobs-page-title">Explore Opportunities</h1>
          <p className="jobs-page-subtitle">
            Browse verified job postings at leading technology companies. Bookmark roles to save them for later review.
          </p>
        </div>

        <div className="jobs-filter-controls">
          <div className="jobs-search-bar">
            <svg className="jobs-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="jobs-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, company, location, or skill tag..."
            />
            {searchQuery && (
              <button
                type="button"
                className="jobs-search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          <div className="workmode-filter-pills">
            {['All', 'Remote', 'Hybrid', 'On-site'].map((mode) => (
              <button
                key={mode}
                type="button"
                className={`workmode-filter-btn ${selectedWorkMode === mode ? 'active' : ''}`}
                onClick={() => setSelectedWorkMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="jobs-page-content">
        <div className="jobs-results-header">
          <span className="results-count">
            Showing <strong>{jobs.length}</strong> available {jobs.length === 1 ? 'position' : 'positions'}
          </span>
        </div>

        {isLoading ? (
          <div className="jobs-empty-catalog">
            <div className="kpi-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Loading verified opportunities...</p>
          </div>
        ) : error ? (
          <div className="jobs-empty-catalog">
            <div className="empty-search-icon">⚠️</div>
            <h3>Unable to load jobs</h3>
            <p>{error}</p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => loadJobs()}
            >
              Retry
            </button>
          </div>
        ) : jobs.length > 0 ? (
          <div className="jobs-catalog-grid">
            {jobs.map((job) => {
              const saved = isJobSaved(savedJobs, job) || Boolean(job.isSaved || job.is_saved);
              const alreadyApplied = applications.some(
                (a) =>
                  a.company?.toLowerCase() === job.company?.toLowerCase() &&
                  a.role?.toLowerCase() === (job.role || job.job_title)?.toLowerCase()
              ) || Boolean(job.hasApplied || job.has_applied);

              const roleTitle = job.role || job.job_title;
              const matchScore = job.matchScore || job.match_score;
              const workMode = job.workMode || job.work_mode;
              const tags = job.tags || job.skills || [];
              const postedDate = job.postedDate || job.posted_at || 'Recently';

              return (
                <div key={job.id} className="job-catalog-card">
                  <div className="job-card-top">
                    <div className="company-info-group">
                      <div className="company-logo-wrap">
                        <CompanyLogo
                          logo={job.logo}
                          company={job.company}
                          companyDomain={job.companyDomain || job.company_domain}
                          size={38}
                          className="company-logo-img"
                        />
                      </div>
                      <div className="job-card-title-block">
                        <h3
                          className="job-card-role-title"
                          onClick={() => onOpenJobDetails(job)}
                          title="Click to view full job details"
                        >
                          {roleTitle}
                        </h3>
                        <span className="job-card-company-name">{job.company}</span>
                      </div>
                    </div>

                    <div className="job-card-top-actions">
                      {matchScore && (
                        <span className="match-score-badge">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          {matchScore}% match
                        </span>
                      )}

                      <button
                        type="button"
                        className={`btn-job-card-bookmark ${saved ? 'is-saved' : 'is-not-saved'}`}
                        onClick={() => {
                          if (saved) {
                            onUnsaveJob(job);
                          } else {
                            onSaveJob(job);
                          }
                        }}
                        title={saved ? "Remove from Saved Jobs" : "Save Job to Bookmarks"}
                        aria-label={saved ? "Unsave job" : "Save job"}
                      >
                        {saved ? (
                          <>
                            <svg className="bookmark-icon filled" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span className="bookmark-label">Saved</span>
                          </>
                        ) : (
                          <>
                            <svg className="bookmark-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span className="bookmark-label">Save</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="app-card-details">
                    <div className="detail-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{job.location}</span>
                    </div>
                    <div className="detail-item">
                      <span className="workmode-pill">{workMode}</span>
                    </div>
                    <div className="detail-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                      <span>{job.salary}</span>
                    </div>
                  </div>

                  {job.description && (
                    <p className="job-card-description">
                      {job.description}
                    </p>
                  )}

                  <div className="job-tags-row">
                    {tags.map((tag) => (
                      <span key={tag} className="job-tag">#{tag}</span>
                    ))}
                  </div>

                  <div className="job-card-footer">
                    <span className="posted-time">Posted {postedDate.replace(/^posted\s+/i, '')}</span>
                    <div className="job-card-footer-actions">
                      <button
                        type="button"
                        className="btn-view-job-details"
                        onClick={() => onOpenJobDetails(job)}
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        className={`btn-apply-now ${alreadyApplied ? 'is-applied' : ''}`}
                        onClick={() => onApplyJob(job)}
                        title={alreadyApplied ? "Already applied for this role" : "Apply now"}
                      >
                        {alreadyApplied ? (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>Applied</span>
                          </>
                        ) : (
                          'Apply Now'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="jobs-empty-catalog">
            <div className="empty-search-icon">🔍</div>
            <h3>No jobs found</h3>
            <p>Try changing your search or filters.</p>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
