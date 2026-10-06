export const PRIORITY_TIMEZONES = [
  { id: 'Asia/Kolkata', label: 'India (IST)', city: 'Kolkata, Delhi, Mumbai, Bengaluru', country: 'India' },
  { id: 'America/New_York', label: 'New York (EDT / EST)', city: 'New York, Boston, Atlanta, Miami', country: 'United States' },
  { id: 'America/Los_Angeles', label: 'Los Angeles (PDT / PST)', city: 'Los Angeles, San Francisco, Seattle', country: 'United States' },
  { id: 'America/Chicago', label: 'Chicago (CDT / CST)', city: 'Chicago, Dallas, Houston, Austin', country: 'United States' },
  { id: 'Europe/London', label: 'London (BST / GMT)', city: 'London, Manchester, Edinburgh', country: 'United Kingdom' },
  { id: 'Europe/Berlin', label: 'Berlin / Paris (CEST / CET)', city: 'Berlin, Paris, Frankfurt, Amsterdam', country: 'Europe' },
  { id: 'Asia/Singapore', label: 'Singapore (SGT)', city: 'Singapore', country: 'Singapore' },
  { id: 'Asia/Tokyo', label: 'Tokyo (JST)', city: 'Tokyo, Osaka, Kyoto', country: 'Japan' },
  { id: 'Australia/Sydney', label: 'Sydney (AEST / AEDT)', city: 'Sydney, Melbourne, Canberra', country: 'Australia' }
];

export function normalizeTimezoneId(tz) {
  if (!tz) return 'America/New_York';
  if (tz === 'Asia/Calcutta') return 'Asia/Kolkata';
  if (tz === 'US/Eastern') return 'America/New_York';
  if (tz === 'US/Central') return 'America/Chicago';
  if (tz === 'US/Mountain') return 'America/Denver';
  if (tz === 'US/Pacific') return 'America/Los_Angeles';
  return tz;
}

export function getUserTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    return normalizeTimezoneId(tz);
  } catch {
    return 'Asia/Kolkata';
  }
}

export function getTimezoneAbbr(date, timeZone) {
  if (!timeZone) return '';
  const canonicalTz = normalizeTimezoneId(timeZone);
  const d = date instanceof Date && !isNaN(date) ? date : new Date();

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: canonicalTz,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(d);
    const val = parts.find((p) => p.type === 'timeZoneName')?.value;

    if (val && !val.startsWith('GMT') && !val.startsWith('UTC')) {
      return val;
    }

    if (canonicalTz === 'Asia/Kolkata') return 'IST';
    if (canonicalTz === 'Asia/Singapore') return 'SGT';
    if (canonicalTz === 'Asia/Tokyo') return 'JST';
    if (canonicalTz === 'Europe/London') return val && val.includes('+1') ? 'BST' : 'GMT';
    if (timeZone === 'Europe/Berlin') return val && val.includes('+2') ? 'CEST' : 'CET';
    if (timeZone === 'Australia/Sydney') return val && val.includes('+11') ? 'AEDT' : 'AEST';

    return val || timeZone;
  } catch {
    return timeZone;
  }
}

export function getTimezoneOffsetStr(date, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset'
    });
    const parts = formatter.formatToParts(date || new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value || '';
  } catch {
    return '';
  }
}

export function getAllSupportedTimezones(referenceDate = new Date()) {
  let allIds = [];
  try {
    if (typeof Intl !== 'undefined' && Intl.supportedValuesOf) {
      allIds = Intl.supportedValuesOf('timeZone');
    }
  } catch {
    allIds = [];
  }

  const prioritySet = new Set(PRIORITY_TIMEZONES.map((p) => p.id));
  const otherIds = allIds.filter((id) => !prioritySet.has(id));

  const priorityList = PRIORITY_TIMEZONES.map((item) => {
    const abbr = getTimezoneAbbr(referenceDate, item.id);
    const offset = getTimezoneOffsetStr(referenceDate, item.id);
    return {
      id: item.id,
      label: item.label,
      abbr,
      offset,
      fullText: `${item.id} (${abbr}${offset ? `, ${offset}` : ''}) - ${item.city}, ${item.country}`
    };
  });

  const otherList = otherIds.map((id) => {
    const abbr = getTimezoneAbbr(referenceDate, id);
    const offset = getTimezoneOffsetStr(referenceDate, id);
    const cleanName = id.replace(/_/g, ' ');
    return {
      id,
      label: cleanName,
      abbr,
      offset,
      fullText: `${id} (${abbr}${offset ? `, ${offset}` : ''})`
    };
  });

  return { priorityList, otherList };
}

export function formatTime12h(time24) {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.padStart(2, '0')} ${ampm}`;
}

export function formatDisplayDate(dateIso) {
  if (!dateIso) return '';
  const [y, m, d] = dateIso.split('-').map(Number);
  if (!y || !m || !d) return dateIso;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function createZonedDate(dateStr, timeStr, timeZone = 'America/New_York') {
  if (!dateStr || !timeStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  const tentativeUtc = new Date(Date.UTC(year, month - 1, day, hour || 0, minute || 0));

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(tentativeUtc);
    const getPart = (type) => Number(parts.find((p) => p.type === type)?.value || 0);

    const tzYear = getPart('year');
    const tzMonth = getPart('month');
    const tzDay = getPart('day');
    let tzHour = getPart('hour');
    if (tzHour === 24) tzHour = 0;
    const tzMinute = getPart('minute');

    const tzTimeAsUtc = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute);
    const offsetDiffMs = tzTimeAsUtc - tentativeUtc.getTime();

    return new Date(tentativeUtc.getTime() - offsetDiffMs);
  } catch {
    return tentativeUtc;
  }
}

export function parseLegacyTimeRange(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?(?:\s+([A-Za-z0-9_/+-]+))?/i);
  if (!match) return null;

  let [_, h1, m1, ap1, h2, m2, ap2, tzRaw] = match;
  let hour1 = parseInt(h1, 10);
  let hour2 = parseInt(h2, 10);

  if (ap1) {
    if (ap1.toUpperCase() === 'PM' && hour1 < 12) hour1 += 12;
    if (ap1.toUpperCase() === 'AM' && hour1 === 12) hour1 = 0;
  }
  if (ap2) {
    if (ap2.toUpperCase() === 'PM' && hour2 < 12) hour2 += 12;
    if (ap2.toUpperCase() === 'AM' && hour2 === 12) hour2 = 0;
  }

  const startTime = `${String(hour1).padStart(2, '0')}:${m1}`;
  const endTime = `${String(hour2).padStart(2, '0')}:${m2}`;

  let timeZone = 'America/New_York';
  const tzClean = (tzRaw || '').toUpperCase();
  if (tzClean === 'IST') timeZone = 'Asia/Kolkata';
  else if (tzClean === 'BST' || tzClean === 'GMT') timeZone = 'Europe/London';
  else if (tzClean === 'JST') timeZone = 'Asia/Tokyo';
  else if (tzClean === 'PST' || tzClean === 'PDT') timeZone = 'America/Los_Angeles';
  else if (tzClean === 'CST' || tzClean === 'CDT') timeZone = 'America/Chicago';
  else if (tzClean === 'SGT') timeZone = 'Asia/Singapore';
  else if (tzClean === 'AEST' || tzClean === 'AEDT') timeZone = 'Australia/Sydney';

  return { startTime, endTime, timeZone };
}

export function parseDateToIso(str) {
  if (!str) return '';
  const trimmed = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (match) {
    const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    const m = months[match[1].toLowerCase().slice(0, 3)];
    if (m) {
      const d = match[2].padStart(2, '0');
      const y = match[3];
      return `${y}-${m}-${d}`;
    }
  }

  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export function getInterviewDisplay(interview, targetTimeZone = null) {
  let dateIso = interview?.interviewDate || parseDateToIso(interview?.date) || new Date().toISOString().slice(0, 10);
  let startTime = interview?.startTime;
  let endTime = interview?.endTime;
  let rawScheduledTz = interview?.timeZone || 'America/New_York';

  if (!startTime || !endTime) {
    const parsed = parseLegacyTimeRange(interview?.time);
    if (parsed) {
      startTime = parsed.startTime;
      endTime = parsed.endTime;
      rawScheduledTz = interview?.timeZone || parsed.timeZone || 'America/New_York';
    } else {
      startTime = '14:00';
      endTime = '15:00';
    }
  }

  const scheduledTz = normalizeTimezoneId(rawScheduledTz);

  const dtStart = createZonedDate(dateIso, startTime, scheduledTz);
  const dtEnd = createZonedDate(dateIso, endTime, scheduledTz);

  const scheduledAbbr = getTimezoneAbbr(dtStart, scheduledTz);
  const scheduledTimeStr = `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
  const scheduledDateStr = formatDisplayDate(dateIso);

  const activeTz = normalizeTimezoneId(targetTimeZone || scheduledTz);
  const activeAbbr = getTimezoneAbbr(dtStart, activeTz);

  const timeFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: activeTz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const dateFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: activeTz,
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const displayDate = dateFmt.format(dtStart);
  const displayTime = `${timeFmt.format(dtStart)} – ${timeFmt.format(dtEnd)}`;
  const displayTimezone = `${activeTz} (${activeAbbr})`;

  const isConverted = activeTz !== scheduledTz;

  const localTz = getUserTimezone();

  let localEquivalent = null;
  if (localTz !== scheduledTz) {
    const localTimeFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: localTz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const localDateFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: localTz,
      month: 'short',
      day: 'numeric'
    });
    const localAbbr = getTimezoneAbbr(dtStart, localTz);
    localEquivalent = {
      date: localDateFmt.format(dtStart),
      time: `${localTimeFmt.format(dtStart)} – ${localTimeFmt.format(dtEnd)}`,
      timeZone: localTz,
      abbr: localAbbr,
      formatted: `${localTimeFmt.format(dtStart)} – ${localTimeFmt.format(dtEnd)} ${localAbbr}`
    };
  }

  return {
    scheduled: {
      date: scheduledDateStr,
      time: scheduledTimeStr,
      timeZone: scheduledTz,
      abbr: scheduledAbbr,
      fullText: `${scheduledDateStr} • ${scheduledTimeStr} ${scheduledTz} (${scheduledAbbr})`
    },
    displayDate,
    displayTime,
    displayTimezone,
    activeTz,
    activeAbbr,
    isConverted,
    localTz,
    localEquivalent
  };
}

export function isEndTimeValid(startTime, endTime) {
  if (!startTime || !endTime) return true;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return true;
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  return endMinutes > startMinutes;
}
