import { mockApplications, mockInterviews, mockReminders } from '../data/mockData';
import { resolveCompanySync } from './companyLogo';
import { parseDateToIso, parseLegacyTimeRange } from './timezoneHelper';

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase() || 'default';
}

function normalizeApplicationRecord(app) {
  if (!app) return app;
  if ((!app.companyDomain || !app.logo || app.logo.includes('/logos/')) && app.company) {
    const { companyDomain, logo } = resolveCompanySync(app.company);
    return {
      ...app,
      companyDomain: app.companyDomain || companyDomain || '',
      logo: (app.logo && !app.logo.includes('/logos/')) ? app.logo : logo || ''
    };
  }
  return app;
}

function normalizeInterviewRecord(item) {
  if (!item) return item;
  let updated = { ...item };
  if (!updated.interviewDate && updated.date) {
    updated.interviewDate = parseDateToIso(updated.date) || '2026-09-30';
  }
  if (!updated.startTime && updated.time) {
    const parsed = parseLegacyTimeRange(updated.time);
    if (parsed) {
      updated.startTime = parsed.startTime || '14:00';
      updated.endTime = parsed.endTime || '15:00';
      updated.timeZone = updated.timeZone || parsed.timeZone || 'America/New_York';
    }
  }
  if ((!updated.companyDomain || !updated.logo || updated.logo.includes('/logos/')) && updated.company) {
    const { companyDomain, logo } = resolveCompanySync(updated.company);
    updated.companyDomain = updated.companyDomain || companyDomain || '';
    updated.logo = (updated.logo && !updated.logo.includes('/logos/')) ? updated.logo : logo || '';
  }
  return updated;
}

export function getUserApplications(email) {
  if (!email) return [];
  const normalized = normalizeEmail(email);
  const userKey = `hirehub_applications_${normalized}`;

  try {
    const saved = localStorage.getItem(userKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeApplicationRecord);
      }
    }
  } catch {}

  if (normalized === 'debalina@example.com' || normalized.includes('debalina')) {
    try {
      const legacy = localStorage.getItem('hirehubApplications');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalizedList = parsed.map(normalizeApplicationRecord);
          saveUserApplications(email, normalizedList);
          return normalizedList;
        }
      }
    } catch {}

    const defaultList = mockApplications.map(normalizeApplicationRecord);
    saveUserApplications(email, defaultList);
    return defaultList;
  }

  saveUserApplications(email, []);
  return [];
}

export function saveUserApplications(email, applications) {
  if (!email) return;
  const normalized = normalizeEmail(email);
  const userKey = `hirehub_applications_${normalized}`;
  try {
    localStorage.setItem(userKey, JSON.stringify(applications || []));
  } catch {}
}

export function getUserInterviews(email) {
  if (!email) return [];
  const normalized = normalizeEmail(email);
  const userKey = `hirehub_interviews_${normalized}`;

  try {
    const saved = localStorage.getItem(userKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeInterviewRecord);
      }
    }
  } catch {}

  if (normalized === 'debalina@example.com' || normalized.includes('debalina')) {
    try {
      const legacy = localStorage.getItem('hirehubInterviews');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalizedList = parsed.map(normalizeInterviewRecord);
          saveUserInterviews(email, normalizedList);
          return normalizedList;
        }
      }
    } catch {}

    const defaultList = mockInterviews.map(normalizeInterviewRecord);
    saveUserInterviews(email, defaultList);
    return defaultList;
  }

  saveUserInterviews(email, []);
  return [];
}

export function saveUserInterviews(email, interviews) {
  if (!email) return;
  const normalized = normalizeEmail(email);
  const userKey = `hirehub_interviews_${normalized}`;
  try {
    localStorage.setItem(userKey, JSON.stringify(interviews || []));
  } catch {}
}

export function getUserReminders(email) {
  if (!email) return [];
  const normalized = normalizeEmail(email);
  const userKey = `hirehub_reminders_${normalized}`;

  try {
    const saved = localStorage.getItem(userKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}

  if (normalized === 'debalina@example.com' || normalized.includes('debalina')) {
    try {
      const legacy = localStorage.getItem('hirehubReminders');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          saveUserReminders(email, parsed);
          return parsed;
        }
      }
    } catch {}

    saveUserReminders(email, mockReminders);
    return mockReminders;
  }

  saveUserReminders(email, []);
  return [];
}

export function saveUserReminders(email, reminders) {
  if (!email) return;
  const normalized = normalizeEmail(email);
  const userKey = `hirehub_reminders_${normalized}`;
  try {
    localStorage.setItem(userKey, JSON.stringify(reminders || []));
  } catch {}
}
