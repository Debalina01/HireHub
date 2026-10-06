import React, { useState, useRef, useEffect } from 'react';
import { calculateProfileCompletion } from '../utils/profileStorage';
import { useNotification } from '../context/NotificationContext';
import CompanyLogo from './CompanyLogo';
import DatePicker from './DatePicker';

export default function ProfilePage({ profile = {}, onUpdateProfile, onBackToDashboard, theme = 'dark' }) {
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();

  const [isEditBasicOpen, setIsEditBasicOpen] = useState(false);
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [editingEdu, setEditingEdu] = useState(null);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [editingProj, setEditingProj] = useState(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [isResumePreviewOpen, setIsResumePreviewOpen] = useState(false);

  const [showAvatarActions, setShowAvatarActions] = useState(false);
  const avatarWrapperRef = useRef(null);

  useEffect(() => {
    if (!showAvatarActions) return;

    const handleClickOutside = (e) => {
      if (avatarWrapperRef.current && !avatarWrapperRef.current.contains(e.target)) {
        setShowAvatarActions(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAvatarActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAvatarActions]);

  const [newSkillInput, setNewSkillInput] = useState('');
  const resumeFileRef = useRef(null);
  const avatarFileRef = useRef(null);

  const { percentage, missingFields } = calculateProfileCompletion(profile);

  const SUGGESTED_SKILLS = [
    'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'SQL',
    'HTML5', 'CSS3', 'Git', 'Docker', 'AWS', 'Tailwind CSS', 'Redux', 'GraphQL'
  ];

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || newSkillInput).trim();
    if (!trimmed) return;
    const currentSkills = profile.skills || [];
    if (currentSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      showWarning(`"${trimmed}" is already in your skills list.`);
      setNewSkillInput('');
      return;
    }
    const updated = [...currentSkills, trimmed];
    onUpdateProfile({ ...profile, skills: updated });
    setNewSkillInput('');
    showSuccess(`Added "${trimmed}" to your skills.`);
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = (profile.skills || []).filter((s) => s !== skillToRemove);
    onUpdateProfile({ ...profile, skills: updated });
    showSuccess(`Removed "${skillToRemove}".`);
  };

  const handleResumeFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('File is too large. Please select a resume smaller than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUri = uploadEvent.target.result;
      const formattedSize = file.size < 1024 * 1024
        ? `${Math.round(file.size / 1024)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      const newResume = {
        filename: file.name,
        uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        size: formattedSize,
        fileUrl: dataUri
      };

      onUpdateProfile({ ...profile, resume: newResume });
      showSuccess(`Resume "${file.name}" uploaded successfully!`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDownloadResume = () => {
    if (!profile.resume) return;

    if (profile.resume.fileUrl) {
      const a = document.createElement('a');
      a.href = profile.resume.fileUrl;
      a.download = profile.resume.filename || 'Resume.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showSuccess('Resume downloaded successfully.');
    } else {
      const blob = new Blob(
        [
          `HireHub Resume Document\nCandidate: ${profile.name}\nEmail: ${profile.email}\nPhone: ${profile.phone}\nRole: ${profile.jobTitle}\n\nSummary:\n${profile.bio}\n\nSkills:\n${(profile.skills || []).join(', ')}`
        ],
        { type: 'text/plain;charset=utf-8' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = profile.resume.filename || `${profile.name}_Resume.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Resume downloaded successfully.');
    }
  };

  const handleDeleteResume = () => {
    showConfirm({
      title: 'Remove Resume',
      message: 'Are you sure you want to remove your current resume? You can upload a new one at any time.',
      confirmText: 'Remove Resume',
      onConfirm: () => {
        onUpdateProfile({ ...profile, resume: null });
        showSuccess('Resume removed.');
      }
    });
  };
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please upload a valid image file (JPEG, PNG, WebP).');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB.');
      e.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (profile?.email) {
        formData.append('user_email', profile.email);
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/upload-image`, {
        method: 'POST',
        headers: {
          ...(profile?.email ? { 'x-user-email': profile.email } : {})
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to upload profile picture.');
      }

      const data = await res.json();
      let imageUrl = data.imageUrl || data.avatar;
      if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = `${import.meta.env.VITE_API_BASE_URL}${imageUrl}`;
      }
      const originalFilename = file.name || data.originalFilename || 'profile-photo.jpg';
      if (imageUrl) {
        onUpdateProfile({
          ...profile,
          avatar: imageUrl,
          avatarOriginalFilename: originalFilename
        });
        setShowAvatarActions(false);
        showSuccess('Profile photo updated!');
      } else {
        throw new Error('Image URL was not returned by server.');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      showError(err.message || 'Failed to upload profile photo.');
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveAvatarClick = async (e) => {
    if (e) e.stopPropagation();
    setShowAvatarActions(false);
    if (profile.avatar) {
      try {
        await fetch('/api/profile/remove-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(profile?.email ? { 'x-user-email': profile.email } : {})
          },
          body: JSON.stringify({ user_email: profile?.email || '' })
        }).catch((err) => console.warn('Remove image API error:', err));
      } catch (err) {
        console.warn('Remove image error:', err);
      }
      onUpdateProfile({ ...profile, avatar: '', avatarOriginalFilename: '' });
      showSuccess('Profile photo removed.');
    }
  };

  const handleAddAvatarClick = (e) => {
    if (e) e.stopPropagation();
    setShowAvatarActions(false);
    avatarFileRef.current?.click();
  };

  const handleSaveEducation = (eduData) => {
    let updated;
    if (editingEdu) {
      updated = (profile.education || []).map((e) =>
        e.id === editingEdu.id ? { ...eduData, id: e.id } : e
      );
      showSuccess('Education entry updated!');
    } else {
      const newEntry = { ...eduData, id: `edu-${Date.now()}` };
      updated = [newEntry, ...(profile.education || [])];
      showSuccess('Education entry added!');
    }
    onUpdateProfile({ ...profile, education: updated });
    setIsEduModalOpen(false);
    setEditingEdu(null);
  };

  const handleDeleteEducation = (eduId, degreeName) => {
    showConfirm({
      title: 'Delete Education',
      message: `Are you sure you want to delete "${degreeName || 'this education entry'}"?`,
      confirmText: 'Delete',
      onConfirm: () => {
        const updated = (profile.education || []).filter((e) => e.id !== eduId);
        onUpdateProfile({ ...profile, education: updated });
        showSuccess('Education entry deleted.');
      }
    });
  };

  const handleSaveExperience = (expData) => {
    let updated;
    if (editingExp) {
      updated = (profile.experience || []).map((e) =>
        e.id === editingExp.id ? { ...expData, id: e.id } : e
      );
      showSuccess('Experience updated!');
    } else {
      const newEntry = { ...expData, id: `exp-${Date.now()}` };
      updated = [newEntry, ...(profile.experience || [])];
      showSuccess('Experience entry added!');
    }
    onUpdateProfile({ ...profile, experience: updated });
    setIsExpModalOpen(false);
    setEditingExp(null);
  };

  const handleDeleteExperience = (expId, jobTitle) => {
    showConfirm({
      title: 'Delete Experience',
      message: `Are you sure you want to delete "${jobTitle || 'this experience'}"?`,
      confirmText: 'Delete',
      onConfirm: () => {
        const updated = (profile.experience || []).filter((e) => e.id !== expId);
        onUpdateProfile({ ...profile, experience: updated });
        showSuccess('Experience entry deleted.');
      }
    });
  };

  const handleSaveProject = (projData) => {
    let updated;
    if (editingProj) {
      updated = (profile.projects || []).map((p) =>
        p.id === editingProj.id ? { ...projData, id: p.id } : p
      );
      showSuccess('Project updated!');
    } else {
      const newEntry = { ...projData, id: `proj-${Date.now()}` };
      updated = [newEntry, ...(profile.projects || [])];
      showSuccess('Project added!');
    }
    onUpdateProfile({ ...profile, projects: updated });
    setIsProjModalOpen(false);
    setEditingProj(null);
  };

  const handleDeleteProject = (projId, projName) => {
    showConfirm({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${projName || 'this project'}"?`,
      confirmText: 'Delete',
      onConfirm: () => {
        const updated = (profile.projects || []).filter((p) => p.id !== projId);
        onUpdateProfile({ ...profile, projects: updated });
        showSuccess('Project deleted.');
      }
    });
  };

  const handleSaveCertification = (certData) => {
    let updated;
    if (editingCert) {
      updated = (profile.certifications || []).map((c) =>
        c.id === editingCert.id ? { ...certData, id: c.id } : c
      );
      showSuccess('Certification updated!');
    } else {
      const newEntry = { ...certData, id: `cert-${Date.now()}` };
      updated = [newEntry, ...(profile.certifications || [])];
      showSuccess('Certification added!');
    }
    onUpdateProfile({ ...profile, certifications: updated });
    setIsCertModalOpen(false);
    setEditingCert(null);
  };

  const handleDeleteCertification = (certId, certName) => {
    showConfirm({
      title: 'Delete Certification',
      message: `Are you sure you want to delete "${certName || 'this certification'}"?`,
      confirmText: 'Delete',
      onConfirm: () => {
        const updated = (profile.certifications || []).filter((c) => c.id !== certId);
        onUpdateProfile({ ...profile, certifications: updated });
        showSuccess('Certification deleted.');
      }
    });
  };

  const initials = (profile.name || 'Job Seeker')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="profile-page-wrapper">
      <input
        type="file"
        ref={resumeFileRef}
        style={{ display: 'none' }}
        accept=".pdf,.doc,.docx"
        onChange={handleResumeFileUpload}
      />
      <input
        type="file"
        ref={avatarFileRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleAvatarUpload}
      />

      <div className="profile-nav-header">
        <button
          type="button"
          className="btn-back-dashboard"
          onClick={onBackToDashboard}
          title="Return to Applications Dashboard"
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
          <span className="crumb-current">My Profile</span>
        </div>
      </div>

      <header className="profile-hero-card">
        <div className="profile-hero-left">
          <div className="profile-avatar-wrapper" ref={avatarWrapperRef}>
            <div
              className={`profile-avatar-container ${profile.avatar ? 'has-avatar' : ''} ${showAvatarActions ? 'actions-open' : ''}`}
              onClick={() => setShowAvatarActions((prev) => !prev)}
              title="Click to manage profile photo"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowAvatarActions((prev) => !prev);
                }
              }}
              aria-label="Manage profile photo"
              aria-expanded={showAvatarActions}
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">{initials}</div>
              )}
            </div>

            {showAvatarActions && (
              <div className="avatar-actions-menu" role="group" aria-label="Profile photo options">
                <button
                  type="button"
                  className="avatar-action-btn avatar-action-remove"
                  onClick={handleRemoveAvatarClick}
                  title="Remove current profile picture"
                  aria-label="Remove profile picture"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>

                <button
                  type="button"
                  className="avatar-action-btn avatar-action-add"
                  onClick={handleAddAvatarClick}
                  title="Add or change profile picture"
                  aria-label="Add or change profile picture"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="profile-hero-info">
            <div className="profile-title-row">
              <h1 className="profile-name-heading">{profile.name || 'Job Seeker'}</h1>
              <span className="job-seeker-badge">
                <span className="badge-dot"></span>
                Job Seeker
              </span>
            </div>

            <p className="profile-headline">{profile.jobTitle || 'Aspiring Professional • Open to Opportunities'}</p>

            <div className="profile-meta-chips">
              {profile.location && (
                <span className="profile-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {profile.location}
                </span>
              )}

              {profile.email && (
                <span className="profile-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  {profile.email}
                </span>
              )}

              {profile.phone && (
                <span className="profile-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  {profile.phone}
                </span>
              )}

              {profile.dob && (
                <span className="profile-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Born: {profile.dob}
                </span>
              )}

              {profile.preferences?.workMode && (
                <span className="profile-meta-item mode-chip">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  {profile.preferences.workMode}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-hero-actions">
          <button
            type="button"
            className="btn-edit-profile"
            onClick={() => setIsEditBasicOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Edit Profile</span>
          </button>
        </div>
      </header>

      <div className="profile-dashboard-grid">
        <div className="profile-main-col">
          <section className="profile-card">
            <div className="profile-card-header">
              <div className="header-title-group">
                <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <h2>About Me</h2>
              </div>
              <button
                type="button"
                className="btn-card-action"
                onClick={() => setIsEditBasicOpen(true)}
                title="Edit Bio"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Edit</span>
              </button>
            </div>
            <div className="profile-card-body">
              {profile.bio ? (
                <p className="bio-text">{profile.bio}</p>
              ) : (
                <div className="empty-section-prompt">
                  <p>No bio added yet. Tell recruiters about your professional journey, technical expertise, and what drives you.</p>
                  <button type="button" className="btn-empty-add" onClick={() => setIsEditBasicOpen(true)}>
                    + Add Bio
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-card-header">
              <div className="header-title-group">
                <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <h2>Experience</h2>
              </div>
              <button
                type="button"
                className="btn-card-action primary-action"
                onClick={() => {
                  setEditingExp(null);
                  setIsExpModalOpen(true);
                }}
              >
                + Add Experience
              </button>
            </div>
            <div className="profile-card-body">
              {profile.experience && profile.experience.length > 0 ? (
                <div className="experience-list">
                  {profile.experience.map((exp) => (
                    <div key={exp.id} className="experience-item-card">
                      <div className="exp-logo-wrap" title="Experience" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                      </div>
                      <div className="exp-details">
                        <div className="exp-header-row">
                          <h3 className="exp-title">{exp.title}</h3>
                          <div className="item-action-btns">
                            <button
                              type="button"
                              className="btn-item-edit"
                              onClick={() => {
                                setEditingExp(exp);
                                setIsExpModalOpen(true);
                              }}
                              title="Edit Experience"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="btn-item-delete"
                              onClick={() => handleDeleteExperience(exp.id, exp.title)}
                              title="Delete Experience"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="exp-company-row">
                          <span className="exp-company">{exp.company}</span>
                          {exp.location && <span className="exp-location">&bull; {exp.location}</span>}
                          {exp.isCurrent && <span className="current-job-pill">Current</span>}
                        </div>

                        <p className="exp-dates">
                          {exp.startDate} &ndash; {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}
                        </p>

                        {exp.description && <p className="exp-desc">{exp.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-section-prompt">
                  <p>No experience added yet. Add internships, full-time positions, or freelance work.</p>
                  <button
                    type="button"
                    className="btn-empty-add"
                    onClick={() => {
                      setEditingExp(null);
                      setIsExpModalOpen(true);
                    }}
                  >
                    + Add Experience
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-card-header">
              <div className="header-title-group">
                <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
                <h2>Projects</h2>
              </div>
              <button
                type="button"
                className="btn-card-action primary-action"
                onClick={() => {
                  setEditingProj(null);
                  setIsProjModalOpen(true);
                }}
              >
                + Add Project
              </button>
            </div>
            <div className="profile-card-body">
              {profile.projects && profile.projects.length > 0 ? (
                <div className="projects-grid">
                  {profile.projects.map((proj) => (
                    <div key={proj.id} className="project-item-card">
                      <div className="proj-icon-wrap" title={proj.name || 'Project'}>
                        <CompanyLogo
                          company={proj.name}
                          alt={`${proj.name || 'Project'} logo`}
                          fallbackIcon={
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="16 18 22 12 16 6"></polyline>
                              <polyline points="8 6 2 12 8 18"></polyline>
                            </svg>
                          }
                        />
                      </div>
                      <div className="project-details">
                        <div className="project-top-row">
                          <h3 className="project-name">{proj.name}</h3>
                          <div className="item-action-btns">
                            <button
                              type="button"
                              className="btn-item-edit"
                              onClick={() => {
                                setEditingProj(proj);
                                setIsProjModalOpen(true);
                              }}
                              title="Edit Project"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="btn-item-delete"
                              onClick={() => handleDeleteProject(proj.id, proj.name)}
                              title="Delete Project"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>

                        {proj.techStack && proj.techStack.length > 0 && (
                          <div className="project-tech-chips">
                            {proj.techStack.map((tech, idx) => (
                              <span key={idx} className="project-tech-badge">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}

                        {proj.description && <p className="project-desc">{proj.description}</p>}

                        {(proj.githubUrl || proj.liveUrl) && (
                          <div className="project-links-row">
                            {proj.githubUrl && (
                              <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="proj-link github-link">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                                </svg>
                                <span>Source Code</span>
                              </a>
                            )}
                            {proj.liveUrl && (
                              <a href={proj.liveUrl} target="_blank" rel="noopener noreferrer" className="proj-link demo-link">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                  <polyline points="15 3 21 3 21 9"></polyline>
                                  <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                                <span>Live Demo</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-section-prompt">
                  <p>No projects added yet. Showcase your personal, academic, or open-source projects.</p>
                  <button
                    type="button"
                    className="btn-empty-add"
                    onClick={() => {
                      setEditingProj(null);
                      setIsProjModalOpen(true);
                    }}
                  >
                    + Add Project
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-card-header">
              <div className="header-title-group">
                <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
                <h2>Education</h2>
              </div>
              <button
                type="button"
                className="btn-card-action primary-action"
                onClick={() => {
                  setEditingEdu(null);
                  setIsEduModalOpen(true);
                }}
              >
                + Add Education
              </button>
            </div>
            <div className="profile-card-body">
              {profile.education && profile.education.length > 0 ? (
                <div className="education-list">
                  {profile.education.map((edu) => (
                    <div key={edu.id} className="education-item-card">
                      <div className="edu-icon-wrap" title="Education" aria-hidden="true">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                        </svg>
                      </div>
                      <div className="edu-details">
                        <div className="edu-header-row">
                          <h3 className="edu-degree">{edu.degree}</h3>
                          <div className="item-action-btns">
                            <button
                              type="button"
                              className="btn-item-edit"
                              onClick={() => {
                                setEditingEdu(edu);
                                setIsEduModalOpen(true);
                              }}
                              title="Edit Education"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="btn-item-delete"
                              onClick={() => handleDeleteEducation(edu.id, edu.degree)}
                              title="Delete Education"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>

                        <p className="edu-school">{edu.school}</p>
                        <p className="edu-years">
                          {edu.startDate || edu.startYear} &ndash; {edu.graduationDate || edu.endYear} {edu.grade && <span className="edu-grade">&bull; {edu.grade}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-section-prompt">
                  <p>No education added yet. Add your degrees, colleges, and academic milestones.</p>
                  <button
                    type="button"
                    className="btn-empty-add"
                    onClick={() => {
                      setEditingEdu(null);
                      setIsEduModalOpen(true);
                    }}
                  >
                    + Add Education
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-card-header">
              <div className="header-title-group">
                <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="7"></circle>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                </svg>
                <h2>Certifications</h2>
              </div>
              <button
                type="button"
                className="btn-card-action primary-action"
                onClick={() => {
                  setEditingCert(null);
                  setIsCertModalOpen(true);
                }}
              >
                + Add Certification
              </button>
            </div>
            <div className="profile-card-body">
              {profile.certifications && profile.certifications.length > 0 ? (
                <div className="cert-list">
                  {profile.certifications.map((cert) => (
                    <div key={cert.id} className="cert-item-card">
                      <div className="cert-badge-wrap">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                      </div>
                      <div className="cert-details">
                        <div className="cert-header-row">
                          <h3 className="cert-name">{cert.name}</h3>
                          <div className="item-action-btns">
                            <button
                              type="button"
                              className="btn-item-edit"
                              onClick={() => {
                                setEditingCert(cert);
                                setIsCertModalOpen(true);
                              }}
                              title="Edit Certification"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="btn-item-delete"
                              onClick={() => handleDeleteCertification(cert.id, cert.name)}
                              title="Delete Certification"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>

                        <p className="cert-issuer">
                          {cert.issuer} {cert.issueDate && <span className="cert-date">&bull; Issued: {cert.issueDate}</span>} {cert.expiryDate && <span className="cert-date">&bull; Expires: {cert.expiryDate}</span>}
                        </p>

                        {cert.certificateUrl && (
                          <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer" className="cert-verify-link">
                            <span>View Credential</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-section-prompt">
                  <p>No certifications added yet. Showcase your verified industry credentials and courses.</p>
                  <button
                    type="button"
                    className="btn-empty-add"
                    onClick={() => {
                      setEditingCert(null);
                      setIsCertModalOpen(true);
                    }}
                  >
                    + Add Certification
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="profile-side-col">
          <div className="profile-card completion-card">
            <div className="completion-top-row">
              <div>
                <span className="completion-label">Profile Strength</span>
                <h3 className="completion-status-title">
                  {percentage >= 90 ? 'All-Star Profile! 🎉' : percentage >= 70 ? 'Strong Profile 🚀' : 'Getting Started 💪'}
                </h3>
              </div>
              <div className="completion-percent-pill">
                <span>{percentage}%</span>
              </div>
            </div>

            <div className="completion-bar-track">
              <div
                className="completion-bar-fill"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            {missingFields.length > 0 ? (
              <div className="missing-items-box">
                <span className="missing-title">Recommended to reach 100%:</span>
                <ul className="missing-list">
                  {missingFields.slice(0, 4).map((field, idx) => (
                    <li key={idx}>
                      <span className="missing-dot">&bull;</span>
                      <span>{field}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn-complete-profile"
                  onClick={() => setIsEditBasicOpen(true)}
                >
                  Complete Profile
                </button>
              </div>
            ) : (
              <div className="completion-complete-box">
                <span className="complete-icon">✓</span>
                <span>Your profile is 100% complete! Recruiters can see your full capabilities.</span>
              </div>
            )}
          </div>

          <div className="profile-card">
            <div className="profile-card-header">
              <div className="header-title-group">
                <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <h2>Resume</h2>
              </div>
              {profile.resume && (
                <button
                  type="button"
                  className="btn-card-action"
                  onClick={() => resumeFileRef.current?.click()}
                  title="Replace Resume"
                >
                  Replace
                </button>
              )}
            </div>

            <div className="profile-card-body">
              {profile.resume ? (
                <div className="resume-display-card">
                  <div className="resume-meta-row">
                    <div className="resume-icon-badge">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </div>
                    <div className="resume-text-meta">
                      <strong className="resume-filename" title={profile.resume.filename}>
                        {profile.resume.filename}
                      </strong>
                      <span className="resume-date-size">
                        {profile.resume.uploadDate || 'Uploaded'} &bull; {profile.resume.size || 'PDF'}
                      </span>
                    </div>
                  </div>

                  <div className="resume-buttons-row">
                    <button
                      type="button"
                      className="btn-resume-action btn-resume-view"
                      onClick={() => setIsResumePreviewOpen(true)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      className="btn-resume-action btn-resume-download"
                      onClick={handleDownloadResume}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      className="btn-resume-action btn-resume-delete"
                      onClick={handleDeleteResume}
                      title="Remove resume"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="resume-dropzone" onClick={() => resumeFileRef.current?.click()}>
                  <svg className="upload-cloud-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <p className="dropzone-text">Click to upload your Resume</p>
                  <span className="dropzone-sub">PDF, DOC, DOCX up to 5MB</span>
                  <button type="button" className="btn-upload-resume">
                    Upload Resume
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-card-header">
              <div className="header-title-group">
                <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
                <h2>Skills</h2>
              </div>
            </div>

            <div className="profile-card-body">
              <form
                className="add-skill-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddSkill();
                }}
              >
                <input
                  type="text"
                  placeholder="e.g. React, Python, Docker..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  className="add-skill-input"
                  aria-label="Add a new skill"
                />
                <button type="submit" className="btn-add-skill-submit" disabled={!newSkillInput.trim()}>
                  Add
                </button>
              </form>

              <div className="skills-chip-container">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, idx) => (
                    <span key={idx} className="skill-chip">
                      <span className="skill-chip-name">{skill}</span>
                      <button
                        type="button"
                        className="skill-chip-remove"
                        onClick={() => handleRemoveSkill(skill)}
                        aria-label={`Remove skill ${skill}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="no-skills-msg">No skills added yet.</p>
                )}
              </div>

              <div className="suggested-skills-box">
                <span className="suggested-label">Suggested:</span>
                <div className="suggested-chips">
                  {SUGGESTED_SKILLS.filter(
                    (s) => !(profile.skills || []).some((userS) => userS.toLowerCase() === s.toLowerCase())
                  )
                    .slice(0, 6)
                    .map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="suggested-skill-btn"
                        onClick={() => handleAddSkill(s)}
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-card-header">
              <div className="header-title-group">
                <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <h2>Job Preferences</h2>
              </div>
              <button
                type="button"
                className="btn-card-action"
                onClick={() => setIsEditBasicOpen(true)}
              >
                Edit
              </button>
            </div>

            <div className="profile-card-body preferences-list">
              <div className="pref-item">
                <span className="pref-label">Preferred Role:</span>
                <span className="pref-val">{profile.preferences?.preferredRole || 'Not specified'}</span>
              </div>
              <div className="pref-item">
                <span className="pref-label">Preferred Location:</span>
                <span className="pref-val">{profile.preferences?.preferredLocation || 'Not specified'}</span>
              </div>
              <div className="pref-item">
                <span className="pref-label">Work Mode:</span>
                <span className="pref-val mode-val">{profile.preferences?.workMode || 'Remote / Hybrid'}</span>
              </div>
              <div className="pref-item">
                <span className="pref-label">Employment Type:</span>
                <span className="pref-val">{profile.preferences?.employmentType || 'Full-time'}</span>
              </div>
              <div className="pref-item">
                <span className="pref-label">Expected Salary:</span>
                <span className="pref-val">{profile.preferences?.expectedSalary || 'Negotiable'}</span>
              </div>
              <div className="pref-item">
                <span className="pref-label">Notice Period:</span>
                <span className="pref-val">{profile.preferences?.noticePeriod || 'Immediate'}</span>
              </div>
              {profile.preferences?.availableFrom && (
                <div className="pref-item">
                  <span className="pref-label">Available From:</span>
                  <span className="pref-val">{profile.preferences.availableFrom}</span>
                </div>
              )}
              {profile.preferences?.noticePeriodEndDate && (
                <div className="pref-item">
                  <span className="pref-label">Notice End Date:</span>
                  <span className="pref-val">{profile.preferences.noticePeriodEndDate}</span>
                </div>
              )}
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-card-header">
              <div className="header-title-group">
                <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                <h2>Social Links</h2>
              </div>
              <button
                type="button"
                className="btn-card-action"
                onClick={() => setIsEditBasicOpen(true)}
              >
                Edit
              </button>
            </div>

            <div className="profile-card-body social-links-list">
              {profile.socialLinks?.linkedin ? (
                <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="social-link-item">
                  <div className="social-icon-box linkedin">in</div>
                  <span className="social-text">LinkedIn Profile</span>
                  <svg className="ext-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              ) : (
                <div className="social-link-empty" onClick={() => setIsEditBasicOpen(true)}>
                  <div className="social-icon-box linkedin">in</div>
                  <span>+ Add LinkedIn</span>
                </div>
              )}

              {profile.socialLinks?.github ? (
                <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="social-link-item">
                  <div className="social-icon-box github">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                  </div>
                  <span className="social-text">GitHub Profile</span>
                  <svg className="ext-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              ) : (
                <div className="social-link-empty" onClick={() => setIsEditBasicOpen(true)}>
                  <div className="social-icon-box github">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                  </div>
                  <span>+ Add GitHub</span>
                </div>
              )}

              {profile.socialLinks?.portfolio ? (
                <a href={profile.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="social-link-item">
                  <div className="social-icon-box web">🌐</div>
                  <span className="social-text">Portfolio Website</span>
                  <svg className="ext-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              ) : (
                <div className="social-link-empty" onClick={() => setIsEditBasicOpen(true)}>
                  <div className="social-icon-box web">🌐</div>
                  <span>+ Add Portfolio Link</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditBasicOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setIsEditBasicOpen(false)}
          onSave={(updatedFields) => {
            onUpdateProfile({ ...profile, ...updatedFields });
            setIsEditBasicOpen(false);
            showSuccess('Profile updated successfully!');
          }}
        />
      )}

      {isEduModalOpen && (
        <EducationModal
          initialData={editingEdu}
          onClose={() => {
            setIsEduModalOpen(false);
            setEditingEdu(null);
          }}
          onSave={handleSaveEducation}
        />
      )}

      {isExpModalOpen && (
        <ExperienceModal
          initialData={editingExp}
          onClose={() => {
            setIsExpModalOpen(false);
            setEditingExp(null);
          }}
          onSave={handleSaveExperience}
        />
      )}

      {isProjModalOpen && (
        <ProjectModal
          initialData={editingProj}
          onClose={() => {
            setIsProjModalOpen(false);
            setEditingProj(null);
          }}
          onSave={handleSaveProject}
        />
      )}

      {isCertModalOpen && (
        <CertificationModal
          initialData={editingCert}
          onClose={() => {
            setIsCertModalOpen(false);
            setEditingCert(null);
          }}
          onSave={handleSaveCertification}
        />
      )}

      {isResumePreviewOpen && profile.resume && (
        <div className="modal-backdrop" onClick={() => setIsResumePreviewOpen(false)}>
          <div className="modal-card resume-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{profile.resume.filename}</h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsResumePreviewOpen(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="modal-body resume-preview-body">
              {profile.resume.fileUrl ? (
                <iframe
                  src={profile.resume.fileUrl}
                  title="Resume Preview"
                  className="resume-iframe"
                />
              ) : (
                <div className="simulated-resume-content">
                  <div className="resume-paper">
                    <h2>{profile.name}</h2>
                    <p className="resume-contact-line">
                      {profile.email} &bull; {profile.phone} &bull; {profile.location}
                    </p>
                    <hr />
                    <h4>Professional Summary</h4>
                    <p>{profile.bio || 'Experienced software developer with strong analytical and problem-solving skills.'}</p>
                    <h4>Core Competencies</h4>
                    <p>{(profile.skills || []).join(' • ')}</p>
                    <h4>Education</h4>
                    {profile.education?.map((e) => (
                      <p key={e.id}><strong>{e.degree}</strong> &ndash; {e.school} ({e.startYear}&ndash;{e.endYear})</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsResumePreviewOpen(false)}>
                Close
              </button>
              <button type="button" className="btn-primary" onClick={handleDownloadResume}>
                Download Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditProfileModal({ profile, onClose, onSave }) {
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
    dob: profile.dob || '',
    location: profile.location || '',
    jobTitle: profile.jobTitle || '',
    bio: profile.bio || '',
    preferences: {
      preferredRole: profile.preferences?.preferredRole || '',
      preferredLocation: profile.preferences?.preferredLocation || '',
      workMode: profile.preferences?.workMode || 'Remote',
      employmentType: profile.preferences?.employmentType || 'Full-time',
      expectedSalary: profile.preferences?.expectedSalary || '',
      noticePeriod: profile.preferences?.noticePeriod || 'Immediate',
      availableFrom: profile.preferences?.availableFrom || '',
      noticePeriodEndDate: profile.preferences?.noticePeriodEndDate || ''
    },
    socialLinks: {
      linkedin: profile.socialLinks?.linkedin || '',
      github: profile.socialLinks?.github || '',
      portfolio: profile.socialLinks?.portfolio || ''
    }
  });

  const isInitialUploaded = Boolean(profile.avatar && (profile.avatar.startsWith('/') || profile.avatar.includes('/uploads/')));
  const [uploadedAvatar, setUploadedAvatar] = useState(isInitialUploaded ? profile.avatar : '');
  const [uploadedFilename, setUploadedFilename] = useState(
    profile.avatarOriginalFilename || (isInitialUploaded ? 'profile-photo.jpg' : '')
  );
  const [photoUrl, setPhotoUrl] = useState(
    (!isInitialUploaded && profile.avatar && (profile.avatar.startsWith('http://') || profile.avatar.startsWith('https://')))
      ? profile.avatar
      : ''
  );
  const [lastSource, setLastSource] = useState(isInitialUploaded ? 'upload' : (profile.avatar ? 'url' : null));
  const [photoUrlError, setPhotoUrlError] = useState('');

  const validateUrl = (urlStr) => {
    if (!urlStr || !urlStr.trim()) return '';
    try {
      const u = new URL(urlStr.trim());
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        return '';
      }
      return 'URL must start with http:// or https://';
    } catch {
      return 'Please enter a valid URL (e.g. https://example.com/photo.jpg)';
    }
  };

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setPhotoUrl(val);
    setLastSource('url');
    if (!val.trim()) {
      setPhotoUrlError('');
    } else {
      setPhotoUrlError(validateUrl(val));
    }
  };

  const handleUrlBlur = () => {
    setPhotoUrlError(validateUrl(photoUrl));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please upload a valid image file (JPEG, PNG, WebP).');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB.');
      e.target.value = '';
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      if (profile?.email) {
        uploadData.append('user_email', profile.email);
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/upload-image`, {
        method: 'POST',
        headers: {
          ...(profile?.email ? { 'x-user-email': profile.email } : {})
        },
        body: uploadData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to upload photo.');
      }

      const data = await res.json();
      let imageUrl = data.imageUrl || data.avatar;
      if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = `${import.meta.env.VITE_API_BASE_URL}${imageUrl}`;
      }
      const originalName = file.name || data.originalFilename || 'profile-photo.jpg';

      if (imageUrl) {
        setUploadedAvatar(imageUrl);
        setUploadedFilename(originalName);
        setLastSource('upload');
        setPhotoUrlError('');
        showSuccess('Photo uploaded successfully.');
      }
    } catch (err) {
      console.error('Modal photo upload error:', err);
      showError(err.message || 'Failed to upload photo.');
    } finally {
      e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setUploadedAvatar('');
    setUploadedFilename('');
    setPhotoUrl('');
    setPhotoUrlError('');
    setLastSource(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const err = validateUrl(photoUrl);
    if (err) {
      setPhotoUrlError(err);
      return;
    }
    setPhotoUrlError('');

    const trimmedUrl = photoUrl.trim();
    let finalAvatar = '';
    let finalOriginalFilename = '';

    if (lastSource === 'upload' && uploadedAvatar) {
      finalAvatar = uploadedAvatar;
      finalOriginalFilename = uploadedFilename || '';
    } else if (lastSource === 'url' && trimmedUrl) {
      finalAvatar = trimmedUrl;
      finalOriginalFilename = uploadedFilename || '';
    } else if (uploadedAvatar) {
      finalAvatar = uploadedAvatar;
      finalOriginalFilename = uploadedFilename || '';
    } else if (trimmedUrl) {
      finalAvatar = trimmedUrl;
      finalOriginalFilename = '';
    }

    onSave({
      ...formData,
      avatar: finalAvatar,
      avatarOriginalFilename: finalOriginalFilename
    });
  };

  const trimmedUrl = photoUrl.trim();
  const previewAvatar = lastSource === 'url'
    ? (trimmedUrl && !photoUrlError ? trimmedUrl : uploadedAvatar)
    : (uploadedAvatar || (trimmedUrl && !photoUrlError ? trimmedUrl : ''));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card edit-profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Profile</h3>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="modal-tabs-bar">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About & Bio
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            Social Links
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {activeTab === 'basic' && (
              <div className="form-fields-stack">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Debalina Roy"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Current / Desired Job Title</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      placeholder="e.g. Senior Frontend Engineer"
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Location</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Bengaluru, India"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Date of Birth</label>
                    <DatePicker
                      value={formData.dob}
                      onChange={(val) => setFormData({ ...formData, dob: val })}
                      placeholder="Select date of birth..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Profile Photo</label>
                  <div className="modal-avatar-control-row">
                    <div className="modal-avatar-preview">
                      {previewAvatar ? (
                        <img src={previewAvatar} alt="Preview" />
                      ) : (
                        <span>{(formData.name || 'JS').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="modal-avatar-actions">
                      <div className="modal-avatar-btns">
                        <label className="btn-modal-upload-photo" title="Upload image from computer">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span>Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                          />
                        </label>
                        {uploadedFilename && (
                          <div className="modal-uploaded-filename-badge" title={uploadedFilename}>
                            <span className="uploaded-file-name-text">{uploadedFilename}</span>
                            <span className="uploaded-check-mark">✓</span>
                          </div>
                        )}
                        {(uploadedAvatar || photoUrl) && (
                          <button
                            type="button"
                            className="btn-modal-remove-photo"
                            onClick={handleRemovePhoto}
                            title="Remove photo"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            <span>Remove Photo</span>
                          </button>
                        )}
                      </div>
                      <div className="modal-avatar-url-group">
                        <label className="modal-avatar-sublabel">Photo URL (optional)</label>
                        <input
                          type="text"
                          className={`form-input modal-avatar-url-input ${photoUrlError ? 'input-error' : ''}`}
                          value={photoUrl}
                          onChange={handleUrlChange}
                          onBlur={handleUrlBlur}
                          placeholder="https://example.com/photo.jpg"
                        />
                        {photoUrlError && (
                          <span className="modal-avatar-url-error">{photoUrlError}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="form-fields-stack">
                <div className="form-group">
                  <label>About Me / Professional Bio</label>
                  <textarea
                    rows={6}
                    className="form-textarea"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Write a concise overview of your background, experience, key strengths, and career aspirations..."
                  ></textarea>
                  <span className="field-hint">
                    A thorough bio increases recruiter response rates by up to 40%.
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="form-fields-stack">
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Preferred Role</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.preferences.preferredRole}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, preferredRole: e.target.value }
                        })
                      }
                      placeholder="e.g. Full Stack Developer"
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Preferred Location</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.preferences.preferredLocation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, preferredLocation: e.target.value }
                        })
                      }
                      placeholder="e.g. Bengaluru, Remote"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Work Mode</label>
                    <select
                      className="form-select"
                      value={formData.preferences.workMode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, workMode: e.target.value }
                        })
                      }
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                      <option value="Open to Any">Open to Any</option>
                    </select>
                  </div>
                  <div className="form-group flex-1">
                    <label>Employment Type</label>
                    <select
                      className="form-select"
                      value={formData.preferences.employmentType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, employmentType: e.target.value }
                        })
                      }
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Expected Salary</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.preferences.expectedSalary}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, expectedSalary: e.target.value }
                        })
                      }
                      placeholder="e.g. ₹15,00,000 / year"
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Notice Period / Availability</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.preferences.noticePeriod}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, noticePeriod: e.target.value }
                        })
                      }
                      placeholder="e.g. Immediate / 15 Days"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Available From / Joining Date</label>
                    <DatePicker
                      value={formData.preferences.availableFrom}
                      onChange={(val) =>
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, availableFrom: val }
                        })
                      }
                      placeholder="Select joining date..."
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Notice Period End Date (if applicable)</label>
                    <DatePicker
                      value={formData.preferences.noticePeriodEndDate}
                      onChange={(val) =>
                        setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, noticePeriodEndDate: val }
                        })
                      }
                      placeholder="Select notice end date..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="form-fields-stack">
                <div className="form-group">
                  <label>LinkedIn URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={formData.socialLinks.linkedin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, linkedin: e.target.value }
                      })
                    }
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div className="form-group">
                  <label>GitHub URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={formData.socialLinks.github}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, github: e.target.value }
                      })
                    }
                    placeholder="https://github.com/username"
                  />
                </div>
                <div className="form-group">
                  <label>Portfolio / Personal Website</label>
                  <input
                    type="url"
                    className="form-input"
                    value={formData.socialLinks.portfolio}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, portfolio: e.target.value }
                      })
                    }
                    placeholder="https://yourwebsite.dev"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EducationModal({ initialData, onClose, onSave }) {
  const [degree, setDegree] = useState(initialData?.degree || '');
  const [school, setSchool] = useState(initialData?.school || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || initialData?.startYear || '');
  const [graduationDate, setGraduationDate] = useState(initialData?.graduationDate || initialData?.endYear || '');
  const [grade, setGrade] = useState(initialData?.grade || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      degree,
      school,
      startDate,
      graduationDate,
      startYear: startDate,
      endYear: graduationDate,
      grade
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? 'Edit Education' : 'Add Education'}</h3>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Degree / Program *</label>
              <input
                type="text"
                required
                className="form-input"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="e.g. B.Tech in Computer Science"
              />
            </div>
            <div className="form-group">
              <label>College / University *</label>
              <input
                type="text"
                required
                className="form-input"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g. Stanford University"
              />
            </div>
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Start Date *</label>
                <DatePicker
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  placeholder="Select start date..."
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label>Graduation Date *</label>
                <DatePicker
                  value={graduationDate}
                  onChange={(val) => setGraduationDate(val)}
                  placeholder="Select graduation date..."
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>CGPA / Percentage</label>
              <input
                type="text"
                className="form-input"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. 8.9 / 10 CGPA or 89%"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {initialData ? 'Update Education' : 'Save Education'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExperienceModal({ initialData, onClose, onSave }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [company, setCompany] = useState(initialData?.company || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [isCurrent, setIsCurrent] = useState(Boolean(initialData?.isCurrent));
  const [description, setDescription] = useState(initialData?.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, company, location, startDate, endDate: isCurrent ? '' : endDate, isCurrent, description });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? 'Edit Experience' : 'Add Experience'}</h3>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Job Title *</label>
              <input
                type="text"
                required
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer Intern"
              />
            </div>
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Company Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google, TechCorp"
                />
              </div>
              <div className="form-group flex-1">
                <label>Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, Remote"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Start Date *</label>
                <DatePicker
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  placeholder="Select start date..."
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label>End Date {isCurrent ? '(Currently Working)' : '*'}</label>
                {isCurrent ? (
                  <input
                    type="text"
                    className="form-input"
                    value="Present"
                    disabled
                    style={{ cursor: 'not-allowed', opacity: 0.7 }}
                  />
                ) : (
                  <DatePicker
                    value={endDate}
                    onChange={(val) => setEndDate(val)}
                    placeholder="Select end date..."
                    disabled={isCurrent}
                    required={!isCurrent}
                  />
                )}
              </div>
            </div>

            <div className="form-checkbox-row">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(e) => {
                    setIsCurrent(e.target.checked);
                    if (e.target.checked) {
                      setEndDate('');
                    }
                  }}
                />
                <span>I currently work here</span>
              </label>
            </div>

            <div className="form-group">
              <label>Job Description & Key Achievements</label>
              <textarea
                rows={4}
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your responsibilities, technologies used, and notable accomplishments..."
              ></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {initialData ? 'Update Experience' : 'Save Experience'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectModal({ initialData, onClose, onSave }) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [techInput, setTechInput] = useState(
    Array.isArray(initialData?.techStack) ? initialData.techStack.join(', ') : ''
  );
  const [githubUrl, setGithubUrl] = useState(initialData?.githubUrl || '');
  const [liveUrl, setLiveUrl] = useState(initialData?.liveUrl || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const techStack = techInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({ name, description, techStack, githubUrl, liveUrl });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? 'Edit Project' : 'Add Project'}</h3>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Project Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. HireHub Application Tracker"
              />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea
                rows={3}
                required
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What problem does this project solve? What did you build?"
              ></textarea>
            </div>
            <div className="form-group">
              <label>Technologies Used (comma separated)</label>
              <input
                type="text"
                className="form-input"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                placeholder="e.g. React, Node.js, Vite, MongoDB"
              />
            </div>
            <div className="form-row">
              <div className="form-group flex-1">
                <label>GitHub Repository URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="form-group flex-1">
                <label>Live Demo URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://demo.dev"
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {initialData ? 'Update Project' : 'Save Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CertificationModal({ initialData, onClose, onSave }) {
  const [name, setName] = useState(initialData?.name || '');
  const [issuer, setIssuer] = useState(initialData?.issuer || '');
  const [issueDate, setIssueDate] = useState(initialData?.issueDate || '');
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate || '');
  const [certificateUrl, setCertificateUrl] = useState(initialData?.certificateUrl || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, issuer, issueDate, expiryDate, certificateUrl });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? 'Edit Certification' : 'Add Certification'}</h3>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Certificate Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AWS Certified Solutions Architect"
              />
            </div>
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Issuing Organization *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="e.g. Amazon Web Services, Meta"
                />
              </div>
              <div className="form-group flex-1">
                <label>Issue Date</label>
                <DatePicker
                  value={issueDate}
                  onChange={(val) => setIssueDate(val)}
                  placeholder="Select issue date..."
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Expiry Date (if applicable)</label>
                <DatePicker
                  value={expiryDate}
                  onChange={(val) => setExpiryDate(val)}
                  placeholder="Select expiry date..."
                />
              </div>
              <div className="form-group flex-1">
                <label>Certificate URL or Credential Link</label>
                <input
                  type="url"
                  className="form-input"
                  value={certificateUrl}
                  onChange={(e) => setCertificateUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {initialData ? 'Update Certificate' : 'Save Certificate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
