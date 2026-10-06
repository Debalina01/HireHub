import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';

export default function SettingsModal({ isOpen, onClose, user, theme, onToggleTheme }) {
  const { showSuccess } = useNotification();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [interviewReminders, setInterviewReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    showSuccess('Settings preferences saved successfully.');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card settings-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="settings-header-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-1.5 1.5-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-2.1v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06-1.5-1.5.06-.06A1.65 1.65 0 0 0 7.4 15a1.65 1.65 0 0 0-1.51-1H5.8v-2.1h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06 1.5-1.5.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V6.3h2.1v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 1.5 1.5-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1h.09V14h-.09A1.65 1.65 0 0 0 19.4 15z"></path>
            </svg>
            <h3>Account Settings</h3>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="modal-body settings-modal-body">
          
          <div className="settings-section">
            <h4 className="settings-section-title">Account Information</h4>
            <div className="settings-user-info-box">
              <div className="settings-user-row">
                <span className="info-label">Name:</span>
                <strong className="info-val">{user?.name || 'Debalina Roy'}</strong>
              </div>
              <div className="settings-user-row">
                <span className="info-label">Email:</span>
                <span className="info-val">{user?.email || 'debalina@example.com'}</span>
              </div>
              <div className="settings-user-row">
                <span className="info-label">Role:</span>
                <span className="info-val role-pill">Job Seeker</span>
              </div>
            </div>
          </div>

          
          <div className="settings-section">
            <h4 className="settings-section-title">Appearance</h4>
            <div className="settings-toggle-row">
              <div>
                <strong>Dark Theme</strong>
                <p className="settings-desc">Switch between Dark and Light mode for HireHub.</p>
              </div>
              <button
                type="button"
                className="btn-theme-toggle-settings"
                onClick={onToggleTheme}
              >
                {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </button>
            </div>
          </div>

          
          <div className="settings-section">
            <h4 className="settings-section-title">Notifications</h4>
            <label className="settings-checkbox-item">
              <input
                type="checkbox"
                checked={interviewReminders}
                onChange={(e) => setInterviewReminders(e.target.checked)}
              />
              <div>
                <strong>Interview Reminders</strong>
                <p className="settings-desc">Receive toasts and browser alerts before upcoming scheduled rounds.</p>
              </div>
            </label>

            <label className="settings-checkbox-item">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
              />
              <div>
                <strong>Status Update Notifications</strong>
                <p className="settings-desc">Notify when application status progresses or offers are received.</p>
              </div>
            </label>

            <label className="settings-checkbox-item">
              <input
                type="checkbox"
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
              />
              <div>
                <strong>Weekly Job Insights Digest</strong>
                <p className="settings-desc">Receive personalized summary of application conversion rates.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
