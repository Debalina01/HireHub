import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { getSettingsForUser, saveSettingsForUser } from '../utils/settingsStorage';
import DatePicker from './DatePicker';

export default function SettingsPage({
  user,
  userProfile,
  onUpdateProfile,
  onUpdateUser,
  onBackToDashboard,
  onNavigateToProfile,
  theme,
  onSetTheme,
  onLogout
}) {
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();

  const [settings, setSettings] = useState(() => getSettingsForUser(user));
  const [activeTab, setActiveTab] = useState('account');

  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [personalInfoForm, setPersonalInfoForm] = useState({
    name: user?.name || userProfile?.name || 'Debalina Roy',
    phone: userProfile?.phone || '+91 98765 43210',
    dob: userProfile?.dob || 'Jan 15, 2002'
  });

  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Modal dialog states
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Reload settings if user changes
  useEffect(() => {
    if (user?.email) {
      setSettings(getSettingsForUser(user));
      setPersonalInfoForm({
        name: user.name || userProfile?.name || 'Debalina Roy',
        phone: userProfile?.phone || '+91 98765 43210',
        dob: userProfile?.dob || 'Jan 15, 2002'
      });
    }
  }, [user?.email, userProfile?.dob]);

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    if (user?.email) {
      saveSettingsForUser(user.email, newSettings);
    }
  };

  // Personal info & email handlers
  const handleSavePersonalInfo = (e) => {
    e.preventDefault();
    if (!personalInfoForm.name.trim()) {
      showError('Full name cannot be empty.');
      return;
    }

    if (onUpdateProfile && userProfile) {
      onUpdateProfile({
        ...userProfile,
        name: personalInfoForm.name.trim(),
        phone: personalInfoForm.phone.trim(),
        dob: personalInfoForm.dob || userProfile.dob || ''
      });
    }

    if (onUpdateUser) {
      onUpdateUser({
        name: personalInfoForm.name.trim()
      });
    }

    setIsEditingPersonalInfo(false);
    showSuccess('Personal information updated successfully.');
  };

  const handleUpdateEmail = (e) => {
    e.preventDefault();
    const trimmed = newEmailInput.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      showError('Please enter a valid email address.');
      return;
    }

    if (trimmed === user?.email?.toLowerCase()) {
      showWarning('This is already your active email address.');
      return;
    }

    showSuccess(`Confirmation link sent to ${trimmed}. Please verify to complete email change.`);
    setIsChangingEmail(false);
    setNewEmailInput('');
  };

  const handleSendVerificationEmail = () => {
    showSuccess(`Verification email sent to ${user?.email || 'your email'}. Check your inbox!`);
  };

  // Password, 2FA, and sessions
  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      showError('Please enter your current password.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showError('New password must be at least 8 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('New passwords do not match. Please verify.');
      return;
    }

    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showSuccess('Your password has been changed successfully!');
  };

  const handleToggle2FA = () => {
    if (settings.twoFactorEnabled) {
      showConfirm({
        title: 'Disable Two-Factor Authentication',
        message: 'Disabling 2FA reduces your account security. Are you sure you want to disable it?',
        confirmText: 'Disable 2FA',
        isDestructive: true,
        onConfirm: () => {
          updateSettings({ ...settings, twoFactorEnabled: false });
          showSuccess('Two-factor authentication disabled.');
        }
      });
    } else {
      setIs2FAModalOpen(true);
    }
  };

  const handleConfirm2FAEnable = () => {
    updateSettings({ ...settings, twoFactorEnabled: true });
    setIs2FAModalOpen(false);
    showSuccess('Two-factor authentication enabled successfully with Authenticator App!');
  };

  const handleLogoutOtherDevices = () => {
    showConfirm({
      title: 'Log Out From Other Devices',
      message: 'Are you sure you want to terminate all active sessions except your current one?',
      confirmText: 'Log Out Other Devices',
      isDestructive: true,
      onConfirm: () => {
        const currentSessionOnly = settings.activeSessions.filter((s) => s.isCurrent);
        updateSettings({ ...settings, activeSessions: currentSessionOnly });
        showSuccess('Logged out from 2 other devices successfully.');
      }
    });
  };

  // Notification preferences
  const handleJobAlertsToggle = (key) => {
    const updated = {
      ...settings,
      jobAlerts: {
        ...settings.jobAlerts,
        [key]: !settings.jobAlerts[key]
      }
    };
    updateSettings(updated);
  };

  const handleEmailNotificationsToggle = (key) => {
    const updated = {
      ...settings,
      emailNotifications: {
        ...settings.emailNotifications,
        [key]: !settings.emailNotifications[key]
      }
    };
    updateSettings(updated);
  };

  const handleGeneralNotificationsToggle = (key) => {
    const updated = {
      ...settings,
      notificationPreferences: {
        ...settings.notificationPreferences,
        [key]: !settings.notificationPreferences[key]
      }
    };
    updateSettings(updated);
    showSuccess('Notification preference updated.');
  };

  // Job search preferences
  const handleJobSearchPreferenceToggle = (key) => {
    const updated = {
      ...settings,
      jobSearchPreferences: {
        ...settings.jobSearchPreferences,
        [key]: !settings.jobSearchPreferences[key]
      }
    };
    updateSettings(updated);
    showSuccess('Job search preference updated.');
  };

  // Privacy settings
  const handleProfileVisibilityChange = (mode) => {
    const updated = {
      ...settings,
      privacy: {
        ...settings.privacy,
        profileVisibility: mode
      }
    };
    updateSettings(updated);
    showSuccess(`Profile visibility updated to ${mode.replace('_', ' ')}.`);
  };

  const handlePrivacyCheckToggle = (key) => {
    const updated = {
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: !settings.privacy[key]
      }
    };
    updateSettings(updated);
  };

  // Appearance (theme & language)
  const handleThemeSelect = (selectedTheme) => {
    if (selectedTheme === 'system') {
      const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      onSetTheme(isSystemDark ? 'dark' : 'light');
      updateSettings({
        ...settings,
        appearance: { ...settings.appearance, theme: 'system' }
      });
      showSuccess('Appearance set to System Default.');
    } else {
      onSetTheme(selectedTheme);
      updateSettings({
        ...settings,
        appearance: { ...settings.appearance, theme: selectedTheme }
      });
      showSuccess(`Switched to ${selectedTheme === 'dark' ? 'Dark' : 'Light'} Mode.`);
    }
  };

  const handleLanguageChange = (lang) => {
    updateSettings({
      ...settings,
      appearance: { ...settings.appearance, language: lang }
    });
    showSuccess(`Language set to ${lang}.`);
  };

  // Connected accounts
  const handleToggleAccount = (provider) => {
    const isCurrentlyConnected = settings.connectedAccounts[provider]?.connected;

    if (isCurrentlyConnected) {
      if (provider === 'google') {
        showWarning('Your Google account is used as your primary single-sign-on.');
        return;
      }
      showConfirm({
        title: `Disconnect ${provider.toUpperCase()}`,
        message: `Are you sure you want to disconnect your ${provider} account?`,
        confirmText: 'Disconnect',
        isDestructive: true,
        onConfirm: () => {
          updateSettings({
            ...settings,
            connectedAccounts: {
              ...settings.connectedAccounts,
              [provider]: { connected: false, username: '' }
            }
          });
          showSuccess(`${provider.charAt(0).toUpperCase() + provider.slice(1)} disconnected.`);
        }
      });
    } else {
      const mockUsername = provider === 'github' ? 'debalina-dev' : 'debalina-roy';
      updateSettings({
        ...settings,
        connectedAccounts: {
          ...settings.connectedAccounts,
          [provider]: { connected: true, username: mockUsername }
        }
      });
      showSuccess(`Successfully connected ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);
    }
  };

  // Data export and privacy
  const handleDownloadMyData = () => {
    const exportData = {
      account: {
        name: user?.name,
        email: user?.email,
        role: user?.role,
        exportedAt: new Date().toISOString()
      },
      profile: userProfile,
      settings: settings
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hirehub-account-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('Account data exported successfully.');
  };

  const handleExportProfileData = () => {
    const profileJson = JSON.stringify(userProfile || {}, null, 2);
    const blob = new Blob([profileJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hirehub-profile-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('Profile data exported successfully.');
  };

  const handleSaveCookies = (cookiePrefs) => {
    updateSettings({ ...settings, cookies: cookiePrefs });
    setIsCookieModalOpen(false);
    showSuccess('Cookie preferences saved.');
  };

  // Account management (deactivate / delete)
  const handleDeactivateAccount = () => {
    setIsDeactivateModalOpen(false);
    showSuccess('Your account has been deactivated. You can reactivate anytime by logging back in.');
    if (onLogout) onLogout();
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      showError('Please type DELETE in capital letters to confirm account deletion.');
      return;
    }
    setIsDeleteModalOpen(false);
    try {
      if (user?.email) {
        localStorage.removeItem(`hirehub_profile_${user.email.toLowerCase()}`);
        localStorage.removeItem(`hirehub_settings_${user.email.toLowerCase()}`);
      }
      localStorage.removeItem('hirehubAuth');
      sessionStorage.removeItem('hirehubAuth');
    } catch (e) {
      console.error(e);
    }
    showSuccess('Your HireHub account and all associated data have been permanently deleted.');
    if (onLogout) onLogout();
  };

  // Logout
  const handleLogoutWithConfirm = () => {
    showConfirm({
      title: 'Log Out',
      message: 'Are you sure you want to log out of your HireHub account?',
      confirmText: 'Log Out',
      cancelText: 'Cancel',
      isDestructive: false,
      onConfirm: () => {
        if (onLogout) onLogout();
      }
    });
  };

  const NAV_ITEMS = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'job-preferences', label: 'Job Preferences', icon: '🎯' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'connected-accounts', label: 'Connected Accounts', icon: '🔗' },
    { id: 'data-privacy', label: 'Data & Privacy', icon: '💾' },
    { id: 'account-management', label: 'Account Management', icon: '⚠️' }
  ];

  return (
    <div className="settings-page-wrapper">
      {/* Top Navigation Bar */}
      <div className="settings-nav-header">
        <button
          type="button"
          className="btn-back-dashboard"
          onClick={onBackToDashboard}
          title="Return to Dashboard"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back to Dashboard</span>
        </button>

        <div className="profile-breadcrumbs">
          <span>HireHub</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">Settings</span>
        </div>
      </div>

      {/* Main Page Header */}
      <header className="settings-hero-header">
        <div>
          <h1 className="settings-page-title">Settings & Preferences</h1>
          <p className="settings-page-desc">
            Manage your account credentials, security protections, notifications, and privacy preferences.
          </p>
        </div>
      </header>

      {/* Mobile Horizontal Tabs */}
      <div className="settings-mobile-tabs" role="tablist">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`settings-mobile-tab-btn ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            role="tab"
            aria-selected={activeTab === item.id}
          >
            <span className="tab-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Two-Column Layout */}
      <div className="settings-layout-grid">
        {/* Desktop sidebar */}
        <aside className="settings-sidebar">
          <div className="settings-sidebar-header">
            <h3>Settings</h3>
          </div>
          <nav className="settings-nav-list" aria-label="Settings navigation">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`settings-nav-btn ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {activeTab === item.id && <span className="active-pip"></span>}
              </button>
            ))}
          </nav>

          <div className="settings-sidebar-footer">
            <button
              type="button"
              className="btn-sidebar-logout"
              onClick={handleLogoutWithConfirm}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main settings content */}
        <main className="settings-content-area">
          {/* Account settings */}
          {activeTab === 'account' && (
            <div className="settings-panel">
              <div className="panel-header">
                <h2>Account Settings</h2>
                <p>Manage your personal profile identity, credentials, and contact email.</p>
              </div>

              {/* Personal Information */}
              <section className="settings-card">
                <div className="card-header-row">
                  <div>
                    <h3>Personal Information</h3>
                    <p className="card-subtext">Basic identification associated with your HireHub account.</p>
                  </div>
                  {!isEditingPersonalInfo && (
                    <button
                      type="button"
                      className="btn-action-outline"
                      onClick={() => setIsEditingPersonalInfo(true)}
                    >
                      Edit Personal Information
                    </button>
                  )}
                </div>

                {isEditingPersonalInfo ? (
                  <form onSubmit={handleSavePersonalInfo} className="settings-form">
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={personalInfoForm.name}
                          onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group flex-1">
                        <label>Phone Number</label>
                        <input
                          type="text"
                          className="form-input"
                          value={personalInfoForm.phone}
                          onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, phone: e.target.value })}
                        />
                      </div>
                      <div className="form-group flex-1">
                        <label>Date of Birth</label>
                        <DatePicker
                          value={personalInfoForm.dob}
                          onChange={(val) => setPersonalInfoForm({ ...personalInfoForm, dob: val })}
                          placeholder="Select date of birth..."
                        />
                      </div>
                    </div>
                    <div className="form-actions-row">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setIsEditingPersonalInfo(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="info-display-grid">
                    <div className="info-box">
                      <span className="info-label">Full Name</span>
                      <strong className="info-value">{user?.name || userProfile?.name || 'Debalina Roy'}</strong>
                    </div>
                    <div className="info-box">
                      <span className="info-label">Email Address</span>
                      <strong className="info-value">{user?.email || 'debalina@example.com'}</strong>
                    </div>
                    <div className="info-box">
                      <span className="info-label">Phone Number</span>
                      <strong className="info-value">{userProfile?.phone || '+91 98765 43210'}</strong>
                    </div>
                    <div className="info-box">
                      <span className="info-label">Date of Birth</span>
                      <strong className="info-value">{userProfile?.dob || 'Jan 15, 2002'}</strong>
                    </div>
                    <div className="info-box">
                      <span className="info-label">Account Type</span>
                      <div>
                        <span className="job-seeker-badge">
                          <span className="badge-dot"></span>
                          Job Seeker
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Email Address Management */}
              <section className="settings-card">
                <div className="card-header-row">
                  <div>
                    <h3>Email Address</h3>
                    <p className="card-subtext">The primary address used for login and job alerts.</p>
                  </div>
                </div>

                <div className="email-status-row">
                  <div className="email-details">
                    <span className="current-email-text">{user?.email || 'debalina@example.com'}</span>
                    <span className="verified-pill">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Verified
                    </span>
                  </div>

                  <div className="email-action-btns">
                    <button
                      type="button"
                      className="btn-action-outline"
                      onClick={() => setIsChangingEmail(!isChangingEmail)}
                    >
                      {isChangingEmail ? 'Cancel' : 'Change Email Address'}
                    </button>
                    <button
                      type="button"
                      className="btn-action-ghost"
                      onClick={handleSendVerificationEmail}
                    >
                      Verify Email Address
                    </button>
                  </div>
                </div>

                {isChangingEmail && (
                  <form onSubmit={handleUpdateEmail} className="email-change-form">
                    <div className="form-group">
                      <label>New Email Address</label>
                      <div className="input-with-button">
                        <input
                          type="email"
                          required
                          className="form-input"
                          placeholder="name@example.com"
                          value={newEmailInput}
                          onChange={(e) => setNewEmailInput(e.target.value)}
                        />
                        <button type="submit" className="btn-primary">
                          Update Email
                        </button>
                      </div>
                      <span className="field-hint">A confirmation link will be dispatched to your new inbox.</span>
                    </div>
                  </form>
                )}
              </section>
            </div>
          )}

          {/* Password & security */}
          {activeTab === 'security' && (
            <div className="settings-panel">
              <div className="panel-header">
                <h2>Password & Security</h2>
                <p>Enhance the defense of your account with 2FA, session tracking, and password updates.</p>
              </div>

              {/* Password Change */}
              <section className="settings-card">
                <h3>Change Password</h3>
                <p className="card-subtext">Ensure you are using a strong, unique password with at least 8 characters.</p>

                <form onSubmit={handleUpdatePassword} className="settings-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="password-input-wrap">
                      <input
                        type={showPassword.current ? 'text' : 'password'}
                        required
                        className="form-input"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        className="btn-password-toggle"
                        onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword.current ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>New Password</label>
                      <div className="password-input-wrap">
                        <input
                          type={showPassword.new ? 'text' : 'password'}
                          required
                          className="form-input"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="At least 8 characters"
                        />
                        <button
                          type="button"
                          className="btn-password-toggle"
                          onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                          aria-label="Toggle password visibility"
                        >
                          {showPassword.new ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    <div className="form-group flex-1">
                      <label>Confirm New Password</label>
                      <div className="password-input-wrap">
                        <input
                          type={showPassword.confirm ? 'text' : 'password'}
                          required
                          className="form-input"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="Re-type new password"
                        />
                        <button
                          type="button"
                          className="btn-password-toggle"
                          onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                          aria-label="Toggle password visibility"
                        >
                          {showPassword.confirm ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                    Update Password
                  </button>
                </form>
              </section>

              {/* Two-Factor Authentication */}
              <section className="settings-card">
                <div className="toggle-row-card">
                  <div>
                    <div className="security-status-title-row">
                      <h3>Two-Factor Authentication (2FA)</h3>
                      <span className={`status-pill ${settings.twoFactorEnabled ? 'status-enabled' : 'status-disabled'}`}>
                        {settings.twoFactorEnabled ? 'Enabled ✓' : 'Disabled'}
                      </span>
                    </div>
                    <p className="card-subtext">
                      Add an additional layer of security by requiring a 6-digit one-time code during login.
                    </p>
                  </div>
                  <label className="switch-toggle" aria-label="Toggle Two Factor Authentication">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorEnabled}
                      onChange={handleToggle2FA}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </section>

              {/* Active Sessions */}
              <section className="settings-card">
                <div className="card-header-row">
                  <div>
                    <h3>Active Sessions</h3>
                    <p className="card-subtext">Devices currently authorized to access your HireHub account.</p>
                  </div>
                  {settings.activeSessions.length > 1 && (
                    <button
                      type="button"
                      className="btn-action-outline btn-danger-outline"
                      onClick={handleLogoutOtherDevices}
                    >
                      Log out from other devices
                    </button>
                  )}
                </div>

                <div className="sessions-list">
                  {settings.activeSessions.map((session) => (
                    <div key={session.id} className="session-item">
                      <div className="session-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                          <line x1="8" y1="21" x2="16" y2="21"></line>
                          <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                      </div>
                      <div className="session-info">
                        <div className="session-device-row">
                          <strong>{session.device}</strong>
                          {session.isCurrent && <span className="current-badge">Current Device</span>}
                        </div>
                        <span className="session-meta">
                          {session.location} &bull; IP: {session.ip} &bull; {session.lastActive}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="settings-panel">
              <div className="panel-header">
                <h2>Notifications</h2>
                <p>Choose what alerts and updates you receive and how we reach you.</p>
              </div>

              {/* Notification preferences */}
              <section className="settings-card">
                <h3>Notification Preferences</h3>
                <p className="card-subtext">Main delivery channels and high-priority notification streams.</p>

                <div className="toggles-stack">
                  <div className="toggle-switch-row">
                    <div>
                      <strong>Email Notifications</strong>
                      <p className="switch-sub">Receive summaries, confirmations, and alerts via email.</p>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={settings.notificationPreferences.emailNotifications}
                        onChange={() => handleGeneralNotificationsToggle('emailNotifications')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-switch-row">
                    <div>
                      <strong>In-app Notifications</strong>
                      <p className="switch-sub">Show instant toast banners and badge updates within HireHub.</p>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={settings.notificationPreferences.inAppNotifications}
                        onChange={() => handleGeneralNotificationsToggle('inAppNotifications')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-switch-row">
                    <div>
                      <strong>Job Alerts</strong>
                      <p className="switch-sub">Real-time alerts whenever newly posted roles match your criteria.</p>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={settings.notificationPreferences.jobAlerts}
                        onChange={() => handleGeneralNotificationsToggle('jobAlerts')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-switch-row">
                    <div>
                      <strong>Recruiter Messages</strong>
                      <p className="switch-sub">Direct outreach and interview invites from verified company talent teams.</p>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={settings.notificationPreferences.recruiterMessages}
                        onChange={() => handleGeneralNotificationsToggle('recruiterMessages')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Job Alerts Specific Controls */}
              <section className="settings-card">
                <h3>Job Alerts</h3>
                <p className="card-subtext">Control the specific parameters triggering recommendation alerts.</p>

                <div className="checkboxes-stack">
                  <label className="checkbox-item-row">
                    <input
                      type="checkbox"
                      checked={settings.jobAlerts.newRecommendations}
                      onChange={() => handleJobAlertsToggle('newRecommendations')}
                    />
                    <span>New job recommendations</span>
                  </label>

                  <label className="checkbox-item-row">
                    <input
                      type="checkbox"
                      checked={settings.jobAlerts.matchingSkills}
                      onChange={() => handleJobAlertsToggle('matchingSkills')}
                    />
                    <span>Jobs matching my skills</span>
                  </label>

                  <label className="checkbox-item-row">
                    <input
                      type="checkbox"
                      checked={settings.jobAlerts.matchingLocation}
                      onChange={() => handleJobAlertsToggle('matchingLocation')}
                    />
                    <span>Jobs matching my preferred location</span>
                  </label>

                  <label className="checkbox-item-row">
                    <input
                      type="checkbox"
                      checked={settings.jobAlerts.applicationUpdates}
                      onChange={() => handleJobAlertsToggle('applicationUpdates')}
                    />
                    <span>Application updates</span>
                  </label>
                </div>
              </section>

              {/* Email Notifications Specific Controls */}
              <section className="settings-card">
                <h3>Email Notifications</h3>
                <p className="card-subtext">Select which updates are delivered directly to your inbox.</p>

                <div className="checkboxes-stack">
                  <label className="checkbox-item-row">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications.jobAlerts}
                      onChange={() => handleEmailNotificationsToggle('jobAlerts')}
                    />
                    <span>Job alerts</span>
                  </label>

                  <label className="checkbox-item-row">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications.applicationStatus}
                      onChange={() => handleEmailNotificationsToggle('applicationStatus')}
                    />
                    <span>Application status</span>
                  </label>

                  <label className="checkbox-item-row">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications.recruiterMessages}
                      onChange={() => handleEmailNotificationsToggle('recruiterMessages')}
                    />
                    <span>Recruiter messages</span>
                  </label>

                  <label className="checkbox-item-row">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications.interviewReminders}
                      onChange={() => handleEmailNotificationsToggle('interviewReminders')}
                    />
                    <span>Interview reminders</span>
                  </label>

                  <label className="checkbox-item-row">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications.platformUpdates}
                      onChange={() => handleEmailNotificationsToggle('platformUpdates')}
                    />
                    <span>Platform updates</span>
                  </label>
                </div>
              </section>
            </div>
          )}

          {/* Job search preferences */}
          {activeTab === 'job-preferences' && (
            <div className="settings-panel">
              <div className="panel-header">
                <h2>Job Search Preferences</h2>
                <p>Manage your search status, recruiter visibility, and recommendation streams.</p>
              </div>

              {/* Search-specific toggles */}
              <section className="settings-card">
                <h3>Search & Recommendation Toggles</h3>
                <p className="card-subtext">Control your job seeker status and discoverability.</p>

                <div className="toggles-stack">
                  <div className="toggle-switch-row">
                    <div>
                      <strong>Open to Opportunities</strong>
                      <p className="switch-sub">Signals to algorithms and recruiters that you are actively considering offers.</p>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={settings.jobSearchPreferences.openToOpportunities}
                        onChange={() => handleJobSearchPreferenceToggle('openToOpportunities')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-switch-row">
                    <div>
                      <strong>Allow recruiters to discover my profile</strong>
                      <p className="switch-sub">Verified talent acquisition teams can find you in candidate search pools.</p>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={settings.jobSearchPreferences.allowRecruiterDiscovery}
                        onChange={() => handleJobSearchPreferenceToggle('allowRecruiterDiscovery')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-switch-row">
                    <div>
                      <strong>Receive job recommendations</strong>
                      <p className="switch-sub">Display curated opportunities based on your skills and past roles.</p>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={settings.jobSearchPreferences.receiveJobRecommendations}
                        onChange={() => handleJobSearchPreferenceToggle('receiveJobRecommendations')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-switch-row">
                    <div>
                      <strong>Receive internship recommendations</strong>
                      <p className="switch-sub">Include student, co-op, and early-career internship opportunities.</p>
                    </div>
                    <label className="switch-toggle">
                      <input
                        type="checkbox"
                        checked={settings.jobSearchPreferences.receiveInternshipRecommendations}
                        onChange={() => handleJobSearchPreferenceToggle('receiveInternshipRecommendations')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Informational Callout to Profile Page */}
              <div className="settings-callout-card">
                <div className="callout-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </div>
                <div className="callout-content">
                  <h4>Looking for Detailed Career Preferences?</h4>
                  <p>
                    Your <strong>Preferred Role</strong>, <strong>Preferred Location</strong>, <strong>Work Mode</strong>, <strong>Employment Type</strong>, <strong>Expected Salary</strong>, and <strong>Notice Period</strong> are configured inside your dedicated <strong>Profile page</strong>.
                  </p>
                  <button
                    type="button"
                    className="btn-action-primary"
                    onClick={onNavigateToProfile}
                  >
                    Go to Profile Page &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy */}
          {activeTab === 'privacy' && (
            <div className="settings-panel">
              <div className="panel-header">
                <h2>Privacy</h2>
                <p>Configure who can view your profile, resume, and contact information.</p>
              </div>

              {/* Profile Visibility Radio Options */}
              <section className="settings-card">
                <h3>Profile Visibility</h3>
                <p className="card-subtext">Choose how visible your profile is across the HireHub platform.</p>

                <div className="radio-cards-grid">
                  <label className={`radio-card ${settings.privacy.profileVisibility === 'public' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="profileVisibility"
                      value="public"
                      checked={settings.privacy.profileVisibility === 'public'}
                      onChange={() => handleProfileVisibilityChange('public')}
                    />
                    <div className="radio-card-content">
                      <div className="radio-title-row">
                        <strong>Public</strong>
                        <span className="visibility-icon">🌐</span>
                      </div>
                      <p>Recruiters can view my profile.</p>
                    </div>
                  </label>

                  <label className={`radio-card ${settings.privacy.profileVisibility === 'recruiters_only' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="profileVisibility"
                      value="recruiters_only"
                      checked={settings.privacy.profileVisibility === 'recruiters_only'}
                      onChange={() => handleProfileVisibilityChange('recruiters_only')}
                    />
                    <div className="radio-card-content">
                      <div className="radio-title-row">
                        <strong>Recruiters Only</strong>
                        <span className="visibility-icon">💼</span>
                      </div>
                      <p>Only verified recruiters can view my profile.</p>
                    </div>
                  </label>

                  <label className={`radio-card ${settings.privacy.profileVisibility === 'private' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="profileVisibility"
                      value="private"
                      checked={settings.privacy.profileVisibility === 'private'}
                      onChange={() => handleProfileVisibilityChange('private')}
                    />
                    <div className="radio-card-content">
                      <div className="radio-title-row">
                        <strong>Private</strong>
                        <span className="visibility-icon">🔒</span>
                      </div>
                      <p>My profile is hidden from recruiters.</p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Resume Visibility */}
              <section className="settings-card">
                <h3>Resume Visibility</h3>
                <p className="card-subtext">Manage access permissions for your uploaded resume.</p>

                <div className="checkboxes-stack">
                  <label className="checkbox-item-row">
                    <input
                      type="checkbox"
                      checked={settings.privacy.allowRecruitersViewResume}
                      onChange={() => handlePrivacyCheckToggle('allowRecruitersViewResume')}
                    />
                    <span>Allow recruiters to view my resume</span>
                  </label>

                  <label className="checkbox-item-row">
                    <input
                      type="checkbox"
                      checked={settings.privacy.hideResumeFromPublic}
                      onChange={() => handlePrivacyCheckToggle('hideResumeFromPublic')}
                    />
                    <span>Hide resume from public profile</span>
                  </label>
                </div>
              </section>

              {/* Contact Information */}
              <section className="settings-card">
                <h3>Contact Information</h3>
                <p className="card-subtext">Select which direct contact channels are exposed to hiring managers.</p>

                <div className="checkboxes-stack">
                  <label className="checkbox-item-row">
                    <input
                      type="checkbox"
                      checked={settings.privacy.showEmailToRecruiters}
                      onChange={() => handlePrivacyCheckToggle('showEmailToRecruiters')}
                    />
                    <span>Show email to recruiters</span>
                  </label>

                  <label className="checkbox-item-row">
                    <input
                      type="checkbox"
                      checked={settings.privacy.showPhoneToRecruiters}
                      onChange={() => handlePrivacyCheckToggle('showPhoneToRecruiters')}
                    />
                    <span>Show phone number to recruiters</span>
                  </label>
                </div>
              </section>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="settings-panel">
              <div className="panel-header">
                <h2>Appearance</h2>
                <p>Customize your workspace theme and language options.</p>
              </div>

              {/* Theme Selection */}
              <section className="settings-card">
                <h3>Theme</h3>
                <p className="card-subtext">Select your preferred color scheme across HireHub.</p>

                <div className="theme-selector-grid">
                  <div
                    className={`theme-card ${theme === 'light' && settings.appearance.theme !== 'system' ? 'selected' : ''}`}
                    onClick={() => handleThemeSelect('light')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="theme-preview-box light-preview">
                      <div className="theme-preview-header"></div>
                      <div className="theme-preview-body"></div>
                    </div>
                    <div className="theme-info-row">
                      <strong>Light</strong>
                      <span>☀️</span>
                    </div>
                    <p className="theme-desc">Crisp, high-contrast light theme.</p>
                  </div>

                  <div
                    className={`theme-card ${theme === 'dark' && settings.appearance.theme !== 'system' ? 'selected' : ''}`}
                    onClick={() => handleThemeSelect('dark')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="theme-preview-box dark-preview">
                      <div className="theme-preview-header"></div>
                      <div className="theme-preview-body"></div>
                    </div>
                    <div className="theme-info-row">
                      <strong>Dark</strong>
                      <span>🌙</span>
                    </div>
                    <p className="theme-desc">Low-light dark workspace theme.</p>
                  </div>

                  <div
                    className={`theme-card ${settings.appearance.theme === 'system' ? 'selected' : ''}`}
                    onClick={() => handleThemeSelect('system')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="theme-preview-box system-preview">
                      <div className="theme-preview-half light"></div>
                      <div className="theme-preview-half dark"></div>
                    </div>
                    <div className="theme-info-row">
                      <strong>System Default</strong>
                      <span>💻</span>
                    </div>
                    <p className="theme-desc">Matches your OS appearance automatically.</p>
                  </div>
                </div>
              </section>

              {/* Language Selection */}
              <section className="settings-card">
                <h3>Language</h3>
                <p className="card-subtext">Set your primary interface language.</p>

                <div className="form-group" style={{ maxWidth: '320px' }}>
                  <select
                    className="form-select"
                    value={settings.appearance.language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="English (UK)">English (UK)</option>
                    <option value="English (India)">English (India)</option>
                  </select>
                </div>
              </section>
            </div>
          )}

          {/* Connected accounts */}
          {activeTab === 'connected-accounts' && (
            <div className="settings-panel">
              <div className="panel-header">
                <h2>Connected Accounts</h2>
                <p>Connect your third-party profiles for streamlined authentication and verification.</p>
              </div>

              <section className="settings-card">
                <div className="connected-accounts-list">
                  {/* Google */}
                  <div className="account-row-item">
                    <div className="account-brand-info">
                      <div className="brand-icon google-icon">G</div>
                      <div>
                        <strong>Google</strong>
                        <p className="account-detail">
                          {settings.connectedAccounts.google?.connected
                            ? `Connected as ${settings.connectedAccounts.google.email || user?.email}`
                            : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {settings.connectedAccounts.google?.connected ? (
                        <span className="connected-status-pill">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Connected
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn-action-outline"
                          onClick={() => handleToggleAccount('google')}
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>

                  {/* GitHub */}
                  <div className="account-row-item">
                    <div className="account-brand-info">
                      <div className="brand-icon github-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                      </div>
                      <div>
                        <strong>GitHub</strong>
                        <p className="account-detail">
                          {settings.connectedAccounts.github?.connected
                            ? `Connected as @${settings.connectedAccounts.github.username || 'debalina-dev'}`
                            : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {settings.connectedAccounts.github?.connected ? (
                        <div className="connected-btn-group">
                          <span className="connected-status-pill">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Connected
                          </span>
                          <button
                            type="button"
                            className="btn-disconnect"
                            onClick={() => handleToggleAccount('github')}
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-action-outline"
                          onClick={() => handleToggleAccount('github')}
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="account-row-item">
                    <div className="account-brand-info">
                      <div className="brand-icon linkedin-icon">in</div>
                      <div>
                        <strong>LinkedIn</strong>
                        <p className="account-detail">
                          {settings.connectedAccounts.linkedin?.connected
                            ? `Connected as @${settings.connectedAccounts.linkedin.username || 'debalina-roy'}`
                            : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {settings.connectedAccounts.linkedin?.connected ? (
                        <div className="connected-btn-group">
                          <span className="connected-status-pill">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Connected
                          </span>
                          <button
                            type="button"
                            className="btn-disconnect"
                            onClick={() => handleToggleAccount('linkedin')}
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-action-outline"
                          onClick={() => handleToggleAccount('linkedin')}
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Data & privacy */}
          {activeTab === 'data-privacy' && (
            <div className="settings-panel">
              <div className="panel-header">
                <h2>Data & Privacy</h2>
                <p>Download your stored data or update privacy tracking preferences.</p>
              </div>

              {/* Your Data */}
              <section className="settings-card">
                <h3>Your Data</h3>
                <p className="card-subtext">
                  Download an archive of all information stored in your account, applications, and settings.
                </p>

                <div className="data-export-row">
                  <div className="export-action-box">
                    <strong>Complete Account Archive</strong>
                    <p>JSON export containing your profile, applications, notes, and preference settings.</p>
                    <button
                      type="button"
                      className="btn-action-outline"
                      onClick={handleDownloadMyData}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      <span>Download My Data</span>
                    </button>
                  </div>

                  <div className="export-action-box">
                    <strong>Profile Information Only</strong>
                    <p>JSON export containing your bio, skills, education, projects, and work history.</p>
                    <button
                      type="button"
                      className="btn-action-outline"
                      onClick={handleExportProfileData}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      <span>Export Profile Data</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Privacy Controls */}
              <section className="settings-card">
                <h3>Privacy Controls</h3>
                <p className="card-subtext">Manage cookie consent and data retention preferences.</p>

                <div className="privacy-actions-list">
                  <div className="privacy-action-item">
                    <div>
                      <strong>Cookie Preferences</strong>
                      <p>Control essential, analytics, and marketing cookie configurations.</p>
                    </div>
                    <button
                      type="button"
                      className="btn-action-outline"
                      onClick={() => setIsCookieModalOpen(true)}
                    >
                      Manage Cookies
                    </button>
                  </div>

                  <div className="privacy-action-item">
                    <div>
                      <strong>Privacy Policy & Data Rights</strong>
                      <p>Learn how HireHub complies with GDPR, CCPA, and global data privacy standards.</p>
                    </div>
                    <a
                      href="#privacy"
                      className="btn-action-outline"
                      onClick={(e) => {
                        e.preventDefault();
                        showSuccess('HireHub complies fully with GDPR, CCPA, and modern privacy regulations.');
                      }}
                    >
                      Privacy Preferences
                    </a>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Account management */}
          {activeTab === 'account-management' && (
            <div className="settings-panel">
              <div className="panel-header">
                <h2>Account Management</h2>
                <p>Manage account lifecycle, temporary deactivation, or permanent deletion.</p>
              </div>

              {/* Deactivate Account */}
              <section className="settings-card">
                <h3>Deactivate Account</h3>
                <p className="card-subtext">
                  Temporarily hide your account and profile. Your applications, notes, and records will be preserved safely until you log back in.
                </p>

                <button
                  type="button"
                  className="btn-action-outline btn-warning-action"
                  onClick={() => setIsDeactivateModalOpen(true)}
                >
                  Deactivate Account
                </button>
              </section>

              {/* Delete Account */}
              <section className="settings-card danger-zone-card">
                <div className="danger-header">
                  <div className="danger-icon">⚠️</div>
                  <div>
                    <h3 className="danger-title">Delete Account</h3>
                    <p className="card-subtext">
                      Permanently delete your HireHub account and all associated applications, resumes, interviews, and profile data. This action is irreversible.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    setDeleteConfirmText('');
                    setIsDeleteModalOpen(true);
                  }}
                >
                  Delete Account
                </button>
              </section>

              {/* Bottom Logout */}
              <section className="settings-card">
                <div className="card-header-row">
                  <div>
                    <h3>Session Sign Out</h3>
                    <p className="card-subtext">Sign out of your active HireHub session on this device.</p>
                  </div>
                  <button
                    type="button"
                    className="btn-action-outline"
                    onClick={handleLogoutWithConfirm}
                  >
                    Log Out
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* 2FA modal */}
      {is2FAModalOpen && (
        <div className="modal-backdrop" onClick={() => setIs2FAModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Enable Two-Factor Authentication</h3>
              <button type="button" className="btn-modal-close" onClick={() => setIs2FAModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '1.75rem 1.5rem' }}>
              <div className="qr-sim-box">
                <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                  <rect x="14" y="14" width="3" height="3"></rect>
                  <rect x="18" y="18" width="3" height="3"></rect>
                </svg>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '1rem 0' }}>
                Scan this QR code with Google Authenticator, Authy, or 1Password, then confirm to activate.
              </p>
              <div className="secret-code-pill">
                <code>HIRE-HUB2-FASE-CUR3</code>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIs2FAModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleConfirm2FAEnable}>
                Activate 2FA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie preferences modal */}
      {isCookieModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCookieModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cookie Preferences</h3>
              <button type="button" className="btn-modal-close" onClick={() => setIsCookieModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              <div className="settings-checkbox-item">
                <input type="checkbox" checked disabled id="cookie-essential" />
                <label htmlFor="cookie-essential">
                  <strong>Strictly Essential Cookies</strong>
                  <p className="card-subtext">Required for core system security and session state.</p>
                </label>
              </div>
              <div className="settings-checkbox-item">
                <input
                  type="checkbox"
                  id="cookie-analytics"
                  checked={settings.cookies.analytics}
                  onChange={(e) => updateSettings({ ...settings, cookies: { ...settings.cookies, analytics: e.target.checked } })}
                />
                <label htmlFor="cookie-analytics">
                  <strong>Analytics & Performance</strong>
                  <p className="card-subtext">Help us understand usage patterns and enhance application performance.</p>
                </label>
              </div>
              <div className="settings-checkbox-item">
                <input
                  type="checkbox"
                  id="cookie-marketing"
                  checked={settings.cookies.marketing}
                  onChange={(e) => updateSettings({ ...settings, cookies: { ...settings.cookies, marketing: e.target.checked } })}
                />
                <label htmlFor="cookie-marketing">
                  <strong>Marketing & Recommendations</strong>
                  <p className="card-subtext">Allow tailored job suggestions across partner networks.</p>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-primary" onClick={() => handleSaveCookies(settings.cookies)}>
                Save Cookie Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate account modal */}
      {isDeactivateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsDeactivateModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deactivate Account</h3>
              <button type="button" className="btn-modal-close" onClick={() => setIsDeactivateModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                Are you sure you want to deactivate your HireHub account?
              </p>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.75rem 0 0 1.25rem' }}>
                <li>Your profile will be hidden from recruiters.</li>
                <li>Your job applications and interviews remain saved.</li>
                <li>You can reactivate instantly by logging back in.</li>
              </ul>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsDeactivateModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleDeactivateAccount}>
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account modal */}
      {isDeleteModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#ef4444' }}>Permanently Delete Account</h3>
              <button type="button" className="btn-modal-close" onClick={() => setIsDeleteModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div className="delete-warning-box">
                <p>
                  <strong>Warning:</strong> This action cannot be undone. All your applications, scheduled interviews, notes, resumes, and profile history will be permanently erased.
                </p>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Please type <strong>DELETE</strong> to confirm:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                onClick={handleDeleteAccount}
              >
                Permanently Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
