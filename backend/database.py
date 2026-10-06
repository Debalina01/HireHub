import os
import re
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

def normalize_date_to_iso(date_str: str) -> Optional[str]:
    if not date_str or not isinstance(date_str, str):
        return None
    s = date_str.strip()
    if s.lower() == 'present':
        return None

    iso_match = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})", s)
    if iso_match:
        y, m, d = int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3))
        return f"{y:04d}-{m:02d}-{d:02d}"

    months = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    }
    match = re.search(r"([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})", s)
    if match:
        m_name = match.group(1)[:3].lower()
        if m_name in months:
            m_num = months[m_name]
            d_num = int(match.group(2))
            y_num = int(match.group(3))
            return f"{y_num:04d}-{m_num:02d}-{d_num:02d}"

    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%B %d, %Y", "%b %d, %Y"):
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d")
        except Exception:
            pass

    return None

DB_PATH = os.path.join(os.path.dirname(__file__), "hirehub.db")

MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))


def get_db_connection():
    if MYSQL_HOST and MYSQL_USER and MYSQL_DATABASE:
        try:
            import pymysql
            return pymysql.connect(
                host=MYSQL_HOST,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD or "",
                database=MYSQL_DATABASE,
                port=MYSQL_PORT,
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=True
            )
        except Exception:
            pass

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

SEED_JOBS_ROWS = [
    (
        1, "Google", "Google", "google.com", "https://img.logo.dev/google.com",
        "Software Developer Intern", "Software Developer Intern", "Sunnyvale, CA", "Hybrid",
        "$48 - $58 / hr", 48, 58, "2 days ago", "2 days ago", 96,
        json.dumps(["React", "JavaScript", "Algorithms"]), json.dumps(["React", "JavaScript", "Algorithms"]),
        "Core Engineering",
        "Join Google's engineering team to build user-facing web applications at planetary scale. You will collaborate with senior engineers and UX designers to deliver performant, accessible digital experiences.",
        json.dumps([
            "Design and implement responsive React components with high visual fidelity.",
            "Optimize web frontend assets, bundle sizes, and network performance.",
            "Write comprehensive unit and integration tests with Jest and Cypress.",
            "Participate in daily agile standups, code reviews, and architectural RFC discussions."
        ]),
        json.dumps([
            "Enrolled in or completed B.S./M.S. in Computer Science or related STEM field.",
            "Strong proficiency in modern JavaScript (ES6+), React, and state management.",
            "Solid foundation in data structures, algorithms, and web standards (HTML5/CSS3).",
            "Demonstrated experience through GitHub projects, open-source contributions, or prior internships."
        ]),
        json.dumps([
            "Competitive hourly pay with housing/relocation stipend.",
            "Direct mentorship from senior Google staff software engineers.",
            "Comprehensive healthcare and wellness reimbursement.",
            "Access to internal tech talks, machine learning courses, and design workshops."
        ]),
        "https://careers.google.com/jobs/results/"
    ),
    (
        2, "Microsoft", "Microsoft", "microsoft.com", "https://img.logo.dev/microsoft.com",
        "Frontend Developer Intern", "Frontend Developer Intern", "Redmond, WA", "Remote",
        "$45 - $55 / hr", 45, 55, "3 days ago", "3 days ago", 92,
        json.dumps(["HTML/CSS", "TypeScript", "Accessibility"]), json.dumps(["HTML/CSS", "TypeScript", "Accessibility"]),
        "Cloud + AI Division",
        "Help build the next generation of cloud developer experiences across Azure and developer tools. Focus on high-contrast accessibility, component reusability, and lightning-fast web performance.",
        json.dumps([
            "Develop accessible UI components adhering to WCAG 2.1 AA accessibility guidelines.",
            "Collaborate with product managers and researchers on telemetry and usability metrics.",
            "Implement design system components using TypeScript, Fluent UI, and React.",
            "Benchmark rendering speeds and diagnose client-side bottleneck issues."
        ]),
        json.dumps([
            "Currently pursuing a degree in Computer Science, Software Engineering, or equivalent.",
            "Hands-on experience with TypeScript, React hooks, and CSS modular styling.",
            "Deep understanding of accessibility best practices (ARIA roles, keyboard navigation).",
            "Excellent communication and cross-functional team collaboration skills."
        ]),
        json.dumps([
            "Top-tier compensation package with full remote equipment grant.",
            "Subsidized learning subscriptions and Microsoft certification vouchers.",
            "Inclusive intern cohort events, hackathons, and networking seminars.",
            "High return-offer conversion rate for full-time graduate opportunities."
        ]),
        "https://careers.microsoft.com/"
    ),
    (
        3, "Amazon", "Amazon", "amazon.com", "https://img.logo.dev/amazon.com",
        "SDE Intern - Summer 2026", "SDE Intern - Summer 2026", "Arlington, VA", "Hybrid",
        "$46 - $54 / hr", 46, 54, "5 days ago", "5 days ago", 89,
        json.dumps(["Java", "Python", "Cloud Basics"]), json.dumps(["Java", "Python", "Cloud Basics"]),
        "AWS eCommerce Services",
        "Work on distributed backend and full-stack services powering millions of global transactions daily. Apply Amazon's Leadership Principles to invent and simplify on behalf of customers.",
        json.dumps([
            "Build robust microservices using Java, Python, and AWS serverless primitives.",
            "Construct RESTful and GraphQL endpoints with low latency SLAs.",
            "Deploy code using modern CI/CD deployment pipelines with zero-downtime rollouts.",
            "Analyze distributed tracing data with CloudWatch and OpenTelemetry."
        ]),
        json.dumps([
            "Academic coursework in Object-Oriented Design, Operating Systems, and Distributed Computing.",
            "Proficiency in Java, Python, C++, or Go.",
            "Familiarity with relational and NoSQL databases (PostgreSQL, DynamoDB).",
            "Enthusiasm for customer obsession, ownership, and deep diving into technical challenges."
        ]),
        json.dumps([
            "Competitive hourly rate plus monthly living and relocation allowance.",
            "One-on-one dedicated mentor and manager guidance throughout the summer.",
            "Prime benefits, employee discounts, and wellness programs.",
            "Opportunities to present intern project to VP engineering leadership."
        ]),
        "https://amazon.jobs/"
    ),
    (
        4, "Infosys", "Infosys", "infosys.com", "https://img.logo.dev/infosys.com",
        "Graduate Software Engineer", "Graduate Software Engineer", "New York, NY", "Remote",
        "$72,000 - $80,000", 72000, 80000, "1 week ago", "1 week ago", 85,
        json.dumps(["JavaScript", "Web Development", "Git"]), json.dumps(["JavaScript", "Web Development", "Git"]),
        "Digital Transformation & Cloud",
        "Accelerate enterprise digital transformation by engineering modern web portals and integrations for Fortune 500 clients. Receive extensive training and hands-on client project deployment.",
        json.dumps([
            "Implement user-friendly frontend interfaces using React, Vue, or Angular.",
            "Integrate client-side applications with secure authentication providers and APIs.",
            "Participate in sprint planning, retrospectives, and client demo presentations.",
            "Maintain thorough technical documentation, API contracts, and user guides."
        ]),
        json.dumps([
            "Bachelor's degree in Computer Science, Information Technology, or related discipline.",
            "Knowledge of JavaScript, HTML5, CSS3, and modern version control (Git).",
            "Analytical mindset with keen problem-solving and troubleshooting skills.",
            "Ability to thrive in dynamic client-facing development environments."
        ]),
        json.dumps([
            "Comprehensive onboarding bootcamps and continuous professional certifications.",
            "Flexible remote working options with ergonomic home office stipend.",
            "Health, dental, vision insurance plus 401(k) matching.",
            "Clear career progression framework with annual performance reviews."
        ]),
        "https://www.infosys.com/careers/"
    ),
    (
        5, "Apple", "Apple", "apple.com", "https://img.logo.dev/apple.com",
        "Software Engineer - Web Platforms", "Software Engineer - Web Platforms", "Cupertino, CA", "On-site",
        "$140,000 - $165,000", 140000, 165000, "3 days ago", "3 days ago", 94,
        json.dumps(["Swift", "Web Standards", "React"]), json.dumps(["Swift", "Web Standards", "React"]),
        "Software & Services",
        "Craft privacy-first, exceptionally polished digital experiences for millions of Apple users. Work closely with human interface designers to push the boundaries of what is possible on the modern web.",
        json.dumps([
            "Build fluid interactive interfaces with meticulous attention to typography, motion, and touch response.",
            "Ensure web applications uphold Apple's stringent privacy and security benchmarks.",
            "Profile and optimize WebKit rendering performance across macOS and iOS devices.",
            "Architect shared components and utility libraries used by distributed engineering teams."
        ]),
        json.dumps([
            "B.S. or higher in Computer Science or demonstrated equivalent engineering experience.",
            "Deep mastery of web standards, modern JavaScript, TypeScript, and CSS architecture.",
            "Appreciation for micro-interactions, smooth animations, and pixel perfection.",
            "Experience with automated testing, continuous integration, and secure coding practices."
        ]),
        json.dumps([
            "Generous Restricted Stock Units (RSUs) and 401(k) matching.",
            "Full comprehensive medical, dental, and mental healthcare coverage.",
            "Product discounts on Apple hardware, software, and services.",
            "On-campus fitness facilities, wellness centers, and commuter benefits."
        ]),
        "https://jobs.apple.com/"
    ),
    (
        6, "Netflix", "Netflix", "netflix.com", "https://img.logo.dev/netflix.com",
        "Full Stack UI Engineer", "Full Stack UI Engineer", "Los Gatos, CA", "Remote",
        "$180,000 - $210,000", 180000, 210000, "4 days ago", "4 days ago", 91,
        json.dumps(["Node.js", "React", "GraphQL"]), json.dumps(["Node.js", "React", "GraphQL"]),
        "Product Engineering",
        "Innovate on the viewing and discovery experiences that entertain over 270 million households worldwide. Work with a culture of freedom and responsibility on high-impact frontend services.",
        json.dumps([
            "Build dynamic A/B testable user interfaces powered by high-throughput Node.js micro-frameworks.",
            "Optimize real-time video playback telemetry, content recommendation tiles, and localized media.",
            "Partner with data scientists and algorithmic engineers to deliver customized member feeds.",
            "Debug complex distributed system interactions across global edge CDN clusters."
        ]),
        json.dumps([
            "Solid full-stack JavaScript experience (React on client, Node.js or GraphQL on server).",
            "Proven track record scaling web applications serving high concurrency user traffic.",
            "Independent problem solver who thrives with autonomy and high-context collaboration.",
            "Passionate about user experience, resilience testing, and automated observability."
        ]),
        json.dumps([
            "Top-of-market compensation with flexible cash vs. stock allocation.",
            "Open and flexible vacation policy with no prescribed PTO tracking.",
            "Comprehensive global family leave, adoption, and fertility assistance.",
            "Home office setup reimbursement and continuous learning budgets."
        ]),
        "https://jobs.netflix.com/"
    ),
    (
        7, "Meta", "Meta", "meta.com", "https://img.logo.dev/meta.com",
        "Product Infrastructure Engineer", "Product Infrastructure Engineer", "Menlo Park, CA", "Hybrid",
        "$155,000 - $185,000", 155000, 185000, "1 day ago", "1 day ago", 93,
        json.dumps(["React", "Relay", "Distributed Systems"]), json.dumps(["React", "Relay", "Distributed Systems"]),
        "Infrastructure & Tools",
        "Build the foundational libraries, developer frameworks, and rendering infrastructure that powers apps used by billions of people daily. Drive technical velocity across thousands of engineers.",
        json.dumps([
            "Evolve and scale core React, Relay, and GraphQL frontend infrastructures.",
            "Diagnose regression in bundle size, memory consumption, and initial paint latency.",
            "Write tools, linters, and compiler plugins that keep developer productivity high.",
            "Collaborate across open-source communities to shape the future of web ecosystems."
        ]),
        json.dumps([
            "B.S./M.S. in Computer Science or equivalent technical practical background.",
            "Demonstrated mastery of React internals, virtual DOM diffing, and build tooling.",
            "Experience optimizing large monorepos, compile times, and test runner performance.",
            "Strong debugging skills in Chrome DevTools, profilers, and memory leak analyzers."
        ]),
        json.dumps([
            "Competitive base salary, equity refresh grants, and annual bonuses.",
            "Comprehensive wellness perks including on-site dining and wellness subsidies.",
            "Generous paid time off, 20-week parental leave, and flexible hybrid arrangements.",
            "Dedicated career coaching, leadership fellowships, and conference travel support."
        ]),
        "https://www.metacareers.com/"
    ),
    (
        8, "Spotify", "Spotify", "spotify.com", "https://img.logo.dev/spotify.com",
        "Web Platform Engineer", "Web Platform Engineer", "New York, NY", "Remote",
        "$135,000 - $155,000", 135000, 155000, "5 days ago", "5 days ago", 88,
        json.dumps(["TypeScript", "Web Audio", "React"]), json.dumps(["TypeScript", "Web Audio", "React"]),
        "Band Members / Creator Platform",
        "Shape the web surfaces of the world's leading audio streaming platform. Build tools and web players that connect millions of artists and podcasters with hundreds of millions of enthusiastic listeners.",
        json.dumps([
            "Engineer responsive web players utilizing Web Audio API and streaming media buffers.",
            "Build modular micro-frontends enabling independent feature release cadences.",
            "Collaborate closely with product designers to realize audio visualizations and seamless queues.",
            "Participate in internal tech communities, hack weeks, and open-source contributions."
        ]),
        json.dumps([
            "Proficiency in modern TypeScript, React, and CSS architecture.",
            "Familiarity with streaming audio protocols, Web Audio API, or media session interfaces.",
            "Advocate for testing best practices (unit, visual regression, and end-to-end testing).",
            "Love for music, podcasts, and empowering creative artists globally."
        ]),
        json.dumps([
            "Flexible 'Work from Anywhere' distributed work framework.",
            "Free Spotify Premium for employees, family members, and friends.",
            "Extensive learning allowances, self-development days, and mental health programs.",
            "Generous retirement plans, life insurance, and parental leave."
        ]),
        "https://www.lifeatspotify.com/jobs"
    ),
    (
        9, "Instagram", "Instagram", "instagram.com", "https://img.logo.dev/instagram.com",
        "Software Engineer Intern", "Software Engineer Intern", "Menlo Park, CA", "Hybrid",
        "$45 - $55 / hr", 45, 55, "4 days ago", "4 days ago", 91,
        json.dumps(["Python", "React", "JavaScript"]), json.dumps(["Python", "React", "JavaScript"]),
        "Product Engineering",
        "Work on products and features that help people connect, share, and communicate through Instagram. Collaborate with engineers to build reliable and user-friendly experiences.",
        json.dumps([
            "Develop and maintain scalable frontend features using React and modern JavaScript.",
            "Collaborate with cross-functional engineering, design, and data science teams.",
            "Write reliable Python backend services and automated test suites.",
            "Optimize photo and video delivery pipelines for high performance across global networks."
        ]),
        json.dumps([
            "Pursuing a B.S. or M.S. in Computer Science or related technical discipline.",
            "Experience with Python, JavaScript, and modern component frameworks like React.",
            "Strong understanding of data structures, algorithms, and web development fundamentals.",
            "Passion for building accessible, high-scale social communication experiences."
        ]),
        json.dumps([
            "Competitive hourly compensation with housing and relocation assistance.",
            "Mentorship from experienced senior software engineers and team leads.",
            "Access to world-class learning resources, technical talks, and hackathons.",
            "Comprehensive health coverage and wellness stipends."
        ]),
        "https://www.metacareers.com/jobs"
    )
]


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'Job Seeker',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        company TEXT NOT NULL,
        company_domain TEXT,
        logo TEXT,
        role TEXT NOT NULL,
        location TEXT,
        work_mode TEXT,
        status TEXT NOT NULL,
        applied_date TEXT NOT NULL,
        salary TEXT,
        stage TEXT,
        notes TEXT,
        source TEXT,
        response_date TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        company TEXT NOT NULL,
        company_domain TEXT,
        logo TEXT,
        role TEXT NOT NULL,
        round TEXT,
        date TEXT,
        time TEXT,
        interviewer TEXT,
        platform TEXT,
        meeting_url TEXT,
        status TEXT DEFAULT 'scheduled',
        prep_tip TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT NOT NULL,
        company_name TEXT,
        company_domain TEXT,
        logo TEXT,
        role TEXT NOT NULL,
        job_title TEXT,
        location TEXT,
        work_mode TEXT,
        salary TEXT,
        salary_min INTEGER,
        salary_max INTEGER,
        posted_date TEXT,
        posted_at TEXT,
        match_score INTEGER,
        tags TEXT,
        skills TEXT,
        department TEXT,
        description TEXT,
        responsibilities TEXT,
        requirements TEXT,
        benefits TEXT,
        application_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        job_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_email, job_id)
    )
    """)
    conn.commit()

    try:
        cursor.execute("ALTER TABLE applications ADD COLUMN job_id INTEGER")
        conn.commit()
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE applications ADD COLUMN source TEXT")
        conn.commit()
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE applications ADD COLUMN response_date TEXT")
        conn.commit()
    except Exception:
        pass

    for col in ["interview_date", "start_time", "end_time", "timezone"]:
        try:
            cursor.execute(f"ALTER TABLE interviews ADD COLUMN {col} TEXT")
            conn.commit()
        except Exception:
            pass

    cursor.execute("UPDATE applications SET source = 'LinkedIn Jobs' WHERE source IS NULL OR source = ''")
    conn.commit()

    cursor.execute("SELECT COUNT(*) AS cnt FROM applications WHERE user_email = 'debalina@example.com'")
    row = cursor.fetchone()
    count = row["cnt"] if isinstance(row, dict) or hasattr(row, "__getitem__") else row[0]

    if count == 0:
        cursor.execute("""
        INSERT OR IGNORE INTO users (email, name, role)
        VALUES ('debalina@example.com', 'Debalina Roy', 'Job Seeker')
        """)

        default_apps = [
            ("debalina@example.com", "Google", "google.com", "https://img.logo.dev/google.com", "Software Engineer Intern", "Mountain View, CA", "Hybrid", "Interviewing", "2026-09-23", "$45 - $55 / hr", "Round 2: Technical Assessment", "Follow up with recruiter Sarah after interview.", "LinkedIn Jobs", "2026-09-25"),
            ("debalina@example.com", "TCS", "tcs.com", "https://img.logo.dev/tcs.com", "Python Developer", "Plano, TX", "Hybrid", "Interviewing", "2026-09-23", "$30 - $38 / hr", "Technical Assessment", "Python data structures and algorithms practice.", "LinkedIn Jobs", "2026-09-26"),
            ("debalina@example.com", "ABC Tech", "abctech.com", "https://img.logo.dev/abctech.com", "Web Developer", "Austin, TX", "Remote", "Screening", "2026-09-23", "$35 - $42 / hr", "Application Submitted", "Submitted portfolio link.", "Company Career Portals", "2026-09-28"),
            ("debalina@example.com", "Microsoft", "microsoft.com", "https://img.logo.dev/microsoft.com", "SDE Intern", "Redmond, WA", "Remote", "Offer", "2026-09-24", "$48 - $56 / hr", "Offer Extended", "Reviewing benefits and stipend package before Friday.", "University Referrals", "2026-09-29"),
            ("debalina@example.com", "Amazon", "amazon.com", "https://img.logo.dev/amazon.com", "Software Developer Intern", "Seattle, WA", "On-site", "Screening", "2026-09-25", "$46 - $54 / hr", "Recruiter Phone Screen", "Prepared leadership principles examples.", "Company Career Portals", "2026-09-27"),
            ("debalina@example.com", "Infosys", "infosys.com", "https://img.logo.dev/infosys.com", "Graduate Software Engineer", "Raleigh, NC", "Remote", "Applied", "2026-09-28", "$70,000 - $82,000", "Application Submitted", "Application viewed by hiring team yesterday.", "Job Boards (Indeed/Handshake)", None),
            ("debalina@example.com", "Accenture", "accenture.com", "https://img.logo.dev/accenture.com", "QA / Testing Intern", "Chicago, IL", "Hybrid", "Rejected", "2026-09-18", "$32 - $40 / hr", "Position Filled", "Keep in touch for summer openings.", "LinkedIn Jobs", "2026-09-24")
        ]

        cursor.executemany("""
        INSERT INTO applications (user_email, company, company_domain, logo, role, location, work_mode, status, applied_date, salary, stage, notes, source, response_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_apps)

        default_interviews = [
            ("debalina@example.com", "XYZ Ltd", "xyz.com", "https://img.logo.dev/xyz.com", "Technical Interview", "Technical Interview: System Architecture & Coding", "2026-09-23", "3:00 PM - 4:00 PM EST", "Sarah Jenkins (Lead Architect)", "Google Meet", "https://meet.google.com/xyz-tech-round", "completed", "Focus on clean modular architecture and API latency."),
            ("debalina@example.com", "Google", "google.com", "https://img.logo.dev/google.com", "Software Engineer Intern", "Round 2: React, Data Structures & Problem Solving", "Tomorrow, Sep 30, 2026", "2:00 PM - 3:00 PM EST", "David Chen (Software Engineer)", "Google Meet", "https://meet.google.com/abc-defg-hij", "scheduled", "Focus on React component lifecycle, state management, and DOM optimization."),
            ("debalina@example.com", "TCS", "tcs.com", "https://img.logo.dev/tcs.com", "Python Developer", "Technical Interview: Python & SQL Basics", "2026-09-25", "10:30 AM - 11:30 AM EST", "Priya Sharma (Technical Lead)", "Microsoft Teams", "https://teams.microsoft.com/l/meetup-join", "conducted", "Review Python generators, list comprehensions, and relational database queries."),
            ("debalina@example.com", "Amazon", "amazon.com", "https://img.logo.dev/amazon.com", "Software Developer Intern", "HR & Behavioral Discussion", "Friday, Oct 02, 2026", "4:00 PM - 4:45 PM EST", "Marcus Vance (University Talent Recruiter)", "Google Meet", "https://meet.google.com/", "scheduled", "Have STAR stories ready for 'Learn and Be Curious' and 'Deliver Results'.")
        ]

        cursor.executemany("""
        INSERT INTO interviews (user_email, company, company_domain, logo, role, round, date, time, interviewer, platform, meeting_url, status, prep_tip)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_interviews)

        conn.commit()

    cursor.execute("SELECT COUNT(*) AS cnt FROM jobs")
    job_row = cursor.fetchone()
    job_count = job_row["cnt"] if isinstance(job_row, dict) or hasattr(job_row, "__getitem__") else job_row[0]

    if job_count == 0:
        cursor.executemany("""
        INSERT INTO jobs (id, company, company_name, company_domain, logo, role, job_title, location, work_mode, salary, salary_min, salary_max, posted_date, posted_at, match_score, tags, skills, department, description, responsibilities, requirements, benefits, application_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, SEED_JOBS_ROWS)
        conn.commit()
    else:
                                            
        cursor.execute("SELECT id FROM jobs WHERE LOWER(company) = 'instagram'")
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO jobs (id, company, company_name, company_domain, logo, role, job_title, location, work_mode, salary, salary_min, salary_max, posted_date, posted_at, match_score, tags, skills, department, description, responsibilities, requirements, benefits, application_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, SEED_JOBS_ROWS[8])
            conn.commit()

    cursor.execute("SELECT COUNT(*) AS cnt FROM saved_jobs WHERE LOWER(user_email) = 'debalina@example.com'")
    saved_row = cursor.fetchone()
    saved_count = saved_row["cnt"] if isinstance(saved_row, dict) or hasattr(saved_row, "__getitem__") else saved_row[0]

    if saved_count == 0:
        cursor.executemany("""
        INSERT OR IGNORE INTO saved_jobs (user_email, job_id)
        VALUES (?, ?)
        """, [
            ("debalina@example.com", 1),
            ("debalina@example.com", 2),
            ("debalina@example.com", 3),
            ("debalina@example.com", 4)
        ])
        conn.commit()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_profiles (
        user_email TEXT PRIMARY KEY,
        profile_data TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    try:
        cursor.execute("SELECT user_email, profile_data FROM user_profiles")
        for p_row in cursor.fetchall():
            u_email = p_row["user_email"] if isinstance(p_row, dict) or hasattr(p_row, "__getitem__") else p_row[0]
            p_str = p_row["profile_data"] if isinstance(p_row, dict) or hasattr(p_row, "__getitem__") else p_row[1]
            if p_str and ("data:image/" in p_str):
                p_json = json.loads(p_str)
                changed = False
                if str(p_json.get("avatar") or "").startswith("data:image/"):
                    p_json["avatar"] = ""
                    changed = True
                if str(p_json.get("profileImage") or "").startswith("data:image/"):
                    p_json["profileImage"] = ""
                    changed = True
                if changed:
                    cursor.execute(
                        "UPDATE user_profiles SET profile_data = ? WHERE user_email = ?",
                        (json.dumps(p_json), u_email)
                    )
        conn.commit()
    except Exception as cleanup_err:
        print(f"Base64 profile picture cleanup error: {cleanup_err}")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        text TEXT NOT NULL,
        due_date TEXT,
        priority TEXT,
        completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()

    cursor.execute("SELECT COUNT(*) AS cnt FROM reminders WHERE LOWER(user_email) = 'debalina@example.com'")
    rem_row = cursor.fetchone()
    rem_count = rem_row["cnt"] if isinstance(rem_row, dict) or hasattr(rem_row, "__getitem__") else rem_row[0]

    if rem_count == 0:
        cursor.executemany("""
        INSERT OR IGNORE INTO reminders (id, user_email, text, due_date, priority, completed)
        VALUES (?, ?, ?, ?, ?, ?)
        """, [
            ("1", "debalina@example.com", "Review Microsoft SDE Intern offer letter & submit acceptance form", "Feb 27, 2026", "High", 0),
            ("2", "debalina@example.com", "Review React state management notes for Google technical interview", "Feb 26, 2026", "High", 0),
            ("3", "debalina@example.com", "Send follow-up thank you note to Amazon recruiter Marcus", "Mar 01, 2026", "Medium", 1),
            ("4", "debalina@example.com", "Update LinkedIn portfolio with latest internship projects", "Mar 05, 2026", "Low", 0)
        ])
        conn.commit()

    conn.close()

def calculate_kpis_for_user(user_email: str) -> Dict[str, Any]:
    email = (user_email or "").strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS total FROM applications WHERE LOWER(user_email) = ?", (email,))
    row = cursor.fetchone()
    total_apps = row["total"] if isinstance(row, dict) or hasattr(row, "__getitem__") else row[0]

    cursor.execute("""
    SELECT applied_date FROM applications
    WHERE LOWER(user_email) = ?
    ORDER BY applied_date DESC
    """, (email,))
    app_dates = [r["applied_date"] if isinstance(r, dict) or hasattr(r, "__getitem__") else r[0] for r in cursor.fetchall()]

    curr_month_count = 0
    prev_month_count = 0

    if app_dates:
                                                                  
        latest_date_str = app_dates[0]
        try:
            ref_dt = datetime.strptime(latest_date_str[:10], "%Y-%m-%d")
        except Exception:
            ref_dt = datetime.now()

        curr_year = ref_dt.year
        curr_month = ref_dt.month

        if curr_month == 1:
            prev_year = curr_year - 1
            prev_month = 12
        else:
            prev_year = curr_year
            prev_month = curr_month - 1

        curr_prefix = f"{curr_year:04d}-{curr_month:02d}"
        prev_prefix = f"{prev_year:04d}-{prev_month:02d}"

        for d_str in app_dates:
            if not d_str:
                continue
            if d_str.startswith(curr_prefix):
                curr_month_count += 1
            elif d_str.startswith(prev_prefix):
                prev_month_count += 1

    if prev_month_count > 0:
        growth = round(((curr_month_count - prev_month_count) / prev_month_count) * 100)
    elif curr_month_count > 0:
        growth = 100                                   
    else:
        growth = 0

    cursor.execute("""
    SELECT COUNT(*) AS active_cnt FROM applications
    WHERE LOWER(user_email) = ?
      AND LOWER(status) NOT IN ('rejected', 'offer')
    """, (email,))
    row = cursor.fetchone()
    active_apps = row["active_cnt"] if isinstance(row, dict) or hasattr(row, "__getitem__") else row[0]

    cursor.execute("""
    SELECT COUNT(*) AS awaiting_cnt FROM applications
    WHERE LOWER(user_email) = ?
      AND (
        LOWER(status) IN ('applied', 'screening', 'in review', 'submitted')
        OR LOWER(stage) LIKE '%submitted%'
        OR LOWER(stage) LIKE '%review%'
      )
    """, (email,))
    row = cursor.fetchone()
    awaiting_resp = row["awaiting_cnt"] if isinstance(row, dict) or hasattr(row, "__getitem__") else row[0]

    cursor.execute("""
    SELECT COUNT(*) AS interview_cnt FROM interviews
    WHERE LOWER(user_email) = ?
      AND LOWER(COALESCE(status, 'scheduled')) NOT IN ('cancelled', 'completed', 'rejected')
    """, (email,))
    row = cursor.fetchone()
    scheduled_interviews = row["interview_cnt"] if isinstance(row, dict) or hasattr(row, "__getitem__") else row[0]

    new_scheduled_interviews = scheduled_interviews

    cursor.execute("""
    SELECT COUNT(*) AS offer_cnt FROM applications
    WHERE LOWER(user_email) = ?
      AND LOWER(status) = 'offer'
    """, (email,))
    row = cursor.fetchone()
    offers_received = row["offer_cnt"] if isinstance(row, dict) or hasattr(row, "__getitem__") else row[0]

    new_offers = min(offers_received, curr_month_count) if offers_received > 0 else 0
    if new_offers == 0 and offers_received > 0:
        new_offers = 1

    conn.close()

    return {
        "totalApplications": total_apps,
        "applicationsGrowth": growth,
        "activeApplications": active_apps,
        "awaitingResponse": awaiting_resp,
        "scheduledInterviews": scheduled_interviews,
        "newScheduledInterviews": new_scheduled_interviews,
        "offersReceived": offers_received,
        "newOffers": new_offers
    }

def calculate_weekly_activity(user_email: str) -> Dict[str, Any]:
    email = (user_email or "").strip().lower()
    today = datetime.now().date()

    days_map = {}
    days_list = []
                                                                     
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        d_iso = d.strftime("%Y-%m-%d")
        day_entry = {
            "date": d_iso,
            "day": d.strftime("%a"),
            "fullDate": d.strftime("%A, %B %d, %Y"),
            "applications": 0,
            "interviews": 0,
            "applicationsList": [],
            "interviewsList": []
        }
        days_map[d_iso] = day_entry
        days_list.append(day_entry)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, company, company_domain, logo, role, location, work_mode, status, applied_date, salary, stage, notes
    FROM applications
    WHERE LOWER(user_email) = ?
    ORDER BY id DESC
    """, (email,))

    app_rows = cursor.fetchall()
    for row in app_rows:
        r = dict(row) if isinstance(row, dict) or hasattr(row, "keys") else {
            "id": row[0], "company": row[1], "company_domain": row[2], "logo": row[3],
            "role": row[4], "location": row[5], "work_mode": row[6], "status": row[7],
            "applied_date": row[8], "salary": row[9], "stage": row[10], "notes": row[11]
        }
        iso_date = normalize_date_to_iso(r.get("applied_date"))
        if iso_date and iso_date in days_map:
            target = days_map[iso_date]
            target["applications"] += 1
            target["applicationsList"].append({
                "id": r.get("id"),
                "company": r.get("company"),
                "companyDomain": r.get("company_domain"),
                "logo": r.get("logo"),
                "role": r.get("role"),
                "location": r.get("location"),
                "workMode": r.get("work_mode"),
                "status": r.get("status"),
                "appliedDate": r.get("applied_date"),
                "salary": r.get("salary"),
                "stage": r.get("stage"),
                "notes": r.get("notes")
            })

    cursor.execute("""
    SELECT id, company, company_domain, logo, role, round, date, time, interviewer, platform, meeting_url, status, prep_tip
    FROM interviews
    WHERE LOWER(user_email) = ?
      AND LOWER(COALESCE(status, 'scheduled')) IN ('completed', 'conducted')
    ORDER BY id DESC
    """, (email,))

    itw_rows = cursor.fetchall()
    for row in itw_rows:
        r = dict(row) if isinstance(row, dict) or hasattr(row, "keys") else {
            "id": row[0], "company": row[1], "company_domain": row[2], "logo": row[3],
            "role": row[4], "round": row[5], "date": row[6], "time": row[7],
            "interviewer": row[8], "platform": row[9], "meeting_url": row[10],
            "status": row[11], "prep_tip": row[12]
        }
        iso_date = normalize_date_to_iso(r.get("date"))
        if iso_date and iso_date in days_map:
            target = days_map[iso_date]
            target["interviews"] += 1
            target["interviewsList"].append({
                "id": r.get("id"),
                "company": r.get("company"),
                "companyDomain": r.get("company_domain"),
                "logo": r.get("logo"),
                "role": r.get("role"),
                "round": r.get("round"),
                "date": r.get("date"),
                "time": r.get("time"),
                "interviewer": r.get("interviewer"),
                "platform": r.get("platform"),
                "link": r.get("meeting_url"),
                "meetingUrl": r.get("meeting_url"),
                "status": r.get("status"),
                "prepTip": r.get("prep_tip")
            })

    conn.close()

    return {"days": days_list}

def calculate_analytics_for_user(user_email: str) -> Dict[str, Any]:
    email = (user_email or "").strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, company, company_domain, logo, role, location, work_mode, status, applied_date, salary, stage, notes, source, response_date
    FROM applications
    WHERE LOWER(user_email) = ?
    ORDER BY id DESC
    """, (email,))

    app_rows = cursor.fetchall()

    cursor.execute("""
    SELECT DISTINCT LOWER(company) AS company
    FROM interviews
    WHERE LOWER(user_email) = ?
    """, (email,))
    itw_companies = {
        (r["company"] if isinstance(r, dict) or hasattr(r, "__getitem__") else r[0] or "").strip().lower()
        for r in cursor.fetchall()
    }
    conn.close()

    total_apps = len(app_rows)
    if total_apps == 0:
        return {
            "conversion": {
                "responseRate": "0%",
                "interviewConversion": "0%",
                "offerRate": "0%",
                "averageResponseDays": "—",
                "respondedCount": 0,
                "interviewCount": 0,
                "offerCount": 0,
                "totalApplications": 0
            },
            "channels": [],
            "responseBreakdown": []
        }

    responded_count = 0
    interview_count = 0
    offer_count = 0
    valid_response_days = []
    response_breakdown = []
    channel_counts = {}

    for row in app_rows:
        r = dict(row) if isinstance(row, dict) or hasattr(row, "keys") else {
            "id": row[0], "company": row[1], "company_domain": row[2], "logo": row[3],
            "role": row[4], "location": row[5], "work_mode": row[6], "status": row[7],
            "applied_date": row[8], "salary": row[9], "stage": row[10], "notes": row[11],
            "source": row[12] if len(row) > 12 else None,
            "response_date": row[13] if len(row) > 13 else None
        }

        app_id = r.get("id")
        company = (r.get("company") or "").strip()
        comp_lower = company.lower()
        status_raw = (r.get("status") or "").strip()
        status_lower = status_raw.lower()
        applied_date_raw = r.get("applied_date") or ""
        response_date_raw = r.get("response_date") or ""
        source = (r.get("source") or "").strip()
        if not source:
            source = "Other"

        channel_counts[source] = channel_counts.get(source, 0) + 1

        applied_iso = normalize_date_to_iso(applied_date_raw)
        response_iso = normalize_date_to_iso(response_date_raw)

        days_taken = None
        if applied_iso and response_iso:
            try:
                d_appl = datetime.strptime(applied_iso, "%Y-%m-%d").date()
                d_resp = datetime.strptime(response_iso, "%Y-%m-%d").date()
                diff = (d_resp - d_appl).days
                if diff >= 0:
                    days_taken = diff
                    valid_response_days.append(diff)
            except Exception:
                pass

        has_responded = bool(response_iso) or status_lower in ("screening", "interviewing", "offer", "rejected")
        if has_responded:
            responded_count += 1

        is_interview = (status_lower == "interviewing") or (comp_lower in itw_companies)
        if is_interview:
            interview_count += 1

        is_offer = (status_lower == "offer")
        if is_offer:
            offer_count += 1

        response_breakdown.append({
            "id": app_id,
            "company": company,
            "companyDomain": r.get("company_domain") or "",
            "logo": r.get("logo") or "",
            "role": r.get("role") or "",
            "status": status_raw,
            "appliedDate": applied_date_raw,
            "responseDate": response_date_raw if response_iso else None,
            "responseDays": days_taken,
            "source": source,
            "channel": source,
            "hasResponded": has_responded,
            "isInterview": is_interview,
            "isOffer": is_offer
        })

    response_rate = round((responded_count / total_apps) * 100)
    interview_rate = round((interview_count / total_apps) * 100)
    offer_rate = round((offer_count / total_apps) * 100)

    if valid_response_days:
        avg_days = sum(valid_response_days) / len(valid_response_days)
        avg_days_str = f"{avg_days:.1f} days" if avg_days % 1 != 0 else f"{int(avg_days)} days"
    else:
        avg_days_str = "—"

    channels_list = []
    for ch_name, count in channel_counts.items():
        pct = round((count / total_apps) * 100)
        channels_list.append({
            "name": ch_name,
            "count": count,
            "applications": count,
            "percent": pct,
            "percentage": pct
        })

    channels_list.sort(key=lambda x: x["count"], reverse=True)

    return {
        "conversion": {
            "responseRate": f"{response_rate}%",
            "interviewConversion": f"{interview_rate}%",
            "offerRate": f"{offer_rate}%",
            "averageResponseDays": avg_days_str,
            "respondedCount": responded_count,
            "interviewCount": interview_count,
            "offerCount": offer_count,
            "totalApplications": total_apps
        },
        "channels": channels_list,
        "responseBreakdown": response_breakdown
    }

def calculate_status_breakdown_for_user(user_email: str) -> Dict[str, Any]:
    email = (user_email or "").strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT status FROM applications
    WHERE LOWER(user_email) = ?
    """, (email,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    total_apps = len(rows)
    canonical_statuses = ["Applied", "Screening", "Interviewing", "Offer", "Rejected"]
    counts = {s: 0 for s in canonical_statuses}

    for row in rows:
        st = (row.get("status") or "").strip().lower()
        if st == "applied" or "submitt" in st:
            counts["Applied"] += 1
        elif st == "screening" or "screen" in st:
            counts["Screening"] += 1
        elif st == "interviewing" or "interview" in st:
            counts["Interviewing"] += 1
        elif st == "offer":
            counts["Offer"] += 1
        elif st == "rejected":
            counts["Rejected"] += 1
        else:
            counts["Applied"] += 1

    statuses_list = []
    for s in canonical_statuses:
        cnt = counts[s]
        pct = round((cnt / total_apps) * 100) if total_apps > 0 else 0
        statuses_list.append({
            "status": s,
            "count": cnt,
            "percentage": pct
        })

    return {
        "totalApplications": total_apps,
        "statuses": statuses_list
    }

def sync_frontend_data(
    user_email: str,
    applications: Optional[List[Dict[str, Any]]] = None,
    interviews: Optional[List[Dict[str, Any]]] = None,
    reminders: Optional[List[Dict[str, Any]]] = None,
    profile: Optional[Dict[str, Any]] = None
):
    email = (user_email or "").strip().lower()
    if not email:
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT OR IGNORE INTO users (email, name, role)
    VALUES (?, ?, 'Job Seeker')
    """, (email, email.split("@")[0].replace(".", " ").title()))

    if applications is not None:
        cursor.execute("DELETE FROM applications WHERE LOWER(user_email) = ?", (email,))
        for app in applications:
            cursor.execute("""
            INSERT INTO applications (user_email, company, company_domain, logo, role, location, work_mode, status, applied_date, salary, stage, notes, source, response_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                email,
                app.get("company", ""),
                app.get("companyDomain", ""),
                app.get("logo", ""),
                app.get("role", ""),
                app.get("location", ""),
                app.get("workMode", ""),
                app.get("status", "Applied"),
                app.get("appliedDate", datetime.now().strftime("%Y-%m-%d")),
                app.get("salary", ""),
                app.get("stage", ""),
                app.get("notes", ""),
                app.get("source", "LinkedIn Jobs"),
                app.get("responseDate", "")
            ))

    if interviews is not None:
        cursor.execute("DELETE FROM interviews WHERE LOWER(user_email) = ?", (email,))
        for itw in interviews:
            cursor.execute("""
            INSERT INTO interviews (user_email, company, company_domain, logo, role, round, date, time, interviewer, platform, meeting_url, status, prep_tip, interview_date, start_time, end_time, timezone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                email,
                itw.get("company", ""),
                itw.get("companyDomain", ""),
                itw.get("logo", ""),
                itw.get("role", ""),
                itw.get("round", ""),
                itw.get("date", ""),
                itw.get("time", ""),
                itw.get("interviewer", ""),
                itw.get("platform", "Google Meet"),
                itw.get("meetingUrl") or itw.get("link") or "",
                itw.get("status", "scheduled"),
                itw.get("prepTip", ""),
                itw.get("interviewDate", ""),
                itw.get("startTime", ""),
                itw.get("endTime", ""),
                itw.get("timeZone") or itw.get("timezone", "")
            ))

    conn.commit()
    conn.close()

    if reminders is not None:
        sync_reminders_for_user_db(email, reminders)

    if profile is not None:
        save_profile_for_user_db(email, profile)

def get_profile_for_user_db(user_email: str) -> Optional[Dict[str, Any]]:
    email = (user_email or "").strip().lower()
    if not email:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT profile_data FROM user_profiles WHERE LOWER(user_email) = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    if row:
        data_str = row["profile_data"] if isinstance(row, dict) or hasattr(row, "__getitem__") else row[0]
        try:
            return json.loads(data_str)
        except Exception:
            return None
    return None

def save_profile_for_user_db(user_email: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    email = (user_email or "").strip().lower()
    if not email:
        raise ValueError("User email required")
                                                                            
    if isinstance(profile_data, dict):
        if str(profile_data.get("avatar") or "").startswith("data:image/"):
            profile_data["avatar"] = ""
        if str(profile_data.get("profileImage") or "").startswith("data:image/"):
            profile_data["profileImage"] = ""
    data_str = json.dumps(profile_data)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO user_profiles (user_email, profile_data, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_email) DO UPDATE SET
        profile_data = excluded.profile_data,
        updated_at = CURRENT_TIMESTAMP
    """, (email, data_str))
    conn.commit()
    conn.close()
    return profile_data

def get_reminders_for_user_db(user_email: str) -> List[Dict[str, Any]]:
    email = (user_email or "").strip().lower()
    if not email:
        return []
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reminders WHERE LOWER(user_email) = ? ORDER BY id DESC", (email,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        row_dict = dict(r) if isinstance(r, dict) or hasattr(r, "keys") else {
            "id": r[0], "user_email": r[1], "text": r[2], "due_date": r[3], "priority": r[4], "completed": r[5]
        }
        result.append({
            "id": row_dict["id"],
            "text": row_dict["text"],
            "dueDate": row_dict.get("due_date", ""),
            "priority": row_dict.get("priority", "Medium"),
            "completed": bool(row_dict.get("completed", 0))
        })
    return result

def sync_reminders_for_user_db(user_email: str, reminders_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    email = (user_email or "").strip().lower()
    if not email:
        return []
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM reminders WHERE LOWER(user_email) = ?", (email,))
    for rem in (reminders_list or []):
        rem_id = str(rem.get("id") or datetime.now().timestamp())
        cursor.execute("""
        INSERT INTO reminders (id, user_email, text, due_date, priority, completed)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            rem_id,
            email,
            rem.get("text", ""),
            rem.get("dueDate", ""),
            rem.get("priority", "Medium"),
            1 if rem.get("completed") else 0
        ))
    conn.commit()
    conn.close()
    return reminders_list

def get_interviews_for_user_db(user_email: str) -> List[Dict[str, Any]]:
    email = (user_email or "").strip().lower()
    if not email:
        return []
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, company, company_domain, logo, role, round, date, time,
           interviewer, platform, meeting_url, status, prep_tip,
           interview_date, start_time, end_time, timezone
    FROM interviews
    WHERE LOWER(user_email) = ?
    ORDER BY COALESCE(interview_date, date) ASC, id ASC
    """, (email,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        row_dict = dict(r) if isinstance(r, dict) or hasattr(r, "keys") else {
            "id": r[0], "company": r[1], "company_domain": r[2], "logo": r[3],
            "role": r[4], "round": r[5], "date": r[6], "time": r[7],
            "interviewer": r[8], "platform": r[9], "meeting_url": r[10],
            "status": r[11], "prep_tip": r[12], "interview_date": r[13],
            "start_time": r[14], "end_time": r[15], "timezone": r[16]
        }
        result.append({
            "id": row_dict["id"],
            "company": row_dict.get("company", ""),
            "companyDomain": row_dict.get("company_domain", ""),
            "logo": row_dict.get("logo", ""),
            "role": row_dict.get("role", ""),
            "round": row_dict.get("round", ""),
            "date": row_dict.get("date", ""),
            "time": row_dict.get("time", ""),
            "interviewer": row_dict.get("interviewer", ""),
            "platform": row_dict.get("platform", "Google Meet"),
            "meetingUrl": row_dict.get("meeting_url", ""),
            "status": row_dict.get("status", "scheduled"),
            "prepTip": row_dict.get("prep_tip", ""),
            "interviewDate": row_dict.get("interview_date", ""),
            "startTime": row_dict.get("start_time", ""),
            "endTime": row_dict.get("end_time", ""),
            "timezone": row_dict.get("timezone", "")
        })
    return result

def format_job_record(row: Dict[str, Any], is_saved: bool = False, has_applied: bool = False) -> Dict[str, Any]:
    tags = []
    raw_tags = row.get("tags") or row.get("skills")
    if raw_tags:
        try:
            if isinstance(raw_tags, str) and raw_tags.strip().startswith("["):
                tags = json.loads(raw_tags)
            elif isinstance(raw_tags, list):
                tags = raw_tags
            else:
                tags = [t.strip() for t in str(raw_tags).split(",") if t.strip()]
        except Exception:
            tags = [t.strip() for t in str(raw_tags).split(",") if t.strip()]

    responsibilities = []
    raw_resp = row.get("responsibilities")
    if raw_resp:
        try:
            if isinstance(raw_resp, str) and raw_resp.strip().startswith("["):
                responsibilities = json.loads(raw_resp)
            elif isinstance(raw_resp, list):
                responsibilities = raw_resp
            else:
                responsibilities = [str(raw_resp)]
        except Exception:
            responsibilities = [str(raw_resp)]

    requirements = []
    raw_req = row.get("requirements")
    if raw_req:
        try:
            if isinstance(raw_req, str) and raw_req.strip().startswith("["):
                requirements = json.loads(raw_req)
            elif isinstance(raw_req, list):
                requirements = raw_req
            else:
                requirements = [str(raw_req)]
        except Exception:
            requirements = [str(raw_req)]

    benefits = []
    raw_ben = row.get("benefits")
    if raw_ben:
        try:
            if isinstance(raw_ben, str) and raw_ben.strip().startswith("["):
                benefits = json.loads(raw_ben)
            elif isinstance(raw_ben, list):
                benefits = raw_ben
            else:
                benefits = [str(raw_ben)]
        except Exception:
            benefits = [str(raw_ben)]

    company = row.get("company") or row.get("company_name", "")
    role = row.get("role") or row.get("job_title", "")
    domain = row.get("company_domain", "")
    work_mode = row.get("work_mode") or row.get("workMode") or "Hybrid"
    posted = row.get("posted_date") or row.get("posted_at") or "Recently"
    app_url = row.get("application_url") or row.get("applicationUrl") or ""

    return {
        "id": row["id"],
        "company": company,
        "company_name": company,
        "companyDomain": domain,
        "company_domain": domain,
        "logo": row.get("logo") or "",
        "role": role,
        "job_title": role,
        "location": row.get("location") or "",
        "workMode": work_mode,
        "work_mode": work_mode,
        "salary": row.get("salary") or "",
        "salary_min": row.get("salary_min"),
        "salary_max": row.get("salary_max"),
        "postedDate": posted,
        "posted_at": posted,
        "matchScore": row.get("match_score"),
        "match_score": row.get("match_score"),
        "tags": tags,
        "skills": tags,
        "department": row.get("department") or "",
        "description": row.get("description") or "",
        "responsibilities": responsibilities,
        "requirements": requirements,
        "benefits": benefits,
        "applicationUrl": app_url,
        "application_url": app_url,
        "isSaved": is_saved,
        "is_saved": is_saved,
        "hasApplied": has_applied,
        "has_applied": has_applied
    }

def get_jobs_list(
    search: Optional[str] = None,
    work_mode: Optional[str] = None,
    user_email: Optional[str] = None
) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    sql = "SELECT * FROM jobs WHERE 1=1"
    params = []

    if work_mode and work_mode.strip() and work_mode.strip().lower() != "all":
        sql += " AND LOWER(work_mode) = ?"
        params.append(work_mode.strip().lower())

    clean_search = re.sub(r"\s+", " ", (search or "").strip().lower())
    if clean_search:
        tokens = clean_search.split(" ")
        for token in tokens:
            if not token:
                continue
            sql += """ AND (
                LOWER(role) LIKE ?
                OR LOWER(company) LIKE ?
                OR LOWER(location) LIKE ?
                OR LOWER(tags) LIKE ?
                OR LOWER(description) LIKE ?
            )"""
            pattern = f"%{token}%"
            params.extend([pattern, pattern, pattern, pattern, pattern])

    sql += " ORDER BY id ASC"
    cursor.execute(sql, tuple(params))
    job_rows = [dict(r) for r in cursor.fetchall()]

    saved_ids = set()
    applied_keys = set()
    email = (user_email or "").strip().lower()
    if email:
        cursor.execute("SELECT job_id FROM saved_jobs WHERE LOWER(user_email) = ?", (email,))
        saved_ids = {r["job_id"] if isinstance(r, dict) or hasattr(r, "__getitem__") else r[0] for r in cursor.fetchall()}

        cursor.execute("SELECT job_id, company, role FROM applications WHERE LOWER(user_email) = ?", (email,))
        for r in cursor.fetchall():
            jid = r["job_id"] if isinstance(r, dict) or hasattr(r, "__getitem__") else r[0]
            comp = (r["company"] if isinstance(r, dict) or hasattr(r, "__getitem__") else r[1] or "").lower()
            rle = (r["role"] if isinstance(r, dict) or hasattr(r, "__getitem__") else r[2] or "").lower()
            if jid:
                applied_keys.add(jid)
            if comp and rle:
                applied_keys.add((comp, rle))

    conn.close()

    result = []
    for row in job_rows:
        jid = row["id"]
        comp = (row.get("company") or "").lower()
        rle = (row.get("role") or "").lower()
        is_saved = jid in saved_ids
        has_applied = (jid in applied_keys) or ((comp, rle) in applied_keys)
        result.append(format_job_record(row, is_saved=is_saved, has_applied=has_applied))

    return result

def get_job_by_id(job_id: int, user_email: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    row_dict = dict(row)
    is_saved = False
    has_applied = False
    email = (user_email or "").strip().lower()
    if email:
        cursor.execute("SELECT id FROM saved_jobs WHERE LOWER(user_email) = ? AND job_id = ?", (email, job_id))
        is_saved = bool(cursor.fetchone())

        cursor.execute("""
        SELECT id FROM applications
        WHERE LOWER(user_email) = ?
          AND (job_id = ? OR (LOWER(company) = ? AND LOWER(role) = ?))
        """, (email, job_id, (row_dict.get("company") or "").lower(), (row_dict.get("role") or "").lower()))
        has_applied = bool(cursor.fetchone())

    conn.close()
    return format_job_record(row_dict, is_saved=is_saved, has_applied=has_applied)

def get_saved_jobs_for_user(user_email: str) -> List[Dict[str, Any]]:
    email = (user_email or "").strip().lower()
    if not email:
        return []
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT j.* FROM jobs j
    INNER JOIN saved_jobs s ON j.id = s.job_id
    WHERE LOWER(s.user_email) = ?
    ORDER BY s.id DESC
    """, (email,))
    rows = [dict(r) for r in cursor.fetchall()]

    applied_keys = set()
    cursor.execute("SELECT job_id, company, role FROM applications WHERE LOWER(user_email) = ?", (email,))
    for r in cursor.fetchall():
        jid = r["job_id"] if isinstance(r, dict) or hasattr(r, "__getitem__") else r[0]
        comp = (r["company"] if isinstance(r, dict) or hasattr(r, "__getitem__") else r[1] or "").lower()
        rle = (r["role"] if isinstance(r, dict) or hasattr(r, "__getitem__") else r[2] or "").lower()
        if jid:
            applied_keys.add(jid)
        if comp and rle:
            applied_keys.add((comp, rle))

    conn.close()

    result = []
    for r in rows:
        jid = r["id"]
        comp = (r.get("company") or "").lower()
        rle = (r.get("role") or "").lower()
        has_applied = (jid in applied_keys) or ((comp, rle) in applied_keys)
        result.append(format_job_record(r, is_saved=True, has_applied=has_applied))

    return result

def add_saved_job_for_user(user_email: str, job_id: int) -> Dict[str, Any]:
    email = (user_email or "").strip().lower()
    if not email or not job_id:
        raise ValueError("User email and valid job_id required")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM jobs WHERE id = ?", (job_id,))
    if not cursor.fetchone():
        conn.close()
        raise ValueError(f"Job #{job_id} not found")

    cursor.execute("SELECT id FROM saved_jobs WHERE LOWER(user_email) = ? AND job_id = ?", (email, job_id))
    existing = cursor.fetchone()
    if not existing:
        cursor.execute("INSERT INTO saved_jobs (user_email, job_id) VALUES (?, ?)", (email, job_id))
        conn.commit()

    cursor.execute("SELECT COUNT(*) AS cnt FROM saved_jobs WHERE LOWER(user_email) = ?", (email,))
    count_row = cursor.fetchone()
    count = count_row["cnt"] if isinstance(count_row, dict) or hasattr(count_row, "__getitem__") else count_row[0]
    conn.close()

    return {
        "status": "saved" if not existing else "already_saved",
        "job_id": job_id,
        "saved_jobs_count": count
    }

def remove_saved_job_for_user(user_email: str, job_id: int) -> Dict[str, Any]:
    email = (user_email or "").strip().lower()
    if not email or not job_id:
        raise ValueError("User email and valid job_id required")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM saved_jobs WHERE LOWER(user_email) = ? AND job_id = ?", (email, job_id))
    conn.commit()

    cursor.execute("SELECT COUNT(*) AS cnt FROM saved_jobs WHERE LOWER(user_email) = ?", (email,))
    count_row = cursor.fetchone()
    count = count_row["cnt"] if isinstance(count_row, dict) or hasattr(count_row, "__getitem__") else count_row[0]
    conn.close()

    return {
        "status": "removed",
        "job_id": job_id,
        "saved_jobs_count": count
    }

def get_saved_jobs_count_for_user(user_email: str) -> int:
    email = (user_email or "").strip().lower()
    if not email:
        return 0
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) AS cnt FROM saved_jobs WHERE LOWER(user_email) = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    return row["cnt"] if isinstance(row, dict) or hasattr(row, "__getitem__") else row[0]

def create_application_for_user(user_email: str, data: Dict[str, Any]) -> Dict[str, Any]:
    email = (user_email or "").strip().lower()
    if not email:
        raise ValueError("User email required")

    company = (data.get("company") or data.get("company_name") or "").strip()
    role = (data.get("role") or data.get("job_title") or "").strip()
    job_id = data.get("job_id") or data.get("id")

    if not company or not role:
        raise ValueError("Company and role are required to create an application")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, company, role, status, applied_date FROM applications
    WHERE LOWER(user_email) = ?
      AND (
        (job_id IS NOT NULL AND job_id = ?)
        OR (LOWER(company) = ? AND LOWER(role) = ?)
      )
    """, (email, job_id or -1, company.lower(), role.lower()))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return {
            "status": "already_applied",
            "message": f"You have already applied for {role} at {company}!",
            "application": dict(existing)
        }

    applied_date = data.get("applied_date") or data.get("appliedDate") or datetime.now().strftime("%Y-%m-%d")
    company_domain = data.get("company_domain") or data.get("companyDomain") or ""
    logo = data.get("logo") or ""
    location = data.get("location") or ""
    work_mode = data.get("work_mode") or data.get("workMode") or ""
    status = data.get("status") or "Applied"
    salary = data.get("salary") or ""
    stage = data.get("stage") or "Application Submitted"
    notes = data.get("notes") or "Applied from Explore Opportunities"
    source = data.get("source") or "Company Career Portals"

    cursor.execute("""
    INSERT INTO applications (user_email, job_id, company, company_domain, logo, role, location, work_mode, status, applied_date, salary, stage, notes, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (email, job_id, company, company_domain, logo, role, location, work_mode, status, applied_date, salary, stage, notes, source))
    new_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM applications WHERE id = ?", (new_id,))
    row = cursor.fetchone()
    conn.close()

    return {
        "status": "created",
        "message": f"Successfully applied for {role} at {company}!",
        "application": dict(row)
    }

def get_applications_for_user(user_email: str) -> List[Dict[str, Any]]:
    email = (user_email or "").strip().lower()
    if not email:
        return []
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications WHERE LOWER(user_email) = ? ORDER BY id DESC", (email,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def check_user_permission(user_email: str) -> bool:
    email = (user_email or "").strip().lower()
    if not email:
        return False
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT role FROM users WHERE LOWER(email) = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return False
    role = (row["role"] if isinstance(row, dict) or hasattr(row, "__getitem__") else row[0] or "").lower()
    return role in ["admin", "recruiter", "manager"]

def add_job_record(user_email: str, job_data: Dict[str, Any]) -> Dict[str, Any]:
    if not check_user_permission(user_email):
        raise PermissionError("Only recruiters or administrators are authorized to add job postings.")
    company = job_data.get("company") or job_data.get("company_name", "")
    role = job_data.get("role") or job_data.get("job_title", "")
    if not company or not role:
        raise ValueError("Company and role are required.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO jobs (company, company_name, company_domain, logo, role, job_title, location, work_mode, salary, salary_min, salary_max, posted_date, posted_at, match_score, tags, skills, department, description, responsibilities, requirements, benefits, application_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        company, company,
        job_data.get("company_domain") or job_data.get("companyDomain", ""),
        job_data.get("logo", ""),
        role, role,
        job_data.get("location", ""),
        job_data.get("work_mode") or job_data.get("workMode", "Remote"),
        job_data.get("salary", ""),
        job_data.get("salary_min"),
        job_data.get("salary_max"),
        job_data.get("posted_date") or job_data.get("postedDate") or "Today",
        job_data.get("posted_at") or job_data.get("postedDate") or "Today",
        job_data.get("match_score") or job_data.get("matchScore", 90),
        json.dumps(job_data.get("tags") or job_data.get("skills") or []),
        json.dumps(job_data.get("tags") or job_data.get("skills") or []),
        job_data.get("department", ""),
        job_data.get("description", ""),
        json.dumps(job_data.get("responsibilities", [])),
        json.dumps(job_data.get("requirements", [])),
        json.dumps(job_data.get("benefits", [])),
        job_data.get("application_url") or job_data.get("applicationUrl", "")
    ))
    new_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT * FROM jobs WHERE id = ?", (new_id,))
    row = cursor.fetchone()
    conn.close()
    return format_job_record(dict(row))

def update_job_record(user_email: str, job_id: int, job_data: Dict[str, Any]) -> Dict[str, Any]:
    if not check_user_permission(user_email):
        raise PermissionError("Only recruiters or administrators are authorized to edit job postings.")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise ValueError(f"Job #{job_id} not found")

    existing = dict(row)
    company = job_data.get("company") or job_data.get("company_name") or existing.get("company")
    role = job_data.get("role") or job_data.get("job_title") or existing.get("role")
    tags = job_data.get("tags") or job_data.get("skills")
    tags_str = json.dumps(tags) if tags is not None else existing.get("tags")

    cursor.execute("""
    UPDATE jobs SET
        company = ?, company_name = ?, company_domain = ?, logo = ?,
        role = ?, job_title = ?, location = ?, work_mode = ?, salary = ?,
        description = ?, tags = ?, skills = ?, application_url = ?
    WHERE id = ?
    """, (
        company, company,
        job_data.get("company_domain", existing.get("company_domain")),
        job_data.get("logo", existing.get("logo")),
        role, role,
        job_data.get("location", existing.get("location")),
        job_data.get("work_mode", existing.get("work_mode")),
        job_data.get("salary", existing.get("salary")),
        job_data.get("description", existing.get("description")),
        tags_str, tags_str,
        job_data.get("application_url", existing.get("application_url")),
        job_id
    ))
    conn.commit()
    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    updated_row = cursor.fetchone()
    conn.close()
    return format_job_record(dict(updated_row))

def delete_job_record(user_email: str, job_id: int) -> Dict[str, Any]:
    if not check_user_permission(user_email):
        raise PermissionError("Only recruiters or administrators are authorized to delete job postings.")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
    cursor.execute("DELETE FROM saved_jobs WHERE job_id = ?", (job_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "job_id": job_id}

def search_available_companies(query: str) -> List[Dict[str, Any]]:
    q = re.sub(r"\s+", " ", (query or "").strip().lower())
    if not q:
        return []

    conn = get_db_connection()
    cursor = conn.cursor()
    like_pattern = f"%{q}%"

    companies_map = {}

    cursor.execute("""
    SELECT DISTINCT company, company_domain, logo FROM applications
    WHERE LOWER(company) LIKE ?
    """, (like_pattern,))
    for row in cursor.fetchall():
        r = dict(row)
        c_name = (r.get("company") or "").strip()
        if c_name and c_name.lower() not in companies_map:
            companies_map[c_name.lower()] = {
                "name": c_name,
                "companyName": c_name,
                "domain": r.get("company_domain", ""),
                "companyDomain": r.get("company_domain", ""),
                "logo": r.get("logo", "")
            }

    cursor.execute("""
    SELECT DISTINCT company, company_domain, logo FROM jobs
    WHERE LOWER(company) LIKE ?
    """, (like_pattern,))
    for row in cursor.fetchall():
        r = dict(row)
        c_name = (r.get("company") or "").strip()
        if c_name and c_name.lower() not in companies_map:
            companies_map[c_name.lower()] = {
                "name": c_name,
                "companyName": c_name,
                "domain": r.get("company_domain", ""),
                "companyDomain": r.get("company_domain", ""),
                "logo": r.get("logo", "")
            }

    cursor.execute("""
    SELECT DISTINCT company, company_domain, logo FROM interviews
    WHERE LOWER(company) LIKE ?
    """, (like_pattern,))
    for row in cursor.fetchall():
        r = dict(row)
        c_name = (r.get("company") or "").strip()
        if c_name and c_name.lower() not in companies_map:
            companies_map[c_name.lower()] = {
                "name": c_name,
                "companyName": c_name,
                "domain": r.get("company_domain", ""),
                "companyDomain": r.get("company_domain", ""),
                "logo": r.get("logo", "")
            }

    conn.close()

    results = list(companies_map.values())
    results.sort(key=lambda x: (not x["name"].lower().startswith(q), x["name"].lower()))
    return results

def global_search_hirehub(user_email: str, query: str) -> Dict[str, Any]:
    q = re.sub(r"\s+", " ", (query or "").strip().lower())
    if not q:
        return {
            "companies": [],
            "applications": [],
            "interviews": [],
            "savedJobs": [],
            "jobs": []
        }

    email = (user_email or "").strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    like_pattern = f"%{q}%"

    results = {
        "companies": [],
        "applications": [],
        "interviews": [],
        "savedJobs": [],
        "jobs": []
    }
    company_sections_map = {}

    def track_company(c_name, c_domain, c_logo, section_name):
        if not c_name:
            return
        c_clean = c_name.strip()
        c_key = c_clean.lower()
        if c_key not in company_sections_map:
            company_sections_map[c_key] = {
                "name": c_clean,
                "companyName": c_clean,
                "domain": c_domain or "",
                "companyDomain": c_domain or "",
                "logo": c_logo or "",
                "sections": set()
            }
        company_sections_map[c_key]["sections"].add(section_name)

    cursor.execute("""
    SELECT id, company, role, location, status, applied_date, logo, company_domain, work_mode, salary
    FROM applications
    WHERE LOWER(user_email) = ?
      AND (LOWER(company) LIKE ? OR LOWER(role) LIKE ?)
    ORDER BY applied_date DESC, id DESC
    """, (email, like_pattern, like_pattern))
    for row in cursor.fetchall():
        r = dict(row)
        c_name = (r.get("company") or "").strip()
        results["applications"].append({
            "id": r.get("id"),
            "company": c_name,
            "role": r.get("role"),
            "location": r.get("location"),
            "status": r.get("status"),
            "date": r.get("applied_date"),
            "appliedDate": r.get("applied_date"),
            "logo": r.get("logo"),
            "companyDomain": r.get("company_domain"),
            "workMode": r.get("work_mode"),
            "salary": r.get("salary"),
            "section": "Applications"
        })
        track_company(c_name, r.get("company_domain"), r.get("logo"), "Applications")

    cursor.execute("""
    SELECT id, company, role, round, date, time, interviewer, platform, meeting_url, status, prep_tip, logo, company_domain
    FROM interviews
    WHERE LOWER(user_email) = ?
      AND (LOWER(company) LIKE ? OR LOWER(role) LIKE ? OR LOWER(round) LIKE ?)
    ORDER BY date ASC, id ASC
    """, (email, like_pattern, like_pattern, like_pattern))
    for row in cursor.fetchall():
        r = dict(row)
        c_name = (r.get("company") or "").strip()
        results["interviews"].append({
            "id": r.get("id"),
            "company": c_name,
            "role": r.get("role"),
            "round": r.get("round"),
            "type": r.get("round") or "Interview",
            "date": r.get("date"),
            "time": r.get("time"),
            "platform": r.get("platform"),
            "interviewer": r.get("interviewer"),
            "status": r.get("status"),
            "logo": r.get("logo"),
            "companyDomain": r.get("company_domain"),
            "section": "Upcoming Interviews"
        })
        track_company(c_name, r.get("company_domain"), r.get("logo"), "Upcoming Interviews")

    cursor.execute("""
    SELECT j.id, j.company, j.job_title, j.role, j.location, j.salary, j.work_mode, j.match_score, j.tags, j.logo, j.company_domain
    FROM saved_jobs sj
    JOIN jobs j ON sj.job_id = j.id
    WHERE LOWER(sj.user_email) = ?
      AND (LOWER(j.company) LIKE ? OR LOWER(j.job_title) LIKE ? OR LOWER(j.role) LIKE ?)
    ORDER BY sj.created_at DESC
    """, (email, like_pattern, like_pattern, like_pattern))
    for row in cursor.fetchall():
        r = dict(row)
        c_name = (r.get("company") or "").strip()
        tags_raw = r.get("tags")
        tags_list = []
        if tags_raw:
            try:
                tags_list = json.loads(tags_raw) if isinstance(tags_raw, str) and tags_raw.startswith("[") else [t.strip() for t in tags_raw.split(",") if t.strip()]
            except Exception:
                tags_list = []
        results["savedJobs"].append({
            "id": r.get("id"),
            "company": c_name,
            "role": r.get("role") or r.get("job_title"),
            "location": r.get("location"),
            "salary": r.get("salary"),
            "workMode": r.get("work_mode"),
            "matchScore": r.get("match_score"),
            "tags": tags_list,
            "logo": r.get("logo"),
            "companyDomain": r.get("company_domain"),
            "section": "Saved Jobs"
        })
        track_company(c_name, r.get("company_domain"), r.get("logo"), "Saved Jobs")

    cursor.execute("""
    SELECT id, company, job_title, role, location, salary, work_mode, match_score, tags, logo, company_domain, description, application_url
    FROM jobs
    WHERE LOWER(company) LIKE ? OR LOWER(job_title) LIKE ? OR LOWER(role) LIKE ?
    ORDER BY id ASC
    """, (like_pattern, like_pattern, like_pattern))
    for row in cursor.fetchall():
        r = dict(row)
        c_name = (r.get("company") or "").strip()
        tags_raw = r.get("tags")
        tags_list = []
        if tags_raw:
            try:
                tags_list = json.loads(tags_raw) if isinstance(tags_raw, str) and tags_raw.startswith("[") else [t.strip() for t in tags_raw.split(",") if t.strip()]
            except Exception:
                tags_list = []
        results["jobs"].append({
            "id": r.get("id"),
            "company": c_name,
            "role": r.get("role") or r.get("job_title"),
            "location": r.get("location"),
            "salary": r.get("salary"),
            "workMode": r.get("work_mode"),
            "matchScore": r.get("match_score"),
            "tags": tags_list,
            "logo": r.get("logo"),
            "companyDomain": r.get("company_domain"),
            "description": r.get("description"),
            "applicationUrl": r.get("application_url"),
            "section": "Explore Opportunities"
        })
        track_company(c_name, r.get("company_domain"), r.get("logo"), "Explore Opportunities")

    conn.close()

    companies_list = []
    for c_key, c_data in company_sections_map.items():
        if q in c_key:
            companies_list.append({
                "name": c_data["name"],
                "companyName": c_data["name"],
                "domain": c_data["domain"],
                "companyDomain": c_data["domain"],
                "logo": c_data["logo"],
                "sections": sorted(list(c_data["sections"]))
            })

    companies_list.sort(key=lambda x: (not x["name"].lower().startswith(q), x["name"].lower()))
    results["companies"] = companies_list

    return results
