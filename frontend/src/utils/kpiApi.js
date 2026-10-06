const API_BASE_URL = '';

export function calculateLocalKpis(applications = [], interviews = []) {
  const totalApplications = applications.length;

  const dates = applications
    .map((a) => a.appliedDate)
    .filter(Boolean)
    .sort()
    .reverse();

  let applicationsGrowth = 0;
  if (dates.length > 0) {
    const latestDate = new Date(dates[0]);
    const currYear = latestDate.getFullYear();
    const currMonth = latestDate.getMonth() + 1;

    const prevYear = currMonth === 1 ? currYear - 1 : currYear;
    const prevMonth = currMonth === 1 ? 12 : currMonth - 1;

    const currPrefix = `${currYear}-${String(currMonth).padStart(2, '0')}`;
    const prevPrefix = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    const currCount = applications.filter((a) => a.appliedDate?.startsWith(currPrefix)).length;
    const prevCount = applications.filter((a) => a.appliedDate?.startsWith(prevPrefix)).length;

    if (prevCount > 0) {
      applicationsGrowth = Math.round(((currCount - prevCount) / prevCount) * 100);
    } else if (currCount > 0) {
      applicationsGrowth = 100;
    }
  }

  const activeApplications = applications.filter((a) => {
    const st = (a.status || '').toLowerCase();
    return st !== 'rejected' && st !== 'offer';
  }).length;

  const awaitingResponse = applications.filter((a) => {
    const st = (a.status || '').toLowerCase();
    const sg = (a.stage || '').toLowerCase();
    return st === 'applied' || st === 'screening' || sg.includes('submitted') || sg.includes('review');
  }).length;

  const scheduledInterviews = interviews.filter((i) => {
    const st = (i.status || 'scheduled').toLowerCase();
    return st !== 'cancelled' && st !== 'completed' && st !== 'rejected';
  }).length;

  const offersReceived = applications.filter((a) => (a.status || '').toLowerCase() === 'offer').length;

  const newOffers = offersReceived > 0 ? 1 : 0;

  return {
    totalApplications,
    applicationsGrowth,
    activeApplications,
    awaitingResponse,
    scheduledInterviews,
    newScheduledInterviews: scheduledInterviews,
    offersReceived,
    newOffers
  };
}

export async function fetchDashboardKpis(userEmail) {
  const email = (userEmail || 'debalina@example.com').trim();
  const endpoints = [
    `/api/dashboard/kpis?user_email=${encodeURIComponent(email)}`,
    `http://127.0.0.1:8000/api/dashboard/kpis?user_email=${encodeURIComponent(email)}`
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'X-User-Email': email
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          totalApplications: Number(data.totalApplications ?? 0),
          applicationsGrowth: Number(data.applicationsGrowth ?? 0),
          activeApplications: Number(data.activeApplications ?? 0),
          awaitingResponse: Number(data.awaitingResponse ?? 0),
          scheduledInterviews: Number(data.scheduledInterviews ?? 0),
          newScheduledInterviews: Number(data.newScheduledInterviews ?? 0),
          offersReceived: Number(data.offersReceived ?? 0),
          newOffers: Number(data.newOffers ?? 0)
        };
      }
    } catch (err) {}
  }

  throw new Error('Could not connect to KPI backend service');
}

export async function syncUserDataToBackend(userEmail, applications, interviews, reminders = null, profile = null) {
  if (!userEmail) return null;
  const email = userEmail.trim();
  const endpoints = [
    '/api/sync',
    'http://127.0.0.1:8000/api/sync'
  ];

  const bodyData = {
    user_email: email,
    applications: applications || [],
    interviews: interviews || []
  };
  if (reminders !== null) bodyData.reminders = reminders;
  if (profile !== null) bodyData.profile = profile;

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {}
  }

  return null;
}

export function normalizeDateToIso(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const s = dateStr.trim();
  if (s.toLowerCase() === 'present') return '';

  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const months = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };
  const txtMatch = s.match(/([a-zA-Z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (txtMatch) {
    const mKey = txtMatch[1].slice(0, 3).toLowerCase();
    if (months[mKey]) {
      const y = parseInt(txtMatch[3], 10);
      const m = String(months[mKey]).padStart(2, '0');
      const d = String(parseInt(txtMatch[2], 10)).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const parsed = Date.parse(s);
  if (!isNaN(parsed)) {
    const dt = new Date(parsed);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

export function calculateLocalWeeklyActivity(applications = [], interviews = []) {
  const days = [];
  const daysMap = {};
  const today = new Date();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dt}`;
    const dayName = dayNames[d.getDay()];
    const fullDate = `${fullDayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}, ${y}`;

    const entry = {
      date: dateStr,
      day: dayName,
      fullDate,
      applications: 0,
      interviews: 0,
      applicationsList: [],
      interviewsList: []
    };
    daysMap[dateStr] = entry;
    days.push(entry);
  }

  applications.forEach((app) => {
    const iso = normalizeDateToIso(app.appliedDate);
    if (iso && daysMap[iso]) {
      daysMap[iso].applications += 1;
      daysMap[iso].applicationsList.push(app);
    }
  });

  interviews.forEach((itw) => {
    const status = (itw.status || 'scheduled').toLowerCase();
    if (status === 'completed' || status === 'conducted') {
      const iso = normalizeDateToIso(itw.date);
      if (iso && daysMap[iso]) {
        daysMap[iso].interviews += 1;
        daysMap[iso].interviewsList.push(itw);
      }
    }
  });

  return { days };
}

export async function fetchWeeklyActivity(userEmail) {
  const email = (userEmail || 'debalina@example.com').trim();
  const endpoints = [
    `/api/dashboard/weekly-activity?user_email=${encodeURIComponent(email)}`,
    `http://127.0.0.1:8000/api/dashboard/weekly-activity?user_email=${encodeURIComponent(email)}`
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'X-User-Email': email
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.days) && data.days.length === 7) {
          return data;
        }
      }
    } catch (err) {}
  }

  throw new Error('Could not connect to Weekly Activity backend service');
}

export function calculateLocalAnalytics(applications = [], interviews = []) {
  const totalApplications = applications.length;
  if (totalApplications === 0) {
    return {
      conversion: {
        responseRate: '0%',
        interviewConversion: '0%',
        offerRate: '0%',
        averageResponseDays: '—',
        respondedCount: 0,
        interviewCount: 0,
        offerCount: 0,
        totalApplications: 0
      },
      channels: [],
      responseBreakdown: []
    };
  }

  const itwCompanies = new Set(
    interviews.map((i) => (i.company || '').trim().toLowerCase()).filter(Boolean)
  );

  let respondedCount = 0;
  let interviewCount = 0;
  let offerCount = 0;
  const validResponseDays = [];
  const channelCounts = {};
  const responseBreakdown = [];

  applications.forEach((app) => {
    const status = (app.status || '').trim().toLowerCase();
    const company = (app.company || '').trim();
    const source = (app.source || '').trim() || 'Other';
    channelCounts[source] = (channelCounts[source] || 0) + 1;

    const applIso = normalizeDateToIso(app.appliedDate);
    const respIso = normalizeDateToIso(app.responseDate);

    let daysTaken = null;
    if (applIso && respIso) {
      const d1 = new Date(applIso);
      const d2 = new Date(respIso);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (!isNaN(diffDays) && diffDays >= 0) {
        daysTaken = diffDays;
        validResponseDays.push(diffDays);
      }
    }

    const hasResponded = Boolean(respIso) || ['screening', 'interviewing', 'offer', 'rejected'].includes(status);
    if (hasResponded) respondedCount++;

    const isInterview = status === 'interviewing' || itwCompanies.has(company.toLowerCase());
    if (isInterview) interviewCount++;

    const isOffer = status === 'offer';
    if (isOffer) offerCount++;

    responseBreakdown.push({
      id: app.id,
      company: app.company,
      companyDomain: app.companyDomain || '',
      logo: app.logo || '',
      role: app.role || '',
      status: app.status || '',
      appliedDate: app.appliedDate || '',
      responseDate: respIso ? app.responseDate : null,
      responseDays: daysTaken,
      source,
      channel: source,
      hasResponded,
      isInterview,
      isOffer
    });
  });

  const responseRate = Math.round((respondedCount / totalApplications) * 100);
  const interviewConversion = Math.round((interviewCount / totalApplications) * 100);
  const offerRate = Math.round((offerCount / totalApplications) * 100);

  let averageResponseDays = '—';
  if (validResponseDays.length > 0) {
    const sum = validResponseDays.reduce((acc, d) => acc + d, 0);
    const avg = sum / validResponseDays.length;
    averageResponseDays = avg % 1 !== 0 ? `${avg.toFixed(1)} days` : `${Math.round(avg)} days`;
  }

  const channels = Object.entries(channelCounts)
    .map(([name, count]) => {
      const percent = Math.round((count / totalApplications) * 100);
      return {
        name,
        count,
        applications: count,
        percent,
        percentage: percent
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    conversion: {
      responseRate: `${responseRate}%`,
      interviewConversion: `${interviewConversion}%`,
      offerRate: `${offerRate}%`,
      averageResponseDays,
      respondedCount,
      interviewCount,
      offerCount,
      totalApplications
    },
    channels,
    responseBreakdown
  };
}

export async function fetchDashboardAnalytics(userEmail) {
  const email = (userEmail || 'debalina@example.com').trim();
  const endpoints = [
    `/api/dashboard/analytics?user_email=${encodeURIComponent(email)}`,
    `http://127.0.0.1:8000/api/dashboard/analytics?user_email=${encodeURIComponent(email)}`
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'X-User-Email': email
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.conversion && Array.isArray(data.channels)) {
          return data;
        }
      }
    } catch (err) {}
  }

  throw new Error('Could not connect to Analytics backend service');
}

export function calculateLocalStatusBreakdown(applications = []) {
  const totalApplications = applications.length;
  const canonicalStatuses = ['Applied', 'Screening', 'Interviewing', 'Offer', 'Rejected'];

  const counts = {
    Applied: 0,
    Screening: 0,
    Interviewing: 0,
    Offer: 0,
    Rejected: 0
  };

  applications.forEach((app) => {
    const rawStatus = (app.status || '').trim().toLowerCase();
    if (rawStatus === 'applied' || rawStatus.includes('submitt')) counts.Applied++;
    else if (rawStatus === 'screening' || rawStatus.includes('screen')) counts.Screening++;
    else if (rawStatus === 'interviewing' || rawStatus.includes('interview')) counts.Interviewing++;
    else if (rawStatus === 'offer') counts.Offer++;
    else if (rawStatus === 'rejected') counts.Rejected++;
    else counts.Applied++;
  });

  const statuses = canonicalStatuses.map((status) => {
    const count = counts[status];
    const percentage = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
    return {
      status,
      count,
      percentage
    };
  });

  return {
    totalApplications,
    statuses
  };
}

export async function fetchDashboardStatusBreakdown(userEmail) {
  const email = (userEmail || 'debalina@example.com').trim();
  const endpoints = [
    `/api/dashboard/status-breakdown?user_email=${encodeURIComponent(email)}`,
    `http://127.0.0.1:8000/api/dashboard/status-breakdown?user_email=${encodeURIComponent(email)}`
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'X-User-Email': email
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.statuses)) {
          return data;
        }
      }
    } catch (err) {}
  }

  throw new Error('Could not connect to Status Breakdown backend service');
}
