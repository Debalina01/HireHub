const memoryCache = new Map();
const CACHE_STORAGE_KEY = 'companyLogoCache';

const STOP_WORDS = new Set([
  'inc', 'llc', 'ltd', 'corp', 'corporation', 'company', 'co',
  'technologies', 'technology', 'solutions', 'group', 'services',
  'enterprises', 'labs', 'app', 'ai', 'io', 'the', 'private', 'limited', 'pvt', 'software'
]);

export function normalizeSearchQuery(query) {
  if (!query || typeof query !== 'string') return '';
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function normalizeCompanyKey(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .replace(/\.[a-z]{2,}(?:\.[a-z]{2,})?$/i, '')
    .replace(/\./g, '')
    .replace(/[^a-z0-9]/g, '');
}

function tokenize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function getCoreStem(str) {
  const words = tokenize(str).filter((w) => !STOP_WORDS.has(w));
  return words.join('');
}

export function scoreCandidate(query, cand, rankIndex = -1) {
  if (!cand || !cand.domain) return 0;
  const qClean = normalizeSearchQuery(query);
  const qNorm = normalizeCompanyKey(qClean);
  if (!qNorm) return 0;

  const candName = (cand.name || '').trim();
  const candNameClean = normalizeSearchQuery(candName);
  const candNameNorm = normalizeCompanyKey(candName);

  const domainHost = (cand.domain || '')
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0];
  const domainParts = domainHost.split('.');
  const domainStem = domainParts[0];
  const domainStemNorm = normalizeCompanyKey(domainStem);
  const fullDomainNorm = normalizeCompanyKey(domainHost);

  let score = 0;

  if (candNameNorm === qNorm || candNameClean === qClean) {
    score += 300;
  }

  if (domainStemNorm === qNorm) {
    score += 280;
  } else if (fullDomainNorm === qNorm) {
    score += 260;
  }

  const candWords = tokenize(candName);
  if (candWords.length > 1 && candWords.every((w) => w.length > 1)) {
    const acronym = candWords.map((w) => w[0]).join('');
    if (acronym === qNorm) score += 250;
  }

  const qCore = getCoreStem(qClean);
  const candCore = getCoreStem(candName);
  if (candCore && qNorm && candCore === qNorm) {
    score += 240;
  } else if (qCore && candCore && qCore === candCore) {
    score += 220;
  }

  if (candNameClean.startsWith(qClean) || candNameNorm.startsWith(qNorm)) {
    score += 200;
  }

  if (domainStemNorm.startsWith(qNorm) || domainHost.startsWith(qClean)) {
    score += 180;
  }

  if (candNameClean.includes(qClean) || candNameNorm.includes(qNorm)) {
    score += 140;
  } else {
    const qWords = tokenize(qClean);
    const matchingWords = qWords.filter((qw, idx) =>
      candWords.some((cw) => cw === qw || (idx === qWords.length - 1 && cw.startsWith(qw)))
    );
    if (matchingWords.length === qWords.length && qWords.length > 1) {
      score += 150;
    } else if (matchingWords.length > 0) {
      score += Math.round((matchingWords.length / qWords.length) * 80);
    }
  }

  if (domainStemNorm.includes(qNorm) || fullDomainNorm.includes(qNorm)) {
    score += 120;
  }

  if (rankIndex >= 0) {
    score += Math.max(50 - rankIndex * 4, 10);
  } else {
    score += 20;
  }

  const tld = domainParts.slice(1).join('.');
  if (tld === 'com') {
    score += 25;
  } else if (['ai', 'io', 'app', 'so', 'dev', 'co', 'in', 'tech', 'de', 'uk', 'fr'].includes(tld)) {
    score += 20;
  }

  if (cand.verified) score += 20;
  if (typeof cand.qualityScore === 'number' && cand.qualityScore > 0) {
    score += Math.round(cand.qualityScore * 20);
  }

  if (/wordpress|blogspot|wixsite|github\.io|gitlab\.io|weebly/i.test(domainHost)) {
    score -= 60;
  }

  return score;
}

export function verifyCandidateMatch(query, cand) {
  if (!cand || !cand.domain) return false;
  const qClean = normalizeSearchQuery(query);
  const qNorm = normalizeCompanyKey(qClean);
  if (!qNorm) return false;

  const candName = (cand.name || '').trim();
  const candNameNorm = normalizeCompanyKey(candName);
  const candNameClean = normalizeSearchQuery(candName);

  const domainHost = (cand.domain || '')
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0];
  const domainParts = domainHost.split('.');
  const domainStemNorm = normalizeCompanyKey(domainParts[0]);
  const fullDomainNorm = normalizeCompanyKey(domainHost);

  const candWords = tokenize(candName);
  const acronym = candWords.length > 1 && candWords.every((w) => w.length > 1) ? candWords.map((w) => w[0]).join('') : '';

  const qCore = getCoreStem(qClean);
  const candCore = getCoreStem(candName);

  if (
    candNameNorm === qNorm ||
    candNameClean === qClean ||
    domainStemNorm === qNorm ||
    fullDomainNorm === qNorm ||
    acronym === qNorm ||
    (Boolean(qCore) && Boolean(candCore) && qCore === candCore)
  ) {
    return true;
  }

  const qWords = tokenize(qClean);
  if (qWords.length > 1 && candWords.length >= qWords.length) {
    const allWordsPresent = qWords.every((qw, idx) =>
      candWords.some((cw) => cw === qw || (idx === qWords.length - 1 && cw.startsWith(qw)))
    );
    if (allWordsPresent) return true;
  }

  return false;
}

function getFromCache(key) {
  const normKey = normalizeCompanyKey(key);
  if (!normKey) return null;

  const validate = (data) => {
    if (!data || !data.companyDomain || !data.logo) return null;
    if (typeof data.logo === 'string' && data.logo.includes('logos.hunter.io')) {
      return null;
    }
    return data;
  };

  if (memoryCache.has(normKey)) {
    const valid = validate(memoryCache.get(normKey));
    if (valid) return valid;
    memoryCache.delete(normKey);
  }

  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed[normKey]) {
          const valid = validate(parsed[normKey]);
          if (valid) {
            memoryCache.set(normKey, valid);
            return valid;
          }
          delete parsed[normKey];
          localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch (err) {}
  }
  return null;
}

function saveToCache(rawName, data) {
  const normKey = normalizeCompanyKey(rawName);
  if (!normKey || !data) return;

  if (!data.companyDomain || !data.logo) {
    memoryCache.delete(normKey);
    return;
  }

  memoryCache.set(normKey, data);

  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[normKey] = data;
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(parsed));
    } catch (err) {}
  }
}

export function invalidateCachedCompany(name) {
  const normKey = normalizeCompanyKey(name);
  if (!normKey) return;
  memoryCache.delete(normKey);
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        delete parsed[normKey];
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {}
  }
}

const domainLogoCache = new Map();
const DOMAIN_LOGO_STORAGE_KEY = 'hirehub_verified_domain_logos';

if (typeof localStorage !== 'undefined') {
  try {
    const raw = localStorage.getItem(DOMAIN_LOGO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const [k, v] of Object.entries(parsed)) {
        if (k && v && typeof v === 'string') domainLogoCache.set(k, v);
      }
    }
  } catch (e) {}
}

export function cacheDomainLogo(domain, url) {
  if (!domain || !url || typeof url !== 'string') return;
  const clean = domain.toLowerCase().trim();
  domainLogoCache.set(clean, url);
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(DOMAIN_LOGO_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[clean] = url;
      localStorage.setItem(DOMAIN_LOGO_STORAGE_KEY, JSON.stringify(parsed));
    } catch (e) {}
  }
}

export function getDomainLogoFromCache(domain) {
  if (!domain) return null;
  const clean = domain.toLowerCase().trim();
  return domainLogoCache.get(clean) || null;
}

export function getDomainLogoFallbackChain(domain, initialLogo = '') {
  if (!domain || typeof domain !== 'string') {
    if (initialLogo && typeof initialLogo === 'string' && !initialLogo.includes('logos.hunter.io')) {
      return [initialLogo];
    }
    return [];
  }
  const cleanDomain = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0];
  if (!cleanDomain || !cleanDomain.includes('.')) {
    if (initialLogo && typeof initialLogo === 'string' && !initialLogo.includes('logos.hunter.io')) {
      return [initialLogo];
    }
    return [];
  }

  let publishableKey = '';
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      publishableKey = import.meta.env.VITE_LOGODEV_PUBLISHABLE_KEY || '';
    } else if (typeof process !== 'undefined' && process.env) {
      publishableKey = process.env.VITE_LOGODEV_PUBLISHABLE_KEY || '';
    }
  } catch (e) {}

  const sources = [];

  const cachedUrl = getDomainLogoFromCache(cleanDomain);
  if (cachedUrl && !sources.includes(cachedUrl)) {
    sources.push(cachedUrl);
  }

  if (initialLogo && typeof initialLogo === 'string' && !initialLogo.includes('logos.hunter.io')) {
    if (!sources.includes(initialLogo)) sources.push(initialLogo);
  }

  if (publishableKey) {
    const logoDevUrl = `https://img.logo.dev/${cleanDomain}?token=${publishableKey}`;
    if (!sources.includes(logoDevUrl)) sources.push(logoDevUrl);
  }

  const unavatarUrl = `https://unavatar.io/${cleanDomain}?fallback=false`;
  if (!sources.includes(unavatarUrl)) sources.push(unavatarUrl);

  const officialDomainIcon = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128&default_icon=none`;
  if (!sources.includes(officialDomainIcon)) sources.push(officialDomainIcon);

  return sources;
}

export function buildLogoUrl(domain) {
  if (!domain || typeof domain !== 'string') return '';
  const cleanDomain = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0];
  if (!cleanDomain || !cleanDomain.includes('.')) return '';

  let publishableKey = '';
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      publishableKey = import.meta.env.VITE_LOGODEV_PUBLISHABLE_KEY || '';
    } else if (typeof process !== 'undefined' && process.env) {
      publishableKey = process.env.VITE_LOGODEV_PUBLISHABLE_KEY || '';
    }
  } catch (e) {}

  if (publishableKey) {
    return `https://img.logo.dev/${cleanDomain}?token=${publishableKey}`;
  }
  return `https://unavatar.io/${cleanDomain}?fallback=false`;
}

const suggestionCache = new Map();

export function getCachedSuggestions(query) {
  if (!query || typeof query !== 'string') return null;
  const normalizedQuery = normalizeSearchQuery(query);
  if (normalizedQuery.length < 2) return null;
  const cacheKey = `suggest_${normalizeCompanyKey(normalizedQuery)}`;
  return suggestionCache.get(cacheKey) || null;
}

export async function fetchCompanySuggestions(query, signal = null) {
  if (!query || typeof query !== 'string') return [];
  const normalizedQuery = normalizeSearchQuery(query);
  if (normalizedQuery.length < 2) return [];

  const cacheKey = `suggest_${normalizeCompanyKey(normalizedQuery)}`;
  if (suggestionCache.has(cacheKey)) {
    return suggestionCache.get(cacheKey);
  }

  const candidates = [];
  const seenDomains = new Set();

  const addCandidate = (cand, rankIndex = -1) => {
    if (!cand || !cand.domain) return;
    const cleanDomain = cand.domain
      .toLowerCase()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .trim();
    if (!cleanDomain || !cleanDomain.includes('.') || seenDomains.has(cleanDomain)) return;
    seenDomains.add(cleanDomain);

    const score = scoreCandidate(normalizedQuery, {
      name: cand.name,
      domain: cleanDomain,
      qualityScore: cand.qualityScore,
      verified: cand.verified,
      claimed: cand.claimed
    }, rankIndex);

    const verifiedLogo =
      cand.logo || cand.logo_url || cand.icon || buildLogoUrl(cleanDomain);
    candidates.push({
      name: cand.name || query.trim(),
      domain: cleanDomain,
      logo: verifiedLogo,
      score
    });
  };

  try {
    const resp = await fetch(`/api/company/search?q=${encodeURIComponent(normalizedQuery)}`, { signal });
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((item, idx) =>
          addCandidate(
            {
              name: item.name,
              domain: item.domain,
              logo: item.logo || item.logo_url || item.icon,
              qualityScore: item.qualityScore,
              verified: item.verified,
              claimed: item.claimed
            },
            idx
          )
        );
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }

  if (candidates.length === 0) {
    try {
      const [bfRes, cbRes] = await Promise.all([
        fetch(`https://api.brandfetch.io/v2/search/${encodeURIComponent(normalizedQuery)}`, { signal })
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
        fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(normalizedQuery)}`, { signal })
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [])
      ]);

      if (Array.isArray(bfRes)) {
        bfRes.forEach((item, idx) =>
          addCandidate(
            {
              name: item.name,
              domain: item.domain,
              logo: item.icon,
              icon: item.icon,
              qualityScore: item.qualityScore,
              verified: item.verified,
              claimed: item.claimed
            },
            idx
          )
        );
      }

      if (Array.isArray(cbRes)) {
        cbRes.forEach((item, idx) =>
          addCandidate(
            {
              name: item.name,
              domain: item.domain,
              logo: item.logo,
              icon: item.logo
            },
            idx
          )
        );
      }
    } catch (err) {
      if (err.name === 'AbortError') throw err;
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const topResults = candidates.slice(0, 8).map(({ name, domain, logo }) => ({ name, domain, logo }));
  suggestionCache.set(cacheKey, topResults);
  return topResults;
}

export async function resolveCompanyLogo(companyName) {
  if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
    return {
      companyName: '',
      companyDomain: '',
      logo: ''
    };
  }

  const rawClean = companyName.trim();
  const normalizedQuery = normalizeSearchQuery(rawClean);

  const cached = getFromCache(rawClean) || getFromCache(normalizedQuery);
  if (cached && cached.companyDomain && cached.logo) {
    return cached;
  }

  let canonicalName = rawClean;
  let canonicalDomain = '';
  let logoUrl = '';

  if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(normalizedQuery)) {
    canonicalDomain = normalizedQuery.toLowerCase();
    canonicalName = rawClean.split('.')[0];
    logoUrl = buildLogoUrl(canonicalDomain);
    const result = { companyName: canonicalName, companyDomain: canonicalDomain, logo: logoUrl };
    saveToCache(rawClean, result);
    saveToCache(normalizedQuery, result);
    return result;
  }

  try {
    const resp = await fetch(
      `/api/company-logo?name=${encodeURIComponent(normalizedQuery)}`
    );
    if (resp.ok) {
      const data = await resp.json();
      if (
        data &&
        data.companyDomain &&
        verifyCandidateMatch(normalizedQuery, { name: data.companyName, domain: data.companyDomain })
      ) {
        canonicalName = data.companyName || canonicalName;
        canonicalDomain = data.companyDomain;
        logoUrl = data.logo || buildLogoUrl(canonicalDomain);
      }
    }
  } catch (err) {
  }

  if (!canonicalDomain) {
    const candidateList = [];
    const searchQueries = [normalizedQuery];
    if (!normalizedQuery.includes('.') && !normalizedQuery.includes(' ')) {
      searchQueries.push(`${normalizedQuery}.com`);
    }

    try {
      const fetchList = [
        fetch(`https://api.brandfetch.io/v2/search/${encodeURIComponent(normalizedQuery)}`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
        ...searchQueries.map((q) =>
          fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(q)}`)
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => [])
        )
      ];

      const [bfData, ...cbDataArrays] = await Promise.all(fetchList);

      if (Array.isArray(bfData)) {
        bfData.forEach((item, idx) => {
          if (verifyCandidateMatch(normalizedQuery, item)) {
            const score = scoreCandidate(normalizedQuery, item, idx);
            if (score >= 50) {
              candidateList.push({
                name: item.name,
                domain: (item.domain || '').toLowerCase().trim(),
                logo: item.icon,
                icon: item.icon,
                score
              });
            }
          }
        });
      }

      for (const cbData of cbDataArrays) {
        if (Array.isArray(cbData) && cbData.length > 0) {
          cbData.forEach((item, idx) => {
            if (verifyCandidateMatch(normalizedQuery, item)) {
              const score = scoreCandidate(normalizedQuery, item, idx);
              if (score >= 50) {
                candidateList.push({
                  name: item.name,
                  domain: (item.domain || '').toLowerCase().trim(),
                  logo: item.logo,
                  icon: item.logo,
                  score
                });
              }
            }
          });
        }
      }
    } catch (err) {}

    if (candidateList.length > 0) {
      candidateList.sort((a, b) => b.score - a.score);
      canonicalName = candidateList[0].name || canonicalName;
      canonicalDomain = candidateList[0].domain;
      logoUrl = candidateList[0].logo || candidateList[0].logo_url || candidateList[0].icon || buildLogoUrl(canonicalDomain);
    }
  }

  if (canonicalDomain) {
    const resolvedData = {
      companyName: canonicalName,
      companyDomain: canonicalDomain,
      logo: logoUrl || buildLogoUrl(canonicalDomain)
    };
    saveToCache(rawClean, resolvedData);
    saveToCache(normalizedQuery, resolvedData);
    saveToCache(canonicalDomain, resolvedData);
    saveToCache(canonicalName, resolvedData);
    return resolvedData;
  }

  const unverified = {
    companyName: rawClean,
    companyDomain: '',
    logo: ''
  };
  return unverified;
}

export function resolveCompanySync(companyName) {
  if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
    return {
      companyName: '',
      companyDomain: '',
      logo: ''
    };
  }

  const rawClean = companyName.trim();
  const normalizedQuery = normalizeSearchQuery(rawClean);
  const cached = getFromCache(rawClean) || getFromCache(normalizedQuery);
  if (cached) {
    return cached;
  }

  if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(normalizedQuery)) {
    const domain = normalizedQuery.toLowerCase();
    const result = {
      companyName: rawClean.split('.')[0],
      companyDomain: domain,
      logo: buildLogoUrl(domain)
    };
    saveToCache(rawClean, result);
    saveToCache(normalizedQuery, result);
    return result;
  }

  return {
    companyName: rawClean,
    companyDomain: '',
    logo: ''
  };
}

export async function migrateRecord(record) {
  if (!record || !record.company) return record;

  const resolved = await resolveCompanyLogo(record.company);

  return {
    ...record,
    company: resolved.companyName || record.company,
    companyDomain: resolved.companyDomain || record.companyDomain || '',
    logo: resolved.logo || record.logo || ''
  };
}

export async function migrateRecordList(list) {
  if (!Array.isArray(list)) return [];
  const migrated = await Promise.all(list.map((item) => migrateRecord(item)));
  return migrated;
}
