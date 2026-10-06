import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootProjectDir = path.resolve(__dirname, '..');

export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv(mode, rootProjectDir, ''),
    ...loadEnv(mode, process.cwd(), '')
  };

  const secretKey =
    env.LOGO_DEV_SECRET_KEY ||
    env.LOGODEV_SECRET_KEY ||
    process.env.LOGO_DEV_SECRET_KEY ||
    '';

  const publishableKey =
    env.VITE_LOGODEV_PUBLISHABLE_KEY ||
    process.env.VITE_LOGODEV_PUBLISHABLE_KEY ||
    '';

  const STOP_WORDS = new Set([
    'inc', 'llc', 'ltd', 'corp', 'corporation', 'company', 'co',
    'technologies', 'technology', 'solutions', 'group', 'services',
    'enterprises', 'labs', 'app', 'ai', 'io', 'the', 'private', 'limited', 'pvt', 'software'
  ]);

  const buildLogoUrl = (domain) => {
    if (!domain) {
      return '';
    }

    const cleanDomain = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0];

    if (publishableKey) {
      return `https://img.logo.dev/${cleanDomain}?token=${publishableKey}`;
    }

    return `https://unavatar.io/${cleanDomain}?fallback=false`;
  };

  const normalizeSearchQuery = (query) => {
    if (!query || typeof query !== 'string') {
      return '';
    }

    return query
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  };

  const normalizeKey = (str) => {
    if (!str || typeof str !== 'string') {
      return '';
    }

    return str
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .replace(/\.[a-z]{2,}(?:\.[a-z]{2,})?$/i, '')
      .replace(/\./g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const tokenize = (str) => {
    return (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  };

  const getCoreStem = (str) => {
    return tokenize(str)
      .filter((word) => !STOP_WORDS.has(word))
      .join('');
  };

  const scoreCandidate = (query, cand, rankIndex = -1) => {
    if (!cand || !cand.domain) {
      return 0;
    }

    const qClean = normalizeSearchQuery(query);
    const qNorm = normalizeKey(qClean);
    if (!qNorm) {
      return 0;
    }

    const candName = (cand.name || '').trim();
    const candNameClean = normalizeSearchQuery(candName);
    const candNameNorm = normalizeKey(candName);

    const domainHost = (cand.domain || '')
      .toLowerCase()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0];

    const domainParts = domainHost.split('.');
    const domainStem = domainParts[0];
    const domainStemNorm = normalizeKey(domainStem);
    const fullDomainNorm = normalizeKey(domainHost);

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
    if (candWords.length > 1 && candWords.every((word) => word.length > 1)) {
      const acronym = candWords.map((word) => word[0]).join('');
      if (acronym === qNorm) {
        score += 250;
      }
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

    if (cand.verified) {
      score += 20;
    }

    if (typeof cand.qualityScore === 'number' && cand.qualityScore > 0) {
      score += Math.round(cand.qualityScore * 20);
    }

    if (/wordpress|blogspot|wixsite|github\.io|gitlab\.io|weebly/i.test(domainHost)) {
      score -= 60;
    }

    return score;
  };

  const verifyCandidateMatch = (query, cand) => {
    if (!cand || !cand.domain) {
      return false;
    }

    const qClean = normalizeSearchQuery(query);
    const qNorm = normalizeKey(qClean);
    if (!qNorm) {
      return false;
    }

    const candName = (cand.name || '').trim();
    const candNameNorm = normalizeKey(candName);
    const candNameClean = normalizeSearchQuery(candName);

    const domainHost = (cand.domain || '')
      .toLowerCase()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0];

    const domainParts = domainHost.split('.');
    const domainStemNorm = normalizeKey(domainParts[0]);
    const fullDomainNorm = normalizeKey(domainHost);

    const candWords = tokenize(candName);
    const acronym =
      candWords.length > 1 && candWords.every((word) => word.length > 1)
        ? candWords.map((word) => word[0]).join('')
        : '';

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

      if (allWordsPresent) {
        return true;
      }
    }

    return false;
  };

  const searchCache = new Map();
  const companyLogoCache = new Map();
  const MAX_CACHE_SIZE = 500;

  return {
    envDir: rootProjectDir,
    server: {
      proxy: {
        '/api/dashboard': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true
        },
        '/api/jobs': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true
        },
        '/api/saved-jobs': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true
        },
        '/api/applications': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true
        },
        '/api/companies': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true
        },
        '/api/sync': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true
        },
        '/api/search': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true
        },
        '/api/profile': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true
        },
        '/api/chat': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true
        },
        '/uploads': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true
        }
      },
      watch: {
        ignored: ['**/scratch/**', '**/scratch/**/*', '**/.system_generated/**']
      }
    },
    plugins: [
      {
        name: 'hirehub-company-logo-api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/company/search')) {
              try {
                const url = new URL(req.url, 'http://localhost');
                const rawQuery = (url.searchParams.get('q') || url.searchParams.get('name') || '').trim();
                const query = normalizeSearchQuery(rawQuery);

                if (!query || query.length < 2) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end('[]');
                  return;
                }

                if (searchCache.has(query)) {
                  res.setHeader('Content-Type', 'application/json');
                  res.setHeader('X-Cache', 'HIT');
                  res.end(JSON.stringify(searchCache.get(query)));
                  return;
                }

                const candidates = [];
                const seenDomains = new Set();

                const addCandidate = (cand, rankIndex = -1) => {
                  if (!cand || !cand.domain) {
                    return;
                  }

                  const cleanDomain = cand.domain
                    .toLowerCase()
                    .replace(/^https?:\/\//i, '')
                    .replace(/^www\./i, '')
                    .split('/')[0]
                    .trim();

                  if (!cleanDomain || !cleanDomain.includes('.') || seenDomains.has(cleanDomain)) {
                    return;
                  }

                  seenDomains.add(cleanDomain);

                  const score = scoreCandidate(
                    query,
                    {
                      name: cand.name,
                      domain: cleanDomain,
                      qualityScore: cand.qualityScore,
                      verified: cand.verified,
                      claimed: cand.claimed
                    },
                    rankIndex
                  );

                  const verifiedLogo =
                    cand.logo_url || cand.logo || cand.icon || buildLogoUrl(cleanDomain);

                  candidates.push({
                    name: cand.name || query,
                    domain: cleanDomain,
                    logo: verifiedLogo,
                    score
                  });
                };

                // Logo.dev search
                if (secretKey) {
                  try {
                    const resp = await fetch(
                      `https://api.logo.dev/search?q=${encodeURIComponent(query)}&strategy=suggest`,
                      {
                        headers: {
                          Authorization: `Bearer ${secretKey}`,
                          Accept: 'application/json'
                        }
                      }
                    );

                    if (resp.ok) {
                      const data = await resp.json();
                      if (Array.isArray(data)) {
                        data.forEach((item, idx) => {
                          addCandidate(
                            {
                              name: item.name,
                              domain: item.domain,
                              logo: item.logo_url || item.logo,
                              logo_url: item.logo_url,
                              verified: true,
                              qualityScore: 1.0
                            },
                            idx
                          );
                        });
                      }
                    }
                  } catch (err) {}
                }

                try {
                  const [bfResp, cbResp] = await Promise.all([
                    fetch(`https://api.brandfetch.io/v2/search/${encodeURIComponent(query)}`)
                      .then((r) => (r.ok ? r.json() : []))
                      .catch(() => []),
                    fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`)
                      .then((r) => (r.ok ? r.json() : []))
                      .catch(() => [])
                  ]);

                  if (Array.isArray(bfResp)) {
                    bfResp.forEach((item, idx) => {
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
                      );
                    });
                  }

                  if (Array.isArray(cbResp)) {
                    cbResp.forEach((item, idx) => {
                      addCandidate(
                        {
                          name: item.name,
                          domain: item.domain,
                          logo: item.logo,
                          icon: item.logo
                        },
                        idx
                      );
                    });
                  }
                } catch (err) {}

                candidates.sort((a, b) => b.score - a.score);

                const topSuggestions = candidates
                  .slice(0, 8)
                  .map(({ name, domain, logo }) => ({ name, domain, logo }));

                if (searchCache.size >= MAX_CACHE_SIZE) {
                  const firstKey = searchCache.keys().next().value;
                  searchCache.delete(firstKey);
                }
                searchCache.set(query, topSuggestions);

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('X-Cache', 'MISS');
                res.end(JSON.stringify(topSuggestions));
                return;
              } catch (err) {
                res.setHeader('Content-Type', 'application/json');
                res.end('[]');
                return;
              }
            }

            // Company logo lookup
            if (req.url && req.url.startsWith('/api/company-logo')) {
              try {
                const url = new URL(req.url, 'http://localhost');
                const rawName = (
                  url.searchParams.get('name') ||
                  url.searchParams.get('q') ||
                  ''
                ).trim();
                const trimmed = normalizeSearchQuery(rawName);

                if (!trimmed) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      companyName: '',
                      companyDomain: '',
                      logo: ''
                    })
                  );
                  return;
                }

                let canonicalName = rawName || trimmed;
                let canonicalDomain = '';
                let logoUrl = '';

                if (companyLogoCache.has(trimmed)) {
                  res.setHeader('Content-Type', 'application/json');
                  res.setHeader('X-Cache', 'HIT');
                  res.end(JSON.stringify(companyLogoCache.get(trimmed)));
                  return;
                }

                if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
                  canonicalDomain = trimmed.toLowerCase();
                  canonicalName = trimmed.split('.')[0];
                  logoUrl = buildLogoUrl(canonicalDomain);
                }

                // Logo.dev search
                if (!canonicalDomain && secretKey) {
                  try {
                    let resp = await fetch(
                      `https://api.logo.dev/search?q=${encodeURIComponent(trimmed)}&strategy=match`,
                      {
                        headers: {
                          Authorization: `Bearer ${secretKey}`,
                          Accept: 'application/json'
                        }
                      }
                    );

                    let matches = resp.ok ? await resp.json() : [];

                    if (!matches.length && resp.ok) {
                      const suggestResp = await fetch(
                        `https://api.logo.dev/search?q=${encodeURIComponent(trimmed)}&strategy=suggest`,
                        {
                          headers: {
                            Authorization: `Bearer ${secretKey}`,
                            Accept: 'application/json'
                          }
                        }
                      );
                      matches = suggestResp.ok ? await suggestResp.json() : [];
                    }

                    if (Array.isArray(matches) && matches.length > 0) {
                      const scored = matches
                        .map((m, idx) => ({ ...m, score: scoreCandidate(trimmed, m, idx) }))
                        .filter((m) => verifyCandidateMatch(trimmed, m) && m.score >= 50)
                        .sort((a, b) => b.score - a.score);

                      if (scored.length > 0) {
                        canonicalName = scored[0].name || canonicalName;
                        canonicalDomain = (scored[0].domain || '').toLowerCase().trim();
                        logoUrl =
                          scored[0].logo_url ||
                          scored[0].logo ||
                          (canonicalDomain ? buildLogoUrl(canonicalDomain) : '');
                      }
                    }
                  } catch (err) {}
                }

                if (!canonicalDomain) {
                  const candidateList = [];
                  const searchQueries = [trimmed];

                  if (!trimmed.includes('.') && !trimmed.includes(' ')) {
                    searchQueries.push(`${trimmed}.com`);
                  }

                  try {
                    const fetchPromises = [
                      fetch(`https://api.brandfetch.io/v2/search/${encodeURIComponent(trimmed)}`)
                        .then((r) => (r.ok ? r.json() : []))
                        .catch(() => []),
                      ...searchQueries.map((q) =>
                        fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(q)}`)
                          .then((r) => (r.ok ? r.json() : []))
                          .catch(() => [])
                      )
                    ];

                    const [bfData, ...cbDataArrays] = await Promise.all(fetchPromises);

                    if (Array.isArray(bfData)) {
                      bfData.forEach((item, idx) => {
                        if (verifyCandidateMatch(trimmed, item)) {
                          const score = scoreCandidate(trimmed, item, idx);
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
                          if (verifyCandidateMatch(trimmed, item)) {
                            const score = scoreCandidate(trimmed, item, idx);
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
                    logoUrl =
                      candidateList[0].logo ||
                      candidateList[0].logo_url ||
                      candidateList[0].icon ||
                      (canonicalDomain ? buildLogoUrl(canonicalDomain) : '');
                  }
                }

                if (!logoUrl && canonicalDomain) {
                  logoUrl = buildLogoUrl(canonicalDomain);
                }

                const resolvedResult = {
                  companyName: canonicalName,
                  companyDomain: canonicalDomain,
                  logo: logoUrl
                };

                if (canonicalDomain) {
                  if (companyLogoCache.size >= MAX_CACHE_SIZE) {
                    const firstKey = companyLogoCache.keys().next().value;
                    companyLogoCache.delete(firstKey);
                  }
                  companyLogoCache.set(trimmed, resolvedResult);
                  if (rawName) {
                    companyLogoCache.set(rawName, resolvedResult);
                  }
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(resolvedResult));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    error: err.message,
                    companyName: '',
                    companyDomain: '',
                    logo: ''
                  })
                );
              }
              return;
            }

            next();
          });
        }
      }
    ]
  };
});
