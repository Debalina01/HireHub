import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDestructive: false,
    onConfirm: null,
    onCancel: null
  });

  const nextToastId = useRef(0);

  
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  
  const showToast = useCallback(({ type = 'info', message, duration = 3500 }) => {
    if (!message) return;
    const id = ++nextToastId.current;
    const newToast = { id, type, message };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  const showSuccess = useCallback((message, duration = 3500) => {
    showToast({ type: 'success', message, duration });
  }, [showToast]);

  const showError = useCallback((message, duration = 4500) => {
    showToast({ type: 'error', message, duration });
  }, [showToast]);

  const showWarning = useCallback((message, duration = 3500) => {
    showToast({ type: 'warning', message, duration });
  }, [showToast]);

  const showInfo = useCallback((message, duration = 3500) => {
    showToast({ type: 'info', message, duration });
  }, [showToast]);

  
  const showConfirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
    onConfirm,
    onCancel
  }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      isDestructive,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (typeof onConfirm === 'function') onConfirm();
      },
      onCancel: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (typeof onCancel === 'function') onCancel();
      }
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

 
  useEffect(() => {
    if (!confirmModal.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirmModal.onCancel) {
          confirmModal.onCancel();
        } else {
          closeConfirm();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmModal, closeConfirm]);

  return (
    <NotificationContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        dismissToast
      }}
    >
      {children}

     
      <div className="hirehub-toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`hirehub-toast toast-${toast.type}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
          >
            <div className="toast-icon-wrap">
              {toast.type === 'success' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
              {toast.type === 'error' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              )}
              {toast.type === 'warning' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              )}
              {toast.type === 'info' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              )}
            </div>

            <div className="toast-content">
              <span className="toast-message">{toast.message}</span>
            </div>

            <button
              type="button"
              className="toast-close-btn"
              onClick={() => dismissToast(toast.id)}
              aria-label="Close notification"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      
      {confirmModal.isOpen && (
        <div className="modal-overlay" onClick={confirmModal.onCancel}>
          <div
            className="modal-card confirm-modal-card"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
          >
            <div className="modal-header">
              <h3 id="confirm-modal-title" className="modal-title">
                {confirmModal.title}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={confirmModal.onCancel}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem 1.75rem' }}>
              <p style={{ fontSize: '0.94rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                {confirmModal.message}
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={confirmModal.onCancel}
                autoFocus={!confirmModal.isDestructive}
              >
                {confirmModal.cancelText}
              </button>
              <button
                type="button"
                className={confirmModal.isDestructive ? 'btn-danger' : 'btn-primary'}
                onClick={confirmModal.onConfirm}
                autoFocus={confirmModal.isDestructive}
                style={
                  confirmModal.isDestructive
                    ? {
                        backgroundColor: '#dc2626',
                        borderColor: '#dc2626',
                        color: '#ffffff',
                        padding: '0.6rem 1.25rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                      }
                    : {}
                }
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
