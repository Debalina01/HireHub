import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import StatCard from './components/StatCard';
import ApplicationCard from './components/ApplicationCard';
import InterviewCard from './components/InterviewCard';
import ReminderCard from './components/ReminderCard';
import Chatbot from './components/Chatbot';
import CompanyLogo from './components/CompanyLogo';
import CompanySearchInput from './components/CompanySearchInput';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import JobsPage from './components/JobsPage';
import JobDetailsModal from './components/JobDetailsModal';
import DatePicker from './components/DatePicker';
import TimezoneSelect from './components/TimezoneSelect';
import {
  getUserTimezone,
  getTimezoneAbbr,
  formatTime12h,
  formatDisplayDate,
  parseLegacyTimeRange,
  parseDateToIso,
  isEndTimeValid
} from './utils/timezoneHelper';
import Auth from './auth/Auth';
import {
  mockStats,
  mockApplications,
  mockInterviews,
  mockSavedJobs,
  mockReminders,
  mockActivityData,
  mockAnalytics
} from './data/mockData';
import {
  resolveCompanyLogo,
  resolveCompanySync,
  migrateRecordList
} from './utils/companyLogo';
import { getProfileForUser, saveProfileForUser } from './utils/profileStorage';
import {
  ALL_AVAILABLE_JOBS,
  getSavedJobsForUser,
  saveJobsForUser,
  isJobSaved,
  addJobToSaved,
  removeJobFromSaved
} from './utils/savedJobsStorage';
import {
  fetchSavedJobs,
  saveJobToBackend,
  unsaveJobFromBackend,
  applyForJobBackend,
  searchAvailableCompaniesApi
} from './utils/jobsApi';
import {
  fetchDashboardKpis,
  fetchWeeklyActivity,
  fetchDashboardAnalytics,
  fetchDashboardStatusBreakdown,
  syncUserDataToBackend,
  calculateLocalKpis,
  calculateLocalWeeklyActivity,
  calculateLocalAnalytics,
  calculateLocalStatusBreakdown,
  normalizeDateToIso
} from './utils/kpiApi';
import {
  getUserApplications,
  saveUserApplications,
  getUserInterviews,
  saveUserInterviews,
  getUserReminders,
  saveUserReminders
} from './utils/userDataStorage';
import { saveOrUpdateAccount } from './utils/userAccounts';
import { useNotification } from './context/NotificationContext';
import './App.css';

function getValidStoredAuthUser() {
  try {
    const raw = sessionStorage.getItem('hirehubAuth') || localStorage.getItem('hirehubAuth');
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (user && typeof user === 'object' && user.email && typeof user.email === 'string') {
      return user;
    }
  } catch (err) {
    console.error('Error reading auth state:', err);
  }
  try {
    localStorage.removeItem('hirehubAuth');
    sessionStorage.removeItem('hirehubAuth');
  } catch {}
  return null;
}

export default function App() {
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();

  const [currentUser, setCurrentUser] = useState(() => getValidStoredAuthUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const initialUser = getValidStoredAuthUser();
    return !!(initialUser && initialUser.email);
  });
  const loadedEmailRef = useRef(currentUser?.email || null);

 
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/profile')) return 'profile';
      if (path.includes('/settings')) return 'settings';
      if (path.includes('/jobs')) return 'jobs';
      if (path.includes('/applications')) return 'applications';
      if (window.location.hash === '#profile') return 'profile';
      if (window.location.hash === '#settings') return 'settings';
      if (window.location.hash === '#jobs') return 'jobs';
      if (window.location.hash === '#applications') return 'applications';
    }
    return 'dashboard';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  
  const [savedJobs, setSavedJobs] = useState(() => {
    return getSavedJobsForUser(currentUser);
  });
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);

  const handleUnsaveJob = async (job) => {
    const updated = removeJobFromSaved(currentUser, savedJobs, job);
    setSavedJobs(updated);
    if (job?.id && currentUser?.email) {
      try {
        await unsaveJobFromBackend(currentUser.email, job.id);
      } catch (err) {
        console.warn('Backend unsave error:', err);
      }
    }
    showSuccess('Job removed from saved jobs.');
  };

  const handleSaveJob = async (job) => {
    const updated = addJobToSaved(currentUser, savedJobs, job);
    setSavedJobs(updated);
    if (job?.id && currentUser?.email) {
      try {
        await saveJobToBackend(currentUser.email, job.id);
      } catch (err) {
        console.warn('Backend save error:', err);
      }
    }
    showSuccess('Job added to saved jobs.');
  };

  const handleToggleSaveJob = (job) => {
    if (isJobSaved(savedJobs, job)) {
      handleUnsaveJob(job);
    } else {
      handleSaveJob(job);
    }
  };

  const handleOpenJobDetails = (job) => {
    setSelectedJobForDetails(job);
  };

  const handleCloseJobDetails = () => {
    setSelectedJobForDetails(null);
  };

  const handleNavigateToJobs = () => {
    handleNavigate('jobs');
  };

  
  const [userProfile, setUserProfile] = useState(() => {
    return getProfileForUser(currentUser);
  });

  const handleUpdateProfile = (updatedProfile) => {
    setUserProfile(updatedProfile);
    if (currentUser?.email) {
      saveProfileForUser(currentUser.email, updatedProfile);
    }
    if (currentUser?.email && (updatedProfile.name !== currentUser?.name || updatedProfile.avatar !== currentUser?.avatar)) {
      const updatedUser = {
        ...currentUser,
        name: updatedProfile.name || currentUser?.name,
        avatar: updatedProfile.avatar !== undefined ? updatedProfile.avatar : currentUser?.avatar
      };
      setCurrentUser(updatedUser);
      saveOrUpdateAccount({
        email: currentUser.email,
        name: updatedProfile.name || currentUser?.name,
        avatar: updatedProfile.avatar !== undefined ? updatedProfile.avatar : currentUser?.avatar
      });
      try {
        if (sessionStorage.getItem('hirehubAuth')) {
          sessionStorage.setItem('hirehubAuth', JSON.stringify(updatedUser));
        } else if (localStorage.getItem('hirehubAuth')) {
          localStorage.setItem('hirehubAuth', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error('Error syncing auth user:', err);
      }
    }
  };

  const handleUpdateUser = (updates) => {
    if (!currentUser?.email) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    try {
      if (sessionStorage.getItem('hirehubAuth')) {
        sessionStorage.setItem('hirehubAuth', JSON.stringify(updatedUser));
      } else if (localStorage.getItem('hirehubAuth')) {
        localStorage.setItem('hirehubAuth', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Error syncing user:', err);
    }
  };

  const handleSetTheme = (newTheme) => {
    if (newTheme === 'system') {
      const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isSystemDark ? 'dark' : 'light');
    } else {
      setTheme(newTheme);
    }
  };

  
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/profile')) {
        setActiveView('profile');
      } else if (path.includes('/settings')) {
        setActiveView('settings');
      } else if (path.includes('/jobs')) {
        setActiveView('jobs');
      } else if (path.includes('/applications')) {
        setActiveView('applications');
      } else {
        setActiveView('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (view) => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      if (view === 'profile') {
        window.history.pushState(null, '', '/profile');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (view === 'settings') {
        window.history.pushState(null, '', '/settings');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (view === 'jobs') {
        window.history.pushState(null, '', '/jobs');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (view === 'applications') {
        window.history.pushState(null, '', '/applications');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.history.pushState(null, '', '/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleLoginSuccess = (user, remember) => {
    if (!user || !user.email) return;
    loadedEmailRef.current = user.email;
    setCurrentUser(user);
    setIsAuthenticated(true);
    const profileForUser = getProfileForUser(user);
    setUserProfile(profileForUser);
    setApplications(getUserApplications(user.email));
    setInterviews(getUserInterviews(user.email));
    setReminders(getUserReminders(user.email));
    setSavedJobs(getSavedJobsForUser(user));
    fetchSavedJobs(user.email).then((backendJobs) => {
      if (Array.isArray(backendJobs) && backendJobs.length >= 0) {
        setSavedJobs(backendJobs);
      }
    }).catch(() => {});
    try {
      if (remember) {
        localStorage.setItem('hirehubAuth', JSON.stringify(user));
        sessionStorage.removeItem('hirehubAuth');
      } else {
        sessionStorage.setItem('hirehubAuth', JSON.stringify(user));
        localStorage.removeItem('hirehubAuth');
      }
    } catch (err) {
      console.error("Storage error:", err);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('hirehubAuth');
      sessionStorage.removeItem('hirehubAuth');
    } catch (err) {
      console.error("Storage error:", err);
    }
    loadedEmailRef.current = null;
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveView('dashboard');
    setUserProfile(getProfileForUser(null));
    setApplications([]);
    setInterviews([]);
    setReminders([]);
    setSavedJobs([]);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
    }
  };

  
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('hirehubTheme') || localStorage.getItem('theme');
      return saved || 'dark';
    } catch {
      return 'dark';
    }
  });

  
  useEffect(() => {
    try {
      localStorage.setItem('hirehubTheme', theme);
      localStorage.setItem('theme', theme);
    } catch (err) {
      console.error('Storage error:', err);
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  
  useEffect(() => {
    if (currentUser?.email) {
      loadedEmailRef.current = currentUser.email;
      setUserProfile(getProfileForUser(currentUser));
      setApplications(getUserApplications(currentUser.email));
      setInterviews(getUserInterviews(currentUser.email));
      setReminders(getUserReminders(currentUser.email));
      setSavedJobs(getSavedJobsForUser(currentUser));

      let isMounted = true;
      fetchSavedJobs(currentUser.email).then((backendJobs) => {
        if (isMounted && Array.isArray(backendJobs) && backendJobs.length >= 0) {
          setSavedJobs(backendJobs);
        }
      }).catch(() => {
        if (isMounted) setSavedJobs(getSavedJobsForUser(currentUser));
      });
      return () => { isMounted = false; };
    } else {
      loadedEmailRef.current = null;
      setUserProfile(getProfileForUser(null));
      setApplications([]);
      setInterviews([]);
      setReminders([]);
      setSavedJobs([]);
    }
  }, [currentUser?.email]);

  
  const [applications, setApplications] = useState(() => {
    return getUserApplications(currentUser?.email);
  });

  useEffect(() => {
    let isMounted = true;
    migrateRecordList(applications).then((migrated) => {
      if (isMounted) {
        const hasChanges = migrated.some((m, idx) => {
          const curr = applications[idx];
          return !curr || curr.companyDomain !== m.companyDomain || curr.logo !== m.logo;
        });
        if (hasChanges) {
          setApplications(migrated);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (currentUser?.email && loadedEmailRef.current === currentUser.email) {
      saveUserApplications(currentUser.email, applications);
    }
  }, [applications, currentUser?.email]);

  
  const [interviews, setInterviews] = useState(() => {
    return getUserInterviews(currentUser?.email);
  });

  useEffect(() => {
    let isMounted = true;
    migrateRecordList(interviews).then((migrated) => {
      if (isMounted) {
        const hasChanges = migrated.some((m, idx) => {
          const curr = interviews[idx];
          return !curr || curr.companyDomain !== m.companyDomain || curr.logo !== m.logo;
        });
        if (hasChanges) {
          setInterviews(migrated);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (currentUser?.email && loadedEmailRef.current === currentUser.email) {
      saveUserInterviews(currentUser.email, interviews);
    }
  }, [interviews, currentUser?.email]);

  
  const [reminders, setReminders] = useState(() => {
    return getUserReminders(currentUser?.email);
  });

  useEffect(() => {
    if (currentUser?.email && loadedEmailRef.current === currentUser.email) {
      saveUserReminders(currentUser.email, reminders);
    }
  }, [reminders, currentUser?.email]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

 
  const [kpis, setKpis] = useState(() => calculateLocalKpis(applications, interviews));
  const [isKpiLoading, setIsKpiLoading] = useState(false);
  const [kpiError, setKpiError] = useState(null);

  
  const [weeklyActivity, setWeeklyActivity] = useState(() => calculateLocalWeeklyActivity(applications, interviews));
  const [isWeeklyActivityLoading, setIsWeeklyActivityLoading] = useState(false);
  const [weeklyActivityError, setWeeklyActivityError] = useState(null);
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

 
  const [analytics, setAnalytics] = useState(() => calculateLocalAnalytics(applications, interviews));
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [selectedResponseBreakdownModal, setSelectedResponseBreakdownModal] = useState(null);
  const [sourceFilter, setSourceFilter] = useState(null);
  const [analyticsFilterType, setAnalyticsFilterType] = useState(null);
  const [analyticsCompanySearch, setAnalyticsCompanySearch] = useState('');

  const filteredAnalyticsApps = useMemo(() => {
    const q = (analyticsCompanySearch || '').trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(app => (app.company || '').toLowerCase().includes(q));
  }, [applications, analyticsCompanySearch]);

  const filteredAnalyticsItws = useMemo(() => {
    const q = (analyticsCompanySearch || '').trim().toLowerCase();
    if (!q) return interviews;
    return interviews.filter(itw => (itw.company || '').toLowerCase().includes(q));
  }, [interviews, analyticsCompanySearch]);

  const displayAnalytics = useMemo(() => {
    const q = (analyticsCompanySearch || '').trim();
    if (q) {
      return calculateLocalAnalytics(filteredAnalyticsApps, filteredAnalyticsItws);
    }
    return analytics || calculateLocalAnalytics(applications, interviews);
  }, [analytics, filteredAnalyticsApps, filteredAnalyticsItws, analyticsCompanySearch, applications, interviews]);

  const [isAnalyticsSearchOpen, setIsAnalyticsSearchOpen] = useState(false);
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');
  const [analyticsCompanySuggestions, setAnalyticsCompanySuggestions] = useState([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const analyticsSearchContainerRef = useRef(null);
  const analyticsSearchInputRef = useRef(null);

  useEffect(() => {
    const raw = (analyticsSearchQuery || '').trim().replace(/\s+/g, ' ');
    if (!raw) {
      setAnalyticsCompanySuggestions([]);
      setIsSearchingCompanies(false);
      return;
    }

    const clean = raw.toLowerCase();
    setIsSearchingCompanies(true);

    let isCurrent = true;
    const timer = setTimeout(async () => {
      const localMap = new Map();

      const addLocal = (cName, cDomain, cLogo) => {
        const name = (cName || '').trim();
        if (!name) return;
        const key = name.toLowerCase();
        if (!localMap.has(key) && key.includes(clean)) {
          localMap.set(key, {
            name,
            companyName: name,
            domain: cDomain || '',
            companyDomain: cDomain || '',
            logo: cLogo || ''
          });
        }
      };

      (applications || []).forEach((a) => addLocal(a.company, a.company_domain || a.domain, a.logo));
      (interviews || []).forEach((i) => addLocal(i.company, i.company_domain || i.domain, i.logo));
      (savedJobs || []).forEach((j) => addLocal(j.company, j.company_domain || j.domain, j.logo));
      (ALL_AVAILABLE_JOBS || []).forEach((j) => addLocal(j.company, j.domain, j.logo));

      try {
        const backendCompanies = await searchAvailableCompaniesApi(clean);
        if (Array.isArray(backendCompanies)) {
          backendCompanies.forEach((bc) => {
            const name = (bc.companyName || bc.name || '').trim();
            if (name) {
              const key = name.toLowerCase();
              if (!localMap.has(key)) {
                localMap.set(key, {
                  name,
                  companyName: name,
                  domain: bc.companyDomain || bc.domain || '',
                  companyDomain: bc.companyDomain || bc.domain || '',
                  logo: bc.logo || ''
                });
              }
            }
          });
        }
      } catch (err) {
      }

      if (isCurrent) {
        const list = Array.from(localMap.values());
        list.sort((a, b) => {
          const aStarts = a.name.toLowerCase().startsWith(clean);
          const bStarts = b.name.toLowerCase().startsWith(clean);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.name.localeCompare(b.name);
        });
        setAnalyticsCompanySuggestions(list);
        setIsSearchingCompanies(false);
      }
    }, 150);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [analyticsSearchQuery, applications, interviews, savedJobs]);

  useEffect(() => {
    if (!isAnalyticsSearchOpen) return;

    const handleClickOutside = (e) => {
      if (analyticsSearchContainerRef.current && !analyticsSearchContainerRef.current.contains(e.target)) {
        setIsAnalyticsSearchOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsAnalyticsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnalyticsSearchOpen]);

  useEffect(() => {
    if (isAnalyticsSearchOpen) {
      const timer = setTimeout(() => {
        analyticsSearchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isAnalyticsSearchOpen]);

  const handleSelectAnalyticsCompany = (companyName) => {
    setAnalyticsCompanySearch(companyName);
    setIsAnalyticsSearchOpen(false);
    setAnalyticsSearchQuery('');
    setAnalyticsCompanySuggestions([]);
  };

  const handleClearAnalyticsCompany = () => {
    setAnalyticsCompanySearch('');
    setAnalyticsSearchQuery('');
    setAnalyticsCompanySuggestions([]);
  };

  const [statusBreakdown, setStatusBreakdown] = useState(() => calculateLocalStatusBreakdown(applications));
  const [isStatusBreakdownLoading, setIsStatusBreakdownLoading] = useState(false);
  const [statusBreakdownError, setStatusBreakdownError] = useState(null);
  const [highlightedStatus, setHighlightedStatus] = useState(null);

  const loadDashboardData = async (silent = false) => {
    if (!silent) {
      setIsKpiLoading(true);
      setIsWeeklyActivityLoading(true);
      setIsAnalyticsLoading(true);
      setIsStatusBreakdownLoading(true);
    }
    const userEmail = currentUser?.email;
    if (!userEmail) {
      setKpis(calculateLocalKpis(applications, interviews));
      setWeeklyActivity(calculateLocalWeeklyActivity(applications, interviews));
      setAnalytics(calculateLocalAnalytics(applications, interviews));
      setStatusBreakdown(calculateLocalStatusBreakdown(applications));
      if (!silent) {
        setIsKpiLoading(false);
        setIsWeeklyActivityLoading(false);
        setIsAnalyticsLoading(false);
        setIsStatusBreakdownLoading(false);
      }
      return;
    }

    let syncRes = null;
    try {
      syncRes = await syncUserDataToBackend(userEmail, applications, interviews, reminders, userProfile).catch(() => null);
    } catch {
      // ignore sync error
    }

    try {
      const kpiData = syncRes?.kpis || await fetchDashboardKpis(userEmail);
      setKpis(kpiData);
      setKpiError(null);
    } catch (err) {
      setKpis(calculateLocalKpis(applications, interviews));
      setKpiError(err.message);
    } finally {
      if (!silent) setIsKpiLoading(false);
    }

    try {
      const actData = syncRes?.weeklyActivity || await fetchWeeklyActivity(userEmail);
      setWeeklyActivity(actData);
      setWeeklyActivityError(null);
    } catch (err) {
      setWeeklyActivity(calculateLocalWeeklyActivity(applications, interviews));
      setWeeklyActivityError(err.message);
    } finally {
      if (!silent) setIsWeeklyActivityLoading(false);
    }

    try {
      const analyticsData = syncRes?.analytics || await fetchDashboardAnalytics(userEmail);
      setAnalytics(analyticsData);
      setAnalyticsError(null);
    } catch (err) {
      setAnalytics(calculateLocalAnalytics(applications, interviews));
      setAnalyticsError(err.message);
    } finally {
      if (!silent) setIsAnalyticsLoading(false);
    }

    try {
      const breakdownData = syncRes?.statusBreakdown || await fetchDashboardStatusBreakdown(userEmail);
      setStatusBreakdown(breakdownData);
      setStatusBreakdownError(null);
    } catch (err) {
      setStatusBreakdown(calculateLocalStatusBreakdown(applications));
      setStatusBreakdownError(err.message);
    } finally {
      if (!silent) setIsStatusBreakdownLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser?.email]);

  useEffect(() => {
    loadDashboardData(true);
  }, [applications, interviews, reminders, userProfile]);

  const handleDayClick = (dayItem) => {
    const targetIso = dayItem.date;
    let appsList = dayItem.applicationsList || [];
    let intvsList = dayItem.interviewsList || [];

    if (appsList.length === 0 && dayItem.applications > 0) {
      appsList = applications.filter((a) => normalizeDateToIso(a.appliedDate) === targetIso);
    }
    if (intvsList.length === 0 && dayItem.interviews > 0) {
      intvsList = interviews.filter((i) => {
        const st = (i.status || 'scheduled').toLowerCase();
        return (st === 'completed' || st === 'conducted') && normalizeDateToIso(i.date) === targetIso;
      });
    }

    setSelectedDayDetail({
      ...dayItem,
      applicationsList: appsList,
      interviewsList: intvsList
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedDayDetail) {
        setSelectedDayDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDayDetail]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedResponseBreakdownModal) {
        setSelectedResponseBreakdownModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedResponseBreakdownModal]);

  const handleKpiCardClick = (type) => {
    if (activeView !== 'dashboard') {
      handleNavigate('dashboard');
    }

    setTimeout(() => {
      if (type === 'total') {
        setStatusFilter('All');
        setSourceFilter(null);
        setAnalyticsFilterType(null);
        setSearchQuery('');
        const section = document.getElementById('applications');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      } else if (type === 'active') {
        setStatusFilter('Active');
        setSourceFilter(null);
        setAnalyticsFilterType(null);
        const section = document.getElementById('applications');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      } else if (type === 'interviews') {
        const section = document.getElementById('interviews');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
          section.classList.add('section-highlight');
          setTimeout(() => section.classList.remove('section-highlight'), 1600);
        }
      } else if (type === 'offers') {
        setStatusFilter('Offer');
        setSourceFilter(null);
        setAnalyticsFilterType(null);
        const section = document.getElementById('applications');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      }
    }, activeView !== 'dashboard' ? 120 : 0);
  };

  const handleAnalyticsMetricClick = (type) => {
    if (activeView !== 'dashboard') {
      handleNavigate('dashboard');
    }

    setTimeout(() => {
      if (type === 'responseRate') {
        setSourceFilter(null);
        setAnalyticsFilterType('responded');
        setStatusFilter('All');
        const section = document.getElementById('applications');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      } else if (type === 'interviewConversion') {
        setSourceFilter(null);
        setAnalyticsFilterType('interview');
        setStatusFilter('All');
        const section = document.getElementById('applications');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      } else if (type === 'offerRate') {
        setSourceFilter(null);
        setAnalyticsFilterType('offer');
        setStatusFilter('Offer');
        const section = document.getElementById('applications');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      } else if (type === 'avgResponseDays') {
        setSelectedResponseBreakdownModal(displayAnalytics?.responseBreakdown || []);
      }
    }, activeView !== 'dashboard' ? 120 : 0);
  };

  const handleChannelFilterClick = (channelName) => {
    if (activeView !== 'dashboard') {
      handleNavigate('dashboard');
    }
    setTimeout(() => {
      setAnalyticsFilterType(null);
      setSourceFilter(channelName);
      setStatusFilter('All');
      const section = document.getElementById('applications');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    }, activeView !== 'dashboard' ? 120 : 0);
  };

  const handleClearAnalyticsFilter = () => {
    setSourceFilter(null);
    setAnalyticsFilterType(null);
  };

  useEffect(() => {
    if (!highlightedStatus) return;

    const handleOutsideClick = (e) => {
      if (e.target && e.target.closest && e.target.closest('#overview .status-bar-row.clickable')) {
        return;
      }
      setHighlightedStatus(null);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setHighlightedStatus(null);
      }
    };

    document.addEventListener('click', handleOutsideClick, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleOutsideClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [highlightedStatus]);

  const handleStatusBreakdownClick = (e, stage) => {
    if (activeView !== 'dashboard') {
      handleNavigate('dashboard');
    }

    setHighlightedStatus((prev) => (prev?.toLowerCase() === stage.toLowerCase() ? null : stage));

    if (statusFilter.toLowerCase() === stage.toLowerCase() && !sourceFilter && !analyticsFilterType) {
      setStatusFilter('All');
    } else {
      setStatusFilter(stage);
      setSourceFilter(null);
      setAnalyticsFilterType(null);
    }

    setTimeout(() => {
      const section = document.getElementById('applications');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }, activeView !== 'dashboard' ? 120 : 0);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);

  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [timeValidationError, setTimeValidationError] = useState('');
  const [interviewFormData, setInterviewFormData] = useState({
    company: '',
    role: '',
    interviewDate: '2026-09-30',
    startTime: '14:00',
    endTime: '15:00',
    timeZone: 'America/New_York',
    date: 'Sep 30, 2026',
    time: '2:00 PM - 3:00 PM EDT',
    round: '',
    platform: 'Google Meet',
    interviewer: '',
    link: '',
    prepTip: '',
    status: 'scheduled'
  });
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    location: '',
    workMode: 'Remote',
    status: 'Applied',
    salary: '',
    stage: '',
    notes: '',
    source: 'LinkedIn Jobs',
    responseDate: ''
  });

  const [appCompanyPreview, setAppCompanyPreview] = useState(null);
  const [interviewCompanyPreview, setInterviewCompanyPreview] = useState(null);

  useEffect(() => {
    const query = formData.company?.trim();
    if (!query || query.length < 2) {
      setAppCompanyPreview(null);
      return;
    }
    if (formData.companyDomain) {
      setAppCompanyPreview({
        companyName: formData.company,
        companyDomain: formData.companyDomain,
        logo: formData.logo
      });
      return;
    }
    const cached = resolveCompanySync(query);
    if (cached && cached.companyDomain) {
      setAppCompanyPreview(cached);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const resolved = await resolveCompanyLogo(query);
        if (resolved && resolved.companyDomain) {
          setAppCompanyPreview(resolved);
        }
      } catch (err) {
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [formData.company, formData.companyDomain, formData.logo]);

  useEffect(() => {
    const query = interviewFormData.company?.trim();
    if (!query || query.length < 2) {
      setInterviewCompanyPreview(null);
      return;
    }
    if (interviewFormData.companyDomain) {
      setInterviewCompanyPreview({
        companyName: interviewFormData.company,
        companyDomain: interviewFormData.companyDomain,
        logo: interviewFormData.logo
      });
      return;
    }
    const cached = resolveCompanySync(query);
    if (cached && cached.companyDomain) {
      setInterviewCompanyPreview(cached);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const resolved = await resolveCompanyLogo(query);
        if (resolved && resolved.companyDomain) {
          setInterviewCompanyPreview(resolved);
        }
      } catch (err) {
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [interviewFormData.company, interviewFormData.companyDomain, interviewFormData.logo]);

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderFormData, setReminderFormData] = useState({
    text: '',
    dueDate: '',
    priority: 'Medium'
  });
  const [reminderPriorityFilter, setReminderPriorityFilter] = useState('All');
  const [reminderSearch, setReminderSearch] = useState('');

  const filterOptions = ['All', 'Active', 'Applied', 'Screening', 'Interviewing', 'Offer', 'Rejected'];

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active'
        ? !['rejected', 'offer'].includes((app.status || '').toLowerCase())
        : (app.status || '').toLowerCase() === statusFilter.toLowerCase());

    let matchesSource = true;
    if (sourceFilter) {
      matchesSource = (app.source || 'Other').toLowerCase() === sourceFilter.toLowerCase();
    }

    let matchesAnalytics = true;
    if (analyticsFilterType === 'responded') {
      matchesAnalytics = Boolean(app.responseDate) || ['screening', 'interviewing', 'offer', 'rejected'].includes((app.status || '').toLowerCase());
    } else if (analyticsFilterType === 'interview') {
      matchesAnalytics = (app.status || '').toLowerCase() === 'interviewing' ||
        interviews.some((i) => (i.company || '').trim().toLowerCase() === (app.company || '').trim().toLowerCase());
    } else if (analyticsFilterType === 'offer') {
      matchesAnalytics = (app.status || '').toLowerCase() === 'offer';
    }

    return matchesSearch && matchesStatus && matchesSource && matchesAnalytics;
  });

  const handleOpenAddModal = () => {
    setEditingApplication(null);
    setFormData({
      company: '',
      role: '',
      location: '',
      workMode: 'Remote',
      status: 'Applied',
      salary: '',
      stage: 'Initial Application',
      notes: '',
      source: 'LinkedIn Jobs',
      responseDate: ''
    });
    setAppCompanyPreview(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (app) => {
    setEditingApplication(app);
    setFormData({
      company: app.company,
      companyDomain: app.companyDomain || '',
      logo: app.logo || '',
      role: app.role,
      location: app.location,
      workMode: app.workMode,
      status: app.status,
      salary: app.salary || '',
      stage: app.stage || '',
      notes: app.notes || '',
      source: app.source || 'LinkedIn Jobs',
      responseDate: app.responseDate || ''
    });
    setAppCompanyPreview(app.companyDomain ? { companyName: app.company, companyDomain: app.companyDomain, logo: app.logo } : null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingApplication(null);
    setAppCompanyPreview(null);
  };

  const handleSaveApplication = async (e) => {
    e.preventDefault();
    if (!formData.company?.trim() || !formData.role?.trim()) return;

    const isCompanyUnchanged = editingApplication &&
      editingApplication.company?.trim().toLowerCase() === formData.company?.trim().toLowerCase();

    let companyName = formData.company;
    let companyDomain = formData.companyDomain || (isCompanyUnchanged ? editingApplication.companyDomain : '');
    let logo = formData.logo || (isCompanyUnchanged ? editingApplication.logo : '');

    if ((!companyDomain || !logo) && !isCompanyUnchanged) {
      const resolved = await resolveCompanyLogo(formData.company);
      companyName = resolved.companyName || companyName;
      companyDomain = resolved.companyDomain || '';
      logo = resolved.logo || '';
    }

    if (editingApplication) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === editingApplication.id
            ? {
                ...app,
                ...formData,
                company: companyName || formData.company,
                companyDomain: companyDomain || app.companyDomain || '',
                logo: logo || (isCompanyUnchanged ? app.logo : '')
              }
            : app
        )
      );
    } else {
      const newApp = {
        id: Date.now(),
        ...formData,
        company: companyName || formData.company,
        companyDomain: companyDomain || '',
        logo: logo || '',
        appliedDate: new Date().toISOString().split('T')[0]
      };
      setApplications((prev) => [newApp, ...prev]);
    }
    showSuccess(editingApplication ? 'Application updated successfully!' : 'Application added successfully!');
    handleCloseModal();
  };

  const handleDeleteApplication = (id) => {
    const app = applications.find((a) => a.id === id);
    showConfirm({
      title: 'Delete Application',
      message: `Are you sure you want to delete your application for ${app?.role || 'this role'} at ${app?.company || 'this company'}? This action cannot be undone.`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        setApplications((prev) => prev.filter((a) => a.id !== id));
        showSuccess('Application deleted successfully');
      }
    });
  };

  const handleOpenAddInterviewModal = () => {
    setEditingInterview(null);
    setTimeValidationError('');
    const userTz = getUserTimezone();
    const defaultDate = '2026-09-30';
    setInterviewFormData({
      company: '',
      role: '',
      interviewDate: defaultDate,
      startTime: '14:00',
      endTime: '15:00',
      timeZone: 'America/New_York',
      date: formatDisplayDate(defaultDate),
      time: `2:00 PM - 3:00 PM ${getTimezoneAbbr(defaultDate, 'America/New_York')}`,
      round: '',
      platform: 'Google Meet',
      interviewer: '',
      link: '',
      prepTip: '',
      status: 'scheduled'
    });
    setInterviewCompanyPreview(null);
    setIsInterviewModalOpen(true);
  };

  const handleOpenEditInterviewModal = (interview) => {
    setEditingInterview(interview);
    setTimeValidationError('');
    const existingLink = interview.link || interview.meetingLink || interview.meetingUrl || interview.url || '';

    let interviewDate = interview.interviewDate || '';
    let startTime = interview.startTime || '14:00';
    let endTime = interview.endTime || '15:00';
    let timeZone = interview.timeZone || interview.timezone || 'America/New_York';

    if (!interviewDate && interview.date) {
      interviewDate = parseDateToIso(interview.date) || '2026-09-30';
    }
    if (!interview.startTime && interview.time) {
      const parsed = parseLegacyTimeRange(interview.time);
      if (parsed) {
        startTime = parsed.startTime || startTime;
        endTime = parsed.endTime || endTime;
        if (parsed.timeZone) {
          timeZone = parsed.timeZone;
        }
      }
    }

    const tzAbbr = getTimezoneAbbr(interviewDate, timeZone);
    const displayTime = `${formatTime12h(startTime)} - ${formatTime12h(endTime)} ${tzAbbr}`;

    setInterviewFormData({
      company: interview.company || '',
      companyDomain: interview.companyDomain || '',
      logo: interview.logo || '',
      role: interview.role || '',
      interviewDate: interviewDate || '2026-09-30',
      startTime: startTime || '14:00',
      endTime: endTime || '15:00',
      timeZone: timeZone || 'America/New_York',
      date: interview.date || (interviewDate ? formatDisplayDate(interviewDate) : ''),
      time: interview.time || displayTime,
      round: interview.round || '',
      platform: interview.platform || 'Google Meet',
      interviewer: interview.interviewer || '',
      link: existingLink,
      prepTip: interview.prepTip || '',
      status: interview.status || 'scheduled'
    });
    setInterviewCompanyPreview(interview.companyDomain ? { companyName: interview.company, companyDomain: interview.companyDomain, logo: interview.logo } : null);
    setIsInterviewModalOpen(true);
  };

  const handleCloseInterviewModal = () => {
    setIsInterviewModalOpen(false);
    setEditingInterview(null);
    setTimeValidationError('');
    setInterviewCompanyPreview(null);
  };

  const handleSaveInterview = async (e) => {
    e.preventDefault();
    if (!interviewFormData.company.trim() || !interviewFormData.role.trim()) return;

    const { startTime, endTime, interviewDate, timeZone } = interviewFormData;
    if (startTime && endTime) {
      if (!isEndTimeValid(startTime, endTime)) {
        setTimeValidationError('End time must be after the start time.');
        return;
      }
    }
    setTimeValidationError('');

    const tzAbbr = getTimezoneAbbr(interviewDate, timeZone);
    const formattedDate = formatDisplayDate(interviewDate);
    const formattedTime = `${formatTime12h(startTime)} - ${formatTime12h(endTime)} ${tzAbbr}`;

    const isCompanyUnchanged = editingInterview &&
      editingInterview.company?.trim().toLowerCase() === interviewFormData.company?.trim().toLowerCase();

    let companyName = interviewFormData.company;
    let companyDomain = interviewFormData.companyDomain || (isCompanyUnchanged ? editingInterview.companyDomain : '');
    let logo = interviewFormData.logo || (isCompanyUnchanged ? editingInterview.logo : '');

    if ((!companyDomain || !logo) && !isCompanyUnchanged) {
      const resolved = await resolveCompanyLogo(interviewFormData.company);
      companyName = resolved.companyName || companyName;
      companyDomain = resolved.companyDomain || '';
      logo = resolved.logo || '';
    }
    const meetingUrl = interviewFormData.link.trim();

    const preparedInterview = {
      ...interviewFormData,
      interviewDate,
      startTime,
      endTime,
      timeZone,
      date: formattedDate || interviewFormData.date,
      time: formattedTime,
      company: companyName || interviewFormData.company,
      companyDomain: companyDomain || '',
      link: meetingUrl,
      meetingLink: meetingUrl,
      logo: logo || ''
    };

    if (editingInterview) {
      setInterviews((prev) =>
        prev.map((item) =>
          item.id === editingInterview.id
            ? {
                ...item,
                ...preparedInterview,
                logo: logo || (isCompanyUnchanged ? item.logo : '')
              }
            : item
        )
      );
    } else {
      const newInterview = {
        id: Date.now(),
        ...preparedInterview
      };
      setInterviews((prev) => [newInterview, ...prev]);
    }

    showSuccess(editingInterview ? 'Interview updated successfully!' : 'Interview scheduled successfully!');
    handleCloseInterviewModal();
  };

  const handleDeleteInterview = (interview) => {
    showConfirm({
      title: 'Delete Interview',
      message: `Are you sure you want to delete the scheduled interview for ${interview.role} at ${interview.company}? This action cannot be undone.`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        setInterviews((prev) => prev.filter((item) => item.id !== interview.id));
        showSuccess('Interview deleted successfully');
      }
    });
  };

  const handleToggleReminder = (id) => {
    setReminders((prev) =>
      prev.map((rem) =>
        rem.id === id ? { ...rem, completed: !rem.completed } : rem
      )
    );
  };

  const handleDeleteReminder = (id) => {
    const rem = reminders.find((r) => r.id === id);
    showConfirm({
      title: 'Delete Action Item',
      message: `Are you sure you want to delete "${rem?.text || 'this action item'}"?`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        setReminders((prev) => prev.filter((r) => r.id !== id));
        showSuccess('Action item deleted');
      }
    });
  };

  const handleOpenAddReminderModal = () => {
    setReminderFormData({
      text: '',
      dueDate: '',
      priority: 'Medium'
    });
    setIsReminderModalOpen(true);
  };

  const handleCloseReminderModal = () => {
    setIsReminderModalOpen(false);
    setReminderFormData({
      text: '',
      dueDate: '',
      priority: 'Medium'
    });
  };

  const handleSaveReminder = (e) => {
    e.preventDefault();
    if (!reminderFormData.text.trim()) return;

    const newRem = {
      id: Date.now(),
      text: reminderFormData.text.trim(),
      dueDate: reminderFormData.dueDate,
      priority: reminderFormData.priority || 'Medium',
      completed: false
    };

    setReminders((prev) => [newRem, ...prev]);
    showSuccess('Action item added successfully!');
    handleCloseReminderModal();
  };

  const filteredReminders = reminders.filter((rem) => {
    const matchesPriority =
      reminderPriorityFilter === 'All' ||
      rem.priority?.toLowerCase() === reminderPriorityFilter.toLowerCase();

    const matchesSearch =
      rem.text?.toLowerCase().includes(reminderSearch.toLowerCase());

    return matchesPriority && matchesSearch;
  });

  const handleApplySavedJob = async (job) => {
    const alreadyApplied = applications.some(
      (a) => a.company.toLowerCase() === job.company.toLowerCase() && a.role.toLowerCase() === job.role.toLowerCase()
    );

    if (alreadyApplied) {
      showWarning(`You have already applied for ${job.role} at ${job.company}!`);
      return;
    }

    let companyDomain = job.companyDomain;
    let logo = job.logo;
    if (!companyDomain || !logo) {
      const resolved = await resolveCompanyLogo(job.company);
      companyDomain = resolved.companyDomain;
      logo = resolved.logo;
    }

    const newApp = {
      id: Date.now(),
      job_id: job.id,
      company: job.company,
      companyDomain: companyDomain || '',
      logo: logo || '',
      role: job.role,
      location: job.location,
      workMode: job.workMode || job.work_mode,
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
      salary: job.salary,
      stage: 'Application Submitted',
      notes: `Applied from Explore Opportunities.`,
      source: 'Company Career Portals'
    };

    try {
      const res = await applyForJobBackend(currentUser?.email || 'debalina@example.com', {
        ...newApp,
        user_email: currentUser?.email || 'debalina@example.com'
      });
      if (res && res.status === 'already_applied') {
        showWarning(res.message || `You have already applied for ${job.role} at ${job.company}!`);
        return;
      }
    } catch (err) {
      console.warn('Backend application save fallback:', err);
    }

    setApplications([newApp, ...applications]);
    showSuccess(`Successfully applied for ${job.role} at ${job.company}!`);

    const appUrl = job.applicationUrl || job.application_url;
    if (appUrl) {
      window.open(appUrl, '_blank', 'noopener,noreferrer');
    } else {
      showInfo('Application link is not available.');
    }
  };

  const renderRecentApplications = (isStandalonePage = false) => (
    <section id="applications" className="applications-section">
      <div className="applications-nav-top">
        <button
          type="button"
          className="btn-back-dashboard"
          onClick={() => {
            if (activeView !== 'dashboard') {
              handleNavigate('dashboard');
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          aria-label="Back to Dashboard"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="section-title-row applications-header-row">
        <div>
          <h2 className="section-title">Recent Applications</h2>
          <p className="section-desc">Manage, filter, and track all your active and past job submissions</p>
        </div>
        <button className="btn-primary" onClick={handleOpenAddModal}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add New</span>
        </button>
      </div>

      <div className="applications-filters-row">
        <div className="filter-pills">
          {filterOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`filter-pill ${statusFilter === opt && !sourceFilter && !analyticsFilterType ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(opt);
                setSourceFilter(null);
                setAnalyticsFilterType(null);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="applications-meta-row">
        <span className="applications-count-text">
          Showing <strong>{filteredApplications.length}</strong> of {applications.length} applications
        </span>

        {(sourceFilter || analyticsFilterType) && (
          <div className="active-filter-banner active-filter-inline">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <span>
              Filtered by: <strong>{sourceFilter ? `Channel: ${sourceFilter}` : analyticsFilterType === 'responded' ? 'Recruiter Responded Applications' : analyticsFilterType === 'interview' ? 'Interview Stage' : 'Offers Extended'}</strong>
            </span>
            <button
              type="button"
              className="clear-filter-chip-btn"
              onClick={handleClearAnalyticsFilter}
              title="Clear filter"
            >
              &times; Clear Filter
            </button>
          </div>
        )}
      </div>

      <div className="applications-grid">
        {filteredApplications.length > 0 ? (
          filteredApplications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteApplication}
            />
          ))
        ) : (
          <div className="empty-state">
            <h4>No applications found</h4>
            <p>
              {statusFilter === 'Rejected'
                ? 'No rejected applications.'
                : statusFilter && statusFilter !== 'All'
                ? `No applications currently in ${statusFilter} stage.`
                : 'Try adjusting your search query or status filter above.'}
            </p>
            {statusFilter && statusFilter !== 'All' && (
              <button
                type="button"
                className="clear-filter-chip-btn"
                style={{ marginTop: '0.75rem', alignSelf: 'center' }}
                onClick={() => {
                  setStatusFilter('All');
                  setSourceFilter(null);
                  setAnalyticsFilterType(null);
                }}
              >
                View All Applications
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );

  const handleSelectSearchResult = (result) => {
    if (!result) return;
    const { type, item, company } = result;

    if (type === 'application') {
      if (activeView !== 'dashboard') {
        handleNavigate('dashboard');
      }
      setTimeout(() => {
        const el = document.getElementById('applications');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          const targetCard = Array.from(document.querySelectorAll('.app-card')).find((c) =>
            c.textContent.toLowerCase().includes((company || '').toLowerCase())
          );
          if (targetCard) {
            targetCard.classList.add('search-highlighted');
            setTimeout(() => targetCard.classList.remove('search-highlighted'), 2500);
          }
        }
      }, 100);
    } else if (type === 'interview') {
      if (activeView !== 'dashboard') {
        handleNavigate('dashboard');
      }
      setTimeout(() => {
        const el = document.getElementById('interviews');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          const targetCard = Array.from(document.querySelectorAll('.interview-card')).find((c) =>
            c.textContent.toLowerCase().includes((company || '').toLowerCase())
          );
          if (targetCard) {
            targetCard.classList.add('search-highlighted');
            setTimeout(() => targetCard.classList.remove('search-highlighted'), 2500);
          }
        }
      }, 100);
    } else if (type === 'savedJob') {
      if (activeView !== 'dashboard') {
        handleNavigate('dashboard');
      }
      setTimeout(() => {
        const el = document.getElementById('saved-jobs');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          const targetCard = Array.from(document.querySelectorAll('.saved-job-card')).find((c) =>
            c.textContent.toLowerCase().includes((company || '').toLowerCase())
          );
          if (targetCard) {
            targetCard.classList.add('search-highlighted');
            setTimeout(() => targetCard.classList.remove('search-highlighted'), 2500);
          }
        }
      }, 100);
    } else if (type === 'job') {
      if (activeView !== 'jobs') {
        handleNavigate('jobs');
      }
      if (item) {
        handleOpenJobDetails(item);
      }
    }
  };

  if (!isAuthenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Navbar
        onOpenAddModal={handleOpenAddModal}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLogout={handleLogout}
        user={currentUser}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onNavigate={handleNavigate}
        activeView={activeView}
        savedJobsCount={savedJobs.length}
        applications={applications}
        interviews={interviews}
        savedJobs={savedJobs}
        jobs={ALL_AVAILABLE_JOBS}
        onSelectSearchResult={handleSelectSearchResult}
      />

      {activeView === 'profile' ? (
        <ProfilePage
          profile={userProfile}
          onUpdateProfile={handleUpdateProfile}
          onBackToDashboard={() => handleNavigate('dashboard')}
          theme={theme}
        />
      ) : activeView === 'settings' ? (
        <SettingsPage
          user={currentUser}
          userProfile={userProfile}
          onUpdateProfile={handleUpdateProfile}
          onUpdateUser={handleUpdateUser}
          onBackToDashboard={() => handleNavigate('dashboard')}
          onNavigateToProfile={() => handleNavigate('profile')}
          theme={theme}
          onSetTheme={handleSetTheme}
          onLogout={handleLogout}
        />
      ) : activeView === 'jobs' ? (
        <JobsPage
          currentUser={currentUser}
          applications={applications}
          savedJobs={savedJobs}
          onSaveJob={handleSaveJob}
          onUnsaveJob={handleUnsaveJob}
          onApplyJob={handleApplySavedJob}
          onOpenJobDetails={handleOpenJobDetails}
          onNavigateToDashboard={() => handleNavigate('dashboard')}
          onNavigateToSavedJobs={() => {
            handleNavigate('dashboard');
            setTimeout(() => {
              const el = document.getElementById('saved-jobs');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
        />
      ) : activeView === 'applications' ? (
        <main className="main-content">
          {renderRecentApplications(true)}
        </main>
      ) : (
        <main className="main-content">
          <section id="dashboard" className="hero-section">
          <div className="hero-content">
            <span className="hero-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Updated today &bull; {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <h1 className="hero-title">Welcome back, {currentUser?.name || 'Debalina'}!</h1>
            <p className="hero-subtitle">
              You have <strong>{kpis.scheduledInterviews} {kpis.scheduledInterviews === 1 ? 'interview' : 'interviews'} scheduled</strong> this week and <strong>{kpis.offersReceived} {kpis.offersReceived === 1 ? 'offer' : 'offers'}</strong> awaiting your review. Keep up the great momentum!
            </p>
          </div>
          <div className="hero-actions">
            <button className="btn-secondary" onClick={() => showSuccess("Application summary exported as CSV successfully!")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Export Report</span>
            </button>
            <button className="btn-primary" onClick={handleOpenAddModal}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add Application</span>
            </button>
          </div>
        </section>

        <section id="statistics" className="statistics-section">
          <div className="section-title-row">
            <div>
              <h2 className="section-title">Key Performance Indicators</h2>
              <p className="section-desc">Real-time overview of your ongoing job search pipeline</p>
            </div>
          </div>
          <div className="stats-grid">
            {[
              {
                id: 1,
                type: 'total',
                title: "Total Applications",
                value: String(kpis.totalApplications),
                change: kpis.totalApplications === 0
                  ? "No applications yet"
                  : (kpis.applicationsGrowth >= 0
                      ? `+${kpis.applicationsGrowth}% this month`
                      : `${kpis.applicationsGrowth}% this month`),
                isPositive: kpis.applicationsGrowth >= 0,
                icon: "briefcase",
                color: "indigo"
              },
              {
                id: 2,
                type: 'active',
                title: "In Review / Active",
                value: String(kpis.activeApplications),
                change: `${kpis.awaitingResponse} awaiting response`,
                isPositive: true,
                icon: "clock",
                color: "amber"
              },
              {
                id: 3,
                type: 'interviews',
                title: "Interviews Scheduled",
                value: String(kpis.scheduledInterviews),
                change: kpis.scheduledInterviews === 0
                  ? "0 scheduled"
                  : `${kpis.scheduledInterviews} scheduled`,
                isPositive: kpis.scheduledInterviews > 0,
                icon: "calendar",
                color: "sky"
              },
              {
                id: 4,
                type: 'offers',
                title: "Offers Received",
                value: String(kpis.offersReceived),
                change: kpis.newOffers > 0
                  ? `+${kpis.newOffers} new offer${kpis.newOffers > 1 ? 's' : ''}`
                  : "No offers yet",
                isPositive: kpis.offersReceived > 0,
                icon: "award",
                color: "emerald"
              }
            ].map((stat) => (
              <StatCard
                key={stat.id}
                stat={stat}
                isLoading={isKpiLoading}
                onClick={() => handleKpiCardClick(stat.type)}
              />
            ))}
          </div>
        </section>

        <section id="overview" className="overview-section">
          <div className="overview-card">
            <div className="section-title-row">
              <div>
                <h2 className="section-title">Application Status Breakdown</h2>
                <p className="section-desc">Distribution of your active submissions across each hiring stage</p>
              </div>
            </div>
            <div className="status-bars-container">
              {isStatusBreakdownLoading ? (
                ['Applied', 'Screening', 'Interviewing', 'Offer', 'Rejected'].map((stage) => (
                  <div key={stage} className="status-bar-row skeleton-row">
                    <div className="status-bar-header">
                      <span className="metric-skeleton-text" style={{ width: '80px', height: '16px' }}></span>
                      <span className="metric-skeleton-text" style={{ width: '90px', height: '16px' }}></span>
                    </div>
                    <div className="status-progress-track">
                      <div className="status-progress-fill chart-skeleton-bar" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                ))
              ) : (statusBreakdown?.totalApplications || 0) === 0 ? (
                <div className="status-breakdown-empty-wrapper">
                  <div className="status-bars-container" style={{ margin: 0 }}>
                    {(statusBreakdown?.statuses || [
                      { status: 'Applied', count: 0, percentage: 0 },
                      { status: 'Screening', count: 0, percentage: 0 },
                      { status: 'Interviewing', count: 0, percentage: 0 },
                      { status: 'Offer', count: 0, percentage: 0 },
                      { status: 'Rejected', count: 0, percentage: 0 }
                    ]).map(({ status: stage }) => (
                      <div key={stage} className="status-bar-row">
                        <div className="status-bar-header">
                          <span className="status-bar-label">{stage}</span>
                          <span className="status-bar-count">0 roles (0%)</span>
                        </div>
                        <div className="status-progress-track">
                          <div className="status-progress-fill" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="status-breakdown-empty-notice">
                    <p className="empty-title">No application data yet.</p>
                    <p className="empty-subtitle">Start adding applications to see your hiring-stage breakdown.</p>
                  </div>
                </div>
              ) : (
                (statusBreakdown?.statuses || []).map(({ status: stage, count, percentage }) => {
                  const fillClass = `fill-${stage.toLowerCase()}`;
                  const isHighlighted = highlightedStatus?.toLowerCase() === stage.toLowerCase();
                  return (
                    <div
                      key={stage}
                      className={`status-bar-row clickable ${isHighlighted ? 'active highlighted' : ''}`}
                      onClick={(e) => handleStatusBreakdownClick(e, stage)}
                      title={`Filter applications by ${stage} (${count} ${count === 1 ? 'role' : 'roles'})`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleStatusBreakdownClick(e, stage);
                        }
                      }}
                    >
                      <div className="status-bar-header">
                        <span className="status-bar-label">{stage}</span>
                        <span className="status-bar-count">
                          {count} {count === 1 ? 'role' : 'roles'} ({percentage}%)
                        </span>
                      </div>
                      <div className="status-progress-track">
                        <div
                          className={`status-progress-fill ${fillClass}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section id="activity" className="activity-section">
          <div className="activity-card">
            <div className="chart-header-row">
              <div>
                <h2 className="section-title">Weekly Application Activity</h2>
                <p className="section-desc">Applications submitted and interviews conducted over the past 7 days</p>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color legend-apps"></span>
                  <span>Applications</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color legend-interviews"></span>
                  <span>Interviews</span>
                </div>
              </div>
            </div>

            <div className="chart-bars-wrapper">
              {isWeeklyActivityLoading ? (
                [...Array(7)].map((_, idx) => (
                  <div key={idx} className="chart-day-column">
                    <div className="chart-bars-group">
                      <div className="chart-bar chart-skeleton-bar" style={{ height: '70px', width: '16px' }}></div>
                      <div className="chart-bar chart-skeleton-bar" style={{ height: '40px', width: '16px' }}></div>
                    </div>
                    <span className="chart-skeleton-pill" style={{ width: '28px', height: '14px', marginTop: '6px' }}></span>
                  </div>
                ))
              ) : (
                (weeklyActivity?.days || []).map((item) => {
                  const appsHeight = item.applications === 0 ? 6 : Math.min(160, Math.max(16, item.applications * 28 + 8));
                  const intvsHeight = item.interviews === 0 ? 6 : Math.min(160, Math.max(16, item.interviews * 38 + 8));
                  return (
                    <div
                      key={item.date}
                      className="chart-day-column clickable"
                      onClick={() => handleDayClick(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleDayClick(item);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      title={`Click to view activity for ${item.fullDate || item.day}`}
                      aria-label={`${item.fullDate || item.day}: ${item.applications} applications submitted, ${item.interviews} interviews conducted. Click to view details.`}
                    >
                      <div className="chart-bars-group">
                        <div
                          className="chart-bar bar-apps"
                          style={{ height: `${appsHeight}px`, opacity: item.applications === 0 ? 0.35 : 1 }}
                          data-value={`${item.applications} Apps`}
                        ></div>
                        <div
                          className="chart-bar bar-interviews"
                          style={{ height: `${intvsHeight}px`, opacity: item.interviews === 0 ? 0.35 : 1 }}
                          data-value={`${item.interviews} Intv`}
                        ></div>
                      </div>
                      <span className="chart-day-label">{item.day}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {renderRecentApplications(false)}

        <section id="interviews" className="interviews-section">
          <div className="section-title-row">
            <div>
              <h2 className="section-title">Upcoming Interviews</h2>
              <p className="section-desc">Scheduled discussions, technical assessments, and panel interviews</p>
            </div>
            <button className="btn-primary" onClick={handleOpenAddInterviewModal}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Add Interview</span>
            </button>
          </div>
          <div className="interviews-grid">
            {interviews.length > 0 ? (
              interviews.map((interview) => (
                <InterviewCard
                  key={interview.id}
                  interview={interview}
                  onEdit={handleOpenEditInterviewModal}
                  onDelete={handleDeleteInterview}
                />
              ))
            ) : (
              <div className="empty-state">
                <h4>No interviews scheduled</h4>
                <p>Click "+ Add Interview" above to schedule a new discussion or round.</p>
              </div>
            )}
          </div>
        </section>

        <section id="saved-jobs" className="saved-jobs-section">
          <div className="section-title-row">
            <div>
              <h2 className="section-title">
                Saved Jobs
                {savedJobs.length > 0 && (
                  <span className="section-count-pill">{savedJobs.length}</span>
                )}
              </h2>
              <p className="section-desc">Opportunities bookmarked for future applications</p>
            </div>
            <button
              type="button"
              className="btn-secondary btn-header-browse"
              onClick={handleNavigateToJobs}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Explore More Jobs</span>
            </button>
          </div>

          {savedJobs.length > 0 ? (
            <div className="saved-jobs-grid">
              {savedJobs.map((job) => (
                <div key={job.id} className="saved-job-card">
                  <div className="saved-job-header">
                    <div className="company-info-group">
                      <div className="company-logo-wrap">
                        <CompanyLogo
                          logo={job.logo}
                          company={job.company}
                          companyDomain={job.companyDomain}
                          className="company-logo-img"
                        />
                      </div>
                      <div className="saved-job-title-block">
                        <h4
                          className="job-title"
                          onClick={() => handleOpenJobDetails(job)}
                          title="Click to view job details"
                          style={{ cursor: 'pointer' }}
                        >
                          {job.role}
                        </h4>
                        <span className="company-name">{job.company}</span>
                      </div>
                    </div>

                    <div className="saved-job-header-right">
                      {job.matchScore && (
                        <span className="match-score-badge">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          {job.matchScore}% match
                        </span>
                      )}

                      <button
                        type="button"
                        className="btn-unsave-job"
                        onClick={() => handleUnsaveJob(job)}
                        title={`Unsave ${job.role} at ${job.company}`}
                        aria-label={`Unsave ${job.role} at ${job.company}`}
                      >
                        <svg className="bookmark-icon filled" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span className="unsave-text">Unsave</span>
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
                      <span className="workmode-pill">{job.workMode}</span>
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
                    <p className="saved-job-desc-preview">
                      {job.description}
                    </p>
                  )}

                  <div className="job-tags-row">
                    {job.tags && job.tags.map((tag) => (
                      <span key={tag} className="job-tag">#{tag}</span>
                    ))}
                  </div>

                  <div className="saved-job-footer">
                    <span className="posted-time">Posted {job.postedDate}</span>
                    <div className="saved-job-footer-btns">
                      <button
                        type="button"
                        className="btn-view-job-details"
                        onClick={() => handleOpenJobDetails(job)}
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        className="btn-apply-now"
                        onClick={() => handleApplySavedJob(job)}
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="saved-jobs-empty-state">
              <div className="empty-bookmark-icon-wrap">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3 className="empty-state-title">No saved jobs yet</h3>
              <p className="empty-state-desc">Jobs you save will appear here.</p>
              <button
                type="button"
                className="btn-primary btn-browse-jobs"
                onClick={handleNavigateToJobs}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span>Browse Jobs</span>
              </button>
            </div>
          )}
        </section>

        <section id="reminders" className="reminders-section">
          <div className="reminders-wrapper">
            <div className="section-title-row">
              <div>
                <h2 className="section-title">Action Items & Reminders</h2>
                <p className="section-desc">Keep track of your pending follow-ups, test submissions, and deadlines</p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleOpenAddReminderModal}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Add</span>
              </button>
            </div>

            <div className="reminders-controls-row">
              <div className="search-bar actions-search-bar">
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
                  placeholder="Search reminders..."
                  value={reminderSearch}
                  onChange={(e) => setReminderSearch(e.target.value)}
                  className="search-input actions-search-input"
                  aria-label="Search action items and reminders"
                />

                {reminderSearch && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => setReminderSearch('')}
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    &times;
                  </button>
                )}
              </div>

              <select
                value={reminderPriorityFilter}
                onChange={(e) => setReminderPriorityFilter(e.target.value)}
                className="form-select actions-priority-select"
                aria-label="Filter reminders by priority"
              >
                <option value="All">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

<div className="reminders-list">
  {filteredReminders.length > 0 ? (
    filteredReminders.map((rem) => (
      <ReminderCard
        key={rem.id}
        reminder={rem}
        onToggleComplete={handleToggleReminder}
        onDelete={handleDeleteReminder}
      />
    ))
  ) : (
    <div className="empty-state">
      <h4>No reminders found</h4>
      <p>Try changing the priority filter or search term.</p>
    </div>
  )}
</div>
          </div>
        </section>

        <section id="analytics" className="analytics-section">
          <div className="section-title-row analytics-title-row">
            <div>
              <h2 className="section-title">Analytics & Insights</h2>
              <p className="section-desc">Metrics to help optimize your job hunt and response conversion</p>
            </div>

            <div className="analytics-header-actions" ref={analyticsSearchContainerRef}>
              {analyticsCompanySearch && (
                <div className="analytics-active-chip" title={`Filtered by ${analyticsCompanySearch}`}>
                  <CompanyLogo company={analyticsCompanySearch} size={15} />
                  <span className="analytics-active-chip-name">{analyticsCompanySearch}</span>
                  <span className="analytics-active-chip-count">
                    ({filteredAnalyticsApps.length} {filteredAnalyticsApps.length === 1 ? 'app' : 'apps'})
                  </span>
                  <button
                    type="button"
                    className="analytics-active-chip-clear"
                    onClick={handleClearAnalyticsCompany}
                    title="Clear company filter"
                    aria-label="Clear company filter"
                  >
                    &times;
                  </button>
                </div>
              )}

              {!isAnalyticsSearchOpen ? (
                <button
                  type="button"
                  className={`btn-analytics-search-trigger ${analyticsCompanySearch ? 'has-filter' : ''}`}
                  onClick={() => {
                    setIsAnalyticsSearchOpen(true);
                    setAnalyticsSearchQuery(analyticsCompanySearch || '');
                  }}
                  title={analyticsCompanySearch ? `Filtered by ${analyticsCompanySearch}. Click to change` : 'Search company analytics'}
                  aria-label={analyticsCompanySearch ? `Filtered by ${analyticsCompanySearch}. Click to change` : 'Search company analytics'}
                  aria-expanded="false"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              ) : (
                <div className="analytics-search-popup" role="search">
                  <div className="analytics-popup-input-wrapper">
                    <svg className="analytics-popup-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                      ref={analyticsSearchInputRef}
                      type="text"
                      className="analytics-popup-input"
                      placeholder="Search company..."
                      value={analyticsSearchQuery}
                      onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsAnalyticsSearchOpen(false);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (analyticsCompanySuggestions.length > 0) {
                            handleSelectAnalyticsCompany(analyticsCompanySuggestions[0].name);
                          } else if (analyticsSearchQuery.trim()) {
                            handleSelectAnalyticsCompany(analyticsSearchQuery.trim());
                          }
                        }
                      }}
                      aria-label="Search company to filter analytics"
                      autoFocus
                    />
                    {analyticsSearchQuery && (
                      <button
                        type="button"
                        className="analytics-popup-clear-btn"
                        onClick={() => setAnalyticsSearchQuery('')}
                        title="Clear search text"
                        aria-label="Clear search text"
                      >
                        &times;
                      </button>
                    )}
                    <button
                      type="button"
                      className="analytics-popup-close-btn"
                      onClick={() => setIsAnalyticsSearchOpen(false)}
                      title="Close search"
                      aria-label="Close search"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>

                  {analyticsSearchQuery.trim().length > 0 && (
                    <div className="analytics-suggestions-dropdown" role="listbox">
                      {isSearchingCompanies ? (
                        <div className="analytics-suggestions-status">
                          <span className="analytics-inline-spinner"></span>
                          <span>Searching...</span>
                        </div>
                      ) : analyticsCompanySuggestions.length > 0 ? (
                        <div className="analytics-suggestions-list">
                          {analyticsCompanySuggestions.map((comp) => {
                            const cName = comp.companyName || comp.name;
                            return (
                              <button
                                key={cName}
                                type="button"
                                className="analytics-suggestion-item"
                                onClick={() => handleSelectAnalyticsCompany(cName)}
                                role="option"
                              >
                                <div className="analytics-suggestion-logo">
                                   <CompanyLogo company={cName} domain={comp.companyDomain || comp.domain} size={20} />
                                </div>
                                <span className="analytics-suggestion-text">{cName}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="analytics-no-results">
                          No matching company found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="analytics-grid">
            <div className="analytics-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <h3 className="stat-title" style={{ margin: 0 }}>Conversion Performance</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Click card to filter / inspect</span>
              </div>
              <div className="analytics-metrics-row">
                <div
                  className="metric-box clickable"
                  onClick={() => handleAnalyticsMetricClick('responseRate')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAnalyticsMetricClick('responseRate');
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title="Click to view responded applications"
                  aria-label={`Recruiter Response Rate: ${displayAnalytics?.conversion?.responseRate || '0%'}. Click to filter responded applications.`}
                >
                  <div className="metric-header-row">
                    <span className="metric-number">
                      {isAnalyticsLoading ? <span className="metric-skeleton-text"></span> : (displayAnalytics?.conversion?.responseRate || '0%')}
                    </span>
                    <span className="metric-click-icon" aria-hidden="true">↗</span>
                  </div>
                  <span className="metric-label">Recruiter Response Rate</span>
                  <span className="metric-subtext">Click to filter responded</span>
                </div>

                <div
                  className="metric-box clickable"
                  onClick={() => handleAnalyticsMetricClick('interviewConversion')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAnalyticsMetricClick('interviewConversion');
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title="Click to view interview-stage applications"
                  aria-label={`Interview Conversion: ${displayAnalytics?.conversion?.interviewConversion || '0%'}. Click to filter interview-stage applications.`}
                >
                  <div className="metric-header-row">
                    <span className="metric-number">
                      {isAnalyticsLoading ? <span className="metric-skeleton-text"></span> : (displayAnalytics?.conversion?.interviewConversion || '0%')}
                    </span>
                    <span className="metric-click-icon" aria-hidden="true">↗</span>
                  </div>
                  <span className="metric-label">Interview Conversion</span>
                  <span className="metric-subtext">Click to filter interviews</span>
                </div>

                <div
                  className="metric-box clickable"
                  onClick={() => handleAnalyticsMetricClick('offerRate')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAnalyticsMetricClick('offerRate');
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title="Click to view final offers"
                  aria-label={`Final Offer Rate: ${displayAnalytics?.conversion?.offerRate || '0%'}. Click to filter offers.`}
                >
                  <div className="metric-header-row">
                    <span className="metric-number">
                      {isAnalyticsLoading ? <span className="metric-skeleton-text"></span> : (displayAnalytics?.conversion?.offerRate || '0%')}
                    </span>
                    <span className="metric-click-icon" aria-hidden="true">↗</span>
                  </div>
                  <span className="metric-label">Final Offer Rate</span>
                  <span className="metric-subtext">Click to filter offers</span>
                </div>

                <div
                  className="metric-box clickable"
                  onClick={() => handleAnalyticsMetricClick('avgResponseDays')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAnalyticsMetricClick('avgResponseDays');
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title="Click to view turnaround time breakdown"
                  aria-label={`Avg Response Time: ${displayAnalytics?.conversion?.averageResponseDays || '—'}. Click to view turnaround breakdown.`}
                >
                  <div className="metric-header-row">
                    <span className="metric-number">
                      {isAnalyticsLoading ? <span className="metric-skeleton-text"></span> : (displayAnalytics?.conversion?.averageResponseDays || '—')}
                    </span>
                    <span className="metric-click-icon" aria-hidden="true">↗</span>
                  </div>
                  <span className="metric-label">Avg. Response Time</span>
                  <span className="metric-subtext">Click to view breakdown</span>
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <h3 className="stat-title" style={{ margin: 0 }}>Top Application Channels</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Click channel to filter</span>
              </div>
              <div className="sources-list">
                {isAnalyticsLoading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="source-row">
                      <div className="source-skeleton-bar"></div>
                    </div>
                  ))
                ) : (displayAnalytics?.channels || []).length > 0 ? (
                  (displayAnalytics?.channels || []).map((source) => (
                    <div
                      key={source.name}
                      className="source-row clickable"
                      onClick={() => handleChannelFilterClick(source.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleChannelFilterClick(source.name);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      title={`Click to filter applications from ${source.name}`}
                      aria-label={`${source.name}: ${source.count || source.applications} applications (${source.percent || source.percentage}%). Click to filter.`}
                    >
                      <div className="source-header">
                        <span className="source-name">{source.name}</span>
                        <span className="source-count">{source.count || source.applications} apps ({source.percent || source.percentage}%)</span>
                      </div>
                      <div className="source-progress-track">
                        <div
                          className="source-progress-fill"
                          style={{ width: `${Math.min(100, Math.max(0, source.percent || source.percentage))}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      {analyticsCompanySearch
                        ? `No application channels found for "${analyticsCompanySearch}".`
                        : 'No application channel data yet. Submit job applications to view channel insights.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      )}

      <footer className="footer-container">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="brand-logo">
                <div className="logo-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <span className="brand-text">Hire<span>Hub</span></span>
              </div>
              <p className="footer-desc">
                Your modern, single-page job application tracker and career management workspace.
              </p>
            </div>

            <div className="footer-nav">
              <div className="footer-col">
                <span className="footer-heading">Navigation</span>
                <a href="#dashboard" className="footer-link" onClick={() => handleNavigate('dashboard')}>Dashboard</a>
                <a href="#overview" className="footer-link" onClick={() => handleNavigate('dashboard')}>Overview</a>
                <a href="#applications" className="footer-link" onClick={() => handleNavigate('dashboard')}>Applications</a>
                <a href="#interviews" className="footer-link" onClick={() => handleNavigate('dashboard')}>Interviews</a>
              </div>
              <div className="footer-col">
                <span className="footer-heading">Resources</span>
                <a href="#saved-jobs" className="footer-link" onClick={() => handleNavigate('dashboard')}>Saved Jobs</a>
                <a href="#reminders" className="footer-link" onClick={() => handleNavigate('dashboard')}>Reminders</a>
                <a href="#analytics" className="footer-link" onClick={() => handleNavigate('dashboard')}>Analytics</a>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => handleNavigate('profile')}
                  style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                >
                  Profile
                </button>
              </div>
              <div className="footer-col">
                <span className="footer-heading">Legal</span>
                <a href="#dashboard" className="footer-link">Privacy Policy</a>
                <a href="#dashboard" className="footer-link">Terms of Service</a>
                <a href="#dashboard" className="footer-link">Cookie Preferences</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>&copy; {new Date().getFullYear()} HireHub Inc. All rights reserved.</span>
            <span>Built for modern professionals &amp; developers.</span>
          </div>
        </div>
      </footer>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingApplication ? 'Edit Application' : 'Add New Application'}
              </h3>
              <button
                className="modal-close-btn"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveApplication}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Company Name *</label>
                      {appCompanyPreview?.companyDomain && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <CompanyLogo
                              logo={appCompanyPreview.logo}
                              company={formData.company}
                              companyDomain={appCompanyPreview.companyDomain}
                              style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                            />
                          </span>
                          <span style={{ fontWeight: 600 }}>{appCompanyPreview.companyDomain}</span>
                        </span>
                      )}
                    </div>
                    <CompanySearchInput
                      required
                      placeholder="e.g. Google, Microsoft, Amazon"
                      value={formData.company}
                      onChange={(val) => setFormData({ ...formData, company: val })}
                      onSelectCompany={({ companyName, companyDomain, logo }) => {
                        setFormData((prev) => ({
                          ...prev,
                          company: companyName,
                          companyDomain,
                          logo
                        }));
                        setAppCompanyPreview({ companyName, companyDomain, logo });
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Job Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Frontend Engineer"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Mountain View, CA"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Work Mode</label>
                    <select
                      value={formData.workMode}
                      onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                      className="form-select"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Application Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="form-select"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Screening">Screening</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Salary Range</label>
                    <input
                      type="text"
                      placeholder="e.g. $140,000 - $160,000"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Application Channel / Source</label>
                    <select
                      value={formData.source || 'LinkedIn Jobs'}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="form-select"
                    >
                      <option value="LinkedIn Jobs">LinkedIn Jobs</option>
                      <option value="Company Career Portals">Company Career Portals</option>
                      <option value="University Referrals">University Referrals</option>
                      <option value="Job Boards (Indeed/Handshake)">Job Boards (Indeed/Handshake)</option>
                      <option value="Direct Referral">Direct Referral</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Response Date (Optional)</label>
                    <DatePicker
                      value={formData.responseDate || ''}
                      onChange={(val) => setFormData({ ...formData, responseDate: val })}
                      placeholder="Select response date"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Current Stage / Round</label>
                  <input
                    type="text"
                    placeholder="e.g. Round 2: Technical Assessment"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    placeholder="Recruiter contact, interview prep notes, referral info..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="form-textarea"
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingApplication ? 'Save Changes' : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isInterviewModalOpen && (
        <div className="modal-overlay" onClick={handleCloseInterviewModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingInterview ? 'Edit Interview' : 'Add Interview'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseInterviewModal}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveInterview}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Company *</label>
                      {interviewCompanyPreview?.companyDomain && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <CompanyLogo
                              logo={interviewCompanyPreview.logo}
                              company={interviewFormData.company}
                              companyDomain={interviewCompanyPreview.companyDomain}
                              style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                            />
                          </span>
                          <span style={{ fontWeight: 600 }}>{interviewCompanyPreview.companyDomain}</span>
                        </span>
                      )}
                    </div>
                    <CompanySearchInput
                      required
                      placeholder="e.g. Google, Microsoft, Amazon"
                      value={interviewFormData.company}
                      onChange={(val) => setInterviewFormData({ ...interviewFormData, company: val })}
                      onSelectCompany={({ companyName, companyDomain, logo }) => {
                        setInterviewFormData((prev) => ({
                          ...prev,
                          company: companyName,
                          companyDomain,
                          logo
                        }));
                        setInterviewCompanyPreview({ companyName, companyDomain, logo });
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Job Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Frontend Developer Intern"
                      value={interviewFormData.role}
                      onChange={(e) => setInterviewFormData({ ...interviewFormData, role: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Interview Date *</label>
                    <DatePicker
                      value={interviewFormData.interviewDate || interviewFormData.date}
                      onChange={(val) => {
                        setInterviewFormData((prev) => ({
                          ...prev,
                          interviewDate: val,
                          date: formatDisplayDate(val)
                        }));
                      }}
                      placeholder="Select interview date..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Time Zone *</label>
                    <TimezoneSelect
                      value={interviewFormData.timeZone || 'America/New_York'}
                      date={interviewFormData.interviewDate}
                      onChange={(tz) => {
                        setInterviewFormData((prev) => ({
                          ...prev,
                          timeZone: tz
                        }));
                      }}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={interviewFormData.startTime}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setInterviewFormData((prev) => ({
                          ...prev,
                          startTime: newStart
                        }));
                        if (interviewFormData.endTime && !isEndTimeValid(newStart, interviewFormData.endTime)) {
                          setTimeValidationError('End time must be after the start time.');
                        } else {
                          setTimeValidationError('');
                        }
                      }}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Time *</label>
                    <input
                      type="time"
                      required
                      value={interviewFormData.endTime}
                      onChange={(e) => {
                        const newEnd = e.target.value;
                        setInterviewFormData((prev) => ({
                          ...prev,
                          endTime: newEnd
                        }));
                        if (interviewFormData.startTime && !isEndTimeValid(interviewFormData.startTime, newEnd)) {
                          setTimeValidationError('End time must be after the start time.');
                        } else {
                          setTimeValidationError('');
                        }
                      }}
                      className="form-input"
                    />
                  </div>
                </div>

                {timeValidationError && (
                  <div className="form-error-inline" role="alert">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{timeValidationError}</span>
                  </div>
                )}

                {interviewFormData.interviewDate && interviewFormData.startTime && interviewFormData.endTime && (
                  <div className="interview-scheduled-preview-box">
                    <div className="preview-header">
                      <span className="preview-label">Interview Time Preview</span>
                      <span className="preview-tz-badge">
                        {getTimezoneAbbr(interviewFormData.interviewDate, interviewFormData.timeZone)}
                      </span>
                    </div>
                    <div className="preview-content-grid">
                      <div className="preview-line">
                        <span className="preview-icon">📅</span>
                        <strong>{formatDisplayDate(interviewFormData.interviewDate)}</strong>
                      </div>
                      <div className="preview-line">
                        <span className="preview-icon">🕐</span>
                        <span>{formatTime12h(interviewFormData.startTime)} – {formatTime12h(interviewFormData.endTime)}</span>
                      </div>
                      <div className="preview-line">
                        <span className="preview-icon">🌐</span>
                        <span>{interviewFormData.timeZone} ({getTimezoneAbbr(interviewFormData.interviewDate, interviewFormData.timeZone)})</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Interview Type / Round</label>
                    <input
                      type="text"
                      placeholder="e.g. Round 2: Technical Assessment"
                      value={interviewFormData.round}
                      onChange={(e) => setInterviewFormData({ ...interviewFormData, round: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Platform</label>
                    <select
                      value={interviewFormData.platform}
                      onChange={(e) => setInterviewFormData({ ...interviewFormData, platform: e.target.value })}
                      className="form-select"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Amazon Chime">Amazon Chime</option>
                      <option value="Phone">Phone</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Meeting Link</label>
                    <input
                      type="url"
                      placeholder="e.g. https://meet.google.com/abc-defg-hij"
                      value={interviewFormData.link}
                      onChange={(e) => setInterviewFormData({ ...interviewFormData, link: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      value={interviewFormData.status || 'scheduled'}
                      onChange={(e) => setInterviewFormData({ ...interviewFormData, status: e.target.value })}
                      className="form-select"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed / Conducted</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    placeholder="Preparation notes, interviewer name, topics to review..."
                    value={interviewFormData.prepTip}
                    onChange={(e) => setInterviewFormData({ ...interviewFormData, prepTip: e.target.value })}
                    className="form-textarea"
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseInterviewModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingInterview ? 'Save Changes' : 'Save Interview'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {isReminderModalOpen && (
        <div className="modal-overlay" onClick={handleCloseReminderModal}>
          <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Reminder</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseReminderModal}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveReminder}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Reminder</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter reminder..."
                    value={reminderFormData.text}
                    onChange={(e) => setReminderFormData({ ...reminderFormData, text: e.target.value })}
                    className="form-input"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <DatePicker
                    value={reminderFormData.dueDate}
                    onChange={(val) => setReminderFormData({ ...reminderFormData, dueDate: val })}
                    placeholder="Select reminder due date..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    value={reminderFormData.priority}
                    onChange={(e) => setReminderFormData({ ...reminderFormData, priority: e.target.value })}
                    className="form-select"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseReminderModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedJobForDetails && (
        <JobDetailsModal
          job={selectedJobForDetails}
          isSaved={isJobSaved(savedJobs, selectedJobForDetails)}
          onToggleSave={handleToggleSaveJob}
          onApply={handleApplySavedJob}
          onClose={handleCloseJobDetails}
        />
      )}

      {selectedDayDetail && (
        <div className="modal-overlay" onClick={() => setSelectedDayDetail(null)}>
          <div
            className="modal-card day-detail-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="day-detail-title"
          >
            <div className="modal-header">
              <div>
                <h3 id="day-detail-title" className="modal-title">
                  {selectedDayDetail.fullDate || selectedDayDetail.date}
                </h3>
                <p className="day-detail-subtitle">Daily submission & interview summary</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedDayDetail(null)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="modal-body day-detail-body">
              <div className="day-detail-metrics-row">
                <div className="day-detail-metric-card metric-apps">
                  <div className="day-metric-icon-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="day-metric-title">Applications Submitted</span>
                    <div className="day-metric-number">{selectedDayDetail.applications}</div>
                  </div>
                </div>

                <div className="day-detail-metric-card metric-interviews">
                  <div className="day-metric-icon-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <div>
                    <span className="day-metric-title">Interviews Conducted</span>
                    <div className="day-metric-number">{selectedDayDetail.interviews}</div>
                  </div>
                </div>
              </div>

              {selectedDayDetail.applications === 0 && selectedDayDetail.interviews === 0 ? (
                <div className="day-empty-state">
                  <div className="day-empty-icon-wrap">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <h4 className="day-empty-title">No activity recorded for this day.</h4>
                  <p className="day-empty-desc">There were no job applications submitted and no interviews conducted on this calendar date.</p>
                </div>
              ) : (
                <div className="day-detail-records-wrap">
                  {selectedDayDetail.applications > 0 && (
                    <div className="day-detail-section">
                      <h4 className="day-detail-section-title">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                        Applications ({selectedDayDetail.applicationsList.length})
                      </h4>
                      <div className="day-cards-list">
                        {selectedDayDetail.applicationsList.map((app) => (
                          <ApplicationCard key={app.id || app.company} application={app} />
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDayDetail.interviews > 0 && (
                    <div className="day-detail-section">
                      <h4 className="day-detail-section-title">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        Interviews ({selectedDayDetail.interviewsList.length})
                      </h4>
                      <div className="day-cards-list">
                        {selectedDayDetail.interviewsList.map((itw) => (
                          <InterviewCard key={itw.id || itw.company} interview={itw} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedDayDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedResponseBreakdownModal && (
        <div className="modal-overlay" onClick={() => setSelectedResponseBreakdownModal(null)}>
          <div
            className="modal-card response-breakdown-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="response-breakdown-title"
          >
            <div className="modal-header">
              <div>
                <h3 id="response-breakdown-title" className="modal-title">
                  Response Time Breakdown
                </h3>
                <p className="day-detail-subtitle">Application turnaround times and recruiter responsiveness analysis</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedResponseBreakdownModal(null)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="response-breakdown-stats">
                <div className="breakdown-stat-chip">
                  <span className="breakdown-stat-val">{analytics?.conversion?.averageResponseDays || '—'}</span>
                  <span className="breakdown-stat-lbl">Average Response Time</span>
                </div>
                <div className="breakdown-stat-chip">
                  <span className="breakdown-stat-val">
                    {analytics?.conversion?.respondedCount || 0} / {analytics?.conversion?.totalApplications || 0}
                  </span>
                  <span className="breakdown-stat-lbl">Responded Applications</span>
                </div>
                <div className="breakdown-stat-chip">
                  <span className="breakdown-stat-val">
                    {(() => {
                      const days = (selectedResponseBreakdownModal || [])
                        .map((a) => a.responseDays)
                        .filter((d) => d !== null && d !== undefined);
                      return days.length > 0 ? `${Math.min(...days)} days` : '—';
                    })()}
                  </span>
                  <span className="breakdown-stat-lbl">Fastest Response</span>
                </div>
                <div className="breakdown-stat-chip">
                  <span className="breakdown-stat-val">
                    {(() => {
                      const days = (selectedResponseBreakdownModal || [])
                        .map((a) => a.responseDays)
                        .filter((d) => d !== null && d !== undefined);
                      return days.length > 0 ? `${Math.max(...days)} days` : '—';
                    })()}
                  </span>
                  <span className="breakdown-stat-lbl">Longest Response</span>
                </div>
              </div>

              <div className="breakdown-list">
                {(selectedResponseBreakdownModal || []).length > 0 ? (
                  selectedResponseBreakdownModal.map((item) => (
                    <div key={item.id} className="breakdown-item">
                      <div className="breakdown-company-col">
                        <div className="breakdown-logo-wrap">
                          <CompanyLogo
                            logo={item.logo}
                            company={item.company}
                            companyDomain={item.companyDomain}
                            style={{ width: '26px', height: '26px', objectFit: 'contain' }}
                          />
                        </div>
                        <div className="breakdown-company-meta">
                          <span className="breakdown-comp-name">{item.company}</span>
                          <span className="breakdown-role-name">{item.role}</span>
                        </div>
                      </div>

                      <div className="breakdown-dates-col">
                        <span className="breakdown-channel-badge">{item.source || item.channel || 'Other'}</span>
                        <span>Applied: {item.appliedDate || 'N/A'}</span>
                        {item.responseDate && <span>Response: {item.responseDate}</span>}
                      </div>

                      <div className="breakdown-days-col">
                        {item.responseDays !== null && item.responseDays !== undefined ? (
                          <span className="response-days-pill resolved">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            {item.responseDays} day{item.responseDays === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span className="response-days-pill pending">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Awaiting response
                          </span>
                        )}
                        <span className={`status-badge status-${(item.status || 'applied').toLowerCase()}`}>
                          {item.status || 'Applied'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>No applications recorded yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedResponseBreakdownModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Chatbot user={currentUser} />
    </div>
  );
}

