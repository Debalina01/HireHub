const DEFAULT_DEBALINA_PROFILE = {
  name: 'Debalina Roy',
  email: 'debalina@example.com',
  phone: '+91 98765 43210',
  location: 'Bengaluru, India',
  jobTitle: 'Full Stack Software Engineer',
  role: 'Job Seeker',
  dob: 'Nov 12, 1998',
  avatar: '',
  avatarOriginalFilename: '',
  bio: 'Passionate software developer specializing in building scalable web applications with React, Node.js, and modern cloud architectures. Excited about solving complex user-centric problems and contributing to innovative engineering teams.',
  resume: {
    filename: 'Debalina_Roy_Resume.pdf',
    uploadDate: 'Sep 25, 2026',
    size: '245 KB',
    fileUrl: null
  },
  skills: [
    'React',
    'JavaScript',
    'TypeScript',
    'Node.js',
    'Python',
    'SQL',
    'HTML5',
    'CSS3',
    'Git',
    'Docker',
    'REST APIs',
    'Tailwind CSS'
  ],
  experience: [
    {
      id: 'exp-1',
      title: 'Software Engineer',
      company: 'NextGen Solutions',
      location: 'Bengaluru (Hybrid)',
      startDate: 'Aug 2025',
      endDate: '',
      isCurrent: true,
      description: 'Building responsive web interfaces, optimizing state management, integrating asynchronous APIs, and collaborating with cross-functional product teams.'
    },
    {
      id: 'exp-2',
      title: 'Frontend Developer Intern',
      company: 'TechCorp Labs',
      location: 'Bengaluru, India',
      startDate: 'Jan 2025',
      endDate: 'Jul 2025',
      isCurrent: false,
      description: 'Engineered reusable UI component library in React, improved Lighthouse web vitals by 32%, and implemented automated integration tests.'
    }
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'B.Tech in Computer Science & Engineering',
      school: 'National Institute of Technology',
      startDate: 'Aug 2021',
      graduationDate: 'May 2025',
      startYear: '2021',
      endYear: '2025',
      grade: '8.9 / 10 CGPA'
    }
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'HireHub - Smart Job Tracker',
      description: 'Full-featured job application tracking platform with real-time company logo resolution, kanban workflows, interview analytics, and reminder systems.',
      techStack: ['React', 'Node.js', 'Vite', 'CSS3', 'REST API'],
      githubUrl: 'https://github.com/debalina/hirehub',
      liveUrl: 'https://hirehub-demo.dev'
    },
    {
      id: 'proj-2',
      name: 'CloudCollab - Team Workspace',
      description: 'Real-time collaborative workspace featuring rich-text editing, task boards, and instantaneous presence synchronization.',
      techStack: ['React', 'TypeScript', 'WebSocket', 'Node.js'],
      githubUrl: 'https://github.com/debalina/cloudcollab',
      liveUrl: 'https://cloudcollab.dev'
    }
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect - Associate',
      issuer: 'Amazon Web Services',
      issueDate: 'Dec 2024',
      expiryDate: 'Dec 2027',
      certificateUrl: 'https://aws.amazon.com/verification'
    },
    {
      id: 'cert-2',
      name: 'Meta Front-End Developer Professional Certificate',
      issuer: 'Meta / Coursera',
      issueDate: 'Jun 2024',
      expiryDate: '',
      certificateUrl: 'https://coursera.org/verify/meta'
    }
  ],
  preferences: {
    preferredRole: 'Frontend Developer / Full Stack Engineer',
    preferredLocation: 'Bengaluru, India (Open to Remote)',
    workMode: 'Hybrid',
    employmentType: 'Full-time',
    expectedSalary: '₹14,00,000 - ₹20,00,000 / year',
    noticePeriod: '15 Days',
    availableFrom: 'Oct 15, 2026',
    noticePeriodEndDate: 'Oct 14, 2026'
  },
  socialLinks: {
    linkedin: 'https://linkedin.com/in/debalina-roy',
    github: 'https://github.com/debalina',
    portfolio: 'https://debalinaroy.dev'
  }
};

export function createNewUserProfile(user) {
  const name = user?.name?.trim() || 'Job Seeker';
  const email = user?.email?.trim().toLowerCase() || '';

  return {
    name,
    email,
    phone: '',
    location: '',
    jobTitle: '',
    role: 'Job Seeker',
    avatar: '',
    avatarOriginalFilename: '',
    bio: '',
    resume: null,
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    preferences: {
      preferredRole: '',
      preferredLocation: '',
      workMode: 'Remote',
      employmentType: 'Full-time',
      expectedSalary: '',
      noticePeriod: ''
    },
    socialLinks: {
      linkedin: '',
      github: '',
      portfolio: ''
    }
  };
}

export function getProfileStorageKey(email) {
  const normalized = (email || '').trim().toLowerCase();
  return `hirehub_profile_${normalized || 'default'}`;
}

export function getProfileForUser(user) {
  if (!user || !user.email) {
    return DEFAULT_DEBALINA_PROFILE;
  }

  const key = getProfileStorageKey(user.email);
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      const cleanAvatar = (parsed.avatar && typeof parsed.avatar === 'string' && !parsed.avatar.startsWith('data:image/'))
        ? parsed.avatar
        : '';
      return {
        ...createNewUserProfile(user),
        ...parsed,
        avatar: cleanAvatar,
        avatarOriginalFilename: parsed.avatarOriginalFilename || (parsed.avatar ? 'profile-photo.jpg' : ''),
        name: parsed.name || user.name || 'Job Seeker',
        email: user.email,
        role: parsed.role || 'Job Seeker',
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        education: Array.isArray(parsed.education) ? parsed.education : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
        preferences: {
          preferredRole: '',
          preferredLocation: '',
          workMode: 'Remote',
          employmentType: 'Full-time',
          expectedSalary: '',
          noticePeriod: '',
          ...(parsed.preferences || {})
        },
        socialLinks: {
          linkedin: '',
          github: '',
          portfolio: '',
          ...(parsed.socialLinks || {})
        }
      };
    }
  } catch (err) {
    console.error('Error reading profile from localStorage:', err);
  }

  if (user.email.toLowerCase().includes('debalina')) {
    const initial = { ...DEFAULT_DEBALINA_PROFILE, name: user.name || 'Debalina Roy', email: user.email };
    saveProfileForUser(user.email, initial);
    return initial;
  }

  const initialNewUser = createNewUserProfile(user);
  saveProfileForUser(user.email, initialNewUser);
  return initialNewUser;
}

export function saveProfileForUser(email, profileData) {
  if (!email || !profileData) return;
  const sanitized = { ...profileData };
  if (typeof sanitized.avatar === 'string' && sanitized.avatar.startsWith('data:image/')) {
    sanitized.avatar = '';
  }
  if (typeof sanitized.profileImage === 'string' && sanitized.profileImage.startsWith('data:image/')) {
    sanitized.profileImage = '';
  }
  const key = getProfileStorageKey(email);
  try {
    localStorage.setItem(key, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Error saving profile to localStorage:', err);
  }

  try {
    const payload = JSON.stringify({ user_email: email.trim(), profile: sanitized });
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    }).catch(() => {
      fetch('http://127.0.0.1:8000/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      }).catch(() => {});
    });
  } catch {}
}

export async function fetchProfileFromBackend(email) {
  if (!email) return null;
  const endpoints = [
    `/api/profile?user_email=${encodeURIComponent(email)}`,
    `http://127.0.0.1:8000/api/profile?user_email=${encodeURIComponent(email)}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) return data;
      }
    } catch {}
  }
  return null;
}

export function calculateProfileCompletion(profile) {
  if (!profile) return { percentage: 0, missingFields: [] };

  const checks = [
    {
      id: 'photo',
      label: 'Profile Photo',
      weight: 5,
      passed: Boolean(profile.avatar && profile.avatar.trim())
    },
    {
      id: 'basic',
      label: 'Job Title & Location',
      weight: 15,
      passed: Boolean(profile.jobTitle?.trim() && profile.location?.trim())
    },
    {
      id: 'phone',
      label: 'Contact Phone Number',
      weight: 5,
      passed: Boolean(profile.phone?.trim())
    },
    {
      id: 'bio',
      label: 'About / Bio summary',
      weight: 15,
      passed: Boolean(profile.bio?.trim() && profile.bio.trim().length >= 20)
    },
    {
      id: 'resume',
      label: 'Uploaded Resume',
      weight: 15,
      passed: Boolean(profile.resume && profile.resume.filename)
    },
    {
      id: 'skills',
      label: 'Key Skills (at least 3)',
      weight: 15,
      passed: Array.isArray(profile.skills) && profile.skills.length >= 3
    },
    {
      id: 'experience',
      label: 'Work Experience',
      weight: 10,
      passed: Array.isArray(profile.experience) && profile.experience.length >= 1
    },
    {
      id: 'education',
      label: 'Education History',
      weight: 10,
      passed: Array.isArray(profile.education) && profile.education.length >= 1
    },
    {
      id: 'projects',
      label: 'Featured Projects',
      weight: 5,
      passed: Array.isArray(profile.projects) && profile.projects.length >= 1
    },
    {
      id: 'preferences',
      label: 'Job Preferences',
      weight: 5,
      passed: Boolean(
        profile.preferences?.preferredRole?.trim() ||
        profile.preferences?.preferredLocation?.trim()
      )
    }
  ];

  let completedWeight = 0;
  const missingFields = [];

  for (const check of checks) {
    if (check.passed) {
      completedWeight += check.weight;
    } else {
      missingFields.push(check.label);
    }
  }

  return {
    percentage: Math.min(100, Math.max(0, Math.round(completedWeight))),
    missingFields
  };
}
