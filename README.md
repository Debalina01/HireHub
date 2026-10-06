# 🚀 HireHub

### Your all-in-one job search & career management platform

**HireHub** helps job seekers manage their entire job search in one place — from applications and interviews to follow-ups, reminders, analytics, and AI-powered career assistance.

## 🌐 Live Demo

👉 **[Open HireHub](https://hire-hub-drab.vercel.app/)**

**Frontend:** Vercel
**Backend:** Render
**Repository:** GitHub



## ✨ Features

### 📋 Application Tracker

* Track applications across **Saved, Applied, Interview, Offer, and Rejected**
* Search and filter applications
* Manage application details and statuses

### 👤 Profile & Resume Management

* Manage personal and professional information
* Add skills, experience, and education
* Upload a profile picture

### 📊 Analytics & Insights

* Application statistics
* Success and conversion rates
* Status distribution
* Response timeline insights

### 🤖 AI Career Assistant

Get AI-powered help for:

* Interview preparation
* Resume improvement
* Job search strategies
* Career-related questions

Supports **Google Gemini, OpenAI, and Groq**.

### ⏰ Reminders & Follow-ups

* Track interview dates
* Set application follow-ups
* Manage important deadlines

### 🏢 Company Logos

Automatically resolves company logos using **Logo.dev**.


## 🛠️ Tech Stack

| Layer            | Technologies                      |
| ---------------- | --------------------------------- |
| Frontend         | React 18, Vite 5, JavaScript, CSS |
| Backend          | FastAPI, Uvicorn, HTTPX           |
| Database         | SQLite                            |
| AI               | Google Gemini, OpenAI, Groq       |
| Frontend Hosting | Vercel                            |
| Backend Hosting  | Render                            |



## 📁 Project Structure


HireHub/
├── backend/
│   ├── ai_service.py
│   ├── database.py
│   ├── main.py
│   ├── requirements.txt
│   └── uploads/
│       └── profile-images/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── .env.example
├── .gitignore
├── Procfile
├── requirements.txt
└── README.md




## ⚡ Run Locally

### 1. Clone the repository


git clone https://github.com/Debalina01/HireHub.git
cd HireHub


### 2. Backend Setup


python -m venv venv


**Windows:**


venv\Scripts\activate

Install dependencies:


pip install -r backend/requirements.txt


Start the backend:


uvicorn backend.main:app --reload --port 8000

Backend API:


http://127.0.0.1:8000


API documentation:


http://127.0.0.1:8000/docs


### 3. Frontend Setup

Open another terminal:


cd frontend
npm install
npm run dev


Frontend:


http://localhost:5173



## 🔐 Environment Variables

Create a .env file using .env.example and add your own API credentials.


VITE_LOGODEV_PUBLISHABLE_KEY=your_key
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-1.5-flash

OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1

GROQ_API_KEY=your_key
GROQ_MODEL=llama-3.1-8b-instant

> ⚠️ Never commit .env or API keys to GitHub.



## 🚀 Deployment

HireHub is deployed as a full-stack application:

**Frontend → Vercel**
**Backend → Render**

### 🔗 Try the Live Application

👉 **https://hire-hub-drab.vercel.app/**



## 🗄️ Database Note

HireHub currently uses **SQLite**.

For production-scale usage, persistent database storage such as **PostgreSQL** is recommended because some cloud hosting environments use ephemeral filesystems.



## 🎯 Project Goal

HireHub was built to make job searching more organized and less stressful by bringing **applications, interviews, reminders, analytics, profiles, and AI career assistance** together in one platform.



## 👩‍💻 Author

**Debalina Roy**

Built with ❤️ using React, FastAPI, and modern web technologies.

### ⭐ If you find HireHub useful, consider giving the repository a star!
