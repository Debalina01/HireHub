import { buildLogoUrl } from './companyLogo';

export const ALL_AVAILABLE_JOBS = [
  {
    id: 1,
    company: "Google",
    companyDomain: "google.com",
    logo: buildLogoUrl("google.com"),
    role: "Software Developer Intern",
    location: "Sunnyvale, CA",
    workMode: "Hybrid",
    salary: "$48 - $58 / hr",
    postedDate: "2 days ago",
    matchScore: 96,
    tags: ["React", "JavaScript", "Algorithms"],
    department: "Core Engineering",
    description: "Join Google's engineering team to build user-facing web applications at planetary scale. You will collaborate with senior engineers and UX designers to deliver performant, accessible digital experiences.",
    responsibilities: [
      "Design and implement responsive React components with high visual fidelity.",
      "Optimize web frontend assets, bundle sizes, and network performance.",
      "Write comprehensive unit and integration tests with Jest and Cypress.",
      "Participate in daily agile standups, code reviews, and architectural RFC discussions."
    ],
    requirements: [
      "Enrolled in or completed B.S./M.S. in Computer Science or related STEM field.",
      "Strong proficiency in modern JavaScript (ES6+), React, and state management.",
      "Solid foundation in data structures, algorithms, and web standards (HTML5/CSS3).",
      "Demonstrated experience through GitHub projects, open-source contributions, or prior internships."
    ],
    benefits: [
      "Competitive hourly pay with housing/relocation stipend.",
      "Direct mentorship from senior Google staff software engineers.",
      "Comprehensive healthcare and wellness reimbursement.",
      "Access to internal tech talks, machine learning courses, and design workshops."
    ]
  },
  {
    id: 2,
    company: "Microsoft",
    companyDomain: "microsoft.com",
    logo: buildLogoUrl("microsoft.com"),
    role: "Frontend Developer Intern",
    location: "Redmond, WA",
    workMode: "Remote",
    salary: "$45 - $55 / hr",
    postedDate: "3 days ago",
    matchScore: 92,
    tags: ["HTML/CSS", "TypeScript", "Accessibility"],
    department: "Cloud + AI Division",
    description: "Help build the next generation of cloud developer experiences across Azure and developer tools. Focus on high-contrast accessibility, component reusability, and lightning-fast web performance.",
    responsibilities: [
      "Develop accessible UI components adhering to WCAG 2.1 AA accessibility guidelines.",
      "Collaborate with product managers and researchers on telemetry and usability metrics.",
      "Implement design system components using TypeScript, Fluent UI, and React.",
      "Benchmark rendering speeds and diagnose client-side bottleneck issues."
    ],
    requirements: [
      "Currently pursuing a degree in Computer Science, Software Engineering, or equivalent.",
      "Hands-on experience with TypeScript, React hooks, and CSS modular styling.",
      "Deep understanding of accessibility best practices (ARIA roles, keyboard navigation).",
      "Excellent communication and cross-functional team collaboration skills."
    ],
    benefits: [
      "Top-tier compensation package with full remote equipment grant.",
      "Subsidized learning subscriptions and Microsoft certification vouchers.",
      "Inclusive intern cohort events, hackathons, and networking seminars.",
      "High return-offer conversion rate for full-time graduate opportunities."
    ]
  },
  {
    id: 3,
    company: "Amazon",
    companyDomain: "amazon.com",
    logo: buildLogoUrl("amazon.com"),
    role: "SDE Intern - Summer 2026",
    location: "Arlington, VA",
    workMode: "Hybrid",
    salary: "$46 - $54 / hr",
    postedDate: "5 days ago",
    matchScore: 89,
    tags: ["Java", "Python", "Cloud Basics"],
    department: "AWS eCommerce Services",
    description: "Work on distributed backend and full-stack services powering millions of global transactions daily. Apply Amazon's Leadership Principles to invent and simplify on behalf of customers.",
    responsibilities: [
      "Build robust microservices using Java, Python, and AWS serverless primitives.",
      "Construct RESTful and GraphQL endpoints with low latency SLAs.",
      "Deploy code using modern CI/CD deployment pipelines with zero-downtime rollouts.",
      "Analyze distributed tracing data with CloudWatch and OpenTelemetry."
    ],
    requirements: [
      "Academic coursework in Object-Oriented Design, Operating Systems, and Distributed Computing.",
      "Proficiency in Java, Python, C++, or Go.",
      "Familiarity with relational and NoSQL databases (PostgreSQL, DynamoDB).",
      "Enthusiasm for customer obsession, ownership, and deep diving into technical challenges."
    ],
    benefits: [
      "Competitive hourly rate plus monthly living and relocation allowance.",
      "One-on-one dedicated mentor and manager guidance throughout the summer.",
      "Prime benefits, employee discounts, and wellness programs.",
      "Opportunities to present intern project to VP engineering leadership."
    ]
  },
  {
    id: 4,
    company: "Infosys",
    companyDomain: "infosys.com",
    logo: buildLogoUrl("infosys.com"),
    role: "Graduate Software Engineer",
    location: "New York, NY",
    workMode: "Remote",
    salary: "$72,000 - $80,000",
    postedDate: "1 week ago",
    matchScore: 85,
    tags: ["JavaScript", "Web Development", "Git"],
    department: "Digital Transformation & Cloud",
    description: "Accelerate enterprise digital transformation by engineering modern web portals and integrations for Fortune 500 clients. Receive extensive training and hands-on client project deployment.",
    responsibilities: [
      "Implement user-friendly frontend interfaces using React, Vue, or Angular.",
      "Integrate client-side applications with secure authentication providers and APIs.",
      "Participate in sprint planning, retrospectives, and client demo presentations.",
      "Maintain thorough technical documentation, API contracts, and user guides."
    ],
    requirements: [
      "Bachelor's degree in Computer Science, Information Technology, or related discipline.",
      "Knowledge of JavaScript, HTML5, CSS3, and modern version control (Git).",
      "Analytical mindset with keen problem-solving and troubleshooting skills.",
      "Ability to thrive in dynamic client-facing development environments."
    ],
    benefits: [
      "Comprehensive onboarding bootcamps and continuous professional certifications.",
      "Flexible remote working options with ergonomic home office stipend.",
      "Health, dental, vision insurance plus 401(k) matching.",
      "Clear career progression framework with annual performance reviews."
    ]
  },
  {
    id: 5,
    company: "Apple",
    companyDomain: "apple.com",
    logo: buildLogoUrl("apple.com"),
    role: "Software Engineer - Web Platforms",
    location: "Cupertino, CA",
    workMode: "On-site",
    salary: "$140,000 - $165,000",
    postedDate: "3 days ago",
    matchScore: 94,
    tags: ["Swift", "Web Standards", "React"],
    department: "Software & Services",
    description: "Craft privacy-first, exceptionally polished digital experiences for millions of Apple users. Work closely with human interface designers to push the boundaries of what is possible on the modern web.",
    responsibilities: [
      "Build fluid interactive interfaces with meticulous attention to typography, motion, and touch response.",
      "Ensure web applications uphold Apple's stringent privacy and security benchmarks.",
      "Profile and optimize WebKit rendering performance across macOS and iOS devices.",
      "Architect shared components and utility libraries used by distributed engineering teams."
    ],
    requirements: [
      "B.S. or higher in Computer Science or demonstrated equivalent engineering experience.",
      "Deep mastery of web standards, modern JavaScript, TypeScript, and CSS architecture.",
      "Appreciation for micro-interactions, smooth animations, and pixel perfection.",
      "Experience with automated testing, continuous integration, and secure coding practices."
    ],
    benefits: [
      "Generous Restricted Stock Units (RSUs) and 401(k) matching.",
      "Full comprehensive medical, dental, and mental healthcare coverage.",
      "Product discounts on Apple hardware, software, and services.",
      "On-campus fitness facilities, wellness centers, and commuter benefits."
    ]
  },
  {
    id: 6,
    company: "Netflix",
    companyDomain: "netflix.com",
    logo: buildLogoUrl("netflix.com"),
    role: "Full Stack UI Engineer",
    location: "Los Gatos, CA",
    workMode: "Remote",
    salary: "$180,000 - $210,000",
    postedDate: "4 days ago",
    matchScore: 91,
    tags: ["Node.js", "React", "GraphQL"],
    department: "Product Engineering",
    description: "Innovate on the viewing and discovery experiences that entertain over 270 million households worldwide. Work with a culture of freedom and responsibility on high-impact frontend services.",
    responsibilities: [
      "Build dynamic A/B testable user interfaces powered by high-throughput Node.js micro-frameworks.",
      "Optimize real-time video playback telemetry, content recommendation tiles, and localized media.",
      "Partner with data scientists and algorithmic engineers to deliver customized member feeds.",
      "Debug complex distributed system interactions across global edge CDN clusters."
    ],
    requirements: [
      "Solid full-stack JavaScript experience (React on client, Node.js or GraphQL on server).",
      "Proven track record scaling web applications serving high concurrency user traffic.",
      "Independent problem solver who thrives with autonomy and high-context collaboration.",
      "Passionate about user experience, resilience testing, and automated observability."
    ],
    benefits: [
      "Top-of-market compensation with flexible cash vs. stock allocation.",
      "Open and flexible vacation policy with no prescribed PTO tracking.",
      "Comprehensive global family leave, adoption, and fertility assistance.",
      "Home office setup reimbursement and continuous learning budgets."
    ]
  },
  {
    id: 7,
    company: "Meta",
    companyDomain: "meta.com",
    logo: buildLogoUrl("meta.com"),
    role: "Product Infrastructure Engineer",
    location: "Menlo Park, CA",
    workMode: "Hybrid",
    salary: "$155,000 - $185,000",
    postedDate: "1 day ago",
    matchScore: 93,
    tags: ["React", "Relay", "Distributed Systems"],
    department: "Infrastructure & Tools",
    description: "Build the foundational libraries, developer frameworks, and rendering infrastructure that powers apps used by billions of people daily. Drive technical velocity across thousands of engineers.",
    responsibilities: [
      "Evolve and scale core React, Relay, and GraphQL frontend infrastructures.",
      "Diagnose regression in bundle size, memory consumption, and initial paint latency.",
      "Write tools, linters, and compiler plugins that keep developer productivity high.",
      "Collaborate across open-source communities to shape the future of web ecosystems."
    ],
    requirements: [
      "B.S./M.S. in Computer Science or equivalent technical practical background.",
      "Demonstrated mastery of React internals, virtual DOM diffing, and build tooling.",
      "Experience optimizing large monorepos, compile times, and test runner performance.",
      "Strong debugging skills in Chrome DevTools, profilers, and memory leak analyzers."
    ],
    benefits: [
      "Competitive base salary, equity refresh grants, and annual bonuses.",
      "Comprehensive wellness perks including on-site dining and wellness subsidies.",
      "Generous paid time off, 20-week parental leave, and flexible hybrid arrangements.",
      "Dedicated career coaching, leadership fellowships, and conference travel support."
    ]
  },
  {
    id: 8,
    company: "Spotify",
    companyDomain: "spotify.com",
    logo: buildLogoUrl("spotify.com"),
    role: "Web Platform Engineer",
    location: "New York, NY",
    workMode: "Remote",
    salary: "$135,000 - $155,000",
    postedDate: "5 days ago",
    matchScore: 88,
    tags: ["TypeScript", "Web Audio", "React"],
    department: "Band Members / Creator Platform",
    description: "Shape the web surfaces of the world's leading audio streaming platform. Build tools and web players that connect millions of artists and podcasters with hundreds of millions of enthusiastic listeners.",
    responsibilities: [
      "Engineer responsive web players utilizing Web Audio API and streaming media buffers.",
      "Build modular micro-frontends enabling independent feature release cadences.",
      "Collaborate closely with product designers to realize audio visualizations and seamless queues.",
      "Participate in internal tech communities, hack weeks, and open-source contributions."
    ],
    requirements: [
      "Proficiency in modern TypeScript, React, and CSS architecture.",
      "Familiarity with streaming audio protocols, Web Audio API, or media session interfaces.",
      "Advocate for testing best practices (unit, visual regression, and end-to-end testing).",
      "Love for music, podcasts, and empowering creative artists globally."
    ],
    benefits: [
      "Flexible 'Work from Anywhere' distributed work framework.",
      "Free Spotify Premium for employees, family members, and friends.",
      "Extensive learning allowances, self-development days, and mental health programs.",
      "Generous retirement plans, life insurance, and parental leave."
    ]
  },
  {
    id: 9,
    company: "Instagram",
    companyDomain: "instagram.com",
    logo: buildLogoUrl("instagram.com"),
    role: "Software Engineer Intern",
    location: "Menlo Park, CA",
    workMode: "Hybrid",
    salary: "$45 - $55 / hr",
    postedDate: "4 days ago",
    matchScore: 91,
    tags: ["Python", "React", "JavaScript"],
    department: "Product Engineering",
    description: "Work on products and features that help people connect, share, and communicate through Instagram. Collaborate with engineers to build reliable and user-friendly experiences.",
    responsibilities: [
      "Develop and maintain scalable frontend features using React and modern JavaScript.",
      "Collaborate with cross-functional engineering, design, and data science teams.",
      "Write reliable Python backend services and automated test suites.",
      "Optimize photo and video delivery pipelines for high performance across global networks."
    ],
    requirements: [
      "Pursuing a B.S. or M.S. in Computer Science or related technical discipline.",
      "Experience with Python, JavaScript, and modern component frameworks like React.",
      "Strong understanding of data structures, algorithms, and web development fundamentals.",
      "Passion for building accessible, high-scale social communication experiences."
    ],
    benefits: [
      "Competitive hourly compensation with housing and relocation assistance.",
      "Mentorship from experienced senior software engineers and team leads.",
      "Access to world-class learning resources, technical talks, and hackathons.",
      "Comprehensive health coverage and wellness stipends."
    ],
    applicationUrl: "https://www.metacareers.com/jobs"
  }
];

export const DEFAULT_SAVED_JOBS = ALL_AVAILABLE_JOBS.slice(0, 4);

export function getSavedJobsStorageKey(email) {
  const normalized = (email || '').trim().toLowerCase();
  return `hirehub_saved_jobs_${normalized || 'default'}`;
}

export function getSavedJobsForUser(user) {
  if (!user || !user.email) {
    return DEFAULT_SAVED_JOBS;
  }

  const key = getSavedJobsStorageKey(user.email);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading saved jobs from localStorage:', err);
  }

  const normalizedEmail = (user.email || '').trim().toLowerCase();
  if (normalizedEmail === 'debalina@example.com' || normalizedEmail === 'default') {
    saveJobsForUser(user, DEFAULT_SAVED_JOBS);
    return DEFAULT_SAVED_JOBS;
  }

  return [];
}

export function saveJobsForUser(user, jobs) {
  if (!user || !user.email) return;
  const key = getSavedJobsStorageKey(user.email);
  try {
    localStorage.setItem(key, JSON.stringify(jobs || []));
  } catch (err) {
    console.error('Error saving jobs to localStorage:', err);
  }
}

export function isJobSaved(savedJobs, job) {
  if (!savedJobs || !Array.isArray(savedJobs) || !job) return false;
  return savedJobs.some((s) => {
    if (job.id && s.id === job.id) return true;
    return s.company?.toLowerCase() === job.company?.toLowerCase() &&
           s.role?.toLowerCase() === job.role?.toLowerCase();
  });
}

export function addJobToSaved(user, currentSavedJobs, jobToAdd) {
  if (!jobToAdd) return currentSavedJobs || [];
  const list = currentSavedJobs || [];

  const alreadySaved = isJobSaved(list, jobToAdd);
  if (alreadySaved) {
    return list;
  }

  const updated = [jobToAdd, ...list];
  saveJobsForUser(user, updated);
  return updated;
}

export function removeJobFromSaved(user, currentSavedJobs, jobIdOrJob) {
  if (!currentSavedJobs || !Array.isArray(currentSavedJobs)) return [];

  const targetId = typeof jobIdOrJob === 'object' ? jobIdOrJob.id : jobIdOrJob;
  const targetCompany = typeof jobIdOrJob === 'object' ? jobIdOrJob.company?.toLowerCase() : null;
  const targetRole = typeof jobIdOrJob === 'object' ? jobIdOrJob.role?.toLowerCase() : null;

  const updated = currentSavedJobs.filter((job) => {
    if (targetId && job.id === targetId) return false;
    if (targetCompany && targetRole &&
        job.company?.toLowerCase() === targetCompany &&
        job.role?.toLowerCase() === targetRole) {
      return false;
    }
    return true;
  });

  saveJobsForUser(user, updated);
  return updated;
}
