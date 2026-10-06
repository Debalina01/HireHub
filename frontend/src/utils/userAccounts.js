const ACCOUNTS_STORAGE_KEY = 'hirehub_accounts';
const DEMO_USER_KEY = 'hirehubDemoUser';

const DEFAULT_ACCOUNTS = {
  'debalina@example.com': {
    name: 'Debalina Roy',
    email: 'debalina@example.com',
    password: 'Password123!',
    verified: true,
    isGoogle: false
  }
};

export function getAccountsMap() {
  let map = {};
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        map = parsed;
      }
    }
  } catch (err) {
    console.error('Error reading accounts from localStorage:', err);
  }

  try {
    const demoRaw = localStorage.getItem(DEMO_USER_KEY);
    if (demoRaw) {
      const demoUser = JSON.parse(demoRaw);
      if (demoUser && demoUser.email) {
        const key = demoUser.email.toLowerCase().trim();
        if (!map[key]) {
          map[key] = {
            name: demoUser.name || 'User',
            email: demoUser.email.trim(),
            password: demoUser.password || 'Password123!',
            verified: demoUser.verified !== false,
            isGoogle: !!demoUser.isGoogle
          };
        }
      }
      localStorage.removeItem(DEMO_USER_KEY);
    }
  } catch (e) {}

  let hasChanges = false;
  Object.keys(DEFAULT_ACCOUNTS).forEach((email) => {
    if (!map[email]) {
      map[email] = { ...DEFAULT_ACCOUNTS[email] };
      hasChanges = true;
    }
  });

  if (hasChanges) {
    saveAccountsMap(map);
  }

  return map;
}

export function saveAccountsMap(map) {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Error saving accounts to localStorage:', err);
  }
}

export function getAccountByEmail(email) {
  if (!email) return null;
  const key = email.toLowerCase().trim();
  const map = getAccountsMap();
  return map[key] || null;
}

export function saveOrUpdateAccount(accountData) {
  if (!accountData || !accountData.email) return null;
  const key = accountData.email.toLowerCase().trim();
  const map = getAccountsMap();
  const existing = map[key] || {};

  const updated = {
    ...existing,
    ...accountData,
    email: accountData.email.trim(),
    name: accountData.name || existing.name || 'User'
  };

  map[key] = updated;
  saveAccountsMap(map);

  return updated;
}

export function verifyUserOtp(email) {
  if (!email) return false;
  const key = email.toLowerCase().trim();
  const map = getAccountsMap();
  if (map[key]) {
    map[key].verified = true;
    saveAccountsMap(map);
    return true;
  }
  return false;
}

export function resetUserPassword(email, newPassword) {
  if (!email || !newPassword) return false;
  const key = email.toLowerCase().trim();
  const map = getAccountsMap();
  if (map[key]) {
    map[key].password = newPassword;
    saveAccountsMap(map);
    return true;
  }
  return false;
}

export function getAllAccountsList() {
  const map = getAccountsMap();
  return Object.values(map).map((acc) => ({
    name: acc.name,
    email: acc.email,
    avatarBg: acc.email.toLowerCase().includes('debalina') ? '#4285F4' : '#0F9D58',
    initial: (acc.name || acc.email)[0].toUpperCase(),
    verified: acc.verified !== false,
    isGoogle: !!acc.isGoogle
  }));
}
