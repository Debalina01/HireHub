import { ALL_AVAILABLE_JOBS, getSavedJobsForUser, isJobSaved } from './savedJobsStorage';

const BASE_URLS = ['', 'http://127.0.0.1:8000'];

export async function fetchJobs({ search = '', workMode = 'All', userEmail = 'debalina@example.com' } = {}) {
  const queryParams = new URLSearchParams();
  if (search && search.trim()) {
    queryParams.set('search', search.trim());
  }
  if (workMode && workMode !== 'All') {
    queryParams.set('work_mode', workMode);
  }
  if (userEmail) {
    queryParams.set('user_email', userEmail.trim());
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  for (const base of BASE_URLS) {
    try {
      const url = `${base}/api/jobs${queryString}`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'X-User-Email': userEmail || 'debalina@example.com'
        }
      });

      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : data.jobs || [];
      }
    } catch (err) {}
  }

  console.warn('Jobs API backend unreachable, using local fallback data');
  let fallback = [...ALL_AVAILABLE_JOBS];
  if (workMode && workMode !== 'All') {
    fallback = fallback.filter((j) => (j.workMode || j.work_mode) === workMode);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    fallback = fallback.filter((j) => {
      const comp = (j.company || '').toLowerCase();
      const role = (j.role || j.job_title || '').toLowerCase();
      const loc = (j.location || '').toLowerCase();
      const tags = (j.tags || j.skills || []).some((t) => t.toLowerCase().includes(q));
      return comp.includes(q) || role.includes(q) || loc.includes(q) || tags;
    });
  }

  return fallback;
}

export async function fetchJobById(jobId, userEmail = 'debalina@example.com') {
  for (const base of BASE_URLS) {
    try {
      const res = await fetch(`${base}/api/jobs/${jobId}?user_email=${encodeURIComponent(userEmail)}`, {
        headers: {
          Accept: 'application/json',
          'X-User-Email': userEmail
        }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {}
  }

  return ALL_AVAILABLE_JOBS.find((j) => j.id === Number(jobId)) || null;
}

export async function fetchSavedJobs(userEmail = 'debalina@example.com') {
  const email = (userEmail || 'debalina@example.com').trim();

  for (const base of BASE_URLS) {
    try {
      const res = await fetch(`${base}/api/saved-jobs?user_email=${encodeURIComponent(email)}`, {
        headers: {
          Accept: 'application/json',
          'X-User-Email': email
        }
      });

      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : data.saved_jobs || [];
      }
    } catch (err) {}
  }

  return getSavedJobsForUser({ email });
}

export async function saveJobToBackend(userEmail, jobId) {
  const email = (userEmail || 'debalina@example.com').trim();

  for (const base of BASE_URLS) {
    try {
      const res = await fetch(`${base}/api/saved-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-User-Email': email
        },
        body: JSON.stringify({
          user_email: email,
          job_id: Number(jobId)
        })
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {}
  }

  return { status: 'saved', job_id: jobId };
}

export async function unsaveJobFromBackend(userEmail, jobId) {
  const email = (userEmail || 'debalina@example.com').trim();

  for (const base of BASE_URLS) {
    try {
      const res = await fetch(`${base}/api/saved-jobs/${jobId}?user_email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'X-User-Email': email
        }
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {}
  }

  return { status: 'removed', job_id: jobId };
}

export async function applyForJobBackend(userEmail, applicationData) {
  const email = (userEmail || 'debalina@example.com').trim();

  for (const base of BASE_URLS) {
    try {
      const res = await fetch(`${base}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-User-Email': email
        },
        body: JSON.stringify({
          ...applicationData,
          user_email: email
        })
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {}
  }

  return { status: 'created', application: applicationData };
}

export async function searchAvailableCompaniesApi(query = '') {
  const clean = (query || '').trim().replace(/\s+/g, ' ');
  if (!clean) return [];

  for (const base of BASE_URLS) {
    try {
      const res = await fetch(`${base}/api/companies/search?q=${encodeURIComponent(clean)}`, {
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {}
  }

  return [];
}

export async function searchGlobalHireHubApi(query = '', userEmail = 'debalina@example.com') {
  const clean = (query || '').trim().replace(/\s+/g, ' ');
  if (!clean) {
    return {
      companies: [],
      applications: [],
      interviews: [],
      savedJobs: [],
      jobs: []
    };
  }

  const email = (userEmail || '').trim();

  for (const base of BASE_URLS) {
    try {
      const url = email
        ? `${base}/api/search?q=${encodeURIComponent(clean)}&user_email=${encodeURIComponent(email)}`
        : `${base}/api/search?q=${encodeURIComponent(clean)}`;
      const headers = { Accept: 'application/json' };
      if (email) headers['X-User-Email'] = email;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          return {
            companies: Array.isArray(data.companies) ? data.companies : [],
            applications: Array.isArray(data.applications) ? data.applications : [],
            interviews: Array.isArray(data.interviews) ? data.interviews : [],
            savedJobs: Array.isArray(data.savedJobs) ? data.savedJobs : [],
            jobs: Array.isArray(data.jobs) ? data.jobs : []
          };
        }
      }
    } catch (err) {}
  }

  return null;
}
