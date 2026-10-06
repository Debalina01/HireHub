const DEFAULT_SETTINGS = {
  emailVerified: true,
  pendingEmail: '',
  twoFactorEnabled: false,
  activeSessions: [
    {
      id: 'sess-1',
      device: 'Windows 11 • Google Chrome',
      location: 'Bengaluru, India',
      ip: '103.21.244.12',
      isCurrent: true,
      lastActive: 'Active Now'
    },
    {
      id: 'sess-2',
      device: 'Apple iPhone 15 • Safari Mobile',
      location: 'Bengaluru, India',
      ip: '103.21.244.15',
      isCurrent: false,
      lastActive: '2 hours ago'
    },
    {
      id: 'sess-3',
      device: 'macOS Sonoma • Chrome',
      location: 'Bengaluru, India',
      ip: '103.21.244.89',
      isCurrent: false,
      lastActive: '3 days ago'
    }
  ],
  jobAlerts: {
    newRecommendations: true,
    matchingSkills: true,
    matchingLocation: true,
    applicationUpdates: true
  },
  emailNotifications: {
    jobAlerts: true,
    applicationStatus: true,
    recruiterMessages: true,
    interviewReminders: true,
    platformUpdates: false
  },
  notificationPreferences: {
    emailNotifications: true,
    inAppNotifications: true,
    jobAlerts: true,
    recruiterMessages: true
  },
  jobSearchPreferences: {
    openToOpportunities: true,
    allowRecruiterDiscovery: true,
    receiveJobRecommendations: true,
    receiveInternshipRecommendations: false
  },
  privacy: {
    profileVisibility: 'public',
    allowRecruitersViewResume: true,
    hideResumeFromPublic: false,
    showEmailToRecruiters: true,
    showPhoneToRecruiters: false
  },
  appearance: {
    theme: 'dark',
    language: 'English (US)'
  },
  connectedAccounts: {
    google: { connected: true, email: 'debalina@example.com' },
    github: { connected: false, username: '' },
    linkedin: { connected: false, username: '' }
  },
  cookies: {
    essential: true,
    analytics: true,
    marketing: false
  },
  accountStatus: 'active'
};

export function getSettingsForUser(user) {
  if (!user || !user.email) return { ...DEFAULT_SETTINGS };

  const storageKey = `hirehub_settings_${user.email.toLowerCase()}`;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        connectedAccounts: {
          ...DEFAULT_SETTINGS.connectedAccounts,
          ...(parsed.connectedAccounts || {}),
          google: {
            connected: true,
            email: user.email
          }
        }
      };
    }
  } catch (err) {
    console.error('Error loading settings from localStorage:', err);
  }

  return {
    ...DEFAULT_SETTINGS,
    connectedAccounts: {
      ...DEFAULT_SETTINGS.connectedAccounts,
      google: { connected: true, email: user.email }
    }
  };
}

export function saveSettingsForUser(email, settings) {
  if (!email) return;
  const storageKey = `hirehub_settings_${email.toLowerCase()}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings to localStorage:', err);
  }
}
