# HealthSaathi AI - Intelligent Personal Health Companion 🩺🤖

HealthSaathi AI is a comprehensive, responsive health companion platform built with **React 19**, **Python FastAPI**, **Google Gemini AI**, and **Supabase Auth**.

---

## 🌟 Key Features

1. **AI Health Chatbot (Google Gemini)**: Server-side integration with clinical triage heuristics, emergency red-flag alerts, multilingual conversational responses, and offline fallback.
2. **Supabase Authentication**: Secure Sign-In, Sign-Up, and session handling with fallback Demo Guest mode.
3. **Interactive Symptom Checker**: Multi-step symptom assessment flow evaluating body systems, duration, severity, and red flags, producing actionable guidance and visit prep questions.
4. **Health History & Vitals Log**: Historical record timeline of vitals and symptom assessments with single and bulk record deletion, backed by Row Level Security (RLS) SQL policies.
5. **Doctor Appointments**: Consultation scheduling with verified medical specialists (Internal Medicine, Cardiology, Neurology, Endocrinology), date/slot selection, status management, and cancellation.
6. **In-App Notifications**: Real-time alert center for appointments, vitals milestones, and medication schedules.
7. **Multilingual Support**: Real-time language switching between **English (EN)**, **Telugu (తెలుగు)**, and **Hindi (हिन्दी)** with persistent local storage.
8. **Modern Glassmorphic UI**: High-contrast, accessible dark theme with animated ECG pulse lines, responsive mobile/desktop layouts, and form validations.

---

## 📁 Project Architecture & File Structure

```text
HealthCare/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Package marker
│   │   ├── config.py             # Environment configuration (Gemini, Supabase, CORS)
│   │   ├── database.py           # SQLite engine & database session dependency
│   │   ├── models.py             # SQLAlchemy models (VitalsRecord, ChatMessage, Appointments, History)
│   │   ├── schemas.py            # Pydantic validation schemas with language support
│   │   └── main.py               # FastAPI application with Gemini API endpoint & triage
│   ├── .env                      # Local server secrets (Keep private!)
│   ├── .env.example              # Template with safe configuration documentation
│   ├── requirements.txt          # Python dependencies
│   ├── supabase_schema.sql       # Supabase SQL migration script with Row Level Security (RLS)
│   └── healthsaathi.db           # Local SQLite database file (auto-generated)
│
├── frontend/
│   ├── index.html                # HealthSaathi AI title, SEO, and fonts
│   ├── package.json              # React 19, Vite, Lucide-React, and Supabase client
│   ├── vite.config.js            # Vite configuration
│   ├── .env.example              # Frontend template with Supabase client keys
│   └── src/
│       ├── main.jsx              # Application mount point
│       ├── App.jsx               # Main SPA coordinator, multilingual & notification state
│       ├── index.css             # Glassmorphism medical aesthetic design system
│       ├── utils/
│       │   └── translations.js   # Localization dictionary (English, Telugu, Hindi)
│       ├── services/
│       │   ├── api.js            # FastAPI client for vitals and Gemini chat
│       │   └── supabase.js       # Supabase auth client with demo guest fallback
│       └── components/
│           ├── Navbar.jsx               # Brand header, navigation tabs, language switcher, notif bell, auth chip
│           ├── HealthStatusBanner.jsx   # Wellness score (94/100) & AI daily insight
│           ├── VitalsGrid.jsx           # Animated ECG & biomarker monitoring cards
│           ├── CopilotChat.jsx          # Interactive AI triage assistant with Gemini & emergency flags
│           ├── SymptomChecker.jsx       # Multi-step clinical questionnaire with next steps
│           ├── AppointmentsManager.jsx  # Doctor booking, date/time slot picker, and cancellation
│           ├── HealthHistory.jsx        # Historical records with single & bulk deletion
│           ├── MedicationTracker.jsx    # Daily prescription & supplement checklist
│           ├── LogVitalsModal.jsx       # Modal to log new vitals into SQLite in real-time
│           ├── NotificationCenter.jsx   # In-app notification drawer with badges
│           └── AuthModal.jsx            # Sign In / Sign Up modal with Demo Guest mode
│
└── README.md                     # Complete project documentation
```

---

## ⚡ Quick Start on Windows

### 1. Start the FastAPI Backend
Open **PowerShell Window #1**:
```powershell
# Navigate into backend directory
cd "c:\Users\pitta dhanashree\HealthCare\backend"

# (Optional) If you have a virtual environment:
# .\venv\Scripts\Activate.ps1

# Install required Python packages:
python -m pip install -r requirements.txt

# Start the FastAPI server on port 8001:
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```
- **Backend URL:** [http://127.0.0.1:8001](http://127.0.0.1:8001)
- **Interactive Swagger Docs:** [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)
- **Health Check Endpoint:** [http://127.0.0.1:8001/api/health](http://127.0.0.1:8001/api/health)

---

### 2. Start the React Frontend
Open **PowerShell Window #2**:
```powershell
# Navigate into frontend directory
cd "c:\Users\pitta dhanashree\HealthCare\frontend"

# Start Vite dev server:
npm run dev
```
- **Web App Dashboard:** [http://localhost:5173](http://localhost:5173)

---

## 🛡️ External Setup & Security

### 1. Google Gemini API Key
To connect the live Gemini LLM:
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open [`backend/.env`](file:///c:/Users/pitta%20dhanashree/HealthCare/backend/.env) and set:
   ```env
   AI_API_KEY=your_actual_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```
3. *Note:* The API key remains strictly on the server and is never exposed in frontend code or client bundles. If omitted, the app automatically runs its built-in clinical triage heuristic.

### 2. Supabase Auth & Cloud Database
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in the Supabase Dashboard, create a new query, paste the contents of [`backend/supabase_schema.sql`](file:///c:/Users/pitta%20dhanashree/HealthCare/backend/supabase_schema.sql), and run it. This creates the tables and sets Row Level Security (RLS) policies.
3. In [`frontend/.env`](file:///c:/Users/pitta%20dhanashree/HealthCare/frontend/.env), add your project details:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
   ```
4. *Demo Mode:* If Supabase keys are not yet configured, the app seamlessly provides a **Continue as Demo Guest** mode so you can test all features immediately.

---

## 🧪 Validating the Build

To test the frontend production build:
```powershell
cd "c:\Users\pitta dhanashree\HealthCare\frontend"
npm run build
```
Builds cleanly in <1 second with zero bundling errors.
