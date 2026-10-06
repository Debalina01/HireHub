# HireHub

HireHub is a full-stack job application tracker and career management platform. It helps job seekers organize applications across recruitment stages, manage their professional profile, monitor key application metrics, schedule reminders, and interact with an integrated AI career assistant.

---

## Features

- **Application Tracker**: Organize job applications through stages (Saved, Applied, Interview, Offer, Rejected) with search and filtering.
- **Profile & Resume Management**: Store user profile details, contact information, skills, experience, education, and upload profile pictures.
- **Analytics & Insights**: View application success rates, status distributions, and response timelines.
- **AI Career Assistant**: Built-in AI assistant powered by Google Gemini, OpenAI, or Groq for interview preparation, resume advice, and job hunt strategy.
- **Reminders & Deadlines**: Track interview dates, application follow-ups, and upcoming milestones.
- **Company Logo Resolution**: Automatic company logo fetching via Logo.dev.
- **Automated Database Setup**: SQLite database with schema initialization and default seed data on first run.

---

## Tech Stack

- **Frontend**: React 18, Vite 5, JavaScript (ES Modules), Vanilla CSS
- **Backend**: FastAPI, Uvicorn, HTTPX (async API clients), python-multipart
- **Database**: SQLite (managed with raw SQL in `backend/database.py`)
- **AI Providers**: Google Gemini (`gemini-1.5-flash`), OpenAI (`gpt-4o-mini`), Groq (`llama-3.1-8b-instant`)

---

## Project Structure

```text
HireHub/
├── backend/
│   ├── ai_service.py            # AI assistant integration (Gemini, OpenAI, Groq)
│   ├── database.py              # SQLite schema, queries, and seed data initialization
│   ├── main.py                  # FastAPI application routes and endpoints
│   ├── requirements.txt         # Backend Python dependencies
│   └── uploads/
│       └── profile-images/      # Uploaded user profile pictures (ignored in git)
│           └── .gitkeep
├── frontend/
│   ├── public/                  # Static assets
│   ├── src/                     # React components, pages, state storage, utils
│   ├── index.html               # Frontend HTML entry point
│   ├── package.json             # Frontend dependencies and scripts
│   ├── package-lock.json
│   └── vite.config.js           # Vite configuration with backend API proxy
├── .env.example                 # Environment variable template
├── .gitignore                   # Git ignore rules for dependencies, secrets, uploads, DB
├── Procfile                     # Deployment process command for PaaS platforms
├── requirements.txt             # Root requirements for platform buildpacks
└── README.md                    # Project documentation
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.10 or higher
- **pip**

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/hirehub.git
cd hirehub
```

---

### 2. Configure Environment Variables

Copy the example environment configuration to create your local `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your API credentials:

```env
# Logo.dev API Keys
VITE_LOGODEV_PUBLISHABLE_KEY=pk_your_publishable_key
LOGO_DEV_SECRET_KEY=sk_your_secret_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

# OpenAI API (Optional / Alternative AI provider)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1

# Groq API (Optional / Alternative AI provider)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
```

---

### 3. Backend Setup

1. (Optional but recommended) Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Run the FastAPI backend server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

The backend server will run at `http://127.0.0.1:8000`. On startup, it automatically creates and initializes the SQLite database (`backend/hirehub.db`) with initial seed data.

FastAPI interactive documentation is available at `http://127.0.0.1:8000/docs`.

---

### 4. Frontend Setup

1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

The frontend will run at `http://localhost:5173`. Vite's dev server is preconfigured to proxy `/api/*` requests directly to `http://127.0.0.1:8000`.

---

## Building for Production

To create an optimized production build of the frontend:

```bash
cd frontend
npm run build
```

The compiled output will be generated in `frontend/dist/`.

---

## Deployment Considerations

When deploying HireHub to cloud platforms (such as Render, Railway, Fly.io, Heroku, or VPS):

1. **Persistent Storage for SQLite & Uploads**:
   - The backend uses a local SQLite database (`backend/hirehub.db`) and saves uploaded profile images to `backend/uploads/profile-images/`.
   - On containerized or serverless hosting platforms with ephemeral filesystems (e.g., standard Render/Heroku dynos), files written to the local disk are reset when the service restarts.
   - **Recommended for production**: Attach a persistent disk volume to the backend service container, or migrate storage to a managed database (e.g., PostgreSQL/MySQL) and an object storage bucket (e.g., AWS S3, Cloudflare R2) for uploaded images.

2. **CORS & API Base URL**:
   - In local development, Vite proxies `/api` to the backend.
   - In production, ensure the frontend points to the deployed backend URL or configure a reverse proxy (e.g., Nginx, Caddy, or platform routing rules) to forward `/api` requests to the FastAPI service.
   - Ensure the backend's CORS configuration in `backend/main.py` permits requests from your production frontend domain.

3. **Environment Variables**:
   - Set all required environment variables in your deployment platform's dashboard settings (`GEMINI_API_KEY`, `LOGO_DEV_SECRET_KEY`, `VITE_LOGODEV_PUBLISHABLE_KEY`, etc.). Never commit `.env` files to git.
