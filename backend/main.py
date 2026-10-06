import os
import re
import uuid
from typing import Optional, List, Dict, Any
import asyncio
import httpx
from fastapi import FastAPI, Query, Header, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
try:
    from dotenv import load_dotenv, find_dotenv
    _env_file = find_dotenv(usecwd=True)
    if _env_file:
        load_dotenv(_env_file)
    else:
        _root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        if os.path.exists(_root_env):
            load_dotenv(_root_env)
        else:
            load_dotenv()
except ImportError:
    pass

try:
    import cloudinary
    import cloudinary.uploader
except ImportError:
    cloudinary = None

try:
    from backend.database import (
        init_db, calculate_kpis_for_user, calculate_weekly_activity,
        calculate_analytics_for_user, calculate_status_breakdown_for_user, sync_frontend_data,
        get_jobs_list, get_job_by_id, get_saved_jobs_for_user, add_saved_job_for_user,
        remove_saved_job_for_user, get_saved_jobs_count_for_user, create_application_for_user,
        get_applications_for_user, add_job_record, update_job_record, delete_job_record,
        search_available_companies, global_search_hirehub,
        get_profile_for_user_db, save_profile_for_user_db,
        get_reminders_for_user_db, sync_reminders_for_user_db
    )
except ImportError:
    from database import (
        init_db, calculate_kpis_for_user, calculate_weekly_activity,
        calculate_analytics_for_user, calculate_status_breakdown_for_user, sync_frontend_data,
        get_jobs_list, get_job_by_id, get_saved_jobs_for_user, add_saved_job_for_user,
        remove_saved_job_for_user, get_saved_jobs_count_for_user, create_application_for_user,
        get_applications_for_user, add_job_record, update_job_record, delete_job_record,
        search_available_companies, global_search_hirehub,
        get_profile_for_user_db, save_profile_for_user_db,
        get_reminders_for_user_db, sync_reminders_for_user_db
    )

try:
    from backend.ai_service import process_chat_message
except ImportError:
    from ai_service import process_chat_message

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
PROFILE_IMAGES_DIR = os.path.join(UPLOADS_DIR, "profile-images")
os.makedirs(PROFILE_IMAGES_DIR, exist_ok=True)

app = FastAPI(title="HireHub API", version="1.0.0")

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.on_event("startup")
def on_startup():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LOGO_DEV_SECRET_KEY = os.getenv("LOGO_DEV_SECRET_KEY", "")
VITE_LOGODEV_PUBLISHABLE_KEY = os.getenv("VITE_LOGODEV_PUBLISHABLE_KEY", "")

STOP_WORDS = {
    'inc', 'llc', 'ltd', 'corp', 'corporation', 'company', 'co',
    'technologies', 'technology', 'solutions', 'group', 'services',
    'enterprises', 'labs', 'app', 'ai', 'io', 'the', 'private', 'limited', 'pvt', 'software'
}


def normalize_search_query(query: str) -> str:
    if not query:
        return ""
    return re.sub(r"\s+", " ", query.strip().lower())

def normalize_key(name: str) -> str:
    if not name:
        return ""
    clean = re.sub(r"^https?://", "", name.lower())
    clean = re.sub(r"^www\.", "", clean)
    clean = clean.split("/")[0]
    clean = re.sub(r"\.[a-z]{2,}(\.[a-z]{2,})?$", "", clean)
    clean = clean.replace(".", "")
    return re.sub(r"[^a-z0-9]", "", clean)

def tokenize(text: str) -> list[str]:
    return [w for w in re.split(r"[^a-z0-9]", (text or "").lower()) if w]

def get_core_stem(text: str) -> str:
    return "".join(w for w in tokenize(text) if w not in STOP_WORDS)

def score_candidate(
    query: str,
    cand_name: str,
    domain: str,
    rank_index: int = -1,
    quality_score: float = 0.0,
    verified: bool = False,
    claimed: bool = False
) -> int:
    if not domain:
        return 0
    q_clean = normalize_search_query(query)
    q_norm = normalize_key(q_clean)
    if not q_norm:
        return 0

    name_norm = normalize_key(cand_name)
    name_clean = normalize_search_query(cand_name)

    domain_host = domain.lower().replace("http://", "").replace("https://", "").replace("www.", "").split("/")[0]
    domain_stem = domain_host.split(".")[0]
    domain_stem_norm = normalize_key(domain_stem)
    full_domain_norm = normalize_key(domain_host)

    score = 0

    if name_norm == q_norm or name_clean == q_clean:
        score += 300

    if domain_stem_norm == q_norm:
        score += 280
    elif full_domain_norm == q_norm:
        score += 260

    cand_words = tokenize(cand_name)
    if len(cand_words) > 1 and all(len(w) > 1 for w in cand_words):
        acronym = "".join(w[0] for w in cand_words)
        if acronym == q_norm:
            score += 250

    q_core = get_core_stem(q_clean)
    cand_core = get_core_stem(cand_name)
    if cand_core and q_norm and cand_core == q_norm:
        score += 240
    elif q_core and cand_core and q_core == cand_core:
        score += 220

    if name_clean.startswith(q_clean) or name_norm.startswith(q_norm):
        score += 200

    if domain_stem_norm.startswith(q_norm) or domain_host.startswith(q_clean):
        score += 180

    if q_clean in name_clean or q_norm in name_norm:
        score += 140
    else:
        q_words = tokenize(q_clean)
        matching_words = [
            qw for idx, qw in enumerate(q_words)
            if any(cw == qw or (idx == len(q_words) - 1 and cw.startswith(qw)) for cw in cand_words)
        ]
        if len(matching_words) == len(q_words) and len(q_words) > 1:
            score += 150
        elif matching_words:
            score += int((len(matching_words) / len(q_words)) * 80)

    if q_norm in domain_stem_norm or q_norm in full_domain_norm:
        score += 120

    if rank_index >= 0:
        score += max(50 - rank_index * 4, 10)
    else:
        score += 20

    domain_parts = domain_host.split(".")
    tld = ".".join(domain_parts[1:])
    if tld == "com":
        score += 25
    elif tld in ["ai", "io", "app", "so", "dev", "co", "in", "tech", "de", "uk", "fr"]:
        score += 20

    if quality_score and quality_score > 0:
        score += round(quality_score * 20)
    if verified:
        score += 20

    if any(p in domain_host for p in ["wordpress", "blogspot", "wixsite", "github.io", "gitlab.io", "weebly"]):
        score -= 60

    return score

def verify_candidate_match(query: str, cand_name: str, cand_domain: str) -> bool:
    if not cand_domain:
        return False
    q_clean = normalize_search_query(query)
    q_norm = normalize_key(q_clean)
    if not q_norm:
        return False

    name_norm = normalize_key(cand_name)
    name_clean = normalize_search_query(cand_name)
    host = cand_domain.lower().replace("http://", "").replace("https://", "").replace("www.", "").split("/")[0]
    parts = host.split(".")
    stem_norm = normalize_key(parts[0])
    full_norm = normalize_key(host)

    cand_words = tokenize(cand_name)
    acronym = "".join(w[0] for w in cand_words) if len(cand_words) > 1 and all(len(w) > 1 for w in cand_words) else ""

    q_core = get_core_stem(q_clean)
    cand_core = get_core_stem(cand_name)

    if (
        name_norm == q_norm
        or name_clean == q_clean
        or stem_norm == q_norm
        or full_norm == q_norm
        or acronym == q_norm
        or (bool(q_core) and bool(cand_core) and q_core == cand_core)
    ):
        return True

    q_words = tokenize(q_clean)
    if len(q_words) > 1 and len(cand_words) >= len(q_words):
        all_words_present = all(
            any(cw == qw or (idx == len(q_words) - 1 and cw.startswith(qw)) for cw in cand_words)
            for idx, qw in enumerate(q_words)
        )
        if all_words_present:
            return True

    return False

search_cache: dict = {}
logo_cache: dict = {}


def build_logo_url(domain: str) -> str:
    if not domain:
        return ""
    clean = domain.lower().replace("http://", "").replace("https://", "").replace("www.", "").split("/")[0].strip()
    if VITE_LOGODEV_PUBLISHABLE_KEY:
        return f"https://img.logo.dev/{clean}?token={VITE_LOGODEV_PUBLISHABLE_KEY}"
    return f"https://unavatar.io/{clean}?fallback=false"

@app.get("/api/company/search")
async def search_company_suggestions(
    q: Optional[str] = Query(None, description="Company query"),
    name: Optional[str] = Query(None, description="Company query alias")
):
    raw_query = (q or name or "").strip()
    query = normalize_search_query(raw_query)
    if not query or len(query) < 2:
        return []

    cache_key = query.lower()
    if cache_key in search_cache:
        return search_cache[cache_key]

    candidates = []
    seen_domains = set()

    def add_cand(cand_name: str, domain_val: str, icon_val: str = "", q_score: float = 0.0, ver: bool = False, clm: bool = False, rank_idx: int = -1):
        if not domain_val:
            return
        clean_d = domain_val.lower().replace("http://", "").replace("https://", "").replace("www.", "").split("/")[0].strip()
        if not clean_d or "." not in clean_d or clean_d in seen_domains:
            return
        seen_domains.add(clean_d)
        score = score_candidate(query, cand_name, clean_d, rank_index=rank_idx, quality_score=q_score, verified=ver, claimed=clm)
        if score > 0:
            candidates.append({
                "name": cand_name or query,
                "domain": clean_d,
                "logo": icon_val or build_logo_url(clean_d),
                "score": score
            })

    async with httpx.AsyncClient(timeout=8.0) as client:

        if LOGO_DEV_SECRET_KEY:
            try:
                headers = {"Authorization": f"Bearer {LOGO_DEV_SECRET_KEY}", "Accept": "application/json"}
                resp = await client.get(
                    "https://api.logo.dev/search",
                    params={"q": query, "strategy": "suggest"},
                    headers=headers
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, list):
                        for idx, item in enumerate(data):
                            logo_val = item.get("logo_url") or item.get("logo") or ""
                            add_cand(
                                item.get("name", query),
                                item.get("domain", ""),
                                icon_val=logo_val,
                                q_score=1.0,
                                ver=True,
                                rank_idx=idx
                            )
            except Exception:
                pass

        try:
            bf_task = client.get(f"https://api.brandfetch.io/v2/search/{query}")
            cb_task = client.get(f"https://autocomplete.clearbit.com/v1/companies/suggest?query={query}")
            bf_resp, cb_resp = await asyncio.gather(bf_task, cb_task, return_exceptions=True)

            if not isinstance(bf_resp, Exception) and bf_resp.status_code == 200:
                bf_data = bf_resp.json()
                if isinstance(bf_data, list):
                    for idx, item in enumerate(bf_data):
                        add_cand(
                            item.get("name", query),
                            item.get("domain", ""),
                            icon_val=item.get("icon", ""),
                            q_score=float(item.get("qualityScore", 0.0) or 0.0),
                            ver=bool(item.get("verified", False)),
                            clm=bool(item.get("claimed", False)),
                            rank_idx=idx
                        )

            if not isinstance(cb_resp, Exception) and cb_resp.status_code == 200:
                cb_data = cb_resp.json()
                if isinstance(cb_data, list):
                    for idx, item in enumerate(cb_data):
                        add_cand(item.get("name", query), item.get("domain", ""), icon_val=item.get("logo", ""), rank_idx=idx)
        except Exception:
            pass

    candidates.sort(key=lambda x: x["score"], reverse=True)
    results = [
        {"name": c["name"], "domain": c["domain"], "logo": c["logo"]}
        for c in candidates[:8]
    ]

    if len(search_cache) > 500:
        search_cache.clear()
    search_cache[cache_key] = results

    return results

@app.get("/api/company-logo")
async def resolve_company(
    name: Optional[str] = Query(None, description="Company name"),
    q: Optional[str] = Query(None, description="Company query alias")
):
    raw_query = (name or q or "").strip()
    query = normalize_search_query(raw_query)
    if not query:
        return {"companyName": "", "companyDomain": "", "logo": ""}

    cache_key = query.lower()
    if cache_key in logo_cache:
        return logo_cache[cache_key]

    canonical_name = raw_query or query
    canonical_domain = ""
    logo_url = ""

    if "." in query and " " not in query:
        canonical_domain = query.lower().replace("http://", "").replace("https://", "").replace("www.", "").split("/")[0]
        logo_url = build_logo_url(canonical_domain)
        res = {"companyName": canonical_domain.split(".")[0], "companyDomain": canonical_domain, "logo": logo_url}
        logo_cache[cache_key] = res
        return res

    async with httpx.AsyncClient(timeout=8.0) as client:

        if not canonical_domain and LOGO_DEV_SECRET_KEY:
            try:
                headers = {"Authorization": f"Bearer {LOGO_DEV_SECRET_KEY}", "Accept": "application/json"}
                resp = await client.get(
                    "https://api.logo.dev/search",
                    params={"q": query, "strategy": "match"},
                    headers=headers
                )
                matches = resp.json() if resp.status_code == 200 else []
                if not matches:
                    resp_suggest = await client.get(
                        "https://api.logo.dev/search",
                        params={"q": query, "strategy": "suggest"},
                        headers=headers
                    )
                    matches = resp_suggest.json() if resp_suggest.status_code == 200 else []

                if isinstance(matches, list) and matches:
                    scored = [
                        {
                            "name": m.get("name", query),
                            "domain": m.get("domain", ""),
                            "logo": m.get("logo_url") or m.get("logo", ""),
                            "score": score_candidate(query, m.get("name", ""), m.get("domain", ""))
                        }
                        for m in matches
                    ]
                    scored = [s for s in scored if verify_candidate_match(query, s["name"], s["domain"]) and s["score"] > 0]
                    scored.sort(key=lambda x: x["score"], reverse=True)
                    if scored:
                        canonical_name = scored[0]["name"]
                        canonical_domain = scored[0]["domain"].lower().strip()
                        logo_url = scored[0].get("logo") or build_logo_url(canonical_domain)
            except Exception:
                pass

        if not canonical_domain:
            candidate_list = []
            search_queries = [query]
            if "." not in query and " " not in query:
                search_queries.append(f"{query}.com")

            try:
                tasks = [client.get(f"https://api.brandfetch.io/v2/search/{query}")]
                for q_str in search_queries:
                    tasks.append(client.get(f"https://autocomplete.clearbit.com/v1/companies/suggest?query={q_str}"))

                results = await asyncio.gather(*tasks, return_exceptions=True)
                bf_resp = results[0]
                cb_resps = results[1:]

                if not isinstance(bf_resp, Exception) and bf_resp.status_code == 200:
                    bf_data = bf_resp.json()
                    if isinstance(bf_data, list):
                        for idx, item in enumerate(bf_data):
                            c_name = item.get("name", query)
                            c_dom = (item.get("domain") or "").lower().strip()
                            if verify_candidate_match(query, c_name, c_dom):
                                s = score_candidate(
                                    query,
                                    c_name,
                                    c_dom,
                                    rank_index=idx,
                                    quality_score=float(item.get("qualityScore", 0.0) or 0.0),
                                    verified=bool(item.get("verified", False)),
                                    claimed=bool(item.get("claimed", False))
                                )
                                if s > 0:
                                    candidate_list.append({"name": c_name, "domain": c_dom, "icon": item.get("icon", ""), "score": s})

                for cb_resp in cb_resps:
                    if not isinstance(cb_resp, Exception) and cb_resp.status_code == 200:
                        cb_data = cb_resp.json()
                        if isinstance(cb_data, list):
                            for idx, item in enumerate(cb_data):
                                c_name = item.get("name", query)
                                c_dom = (item.get("domain") or "").lower().strip()
                                if verify_candidate_match(query, c_name, c_dom):
                                    s = score_candidate(query, c_name, c_dom, rank_index=idx)
                                    if s > 0:
                                        candidate_list.append({"name": c_name, "domain": c_dom, "icon": item.get("logo", ""), "score": s})
            except Exception:
                pass

            if candidate_list:
                candidate_list.sort(key=lambda x: x["score"], reverse=True)
                canonical_name = candidate_list[0]["name"]
                canonical_domain = candidate_list[0]["domain"]
                logo_url = candidate_list[0].get("icon") or (build_logo_url(canonical_domain) if canonical_domain else "")

    if not logo_url and canonical_domain:
        logo_url = build_logo_url(canonical_domain)

    res = {
        "companyName": canonical_name,
        "companyDomain": canonical_domain,
        "logo": logo_url
    }

    if canonical_domain:
        if len(logo_cache) > 500:
            logo_cache.clear()
        logo_cache[cache_key] = res

    return res

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "has_logo_dev_secret": bool(LOGO_DEV_SECRET_KEY),
        "has_logo_dev_publishable": bool(VITE_LOGODEV_PUBLISHABLE_KEY)
    }

class SyncPayload(BaseModel):
    user_email: str
    applications: Optional[list] = None
    interviews: Optional[list] = None
    reminders: Optional[list] = None
    profile: Optional[dict] = None

class ProfilePayload(BaseModel):
    user_email: str
    profile: dict

class RemindersPayload(BaseModel):
    user_email: str
    reminders: list

@app.get("/api/dashboard/kpis")
def get_dashboard_kpis(
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = user_email or x_user_email or "debalina@example.com"
    return calculate_kpis_for_user(email)

@app.get("/api/dashboard/weekly-activity")
def get_dashboard_weekly_activity(
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = user_email or x_user_email or "debalina@example.com"
    return calculate_weekly_activity(email)

@app.get("/api/dashboard/analytics")
def get_dashboard_analytics(
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = user_email or x_user_email or "debalina@example.com"
    return calculate_analytics_for_user(email)

@app.get("/api/dashboard/status-breakdown")
def get_dashboard_status_breakdown(
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = user_email or x_user_email or "debalina@example.com"
    return calculate_status_breakdown_for_user(email)

@app.post("/api/sync")
def sync_dashboard_data(payload: SyncPayload):
    sync_frontend_data(
        payload.user_email,
        payload.applications,
        payload.interviews,
        payload.reminders,
        payload.profile
    )
    return {
        "status": "synced",
        "kpis": calculate_kpis_for_user(payload.user_email),
        "weeklyActivity": calculate_weekly_activity(payload.user_email),
        "analytics": calculate_analytics_for_user(payload.user_email),
        "statusBreakdown": calculate_status_breakdown_for_user(payload.user_email)
    }

@app.get("/api/profile")
def get_profile_endpoint(
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = user_email or x_user_email or "debalina@example.com"
    prof = get_profile_for_user_db(email)
    return prof or {}

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
}
MAX_FILE_SIZE = 5 * 1024 * 1024       


class RemoveImagePayload(BaseModel):
    user_email: Optional[str] = None

@app.post("/api/profile/upload-image")
async def upload_profile_image_endpoint(
    file: UploadFile = File(...),
    user_email: Optional[str] = Form(None),
    x_user_email: Optional[str] = Header(None)
):
    email = (user_email or x_user_email or "debalina@example.com").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="User email is required")

    content_type = (file.content_type or "").lower()
    ext = ALLOWED_IMAGE_TYPES.get(content_type)
    if not ext:
        orig_ext = os.path.splitext(file.filename or "")[1].lower()
        if orig_ext in [".jpg", ".jpeg"]:
            ext = ".jpg"
        elif orig_ext == ".png":
            ext = ".png"
        elif orig_ext == ".webp":
            ext = ".webp"
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only JPEG, PNG, and WebP images are allowed."
            )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 5MB limit.")
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if not cloudinary or not (cloud_name and api_key and api_secret):
        raise HTTPException(
            status_code=500,
            detail="Persistent image storage is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
        )

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )

    original_filename = os.path.basename(file.filename or "profile-photo.jpg")
    safe_stem = re.sub(r"[^a-zA-Z0-9]", "_", email.split("@")[0])[:30]
    unique_id = uuid.uuid4().hex[:8]
    public_id = f"user_{safe_stem}_{unique_id}"

    try:
        upload_result = cloudinary.uploader.upload(
            content,
            folder="hirehub/profile-images",
            public_id=public_id,
            overwrite=True,
            resource_type="image"
        )
        file_url = upload_result.get("secure_url")
        if not file_url:
            raise RuntimeError("Cloudinary upload did not return a secure_url")
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(err)}")

    current_profile = get_profile_for_user_db(email) or {}
    current_profile["avatar"] = file_url
    current_profile["avatarOriginalFilename"] = original_filename
    if "profileImage" in current_profile:
        current_profile["profileImage"] = file_url
    save_profile_for_user_db(email, current_profile)

    return {
        "status": "success",
        "message": "Profile picture uploaded successfully",
        "imageUrl": file_url,
        "avatar": file_url,
        "originalFilename": original_filename,
        "avatarOriginalFilename": original_filename,
        "filename": original_filename
    }

@app.post("/api/profile/remove-image")
def remove_profile_image_endpoint(
    payload: Optional[RemoveImagePayload] = None,
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = (
        (payload.user_email if payload else None)
        or user_email
        or x_user_email
        or "debalina@example.com"
    ).strip().lower()

    current_profile = get_profile_for_user_db(email) or {}
    old_avatar = current_profile.get("avatar") or current_profile.get("profileImage") or ""
    if old_avatar and "/uploads/profile-images/" in old_avatar:
        old_filename = old_avatar.split("/uploads/profile-images/")[-1].split("?")[0].strip()
        old_safe_filename = os.path.basename(old_filename)
        if old_safe_filename:
            old_filepath = os.path.join(PROFILE_IMAGES_DIR, old_safe_filename)
            if os.path.exists(old_filepath) and os.path.isfile(old_filepath):
                try:
                    os.remove(old_filepath)
                except Exception as err:
                    print(f"Warning: Failed to delete avatar file {old_filepath}: {err}")

    current_profile["avatar"] = ""
    current_profile["avatarOriginalFilename"] = ""
    if "profileImage" in current_profile:
        current_profile["profileImage"] = ""
    save_profile_for_user_db(email, current_profile)

    return {
        "status": "success",
        "message": "Profile picture removed successfully",
        "avatar": "",
        "imageUrl": "",
        "originalFilename": ""
    }

@app.post("/api/profile")
def save_profile_endpoint(
    payload: ProfilePayload,
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = payload.user_email or user_email or x_user_email or ""
    if not email:
        raise HTTPException(status_code=400, detail="User email is required")

    if isinstance(payload.profile, dict):
        if str(payload.profile.get("avatar") or "").startswith("data:image/"):
            payload.profile["avatar"] = ""
        if str(payload.profile.get("profileImage") or "").startswith("data:image/"):
            payload.profile["profileImage"] = ""
    return save_profile_for_user_db(email, payload.profile)

@app.get("/api/reminders")
def get_reminders_endpoint(
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = user_email or x_user_email or "debalina@example.com"
    return get_reminders_for_user_db(email)

@app.post("/api/reminders")
def sync_reminders_endpoint(
    payload: RemindersPayload,
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = payload.user_email or user_email or x_user_email or ""
    if not email:
        raise HTTPException(status_code=400, detail="User email is required")
    return sync_reminders_for_user_db(email, payload.reminders)

class SavedJobPayload(BaseModel):
    job_id: int
    user_email: Optional[str] = None

class JobCreatePayload(BaseModel):
    company: str
    role: str
    company_domain: Optional[str] = None
    logo: Optional[str] = None
    location: Optional[str] = "Remote"
    work_mode: Optional[str] = "Remote"
    salary: Optional[str] = ""
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    posted_date: Optional[str] = "Today"
    match_score: Optional[int] = 90
    tags: Optional[list] = []
    skills: Optional[list] = []
    department: Optional[str] = ""
    description: Optional[str] = ""
    responsibilities: Optional[list] = []
    requirements: Optional[list] = []
    benefits: Optional[list] = []
    application_url: Optional[str] = ""

class JobUpdatePayload(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    company_domain: Optional[str] = None
    logo: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    salary: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[list] = None
    skills: Optional[list] = None
    application_url: Optional[str] = None

class ApplicationCreatePayload(BaseModel):
    user_email: Optional[str] = None
    job_id: Optional[int] = None
    company: str
    role: str
    company_domain: Optional[str] = None
    logo: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    status: Optional[str] = "Applied"
    applied_date: Optional[str] = None
    salary: Optional[str] = None
    stage: Optional[str] = "Application Submitted"
    notes: Optional[str] = "Applied from Explore Opportunities"
    source: Optional[str] = "Company Career Portals"

@app.get("/api/jobs")
def get_jobs_endpoint(
    search: Optional[str] = Query(None),
    work_mode: Optional[str] = Query(None),
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = user_email or x_user_email or "debalina@example.com"
    return get_jobs_list(search=search, work_mode=work_mode, user_email=email)

@app.get("/api/jobs/{job_id}")
def get_single_job_endpoint(
    job_id: int,
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = user_email or x_user_email or "debalina@example.com"
    job = get_job_by_id(job_id, email)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.post("/api/jobs")
def create_job_endpoint(
    payload: JobCreatePayload,
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = user_email or x_user_email or ""
    try:
        return add_job_record(email, payload.dict())
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@app.put("/api/jobs/{job_id}")
def update_job_endpoint(
    job_id: int,
    payload: JobUpdatePayload,
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = user_email or x_user_email or ""
    try:
        return update_job_record(email, job_id, payload.dict(exclude_unset=True))
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

@app.delete("/api/jobs/{job_id}")
def delete_job_endpoint(
    job_id: int,
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = user_email or x_user_email or ""
    try:
        return delete_job_record(email, job_id)
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

@app.get("/api/saved-jobs")
def get_saved_jobs_endpoint(
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = user_email or x_user_email or "debalina@example.com"
    return get_saved_jobs_for_user(email)

@app.post("/api/saved-jobs")
def save_job_endpoint(
    payload: SavedJobPayload,
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = payload.user_email or user_email or x_user_email or "debalina@example.com"
    try:
        return add_saved_job_for_user(email, payload.job_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

@app.delete("/api/saved-jobs/{job_id}")
def unsave_job_endpoint(
    job_id: int,
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = user_email or x_user_email or "debalina@example.com"
    try:
        return remove_saved_job_for_user(email, job_id)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@app.get("/api/applications")
def get_applications_endpoint(
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = user_email or x_user_email or "debalina@example.com"
    return get_applications_for_user(email)

@app.post("/api/applications")
def create_application_endpoint(
    payload: ApplicationCreatePayload,
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None)
):
    email = payload.user_email or user_email or x_user_email or "debalina@example.com"
    try:
        return create_application_for_user(email, payload.dict())
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@app.get("/api/companies/search")
def search_available_companies_endpoint(
    q: Optional[str] = Query(None),
    query: Optional[str] = Query(None)
):
    search_str = q or query or ""
    return search_available_companies(search_str)

@app.get("/api/companies")
def get_all_available_companies_endpoint():
    return search_available_companies("")

@app.get("/api/search")
def global_search_endpoint(
    q: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    user_email: Optional[str] = Query(None),
    request: Request = None
):
    search_str = q or query or ""
    email = user_email or (request.headers.get("x-user-email") if request else None) or ""
    return global_search_hirehub(email, search_str)

class ChatPayload(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = None
    user_email: Optional[str] = None

@app.post("/api/chat")
async def chat_endpoint(
    payload: ChatPayload,
    request: Request,
    user_email: Optional[str] = Query(None),
    x_user_email: Optional[str] = Header(None),
    x_simulate_api_error: Optional[str] = Header(None)
):
    clean_message = (payload.message or "").strip()
    if not clean_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    email = (
        payload.user_email
        or user_email
        or x_user_email
        or (request.headers.get("x-user-email") if request else None)
        or "debalina@example.com"
    ).strip().lower()

    simulate_error = (
        x_simulate_api_error == "true"
        or (request.headers.get("x-simulate-api-error") == "true" if request else False)
        or (request.query_params.get("simulate_error") == "true" if request else False)
    )

    result = await process_chat_message(
        message=clean_message,
        history=payload.history or [],
        user_email=email,
        simulate_error=simulate_error
    )

    return result
