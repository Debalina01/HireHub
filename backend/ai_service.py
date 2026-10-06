import os
import re
import json
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
import httpx

try:
    from backend.database import (
        get_profile_for_user_db,
        get_applications_for_user,
        get_interviews_for_user_db,
        get_reminders_for_user_db,
        get_saved_jobs_for_user,
        calculate_kpis_for_user,
        calculate_analytics_for_user,
        calculate_status_breakdown_for_user,
    )
except ImportError:
    from database import (
        get_profile_for_user_db,
        get_applications_for_user,
        get_interviews_for_user_db,
        get_reminders_for_user_db,
        get_saved_jobs_for_user,
        calculate_kpis_for_user,
        calculate_analytics_for_user,
        calculate_status_breakdown_for_user,
    )

logger = logging.getLogger("hirehub.ai_service")

FRIENDLY_ERROR_MESSAGE = "I'm having trouble connecting right now. Please try again in a moment."

def get_user_hirehub_context(email: str) -> Dict[str, Any]:
    clean_email = (email or "").strip().lower()
    if not clean_email:
        return {}

    profile = get_profile_for_user_db(clean_email) or {}
    applications = get_applications_for_user(clean_email) or []
    interviews = get_interviews_for_user_db(clean_email) or []
    reminders = get_reminders_for_user_db(clean_email) or []
    saved_jobs = get_saved_jobs_for_user(clean_email) or []

    try:
        kpis = calculate_kpis_for_user(clean_email) or {}
    except Exception as e:
        logger.warning(f"Error calculating KPIs for {clean_email}: {e}")
        kpis = {}

    try:
        analytics = calculate_analytics_for_user(clean_email) or {}
    except Exception as e:
        logger.warning(f"Error calculating analytics for {clean_email}: {e}")
        analytics = {}

    try:
        status_breakdown = calculate_status_breakdown_for_user(clean_email) or {}
    except Exception as e:
        logger.warning(f"Error calculating status breakdown for {clean_email}: {e}")
        status_breakdown = {}

    return {
        "email": clean_email,
        "profile": profile,
        "applications": applications,
        "interviews": interviews,
        "reminders": reminders,
        "saved_jobs": saved_jobs,
        "kpis": kpis,
        "analytics": analytics,
        "status_breakdown": status_breakdown,
    }

def build_system_prompt_and_context(user_context: Dict[str, Any], today_dt: Optional[datetime] = None) -> str:
    now = today_dt or datetime.now()
    today_str = now.strftime("%A, %b %d, %Y")

    profile = user_context.get("profile", {})
    user_name = profile.get("name") or user_context.get("email", "Job Seeker")
    job_title = profile.get("jobTitle") or profile.get("role") or "Candidate"
    skills = profile.get("skills", [])
    experience = profile.get("experience", [])
    education = profile.get("education", [])
    projects = profile.get("projects", [])

    apps = user_context.get("applications", [])
    interviews = user_context.get("interviews", [])
    reminders = user_context.get("reminders", [])
    kpis = user_context.get("kpis", {})
    analytics = user_context.get("analytics", {})

    apps_text = []
    for a in apps:
        comp = a.get("company", "Unknown")
        role = a.get("role", "Role")
        st = a.get("status", "Applied")
        ad = a.get("applied_date") or a.get("appliedDate", "N/A")
        notes = a.get("notes", "")
        apps_text.append(f"- {comp} | Role: {role} | Status: {st} | Applied: {ad}" + (f" | Notes: {notes}" if notes else ""))
    apps_block = "\n".join(apps_text) if apps_text else "No applications submitted yet."

    itw_text = []
    for itw in interviews:
        comp = itw.get("company", "Unknown")
        role = itw.get("role", "Role")
        rnd = itw.get("round", "Interview")
        d = itw.get("date") or itw.get("interviewDate", "TBD")
        t = itw.get("time") or (f"{itw.get('startTime', '')} - {itw.get('endTime', '')} {itw.get('timezone', '')}".strip()) or "TBD"
        st = itw.get("status", "scheduled")
        plat = itw.get("platform", "Google Meet")
        url = itw.get("meetingUrl") or ""
        tip = itw.get("prepTip", "")
        itw_text.append(
            f"- {comp} | Role: {role} | Round: {rnd} | Date: {d} | Time: {t} | Status: {st} | Platform: {plat}"
            + (f" | Link: {url}" if url else "")
            + (f" | Prep Tip: {tip}" if tip else "")
        )
    itw_block = "\n".join(itw_text) if itw_text else "No interviews scheduled."

    rem_text = []
    for r in reminders:
        txt = r.get("text", "")
        dd = r.get("dueDate") or r.get("due_date", "No due date")
        prio = r.get("priority", "Medium")
        done = "Completed" if r.get("completed") else "Pending"
        rem_text.append(f"- [{done} | {prio} Priority] {txt} (Due: {dd})")
    rem_block = "\n".join(rem_text) if rem_text else "No reminders."

    conv = analytics.get("conversion", {})
    kpi_block = f"""Total Applications: {kpis.get('totalApplications', len(apps))}
Applications Growth: {kpis.get('applicationsGrowth', 0)}%
Active Applications: {kpis.get('activeApplications', 0)}
Awaiting Response: {kpis.get('awaitingResponse', 0)}
Scheduled Interviews: {kpis.get('scheduledInterviews', len(interviews))}
New Interviews: {kpis.get('newScheduledInterviews', 0)}
Offers Received: {kpis.get('offersReceived', 0)}
Response Rate: {conv.get('responseRate', 'N/A')}
Interview Conversion: {conv.get('interviewConversion', 'N/A')}
Offer Rate: {conv.get('offerRate', 'N/A')}"""

    profile_block = f"""Name: {user_name}
Title: {job_title}
Skills: {', '.join(skills) if skills else 'None added'}
Experience:
"""
    if experience:
        for exp in experience:
            profile_block += f"- {exp.get('title')} at {exp.get('company')} ({exp.get('startDate', '')} - {exp.get('endDate', '')}): {exp.get('description', '')}\n"
    else:
        profile_block += "No experience entries.\n"

    profile_block += "Education:\n"
    if education:
        for edu in education:
            profile_block += f"- {edu.get('degree')} at {edu.get('institution')} ({edu.get('startDate', '')} - {edu.get('endDate', '')})\n"
    else:
        profile_block += "No education entries.\n"

    profile_block += "Projects:\n"
    if projects:
        for proj in projects:
            profile_block += f"- {proj.get('name')}: {proj.get('description', '')} (Tech: {', '.join(proj.get('techStack', []))})\n"
    else:
        profile_block += "No project entries.\n"

    system_prompt = f"""You are HireHub Assistant, the dedicated AI assistant for HireHub job search platform.
You help the currently logged-in user understand and manage their job search information.

CRITICAL INSTRUCTIONS:
1. Use ONLY the HireHub data provided below.
2. Never invent applications, interviews, reminders, statistics, companies, dates, or other user information.
3. If the required information is not available, say so clearly and politely.
4. For greetings and casual conversation, respond naturally, politely, and warmly.
5. For HireHub questions, provide concise, clear, and useful answers based on the user's actual data.
6. Do not claim to have performed an action unless the backend actually performed it.
7. Understand follow-up context and pronouns (e.g., 'which one is earliest?' refers to the interviews just listed).
8. For progress or improvement questions ('How was my improvement?', 'Am I improving?', 'How is my job search going?'), do not tell the user to just check their dashboard; explain the actual trend, growth percentage, conversion rates, and offers from their metrics. If data is insufficient, clearly say so.

--- CURRENT CONTEXT ---
Today's Date: {today_str}
Logged-in User Email: {user_context.get('email')}

[PROFILE DATA]
{profile_block}

[APPLICATIONS DATA]
{apps_block}

[INTERVIEWS DATA]
{itw_block}

[REMINDERS DATA]
{rem_block}

[KPIS & PROGRESS METRICS]
{kpi_block}
"""
    return system_prompt

def generate_smart_local_response(message: str, history: List[Dict[str, Any]], user_context: Dict[str, Any], today_dt: Optional[datetime] = None) -> str:
    now = today_dt or datetime.now()
    clean_msg = (message or "").strip().lower()

    profile = user_context.get("profile", {})
    user_name = profile.get("name") or "there"
    first_name = user_name.split()[0] if user_name else "there"

    apps = user_context.get("applications", [])
    interviews = user_context.get("interviews", [])
    reminders = user_context.get("reminders", [])
    kpis = user_context.get("kpis", {})
    analytics = user_context.get("analytics", {})

    last_assistant_msg = ""
    last_user_msg = ""
    if history:
        for h in reversed(history):
            sender = (h.get("sender") or "").lower()
            text = h.get("text") or ""
            if not last_assistant_msg and sender in ("bot", "assistant"):
                last_assistant_msg = text.lower()
            elif not last_user_msg and sender == "user":
                last_user_msg = text.lower()

    greeting_patterns = [
        r"^(hi|hello|hey|hola|greetings)\b",
        r"^good\s+(morning|afternoon|evening|day)\b",
        r"^how\s+are\s+you\b",
        r"^what'?s\s+up\b"
    ]
    is_greeting = any(re.search(pat, clean_msg) for pat in greeting_patterns)

    if is_greeting and not any(k in clean_msg for k in ["interview", "application", "reminder", "progress", "improve", "job", "profile", "skill", "education"]):
        if "good morning" in clean_msg:
            return f"Good morning, {first_name}! ☀️ How can I assist you with your job search today?"
        elif "good afternoon" in clean_msg:
            return f"Good afternoon, {first_name}! 👋 How can I help you with your applications and interviews today?"
        elif "good evening" in clean_msg:
            return f"Good evening, {first_name}! 🌙 How can I help you review your job search progress today?"
        elif "how are you" in clean_msg:
            return f"I'm doing well, thank you for asking! 😊 I'm ready to help you with your applications, interviews, and reminders. How is your job search going today?"
        else:
            return f"Hi {first_name}! 👋 How can I help you with your job search today?"

    is_follow_up_earliest = bool(re.search(r"\b(which\s+one|which\s+is|what\s+is|earliest|first|next\s+one)\b", clean_msg) and ("earliest" in clean_msg or "first" in clean_msg or "soonest" in clean_msg))
    if is_follow_up_earliest or (("which one" in clean_msg or "which is" in clean_msg) and ("interview" in last_assistant_msg or "interview" in last_user_msg)):
        scheduled = [itw for itw in interviews if str(itw.get("status", "")).lower() not in ("cancelled", "completed", "rejected")]
        if not scheduled:
            return "You don't have any upcoming interviews scheduled in your account."

        earliest = scheduled[0]
        comp = earliest.get("company", "Unknown")
        role = earliest.get("role", "Role")
        d = earliest.get("date") or earliest.get("interviewDate", "")
        t = earliest.get("time") or earliest.get("startTime", "")
        rnd = earliest.get("round", "Interview")
        plat = earliest.get("platform", "Google Meet")
        tip = earliest.get("prepTip", "")
        reply = f"The earliest upcoming interview is with **{comp}** for the **{role}** position ({rnd} round) on **{d}** at **{t}** via {plat}."
        if tip:
            reply += f"\n\n💡 *Prep Tip:* {tip}"
        return reply

    if any(k in clean_msg for k in ["interview", "interviews"]):
        scheduled = [itw for itw in interviews if str(itw.get("status", "")).lower() not in ("cancelled", "completed", "rejected")]

        comp_match = re.search(r"\b(?:with|at|for)\s+([a-zA-Z0-9\.\-_]+)", clean_msg)
        if comp_match:
            target = comp_match.group(1).strip().lower()
            if target not in ["me", "my", "this", "that", "the", "a", "an", "all", "any", "each", "us"]:
                matching = [i for i in interviews if target in (i.get("company") or "").lower()]
                if not matching:
                    return f"You don't have any interviews scheduled with **{target.capitalize()}** in your HireHub records."
                lines = []
                for itw in matching:
                    lines.append(f"• **{itw.get('company')}** – {itw.get('role')} ({itw.get('round')}) on {itw.get('date')} at {itw.get('time')}")
                return f"Here are your interview details for **{target.capitalize()}**:\n\n" + "\n".join(lines)

        if "next" in clean_msg or "earliest" in clean_msg or "upcoming" in clean_msg:
            if not scheduled:
                return "You currently don't have any upcoming interviews scheduled in your HireHub account."
            nxt = scheduled[0]
            comp = nxt.get("company", "Unknown")
            role = nxt.get("role", "Role")
            d = nxt.get("date") or nxt.get("interviewDate", "")
            t = nxt.get("time") or nxt.get("startTime", "")
            rnd = nxt.get("round", "Interview")
            plat = nxt.get("platform", "Google Meet")
            tip = nxt.get("prepTip", "")
            reply = f"Your next scheduled interview is with **{comp}** for the **{role}** role ({rnd} round) on **{d}** at **{t}** ({plat})."
            if tip:
                reply += f"\n\n💡 *Prep Tip:* {tip}"
            return reply

        if "this week" in clean_msg or "week" in clean_msg:
            if not scheduled:
                return "You do not have any interviews scheduled for this week."
            lines = []
            for itw in scheduled[:4]:
                lines.append(f"• **{itw.get('company')}** – {itw.get('role')} ({itw.get('round')}) on {itw.get('date')} at {itw.get('time')}")
            return f"You have {len(scheduled)} upcoming interview{'s' if len(scheduled) > 1 else ''}:\n\n" + "\n".join(lines)

        if not scheduled:
            return "You currently don't have any scheduled interviews recorded in HireHub."
        lines = []
        for itw in scheduled:
            lines.append(f"• **{itw.get('company')}** – {itw.get('role')} ({itw.get('round')}) on {itw.get('date')} at {itw.get('time')}")
        return f"You have **{len(scheduled)} scheduled interview{'s' if len(scheduled) > 1 else ''}**:\n\n" + "\n".join(lines)

    if any(k in clean_msg for k in ["progress", "improve", "improvement", "better", "going", "trend"]):
        total_apps = kpis.get("totalApplications", len(apps))
        growth = kpis.get("applicationsGrowth", 0)
        active_apps = kpis.get("activeApplications", 0)
        sched_itws = kpis.get("scheduledInterviews", len(interviews))
        offers = kpis.get("offersReceived", 0)
        conv = analytics.get("conversion", {})
        resp_rate = conv.get("responseRate", "N/A")
        itw_conv = conv.get("interviewConversion", "N/A")
        offer_rate = conv.get("offerRate", "N/A")

        if total_apps == 0:
            return "You haven't submitted any job applications yet, so there is not enough historical data to calculate your improvement. Once you start applying, I can track your growth and conversion rates!"

        reply = f"Here is how your job search is progressing:\n\n"
        reply += f"• **Applications Growth**: You have submitted **{total_apps} applications** in total, representing a **+{growth}% improvement** in activity compared to your previous period.\n"
        reply += f"• **Response & Interview Conversion**: Your response rate is **{resp_rate}**, and your interview conversion rate is **{itw_conv}** with **{sched_itws} interviews** scheduled.\n"
        if offers > 0:
            reply += f"• **Offers**: You have received **{offers} job offer** (an offer rate of **{offer_rate}**)! 🎉\n"
        else:
            reply += f"• **Active Pipeline**: You have **{active_apps} active applications** currently moving through the pipeline.\n"
        reply += "\nOverall, your outreach is showing strong positive momentum! Let me know if you would like tips for upcoming interviews."
        return reply

    if any(k in clean_msg for k in ["application", "applications", "applied", "apply"]):
        total_apps = kpis.get("totalApplications", len(apps))
        active_apps = kpis.get("activeApplications", 0)
        awaiting = kpis.get("awaitingResponse", 0)

        if "interviewing" in clean_msg or "interview" in clean_msg:
            itw_apps = [a for a in apps if str(a.get("status", "")).lower() == "interviewing"]
            if not itw_apps:
                return "You don't currently have any applications marked with 'Interviewing' status."
            comps = [f"• **{a.get('company')}** ({a.get('role')})" for a in itw_apps]
            return f"You are currently interviewing with {len(itw_apps)} company:\n\n" + "\n".join(comps)

        if "waiting" in clean_msg or "awaiting" in clean_msg or "pending" in clean_msg:
            return f"You have **{awaiting} application{'s' if awaiting != 1 else ''}** currently waiting for a response."

        if "active" in clean_msg:
            active_list = [a for a in apps if str(a.get("status", "")).lower() not in ("rejected", "withdrawn")]
            if not active_list:
                return "You don't have any active job applications right now."
            lines = [f"• **{a.get('company')}** – {a.get('role')} (*Status: {a.get('status')}*)" for a in active_list]
            return f"You have **{len(active_list)} active application{'s' if len(active_list) != 1 else ''}**:\n\n" + "\n".join(lines)

        if total_apps == 0:
            return "You haven't submitted any job applications yet."
        lines = [f"• **{a.get('company')}** – {a.get('role')} (*{a.get('status')}*)" for a in apps[:5]]
        more = f"\n*...and {len(apps) - 5} more.*" if len(apps) > 5 else ""
        return f"You have applied to **{total_apps} job{'s' if total_apps > 1 else ''}** in total ({active_apps} currently active, {awaiting} awaiting response):\n\n" + "\n".join(lines) + more

    if any(k in clean_msg for k in ["reminder", "reminders", "follow up", "follow-up", "to do", "todo", "do today"]):
        pending = [r for r in reminders if not r.get("completed")]
        if not pending:
            return "You don't have any pending reminders at the moment! All set."
        lines = []
        for r in pending:
            prio = r.get("priority", "Medium")
            due = r.get("dueDate") or r.get("due_date", "")
            lines.append(f"• [{prio} Priority] **{r.get('text')}**" + (f" *(Due: {due})*" if due else ""))
        return f"You have **{len(pending)} pending reminder{'s' if len(pending) > 1 else ''}**:\n\n" + "\n".join(lines)

    if any(k in clean_msg for k in ["skill", "skills"]):
        skills = profile.get("skills", [])
        if not skills:
            return "You haven't added any skills to your HireHub profile yet."
        return f"You have added the following **{len(skills)} skills** to your profile:\n\n" + ", ".join(skills)

    if any(k in clean_msg for k in ["project", "projects"]):
        projects = profile.get("projects", [])
        if not projects:
            return "You haven't added any projects to your profile yet."
        lines = []
        for p in projects:
            tech = ", ".join(p.get("techStack", []))
            lines.append(f"• **{p.get('name')}**: {p.get('description', '')}" + (f" *(Tech: {tech})*" if tech else ""))
        return f"You have **{len(projects)} project{'s' if len(projects) > 1 else ''}** on your profile:\n\n" + "\n".join(lines)

    if any(k in clean_msg for k in ["education", "college", "university", "degree"]):
        education = profile.get("education", [])
        if not education:
            return "You haven't added any education details to your profile yet."
        lines = []
        for edu in education:
            lines.append(f"• **{edu.get('degree')}** at **{edu.get('institution')}** ({edu.get('startDate', '')} – {edu.get('endDate', '')})")
        return f"Here is the education listed on your profile:\n\n" + "\n".join(lines)

    if any(k in clean_msg for k in ["experience", "work experience", "internship"]):
        experience = profile.get("experience", [])
        if not experience:
            return "You haven't added any work experience entries to your profile yet."
        lines = []
        for exp in experience:
            lines.append(f"• **{exp.get('title')}** at **{exp.get('company')}** ({exp.get('startDate', '')} – {exp.get('endDate', '')})\n  {exp.get('description', '')}")
        return f"Here is the work experience listed on your profile:\n\n" + "\n".join(lines)

    words = [w for w in re.findall(r"\b[A-Za-z0-9]+\b", clean_msg) if len(w) > 3]
    apps_comp_names = {a.get("company", "").lower() for a in apps}
    itws_comp_names = {i.get("company", "").lower() for i in interviews}
    all_known_comps = apps_comp_names | itws_comp_names

    for word in words:
        if word not in ["have", "what", "which", "when", "show", "tell", "about", "your", "with", "from", "this", "that", "there", "some", "many", "more"] and word not in all_known_comps:

            if any(term in clean_msg for term in ["offer", "interview", "application", "applied", "status"]):
                return f"I checked your HireHub records and could not find any applications or interviews associated with **{word.capitalize()}**. If you applied recently, you can add it to your dashboard using the 'Add Application' button!"

    return (
        f"I'm here to help you manage your HireHub job search! You can ask me about:\n"
        f"• Your upcoming **interviews** and prep tips\n"
        f"• Your active **applications** and response statuses\n"
        f"• Your job search **progress** and improvement trends\n"
        f"• Your pending **reminders** and follow-ups\n"
        f"• Your profile **skills, experience, and projects**\n\n"
        f"What would you like to check?"
    )

async def call_gemini_api(api_key: str, system_prompt: str, user_message: str, history: List[Dict[str, Any]], model: str = "gemini-1.5-flash") -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    contents = []
    for h in history[-8:]:
        sender = (h.get("sender") or "").lower()
        role = "user" if sender == "user" else "model"
        text = h.get("text") or ""
        if text.strip():
            contents.append({"role": role, "parts": [{"text": text}]})

    contents.append({"role": "user", "parts": [{"text": user_message}]})

    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 800
        }
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(url, json=payload)
        if resp.status_code != 200:
            logger.error(f"Gemini API returned status {resp.status_code}: {resp.text}")
            raise RuntimeError(f"Gemini API error status {resp.status_code}")
        data = resp.json()
        candidates = data.get("candidates", [])
        if candidates and "content" in candidates[0]:
            parts = candidates[0]["content"].get("parts", [])
            if parts and "text" in parts[0]:
                return parts[0]["text"].strip()
        raise RuntimeError("Empty response from Gemini API")

async def call_openai_compatible_api(api_key: str, base_url: str, model: str, system_prompt: str, user_message: str, history: List[Dict[str, Any]]) -> str:
    clean_base = base_url.rstrip("/")
    if not clean_base.endswith("/chat/completions"):
        url = f"{clean_base}/chat/completions"
    else:
        url = clean_base

    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-8:]:
        sender = (h.get("sender") or "").lower()
        role = "user" if sender == "user" else "assistant"
        text = h.get("text") or ""
        if text.strip():
            messages.append({"role": role, "content": text})

    messages.append({"role": "user", "content": user_message})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 800
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code != 200:
            logger.error(f"OpenAI-compatible API returned status {resp.status_code}: {resp.text}")
            raise RuntimeError(f"API error status {resp.status_code}")
        data = resp.json()
        choices = data.get("choices", [])
        if choices and "message" in choices[0]:
            return choices[0]["message"].get("content", "").strip()
        raise RuntimeError("Empty response from API")

def is_valid_api_key(key: Optional[str]) -> bool:
    if not key or not isinstance(key, str):
        return False
    k = key.strip()
    if not k or k.startswith("your_") or k.startswith("pk_") or k.startswith("sk_your") or "placeholder" in k.lower():
        return False
    return True

async def process_chat_message(
    message: str,
    history: List[Dict[str, Any]],
    user_email: str,
    simulate_error: bool = False
) -> Dict[str, Any]:
    if simulate_error:
        logger.info("Simulated API failure triggered via request header/param")
        return {
            "reply": FRIENDLY_ERROR_MESSAGE,
            "error": True
        }

    email = (user_email or "debalina@example.com").strip().lower()
    user_context = get_user_hirehub_context(email)
    system_prompt = build_system_prompt_and_context(user_context)

    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    ai_api_key = os.getenv("AI_API_KEY")

    try:
        if is_valid_api_key(gemini_key):
            model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
            reply = await call_gemini_api(gemini_key, system_prompt, message, history, model=model)
            return {"reply": reply, "error": False, "provider": "gemini"}

        if is_valid_api_key(groq_key):
            model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
            reply = await call_openai_compatible_api(
                api_key=groq_key,
                base_url="https://api.groq.com/openai/v1",
                model=model,
                system_prompt=system_prompt,
                user_message=message,
                history=history
            )
            return {"reply": reply, "error": False, "provider": "groq"}

        if is_valid_api_key(openai_key):
            base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
            model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            reply = await call_openai_compatible_api(
                api_key=openai_key,
                base_url=base_url,
                model=model,
                system_prompt=system_prompt,
                user_message=message,
                history=history
            )
            return {"reply": reply, "error": False, "provider": "openai"}

        if is_valid_api_key(ai_api_key):
            if ai_api_key.startswith("AIza"):
                model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
                reply = await call_gemini_api(ai_api_key, system_prompt, message, history, model=model)
                return {"reply": reply, "error": False, "provider": "gemini"}
            else:
                base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
                model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
                reply = await call_openai_compatible_api(
                    api_key=ai_api_key,
                    base_url=base_url,
                    model=model,
                    system_prompt=system_prompt,
                    user_message=message,
                    history=history
                )
                return {"reply": reply, "error": False, "provider": "openai"}

    except Exception as e:
        logger.error(f"External AI API call failed: {e}")
        return {
            "reply": FRIENDLY_ERROR_MESSAGE,
            "error": True
        }

    try:
        reply = generate_smart_local_response(message, history, user_context)
        return {
            "reply": reply,
            "error": False,
            "provider": "smart_local_engine"
        }
    except Exception as e:
        logger.error(f"Local AI engine error: {e}")
        return {
            "reply": FRIENDLY_ERROR_MESSAGE,
            "error": True
        }
