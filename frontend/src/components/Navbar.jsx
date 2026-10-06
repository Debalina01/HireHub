import React, { useState, useRef, useEffect } from 'react';
import CompanyLogo from './CompanyLogo';
import { searchGlobalHireHubApi } from '../utils/jobsApi';

export default function Navbar({
  onOpenAddModal,
  searchQuery,
  setSearchQuery,
  onLogout,
  user,
  theme = 'dark',
  onToggleTheme,
  onNavigate,
  activeView = 'dashboard',
  savedJobsCount = 0,
  applications = [],
  interviews = [],
  savedJobs = [],
  jobs = [],
  onSelectSearchResult
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [groupedResults, setGroupedResults] = useState({
    applications: [],
    savedJobs: [],
    interviews: [],
    jobs: []
  });
  const [isSearching, setIsSearching] = useState(false);

  const searchContainerRef = useRef(null);
  const mobileSearchContainerRef = useRef(null);
  const profileRef = useRef(null);

  const clean = (searchQuery || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const searchTokens = clean ? clean.split(' ').filter(Boolean) : [];

  const matchesQuery = (tokens, cleanQuery, ...fields) => {
    const combined = fields.filter(Boolean).join(' ').toLowerCase();
    if (combined.includes(cleanQuery)) return true;
    return tokens.length > 0 && tokens.every((token) => combined.includes(token));
  };

  useEffect(() => {
    if (!clean) {
      setIsDropdownOpen(false);
      setGroupedResults({
        applications: [],
        savedJobs: [],
        interviews: [],
        jobs: []
      });
      setIsSearching(false);
      return;
    }

    setIsDropdownOpen(true);

    const localApps = (applications || []).filter((a) =>
      matchesQuery(searchTokens, clean, a.company, a.role)
    );

    const localSaved = (savedJobs || []).filter((j) =>
      matchesQuery(searchTokens, clean, j.company, j.role, j.job_title)
    );

    const localInterviews = (interviews || []).filter((i) =>
      matchesQuery(searchTokens, clean, i.company, i.role, i.round)
    );

    const localJobs = (jobs || []).filter((j) =>
      matchesQuery(searchTokens, clean, j.company, j.role, j.job_title)
    );

    setGroupedResults({
      applications: localApps.slice(0, 8),
      savedJobs: localSaved.slice(0, 8),
      interviews: localInterviews.slice(0, 8),
      jobs: localJobs.slice(0, 8)
    });

    const hasLocal = localApps.length > 0 || localSaved.length > 0 || localInterviews.length > 0 || localJobs.length > 0;
    let isCurrent = true;

    if (!hasLocal) {
      setIsSearching(true);
    }

    searchGlobalHireHubApi(clean, user?.email)
      .then((backendData) => {
        if (!isCurrent || !backendData) return;

        const seenApps = new Set(localApps.map((a) => `${(a.company || '').toLowerCase()}:::${(a.role || '').toLowerCase()}`));
        const finalApps = [...localApps];
        (backendData.applications || []).forEach((ba) => {
          const key = `${(ba.company || '').toLowerCase()}:::${(ba.role || '').toLowerCase()}`;
          if (!seenApps.has(key)) {
            seenApps.add(key);
            finalApps.push(ba);
          }
        });

        const seenSaved = new Set(localSaved.map((s) => `${(s.company || '').toLowerCase()}:::${(s.role || s.job_title || '').toLowerCase()}`));
        const finalSaved = [...localSaved];
        (backendData.savedJobs || []).forEach((bs) => {
          const key = `${(bs.company || '').toLowerCase()}:::${(bs.role || bs.job_title || '').toLowerCase()}`;
          if (!seenSaved.has(key)) {
            seenSaved.add(key);
            finalSaved.push(bs);
          }
        });

        const seenItws = new Set(localInterviews.map((i) => `${(i.company || '').toLowerCase()}:::${(i.round || i.role || '').toLowerCase()}:::${(i.date || '')}`));
        const finalItws = [...localInterviews];
        (backendData.interviews || []).forEach((bi) => {
          const key = `${(bi.company || '').toLowerCase()}:::${(bi.round || bi.role || '').toLowerCase()}:::${(bi.date || '')}`;
          if (!seenItws.has(key)) {
            seenItws.add(key);
            finalItws.push(bi);
          }
        });

        const seenJobs = new Set(localJobs.map((j) => `${(j.company || '').toLowerCase()}:::${(j.role || j.job_title || '').toLowerCase()}`));
        const finalJobs = [...localJobs];
        (backendData.jobs || []).forEach((bj) => {
          const key = `${(bj.company || '').toLowerCase()}:::${(bj.role || bj.job_title || '').toLowerCase()}`;
          if (!seenJobs.has(key)) {
            seenJobs.add(key);
            finalJobs.push(bj);
          }
        });

        setGroupedResults({
          applications: finalApps.slice(0, 8),
          savedJobs: finalSaved.slice(0, 8),
          interviews: finalItws.slice(0, 8),
          jobs: finalJobs.slice(0, 8)
        });
      })
      .catch(() => {})
      .finally(() => {
        if (isCurrent) setIsSearching(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [clean, applications, interviews, savedJobs, jobs, user?.email]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e) => {
      const inDesktop = searchContainerRef.current && searchContainerRef.current.contains(e.target);
      const inMobile = mobileSearchContainerRef.current && mobileSearchContainerRef.current.contains(e.target);
      if (!inDesktop && !inMobile) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleItemClick = (type, item) => {
    setSearchQuery('');
    setIsDropdownOpen(false);
    setMobileMenuOpen(false);
    if (onSelectSearchResult) {
      onSelectSearchResult({ type, ...item });
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const first =
        groupedResults.applications?.[0] ? { type: 'application', item: groupedResults.applications[0], company: groupedResults.applications[0].company } :
        groupedResults.savedJobs?.[0] ? { type: 'savedJob', item: groupedResults.savedJobs[0], company: groupedResults.savedJobs[0].company } :
        groupedResults.interviews?.[0] ? { type: 'interview', item: groupedResults.interviews[0], company: groupedResults.interviews[0].company } :
        groupedResults.jobs?.[0] ? { type: 'job', item: groupedResults.jobs[0], company: groupedResults.jobs[0].company } : null;

      if (first) {
        handleItemClick(first.type, first);
      }
    }
  };

  const renderSearchDropdown = () => {
    if (!clean) return null;

    const totalCount =
      (groupedResults.applications?.length || 0) +
      (groupedResults.savedJobs?.length || 0) +
      (groupedResults.interviews?.length || 0) +
      (groupedResults.jobs?.length || 0);

    return (
      <div className="navbar-search-dropdown" role="region" aria-label="Search results">
        {isSearching && totalCount === 0 ? (
          <div className="navbar-search-loading">
            <span className="navbar-search-spinner"></span>
            <span>Searching HireHub data...</span>
          </div>
        ) : totalCount === 0 ? (
          <div className="navbar-search-no-results">
            No matching results found.
          </div>
        ) : (
          <div className="navbar-search-results">
            {groupedResults.applications?.length > 0 && (
              <div className="search-result-group">
                <div className="search-group-header">
                  <span>Applications</span>
                  <span className="group-count">{groupedResults.applications.length}</span>
                </div>
                {groupedResults.applications.map((app) => (
                  <button
                    key={`app-${app.id || app.company + (app.role || '')}`}
                    type="button"
                    className="search-result-item"
                    onClick={() => handleItemClick('application', { item: app, company: app.company })}
                  >
                    <div className="result-logo">
                      <CompanyLogo company={app.company} domain={app.companyDomain || app.company_domain} logo={app.logo} size={22} />
                    </div>
                    <div className="result-info">
                      <div className="result-title">
                        <span className="result-company-name">{app.company}</span>
                        <span className="result-dash"> — </span>
                        <span className="result-role-title">{app.role || 'Application'}</span>
                      </div>
                      <div className="result-subtext">
                        {app.status ? <span>{app.status}</span> : null}
                        {app.location ? <span> · {app.location}</span> : null}
                      </div>
                    </div>
                    <span className="result-badge section-badge app-badge">Application</span>
                  </button>
                ))}
              </div>
            )}

            {groupedResults.savedJobs?.length > 0 && (
              <div className="search-result-group">
                <div className="search-group-header">
                  <span>Saved Jobs</span>
                  <span className="group-count">{groupedResults.savedJobs.length}</span>
                </div>
                {groupedResults.savedJobs.map((job) => (
                  <button
                    key={`saved-${job.id || job.company + (job.role || job.job_title || '')}`}
                    type="button"
                    className="search-result-item"
                    onClick={() => handleItemClick('savedJob', { item: job, company: job.company })}
                  >
                    <div className="result-logo">
                      <CompanyLogo company={job.company} domain={job.companyDomain || job.domain || job.company_domain} logo={job.logo} size={22} />
                    </div>
                    <div className="result-info">
                      <div className="result-title">
                        <span className="result-company-name">{job.company}</span>
                        <span className="result-dash"> — </span>
                        <span className="result-role-title">{job.role || job.job_title || 'Saved Position'}</span>
                      </div>
                      <div className="result-subtext">
                        {job.location ? <span>{job.location}</span> : null}
                        {job.salary ? <span> · {job.salary}</span> : null}
                      </div>
                    </div>
                    <span className="result-badge section-badge saved-badge">Saved Job</span>
                  </button>
                ))}
              </div>
            )}

            {groupedResults.interviews?.length > 0 && (
              <div className="search-result-group">
                <div className="search-group-header">
                  <span>Upcoming Interviews</span>
                  <span className="group-count">{groupedResults.interviews.length}</span>
                </div>
                {groupedResults.interviews.map((itw) => (
                  <button
                    key={`itw-${itw.id || itw.company + (itw.role || '')}`}
                    type="button"
                    className="search-result-item"
                    onClick={() => handleItemClick('interview', { item: itw, company: itw.company })}
                  >
                    <div className="result-logo">
                      <CompanyLogo company={itw.company} domain={itw.companyDomain || itw.domain || itw.company_domain} logo={itw.logo} size={22} />
                    </div>
                    <div className="result-info">
                      <div className="result-title">
                        <span className="result-company-name">{itw.company}</span>
                        <span className="result-dash"> — </span>
                        <span className="result-role-title">{itw.role || itw.round || 'Technical Interview'}</span>
                      </div>
                      <div className="result-subtext">
                        {itw.round && itw.role ? <span>{itw.round} · </span> : null}
                        {itw.date ? <span>{itw.date}</span> : null}
                        {itw.time ? <span> · {itw.time}</span> : null}
                      </div>
                    </div>
                    <span className="result-badge section-badge itw-badge">Interview</span>
                  </button>
                ))}
              </div>
            )}

            {groupedResults.jobs?.length > 0 && (
              <div className="search-result-group">
                <div className="search-group-header">
                  <span>Explore Opportunities</span>
                  <span className="group-count">{groupedResults.jobs.length}</span>
                </div>
                {groupedResults.jobs.map((job) => (
                  <button
                    key={`job-${job.id || job.company + (job.role || job.job_title || '')}`}
                    type="button"
                    className="search-result-item"
                    onClick={() => handleItemClick('job', { item: job, company: job.company })}
                  >
                    <div className="result-logo">
                      <CompanyLogo company={job.company} domain={job.companyDomain || job.domain || job.company_domain} logo={job.logo} size={22} />
                    </div>
                    <div className="result-info">
                      <div className="result-title">
                        <span className="result-company-name">{job.company}</span>
                        <span className="result-dash"> — </span>
                        <span className="result-role-title">{job.role || job.job_title || 'Opportunity'}</span>
                      </div>
                      <div className="result-subtext">
                        {job.location ? <span>{job.location}</span> : null}
                        {job.matchScore || job.match_score ? <span> · {job.matchScore || job.match_score}% match</span> : null}
                      </div>
                    </div>
                    <span className="result-badge section-badge explore-badge">Explore</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const navLinks = [
    { label: "Dashboard", href: "#dashboard", view: 'dashboard' },
    { label: "Explore Jobs", href: "#jobs", view: 'jobs' },
    { label: "Saved Jobs", href: "#saved-jobs", view: 'saved-jobs' },
    { label: "Applications", href: "#applications", view: 'dashboard' },
    { label: "Interviews", href: "#interviews", view: 'dashboard' },
    { label: "Reminders", href: "#reminders", view: 'dashboard' },
    { label: "Analytics", href: "#analytics", view: 'dashboard' }
  ];

  const displayName = user?.name || 'Debalina Roy';
  const displayEmail = user?.email || 'your@email.com';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((name) => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    if (activeView !== 'dashboard' && onNavigate) {
      onNavigate('dashboard');
    }
  };

  const handleNavLinkClick = (e, link) => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    if (link.view === 'jobs') {
      e.preventDefault();
      if (onNavigate) onNavigate('jobs');
    } else if (link.view === 'saved-jobs') {
      if (activeView !== 'dashboard') {
        e.preventDefault();
        if (onNavigate) onNavigate('dashboard');
        setTimeout(() => {
          const el = document.getElementById('saved-jobs');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else if (link.href === '#applications') {
      if (activeView !== 'dashboard') {
        e.preventDefault();
        if (onNavigate) onNavigate('dashboard');
        setTimeout(() => {
          const el = document.getElementById('applications');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      if (activeView !== 'dashboard' && onNavigate) {
        onNavigate('dashboard');
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogoutClick = () => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);

    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        <a
          href="#dashboard"
          className="brand-logo"
          onClick={handleLinkClick}
        >
          <div className="logo-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect
                x="2"
                y="7"
                width="20"
                height="14"
                rx="2"
                ry="2"
              ></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>

          <span className="brand-text">
            Hire<span>Hub</span>
          </span>
        </a>

        <nav className="desktop-nav">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`nav-link ${link.view === 'jobs' && activeView === 'jobs' ? 'active' : ''}`}
              onClick={(e) => handleNavLinkClick(e, link)}
            >
              <span>{link.label}</span>
              {link.label === "Saved Jobs" && savedJobsCount > 0 && (
                <span className="nav-badge-counter">{savedJobsCount}</span>
              )}
            </a>
          ))}
        </nav>

        <div className="navbar-actions">
          <div className="search-bar navbar-search-bar" ref={searchContainerRef}>
            <svg
              className="search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line
                x1="21"
                y1="21"
                x2="16.65"
                y2="16.65"
              ></line>
            </svg>

            <input
              type="text"
              placeholder="Search companies, roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setIsDropdownOpen(true);
              }}
              onKeyDown={handleInputKeyDown}
              className="search-input navbar-search-input"
              aria-label="Search companies and roles"
              aria-expanded={isDropdownOpen}
            />

            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => {
                  setSearchQuery('');
                  setIsDropdownOpen(false);
                }}
                title="Clear search"
                aria-label="Clear search"
              >
                &times;
              </button>
            )}

            {isDropdownOpen && renderSearchDropdown()}
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={onOpenAddModal}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>

            <span>Add Application</span>
          </button>

          {onLogout && (
            <div
              className="profile-menu-wrapper"
              ref={profileRef}
              onMouseLeave={() => {
                if (profileMenuOpen) {
                  setProfileMenuOpen(false);
                }
              }}
            >
              <button
                type="button"
                className={`profile-trigger ${
                  profileMenuOpen ? 'active' : ''
                }`}
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                aria-label="Open profile menu"
                aria-expanded={profileMenuOpen}
              >
                <div className="profile-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    initials
                  )}
                </div>

                <div className="profile-info">
                  <span className="profile-name">
                    {displayName}
                  </span>

                  <span className="profile-role">
                    Job Seeker
                  </span>
                </div>

                <svg
                  className={`profile-chevron ${
                    profileMenuOpen ? 'rotate' : ''
                  }`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {profileMenuOpen && (
                <div
                  className="profile-dropdown"
                  role="menu"
                  aria-label="User profile options"
                >
                  <div className="profile-dropdown-header">
                    <div className="profile-avatar profile-avatar-large">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        initials
                      )}
                    </div>

                    <div className="profile-dropdown-user">
                      <strong title={displayName}>{displayName}</strong>
                      <span title={displayEmail}>{displayEmail}</span>
                      <span className="profile-status-pill">
                        <span className="status-indicator-dot"></span>
                        Job Seeker
                      </span>
                    </div>
                  </div>

                  <div className="profile-dropdown-divider"></div>

                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      if (onNavigate) onNavigate('profile');
                    }}
                    role="menuitem"
                  >
                    <div className="dropdown-item-icon-wrap">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>

                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      if (onNavigate) onNavigate('settings');
                    }}
                    role="menuitem"
                  >
                    <div className="dropdown-item-icon-wrap">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-1.5 1.5-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-2.1v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06-1.5-1.5.06-.06A1.65 1.65 0 0 0 7.4 15a1.65 1.65 0 0 0-1.51-1H5.8v-2.1h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06 1.5-1.5.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V6.3h2.1v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 1.5 1.5-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1h.09V14h-.09A1.65 1.65 0 0 0 19.4 15z"></path>
                      </svg>
                    </div>

                    <span>Settings</span>
                  </button>

                  {onToggleTheme && (
                    <button
                      type="button"
                      className="profile-dropdown-item theme-toggle-item"
                      onClick={onToggleTheme}
                      role="menuitem"
                      aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                    >
                      <div className="dropdown-item-icon-wrap theme-icon-wrap">
                        {theme === 'dark' ? (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                          </svg>
                        ) : (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                          </svg>
                        )}
                      </div>

                      <div className="theme-toggle-content">
                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                        <span className="theme-badge">{theme === 'dark' ? '☀️' : '🌙'}</span>
                      </div>
                    </button>
                  )}

                  <div className="profile-dropdown-divider"></div>

                  <button
                    type="button"
                    className="profile-dropdown-item logout-item"
                    onClick={handleLogoutClick}
                    role="menuitem"
                  >
                    <div className="dropdown-item-icon-wrap logout-icon-wrap">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                    </div>

                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-nav-dropdown">
          <div className="search-bar mobile-search" ref={mobileSearchContainerRef}>
            <svg
              className="search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search companies, roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (clean) setIsDropdownOpen(true);
              }}
              onKeyDown={handleInputKeyDown}
              className="search-input mobile-search-input"
              aria-label="Search companies and roles"
              aria-expanded={isDropdownOpen}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => {
                  setSearchQuery('');
                  setIsDropdownOpen(false);
                }}
                title="Clear search"
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
            {isDropdownOpen && renderSearchDropdown()}
          </div>

          <div className="mobile-links">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`mobile-nav-link ${link.view === 'jobs' && activeView === 'jobs' ? 'active' : ''}`}
                onClick={(e) => handleNavLinkClick(e, link)}
              >
                <span>{link.label}</span>
                {link.label === "Saved Jobs" && savedJobsCount > 0 && (
                  <span className="nav-badge-counter">{savedJobsCount}</span>
                )}
              </a>
            ))}
          </div>

          <button
            type="button"
            className="btn-primary mobile-add-btn"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAddModal();
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>

            <span>Add Application</span>
          </button>

          <div className="mobile-profile-card">
            <div className="profile-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>

            <div className="mobile-profile-info">
              <strong>{displayName}</strong>
              <span>{displayEmail}</span>
            </div>
          </div>

          <button
            type="button"
            className="profile-dropdown-item mobile-nav-profile-btn"
            onClick={() => {
              setMobileMenuOpen(false);
              if (onNavigate) onNavigate('profile');
            }}
          >
            <div className="dropdown-item-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span>My Profile</span>
          </button>

          <button
            type="button"
            className="profile-dropdown-item mobile-nav-profile-btn"
            onClick={() => {
              setMobileMenuOpen(false);
              if (onNavigate) onNavigate('settings');
            }}
          >
            <div className="dropdown-item-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-1.5 1.5-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-2.1v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06-1.5-1.5.06-.06A1.65 1.65 0 0 0 7.4 15a1.65 1.65 0 0 0-1.51-1H5.8v-2.1h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06 1.5-1.5.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V6.3h2.1v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 1.5 1.5-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1h.09V14h-.09A1.65 1.65 0 0 0 19.4 15z"></path>
              </svg>
            </div>
            <span>Settings</span>
          </button>

          {onToggleTheme && (
            <button
              type="button"
              className="profile-dropdown-item theme-toggle-item mobile-theme-toggle"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <div className="dropdown-item-icon-wrap theme-icon-wrap">
                {theme === 'dark' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                )}
              </div>
              <div className="theme-toggle-content">
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                <span className="theme-badge">{theme === 'dark' ? '☀️' : '🌙'}</span>
              </div>
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              className="btn-logout mobile-logout-btn"
              onClick={handleLogoutClick}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>

              <span>Logout</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}