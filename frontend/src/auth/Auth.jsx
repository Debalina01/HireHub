import React, { useState, useEffect, useRef } from 'react';
import {
  getAccountByEmail,
  saveOrUpdateAccount,
  verifyUserOtp,
  resetUserPassword
} from '../utils/userAccounts';

const CAPTCHA_CHALLENGES = [
  {
    id: 1,
    targetName: 'bicycle',
    instruction: 'Select all images containing a bicycle',
    tiles: [
      { id: 't1', type: 'bicycle', label: 'Bicycle' },
      { id: 't2', type: 'car', label: 'Car' },
      { id: 't3', type: 'bicycle', label: 'Bicycle' },
      { id: 't4', type: 'bus', label: 'Bus' },
      { id: 't5', type: 'boat', label: 'Boat' },
      { id: 't6', type: 'bicycle', label: 'Bicycle' }
    ]
  },
  {
    id: 2,
    targetName: 'car',
    instruction: 'Select all images containing a car',
    tiles: [
      { id: 't1', type: 'car', label: 'Car' },
      { id: 't2', type: 'bus', label: 'Bus' },
      { id: 't3', type: 'airplane', label: 'Airplane' },
      { id: 't4', type: 'car', label: 'Car' },
      { id: 't5', type: 'bicycle', label: 'Bicycle' },
      { id: 't6', type: 'car', label: 'Car' }
    ]
  },
  {
    id: 3,
    targetName: 'airplane',
    instruction: 'Select all images containing an airplane',
    tiles: [
      { id: 't1', type: 'boat', label: 'Boat' },
      { id: 't2', type: 'airplane', label: 'Airplane' },
      { id: 't3', type: 'car', label: 'Car' },
      { id: 't4', type: 'bicycle', label: 'Bicycle' },
      { id: 't5', type: 'airplane', label: 'Airplane' },
      { id: 't6', type: 'bus', label: 'Bus' }
    ]
  },
  {
    id: 4,
    targetName: 'bus',
    instruction: 'Select all images containing a bus',
    tiles: [
      { id: 't1', type: 'bus', label: 'Bus' },
      { id: 't2', type: 'bicycle', label: 'Bicycle' },
      { id: 't3', type: 'car', label: 'Car' },
      { id: 't4', type: 'bus', label: 'Bus' },
      { id: 't5', type: 'boat', label: 'Boat' },
      { id: 't6', type: 'airplane', label: 'Airplane' }
    ]
  }
];

const renderCaptchaIcon = (type) => {
  switch (type) {
    case 'bicycle':
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="18.5" cy="17.5" r="3.5" />
          <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L14 10l-4-3 1.5-2.5h3" />
          <path d="M5.5 17.5l4-7.5h4.5" />
        </svg>
      );
    case 'car':
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case 'bus':
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 14h.01" />
          <path d="M17 14h.01" />
          <path d="M5 18v2" />
          <path d="M19 18v2" />
        </svg>
      );
    case 'airplane':
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.8-.2-1.6.2-2 .9-.4.7-.2 1.6.5 2.1l5.7 4.2-3.3 3.3-2.6-.6c-.5-.1-1 .1-1.3.5-.3.4-.3.9 0 1.3l2.8 2.8c.4.3.9.3 1.3 0 .4-.3.6-.8.5-1.3l-.6-2.6 3.3-3.3 4.2 5.7c.5.7 1.4.9 2.1.5.7-.4 1.1-1.2.9-2z" />
        </svg>
      );
    case 'boat':
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20a2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1" />
          <path d="M4 17 2 11h20l-2 6" />
          <path d="M12 2v9" />
          <path d="M8 7h8" />
        </svg>
      );
    default:
      return null;
  }
};

const renderPasswordToggle = (isVisible, onToggle) => (
  <button
    type="button"
    className="password-toggle-btn"
    onClick={onToggle}
    aria-label={isVisible ? 'Hide password' : 'Show password'}
  >
    {isVisible ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    )}
  </button>
);

const renderStrengthMeter = (strength) => (
  <div className="strength-container">
    <div className="strength-bars">
      <div
        className="strength-bar"
        style={{
          backgroundColor: strength.score >= 1 ? strength.color : '#e2e8f0'
        }}
      ></div>
      <div
        className="strength-bar"
        style={{
          backgroundColor: strength.score >= 2 ? strength.color : '#e2e8f0'
        }}
      ></div>
      <div
        className="strength-bar"
        style={{
          backgroundColor: strength.score >= 3 ? strength.color : '#e2e8f0'
        }}
      ></div>
    </div>
    <span className="strength-label" style={{ color: strength.color }}>
      {strength.label}
    </span>
  </div>
);

const loadGoogleScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      resolve(window.google);
      return;
    }
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google || null));
      existing.addEventListener('error', () => resolve(null));
      setTimeout(() => resolve(window.google || null), 1500);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google || null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
};

export default function Auth({ onLoginSuccess }) {
  const [view, setView] = useState('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');

  const [captchaIndex, setCaptchaIndex] = useState(0);
  const [selectedCaptchaTiles, setSelectedCaptchaTiles] = useState([]);
  const [captchaError, setCaptchaError] = useState('');
  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [signupTerms, setSignupTerms] = useState(false);
  const [signupErrors, setSignupErrors] = useState({});

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpShake, setOtpShake] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const otpInputRefs = useRef([]);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');

  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetErrors, setResetErrors] = useState({});

  const currentCaptcha = CAPTCHA_CHALLENGES[captchaIndex];

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '' };

    let score = 0;
    if (pass.length >= 8) score++;
    if (/\d/.test(pass)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score++;

    if (score === 1) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score === 2) return { score: 2, label: 'Medium', color: '#f59e0b' };
    if (score === 3) return { score: 3, label: 'Strong', color: '#10b981' };
    return { score: 0, label: 'Too short', color: '#ef4444' };
  };

  const switchView = (newView) => {
    setView(newView);
    setLoginError('');
    setSignupErrors({});
    setOtpError('');
    setForgotError('');
    setResetErrors({});
    setOtp(['', '', '', '', '', '']);
    setVerificationSuccess(false);
    setSelectedCaptchaTiles([]);
    setCaptchaError('');
    setIsCaptchaOpen(false);
    setIsCaptchaVerified(false);
  };

  const handleToggleCaptchaTile = (tileId) => {
    setCaptchaError('');
    if (selectedCaptchaTiles.includes(tileId)) {
      setSelectedCaptchaTiles(selectedCaptchaTiles.filter((id) => id !== tileId));
    } else {
      setSelectedCaptchaTiles([...selectedCaptchaTiles, tileId]);
    }
  };

  const handleRefreshCaptcha = () => {
    setSelectedCaptchaTiles([]);
    setCaptchaError('');
    setCaptchaIndex((prev) => (prev + 1) % CAPTCHA_CHALLENGES.length);
  };

  const handleTriggerBoxClick = () => {
    if (isCaptchaVerified) return;
    setIsCaptchaOpen(!isCaptchaOpen);
    setCaptchaError('');
  };

  const handleVerifyCaptcha = () => {
    if (selectedCaptchaTiles.length === 0) {
      setCaptchaError('Please select the matching image(s).');
      return;
    }

    const correctTileIds = currentCaptcha.tiles
      .filter((t) => t.type === currentCaptcha.targetName)
      .map((t) => t.id);

    const isCorrect =
      selectedCaptchaTiles.length === correctTileIds.length &&
      correctTileIds.every((id) => selectedCaptchaTiles.includes(id));

    if (isCorrect) {
      setIsCaptchaVerified(true);
      setIsCaptchaOpen(false);
      setCaptchaError('');
      setSelectedCaptchaTiles([]);
      return;
    }

    setCaptchaError('Incorrect selection. Please try again.');
    setSelectedCaptchaTiles([]);
    setCaptchaIndex((prev) => (prev + 1) % CAPTCHA_CHALLENGES.length);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    setCaptchaError('');

    const email = loginEmail.trim();

    if (!email) {
      setLoginError('Please enter your email address.');
      return;
    }
    if (!isValidEmail(email)) {
      setLoginError('Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    if (!isCaptchaVerified) {
      setIsCaptchaOpen(true);
      setCaptchaError('Please complete the CAPTCHA.');
      return;
    }

    const storedUser = getAccountByEmail(email);
    if (!storedUser) {
      setLoginError('Incorrect credentials. No account found with this email.');
      return;
    }

    if (storedUser.password && storedUser.password !== loginPassword) {
      setLoginError('Incorrect password. Please try again.');
      return;
    }

    if (!storedUser.verified) {
      setLoginError('Please verify your email before signing in.');
      setView('verify');
      setResendTimer(30);
      setCanResend(false);
      return;
    }

    onLoginSuccess(storedUser, rememberMe);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    const name = signupName.trim();
    const email = signupEmail.trim();

    if (!name) {
      errors.name = 'Full name is required.';
    }

    if (!email) {
      errors.email = 'Email address is required.';
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!signupPassword) {
      errors.password = 'Password is required.';
    } else if (signupPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (!/\d/.test(signupPassword)) {
      errors.password = 'Password must contain at least one number.';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(signupPassword)) {
      errors.password = 'Password must contain at least one special character.';
    }

    if (!signupConfirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (signupPassword !== signupConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!signupTerms) {
      errors.terms = 'You must agree to the Terms & Privacy Policy.';
    }

    if (Object.keys(errors).length > 0) {
      setSignupErrors(errors);
      return;
    }

    saveOrUpdateAccount({
      name,
      email,
      password: signupPassword,
      verified: false
    });

    setOtp(['', '', '', '', '', '']);
    setResendTimer(30);
    setCanResend(false);
    setView('verify');
  };

  useEffect(() => {
    if (view !== 'verify') return;

    if (resendTimer === 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [view, resendTimer]);

  const handleOtpChange = (index, value) => {
    setOtpError('');
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value ? value.slice(-1) : '';
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    setOtpError('');
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData.split(''));
      otpInputRefs.current[5]?.focus();
    }
  };

  const triggerShake = () => {
    setOtpShake(true);
    setTimeout(() => setOtpShake(false), 500);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');

    if (enteredOtp.length < 6) {
      setOtpError('Please enter all 6 digits of the verification code.');
      triggerShake();
      return;
    }

    if (enteredOtp !== '123456') {
      setOtpError('Invalid verification code. Please try again.');
      triggerShake();
      return;
    }

    const targetEmail = (signupEmail || loginEmail || '').trim();
    verifyUserOtp(targetEmail);
    setVerificationSuccess(true);
  };

  const handleResendOtp = () => {
    if (!canResend) return;

    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setResendTimer(30);
    setCanResend(false);
    otpInputRefs.current[0]?.focus();
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotError('');

    const email = forgotEmail.trim();
    if (!email) {
      setForgotError('Please enter your email address.');
      return;
    }
    if (!isValidEmail(email)) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    const storedUser = getAccountByEmail(email);
    if (!storedUser) {
      setForgotError("We couldn't find an account with that email.");
      return;
    }

    setView('reset');
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!resetPassword) {
      errors.password = 'New password is required.';
    } else if (resetPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (!/\d/.test(resetPassword)) {
      errors.password = 'Password must contain at least one number.';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(resetPassword)) {
      errors.password = 'Password must contain at least one special character.';
    }

    if (!resetConfirmPassword) {
      errors.confirmPassword = 'Confirm your new password.';
    } else if (resetPassword !== resetConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setResetErrors(errors);
      return;
    }

    resetUserPassword(forgotEmail.trim(), resetPassword);
    setView('reset-success');
  };

  const handleGoogleSignIn = async () => {
    setLoginError('');
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setLoginError('Google Sign-In is not configured. Please set VITE_GOOGLE_CLIENT_ID in your environment variables.');
      return;
    }

    const google = await loadGoogleScript();
    if (!google?.accounts?.oauth2) {
      setLoginError('Google Sign-In service could not be loaded. Please check your connection and try again.');
      return;
    }

    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse?.error) {
            if (tokenResponse.error !== 'access_denied') {
              setLoginError(tokenResponse.error_description || 'Google sign-in was cancelled or failed.');
            }
            return;
          }

          if (tokenResponse?.access_token) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                  Authorization: `Bearer ${tokenResponse.access_token}`
                }
              });

              if (!res.ok) {
                setLoginError('Failed to retrieve user profile from Google.');
                return;
              }

              const profile = await res.json();
              if (!profile?.email) {
                setLoginError('No email returned by Google account.');
                return;
              }

              const cleanEmail = profile.email.toLowerCase().trim();
              const cleanName = profile.name || profile.given_name || 'Google User';
              const cleanAvatar = profile.picture || '';

              const user = saveOrUpdateAccount({
                name: cleanName,
                email: cleanEmail,
                avatar: cleanAvatar,
                verified: true,
                isGoogle: true
              });

              onLoginSuccess(
                user || {
                  name: cleanName,
                  email: cleanEmail,
                  avatar: cleanAvatar,
                  verified: true,
                  isGoogle: true
                },
                rememberMe
              );
            } catch {
              setLoginError('Error retrieving Google account data.');
            }
          }
        }
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch {
      setLoginError('Failed to initialize Google Sign-In.');
    }
  };

  const signupStrength = getPasswordStrength(signupPassword);
  const resetStrength = getPasswordStrength(resetPassword);

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-brand-panel">
          <div className="auth-brand-header">
            <div className="brand-logo">
              <div className="logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <span className="brand-text">Hire<span>Hub</span></span>
            </div>
            <span className="brand-badge">Smart Job Application Tracker</span>
          </div>

          <div className="auth-hero-copy">
            <h1 className="auth-hero-title">Your job search, organized.</h1>
            <p className="auth-hero-desc">
              Track applications, interviews, follow-ups, and offers — all in one place. Never let an opportunity slip through the cracks.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature-item">
                <div className="feature-check-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span>Track applications across every hiring stage</span>
              </div>

              <div className="auth-feature-item">
                <div className="feature-check-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span>Manage interview rounds with preparation notes</span>
              </div>

              <div className="auth-feature-item">
                <div className="feature-check-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span>Stay on top of follow-ups and deadlines</span>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <span>&copy; {new Date().getFullYear()} HireHub. Built for career growth.</span>
          </div>
        </div>

        <div className="auth-card-container">
          <div className="auth-mobile-header">
            <div className="brand-logo">
              <div className="logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <span className="brand-text">Hire<span>Hub</span></span>
            </div>
            <span className="auth-tagline-mobile">Smart Job Application Tracker</span>
          </div>

          <div className="auth-card">
            {view === 'login' && (
              <div className="auth-screen-fade">
                <div className="auth-header">
                  <h2 className="auth-title">Welcome back</h2>
                  <p className="auth-subtitle">Track your applications. Stay organized. Get hired.</p>
                </div>

                {loginError && (
                  <div className="auth-error-banner" role="alert">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
                  <div className="form-group">
                    <label className="form-label" htmlFor="login-email">Email address</label>
                    <div className="auth-input-wrapper">
                      <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      <input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          if (loginError) setLoginError('');
                        }}
                        className="form-input auth-input"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="form-label-row">
                      <label className="form-label" htmlFor="login-password">Password</label>
                      <button
                        type="button"
                        className="auth-link-btn"
                        onClick={() => switchView('forgot')}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="auth-input-wrapper">
                      <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (loginError) setLoginError('');
                        }}
                        className="form-input auth-input"
                        autoComplete="current-password"
                        required
                      />
                      {renderPasswordToggle(showLoginPassword, () => setShowLoginPassword(!showLoginPassword))}
                    </div>
                  </div>

                  <div
                    className={`captcha-trigger-box ${isCaptchaVerified ? 'verified' : ''} ${isCaptchaOpen ? 'active' : ''}`}
                    onClick={handleTriggerBoxClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTriggerBoxClick();
                      }
                    }}
                    aria-label={isCaptchaVerified ? 'Human verification completed' : 'Verify you are human'}
                  >
                    <div className="captcha-trigger-left">
                      <div className={`captcha-checkbox-box ${isCaptchaVerified ? 'checked' : ''}`}>
                        {isCaptchaVerified && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className="captcha-trigger-label">
                        {isCaptchaVerified ? 'Human verification completed' : 'Verify you are human'}
                      </span>
                    </div>

                    <div className="captcha-brand-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="captcha-brand-icon">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span>HireHub</span>
                    </div>
                  </div>

                  {isCaptchaOpen && !isCaptchaVerified && (
                    <div className="captcha-card">
                      <div className="captcha-header">
                        <div className="captcha-header-text">
                          <div className="captcha-title-row">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="captcha-shield-icon">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span className="captcha-title">Verify you're human</span>
                          </div>
                          <p className="captcha-instruction">
                            {currentCaptcha.instruction}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="captcha-refresh-btn"
                          onClick={handleRefreshCaptcha}
                          title="Get another challenge"
                          aria-label="Refresh challenge"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                          </svg>
                        </button>
                      </div>

                      <div className="captcha-grid">
                        {currentCaptcha.tiles.map((tile) => {
                          const isSelected = selectedCaptchaTiles.includes(tile.id);
                          return (
                            <button
                              key={tile.id}
                              type="button"
                              className={`captcha-tile ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleToggleCaptchaTile(tile.id)}
                              aria-pressed={isSelected}
                              aria-label={tile.label}
                            >
                              <div className="captcha-icon-wrap">
                                {renderCaptchaIcon(tile.type)}
                              </div>
                              <span className="captcha-tile-label">{tile.label}</span>
                              {isSelected && (
                                <div className="captcha-checkmark">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {captchaError && (
                        <span className="auth-field-error captcha-error-msg" role="alert">
                          {captchaError}
                        </span>
                      )}

                      <div className="captcha-actions">
                        <button
                          type="button"
                          className="btn-primary captcha-verify-btn"
                          onClick={handleVerifyCaptcha}
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn-primary auth-submit-btn">
                    Sign In
                  </button>
                </form>

                <div className="auth-divider">
                  <span>OR</span>
                </div>

                <button
                  type="button"
                  className="btn-google"
                  onClick={handleGoogleSignIn}
                >
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="auth-footer-link">
                  <span>Don't have an account?</span>
                  <button
                    type="button"
                    className="auth-link-highlight"
                    onClick={() => switchView('signup')}
                  >
                    Create account
                  </button>
                </div>
              </div>
            )}

            {view === 'signup' && (
              <div className="auth-screen-fade">
                <div className="auth-header">
                  <h2 className="auth-title">Create your HireHub account</h2>
                  <p className="auth-subtitle">Start organizing your job search today.</p>
                </div>

                <form onSubmit={handleSignupSubmit} className="auth-form" noValidate>
                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-name">Full Name</label>
                    <input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className={`form-input auth-input ${signupErrors.name ? 'input-error' : ''}`}
                      required
                    />
                    {signupErrors.name && (
                      <span className="auth-field-error">{signupErrors.name}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-email">Email address</label>
                    <input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className={`form-input auth-input ${signupErrors.email ? 'input-error' : ''}`}
                      required
                    />
                    {signupErrors.email && (
                      <span className="auth-field-error">{signupErrors.email}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-password">Password</label>
                    <div className="auth-input-wrapper">
                      <input
                        id="signup-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className={`form-input auth-input ${signupErrors.password ? 'input-error' : ''}`}
                        required
                      />
                      {renderPasswordToggle(showSignupPassword, () => setShowSignupPassword(!showSignupPassword))}
                    </div>

                    {signupPassword && renderStrengthMeter(signupStrength)}

                    {signupErrors.password && (
                      <span className="auth-field-error">{signupErrors.password}</span>
                    )}
                    <span className="auth-field-hint">
                      Must be at least 8 characters with at least one number and one special character.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-confirm-password">Confirm Password</label>
                    <div className="auth-input-wrapper">
                      <input
                        id="signup-confirm-password"
                        type={showSignupConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className={`form-input auth-input ${signupErrors.confirmPassword ? 'input-error' : ''}`}
                        required
                      />
                      {renderPasswordToggle(showSignupConfirmPassword, () => setShowSignupConfirmPassword(!showSignupConfirmPassword))}
                    </div>
                    {signupErrors.confirmPassword && (
                      <span className="auth-field-error">{signupErrors.confirmPassword}</span>
                    )}
                  </div>

                  <div className="auth-terms-row">
                    <label className="auth-checkbox-label">
                      <input
                        type="checkbox"
                        checked={signupTerms}
                        onChange={(e) => setSignupTerms(e.target.checked)}
                        className="auth-checkbox"
                      />
                      <span>I agree to the <strong className="terms-highlight">Terms & Privacy Policy</strong></span>
                    </label>
                    {signupErrors.terms && (
                      <span className="auth-field-error">{signupErrors.terms}</span>
                    )}
                  </div>

                  <button type="submit" className="btn-primary auth-submit-btn">
                    Create Account
                  </button>
                </form>

                <div className="auth-footer-link">
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    className="auth-link-highlight"
                    onClick={() => switchView('login')}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}

            {view === 'verify' && (
              <div className="auth-screen-fade">
                {!verificationSuccess ? (
                  <>
                    <div className="auth-header">
                      <div className="auth-icon-circle">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </div>
                      <h2 className="auth-title">Verify your email</h2>
                      <p className="auth-subtitle">
                        We've sent a 6-digit verification code to<br />
                        <strong>{signupEmail || loginEmail || 'your email'}</strong>
                      </p>
                    </div>

                    <div className="demo-otp-badge">
                      <span>Demo OTP: <strong>123456</strong></span>
                    </div>

                    {otpError && (
                      <div className="auth-error-banner" role="alert">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>{otpError}</span>
                      </div>
                    )}

                    <form onSubmit={handleVerifyOtp} className="auth-form">
                      <div
                        className={`otp-container ${otpShake ? 'otp-shake' : ''}`}
                        onPaste={handleOtpPaste}
                      >
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (otpInputRefs.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="otp-box"
                            autoFocus={idx === 0}
                            aria-label={`Digit ${idx + 1}`}
                          />
                        ))}
                      </div>

                      <button type="submit" className="btn-primary auth-submit-btn">
                        Verify Email
                      </button>
                    </form>

                    <div className="otp-resend-section">
                      <span className="resend-text">Didn't receive the code?</span>
                      {canResend ? (
                        <button
                          type="button"
                          className="auth-link-highlight"
                          onClick={handleResendOtp}
                        >
                          Resend OTP
                        </button>
                      ) : (
                        <span className="resend-countdown">
                          Resend code in {resendTimer}s
                        </span>
                      )}
                    </div>

                    <div className="auth-footer-link">
                      <button
                        type="button"
                        className="auth-link-btn"
                        onClick={() => switchView('login')}
                      >
                        &larr; Back to Sign In
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="auth-success-state">
                    <div className="auth-success-circle">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <h2 className="auth-title">Email verified successfully!</h2>
                    <p className="auth-subtitle">
                      Your account is now fully verified. You can now sign in to access your HireHub dashboard.
                    </p>
                    <button
                      type="button"
                      className="btn-primary auth-submit-btn"
                      onClick={() => switchView('login')}
                    >
                      Continue to Sign In
                    </button>
                  </div>
                )}
              </div>
            )}

            {view === 'forgot' && (
              <div className="auth-screen-fade">
                <div className="auth-header">
                  <div className="auth-icon-circle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <h2 className="auth-title">Forgot your password?</h2>
                  <p className="auth-subtitle">
                    Enter your email and we'll help you reset your password.
                  </p>
                </div>

                {forgotError && (
                  <div className="auth-error-banner" role="alert">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{forgotError}</span>
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="auth-form" noValidate>
                  <div className="form-group">
                    <label className="form-label" htmlFor="forgot-email">Email address</label>
                    <div className="auth-input-wrapper">
                      <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      <input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          if (forgotError) setForgotError('');
                        }}
                        className="form-input auth-input"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary auth-submit-btn">
                    Send Reset Link
                  </button>
                </form>

                <div className="auth-footer-link">
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => switchView('login')}
                  >
                    &larr; Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {view === 'reset' && (
              <div className="auth-screen-fade">
                <div className="auth-header">
                  <h2 className="auth-title">Create a new password</h2>
                  <p className="auth-subtitle">
                    Your new password should be different from your previous password.
                  </p>
                </div>

                <form onSubmit={handleResetSubmit} className="auth-form" noValidate>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reset-password">New Password</label>
                    <div className="auth-input-wrapper">
                      <input
                        id="reset-password"
                        type={showResetPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className={`form-input auth-input ${resetErrors.password ? 'input-error' : ''}`}
                        required
                      />
                      {renderPasswordToggle(showResetPassword, () => setShowResetPassword(!showResetPassword))}
                    </div>

                    {resetPassword && renderStrengthMeter(resetStrength)}

                    {resetErrors.password && (
                      <span className="auth-field-error">{resetErrors.password}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reset-confirm-password">Confirm New Password</label>
                    <div className="auth-input-wrapper">
                      <input
                        id="reset-confirm-password"
                        type={showResetConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        className={`form-input auth-input ${resetErrors.confirmPassword ? 'input-error' : ''}`}
                        required
                      />
                      {renderPasswordToggle(showResetConfirmPassword, () => setShowResetConfirmPassword(!showResetConfirmPassword))}
                    </div>
                    {resetErrors.confirmPassword && (
                      <span className="auth-field-error">{resetErrors.confirmPassword}</span>
                    )}
                  </div>

                  <button type="submit" className="btn-primary auth-submit-btn">
                    Reset Password
                  </button>
                </form>

                <div className="auth-footer-link">
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => switchView('login')}
                  >
                    &larr; Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {view === 'reset-success' && (
              <div className="auth-screen-fade auth-success-state">
                <div className="auth-success-circle">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h2 className="auth-title">Password reset successful</h2>
                <p className="auth-subtitle">
                  Your password has been updated successfully. You can now log in with your new credentials.
                </p>
                <button
                  type="button"
                  className="btn-primary auth-submit-btn"
                  onClick={() => switchView('login')}
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
