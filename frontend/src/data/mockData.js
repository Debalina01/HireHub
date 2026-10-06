import { buildLogoUrl } from '../utils/companyLogo';

export const mockStats = [
  {
    id: 1,
    title: "Total Applications",
    value: "48",
    change: "+12% this month",
    isPositive: true,
    icon: "briefcase",
    color: "indigo"
  },
  {
    id: 2,
    title: "In Review / Active",
    value: "18",
    change: "6 awaiting response",
    isPositive: true,
    icon: "clock",
    color: "amber"
  },
  {
    id: 3,
    title: "Interviews Scheduled",
    value: "5",
    change: "2 this week",
    isPositive: true,
    icon: "calendar",
    color: "sky"
  },
  {
    id: 4,
    title: "Offers Received",
    value: "2",
    change: "+1 new offer",
    isPositive: true,
    icon: "award",
    color: "emerald"
  }
];

export const mockApplications = [
  {
    id: 1,
    company: "Google",
    companyDomain: "google.com",
    logo: buildLogoUrl("google.com"),
    role: "Software Engineer Intern",
    location: "Mountain View, CA",
    workMode: "Hybrid",
    status: "Interviewing",
    appliedDate: "2026-09-23",
    responseDate: "2026-09-25",
    source: "LinkedIn Jobs",
    salary: "$45 - $55 / hr",
    stage: "Round 2: Technical Assessment",
    notes: "Follow up with recruiter Sarah after interview."
  },
  {
    id: 2,
    company: "TCS",
    companyDomain: "tcs.com",
    logo: buildLogoUrl("tcs.com"),
    role: "Python Developer",
    location: "Plano, TX",
    workMode: "Hybrid",
    status: "Interviewing",
    appliedDate: "2026-09-23",
    responseDate: "2026-09-26",
    source: "LinkedIn Jobs",
    salary: "$30 - $38 / hr",
    stage: "Technical Assessment",
    notes: "Python data structures and algorithms practice."
  },
  {
    id: 3,
    company: "ABC Tech",
    companyDomain: "abctech.com",
    logo: buildLogoUrl("abctech.com"),
    role: "Web Developer",
    location: "Austin, TX",
    workMode: "Remote",
    status: "Screening",
    appliedDate: "2026-09-23",
    responseDate: "2026-09-28",
    source: "Company Career Portals",
    salary: "$35 - $42 / hr",
    stage: "Application Submitted",
    notes: "Submitted portfolio link."
  },
  {
    id: 4,
    company: "Microsoft",
    companyDomain: "microsoft.com",
    logo: buildLogoUrl("microsoft.com"),
    role: "SDE Intern",
    location: "Redmond, WA",
    workMode: "Remote",
    status: "Offer",
    appliedDate: "2026-09-24",
    responseDate: "2026-09-29",
    source: "University Referrals",
    salary: "$48 - $56 / hr",
    stage: "Offer Extended",
    notes: "Reviewing benefits and stipend package before Friday."
  },
  {
    id: 5,
    company: "Amazon",
    companyDomain: "amazon.com",
    logo: buildLogoUrl("amazon.com"),
    role: "Software Developer Intern",
    location: "Seattle, WA",
    workMode: "On-site",
    status: "Screening",
    appliedDate: "2026-09-25",
    responseDate: "2026-09-27",
    source: "Company Career Portals",
    salary: "$46 - $54 / hr",
    stage: "Recruiter Phone Screen",
    notes: "Prepared leadership principles examples."
  },
  {
    id: 6,
    company: "Infosys",
    companyDomain: "infosys.com",
    logo: buildLogoUrl("infosys.com"),
    role: "Graduate Software Engineer",
    location: "Raleigh, NC",
    workMode: "Remote",
    status: "Applied",
    appliedDate: "2026-09-28",
    responseDate: "",
    source: "Job Boards (Indeed/Handshake)",
    salary: "$70,000 - $82,000",
    stage: "Application Submitted",
    notes: "Application viewed by hiring team yesterday."
  },
  {
    id: 7,
    company: "Accenture",
    companyDomain: "accenture.com",
    logo: buildLogoUrl("accenture.com"),
    role: "QA / Testing Intern",
    location: "Chicago, IL",
    workMode: "Hybrid",
    status: "Rejected",
    appliedDate: "2026-09-18",
    responseDate: "2026-09-24",
    source: "LinkedIn Jobs",
    salary: "$32 - $40 / hr",
    stage: "Position Closed",
    notes: "Position filled. Recruiter invited to reapply for Summer batch."
  }
];

export const mockInterviews = [
  {
    id: 1,
    company: "XYZ Ltd",
    companyDomain: "xyz.com",
    logo: buildLogoUrl("xyz.com"),
    role: "Technical Interview",
    round: "Technical Interview: System Architecture & Coding",
    interviewDate: "2026-09-23",
    startTime: "15:00",
    endTime: "16:00",
    timeZone: "America/New_York",
    date: "2026-09-23",
    time: "3:00 PM - 4:00 PM EDT",
    interviewer: "Sarah Jenkins (Lead Architect)",
    platform: "Google Meet",
    link: "https://meet.google.com/xyz-tech-round",
    status: "completed",
    prepTip: "Focus on clean modular architecture and API latency."
  },
  {
    id: 2,
    company: "Google",
    companyDomain: "google.com",
    logo: buildLogoUrl("google.com"),
    role: "Software Engineer Intern",
    round: "Round 2: React, Data Structures & Problem Solving",
    interviewDate: "2026-09-30",
    startTime: "14:00",
    endTime: "15:00",
    timeZone: "America/New_York",
    date: "Sep 30, 2026",
    time: "2:00 PM - 3:00 PM EDT",
    interviewer: "David Chen (Software Engineer)",
    platform: "Google Meet",
    link: "https://meet.google.com/abc-defg-hij",
    status: "scheduled",
    prepTip: "Focus on React component lifecycle, state management, and DOM optimization."
  },
  {
    id: 3,
    company: "TCS",
    companyDomain: "tcs.com",
    logo: buildLogoUrl("tcs.com"),
    role: "Python Developer",
    round: "Technical Interview: Python & SQL Basics",
    interviewDate: "2026-09-25",
    startTime: "10:30",
    endTime: "11:30",
    timeZone: "America/New_York",
    date: "2026-09-25",
    time: "10:30 AM - 11:30 AM EDT",
    interviewer: "Priya Sharma (Technical Lead)",
    platform: "Microsoft Teams",
    link: "https://teams.microsoft.com/l/meetup-join",
    status: "conducted",
    prepTip: "Review Python generators, list comprehensions, and relational database queries."
  },
  {
    id: 4,
    company: "Amazon",
    companyDomain: "amazon.com",
    logo: buildLogoUrl("amazon.com"),
    role: "Software Developer Intern",
    round: "HR & Behavioral Discussion",
    interviewDate: "2026-10-02",
    startTime: "16:00",
    endTime: "16:45",
    timeZone: "America/New_York",
    date: "Oct 02, 2026",
    time: "4:00 PM - 4:45 PM EDT",
    interviewer: "Marcus Vance (University Talent Recruiter)",
    platform: "Google Meet",
    link: "https://meet.google.com/",
    status: "scheduled",
    prepTip: "Have STAR stories ready for 'Learn and Be Curious' and 'Deliver Results'."
  }
];

export const mockSavedJobs = [
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
    tags: ["React", "JavaScript", "Algorithms"]
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
    tags: ["HTML/CSS", "TypeScript", "Accessibility"]
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
    tags: ["Java", "Python", "Cloud Basics"]
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
    tags: ["JavaScript", "Web Development", "Git"]
  }
];

export const mockReminders = [
  {
    id: 1,
    text: "Review Microsoft SDE Intern offer letter & submit acceptance form",
    dueDate: "Feb 27, 2026",
    priority: "High",
    completed: false
  },
  {
    id: 2,
    text: "Review React state management notes for Google technical interview",
    dueDate: "Feb 26, 2026",
    priority: "High",
    completed: false
  },
  {
    id: 3,
    text: "Send follow-up thank you note to Amazon recruiter Marcus",
    dueDate: "Mar 01, 2026",
    priority: "Medium",
    completed: true
  },
  {
    id: 4,
    text: "Update LinkedIn portfolio with latest internship projects",
    dueDate: "Mar 05, 2026",
    priority: "Low",
    completed: false
  }
];

export const mockActivityData = [
  { day: "Mon", applications: 3, interviews: 1 },
  { day: "Tue", applications: 5, interviews: 0 },
  { day: "Wed", applications: 2, interviews: 2 },
  { day: "Thu", applications: 6, interviews: 1 },
  { day: "Fri", applications: 4, interviews: 1 },
  { day: "Sat", applications: 1, interviews: 0 },
  { day: "Sun", applications: 0, interviews: 0 }
];

export const mockAnalytics = {
  responseRate: "42%",
  interviewRate: "28%",
  offerRate: "11%",
  avgResponseDays: "6.4 days",
  topSources: [
    { name: "LinkedIn Jobs", count: 24, percent: 50 },
    { name: "Company Career Portals", count: 14, percent: 29 },
    { name: "University Referrals", count: 6, percent: 13 },
    { name: "Job Boards (Indeed/Handshake)", count: 4, percent: 8 }
  ]
};
