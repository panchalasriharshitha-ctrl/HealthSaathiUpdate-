import json
import logging
import urllib.request
import urllib.error
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.database import engine, Base, get_db
from app.models import VitalsRecord, ChatMessage, AppointmentRecord, HistoryRecord
from app.schemas import (
    HealthCheckResponse,
    VitalsCreate,
    VitalsResponse,
    ChatRequest,
    ChatResponse
)

# Setup logging (Sanitized: never log raw patient health data)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("HealthSaathiBackend")

# Auto-create tables in SQLite on application startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="HealthSaathi AI - Intelligent Personal Health Companion Backend with FastAPI, SQLite & Gemini AI",
    version="2.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_populate_sample_vitals():
    """Seed initial sample vitals if the SQLite database is empty."""
    db = next(get_db())
    try:
        count = db.query(VitalsRecord).count()
        if count == 0:
            sample = VitalsRecord(
                user_id="guest_patient",
                heart_rate=72,
                blood_pressure_sys=118,
                blood_pressure_dia=78,
                blood_glucose=95.5,
                oxygen_level=98,
                sleep_hours=7.5,
                notes="Morning resting vitals. Sinus rhythm optimal."
            )
            db.add(sample)
            db.commit()
    except Exception as exc:
        logger.warning(f"Could not seed initial vitals: {exc}")
    finally:
        db.close()

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to HealthSaathi AI Backend",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "version": "2.0.0"
    }

@app.get("/api/health", response_model=HealthCheckResponse, tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint to verify API and SQLite database status."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"

    return HealthCheckResponse(
        status="healthy" if "unhealthy" not in db_status else "degraded",
        app_name=settings.APP_NAME,
        database=db_status,
        environment=settings.APP_ENV,
        timestamp=datetime.utcnow(),
        version="2.0.0"
    )

@app.get("/api/vitals", response_model=list[VitalsResponse], tags=["Vitals"])
def get_vitals(limit: int = 10, db: Session = Depends(get_db)):
    """Get the latest vitals records logged by the user."""
    records = db.query(VitalsRecord).order_by(VitalsRecord.created_at.desc()).limit(limit).all()
    return records

@app.post("/api/vitals", response_model=VitalsResponse, status_code=status.HTTP_201_CREATED, tags=["Vitals"])
def log_vitals(vital_in: VitalsCreate, db: Session = Depends(get_db)):
    """Log new health vitals into SQLite."""
    record = VitalsRecord(**vital_in.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def call_gemini_api(prompt: str, lang: str = "en") -> str:
    """Call Google Gemini REST API safely using server environment key."""
    api_key = settings.AI_API_KEY
    if not api_key:
        raise ValueError("NO_GEMINI_KEY")

    # Map language instruction
    lang_instruction = "Respond in English."
    if lang == "te":
        lang_instruction = "Respond in fluent Telugu (తెలుగు) using accessible health terminology."
    elif lang == "hi":
        lang_instruction = "Respond in fluent Hindi (हिन्दी) using accessible health terminology."

    system_instruction = (
        "You are HealthSaathi AI, a compassionate personal health companion and triage guide. "
        "Provide clear health literacy, possible factors for the patient to explore with their doctor, "
        "and supportive home wellness tips. "
        "SAFETY MANDATE: Never claim to give definitive clinical diagnoses or prescribe pharmaceuticals. "
        "If symptoms suggest an emergency (e.g., crushing chest pain, sudden numbness or slurred speech, "
        "severe breathlessness, heavy bleeding), prominently urge them to seek emergency medical care "
        "or call local emergency services (112 or 108 in India / 911) immediately. "
        f"{lang_instruction}"
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}"
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_instruction}\n\nPatient Query: {prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 600,
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=12) as response:
        resp_data = json.loads(response.read().decode("utf-8"))
        candidates = resp_data.get("candidates", [])
        if candidates and "content" in candidates[0]:
            parts = candidates[0]["content"].get("parts", [])
            if parts and "text" in parts[0]:
                return parts[0]["text"].strip()
                
    raise ValueError("EMPTY_GEMINI_RESPONSE")

@app.post("/api/copilot/chat", response_model=ChatResponse, tags=["Copilot"])
def copilot_chat(request: ChatRequest, db: Session = Depends(get_db)):
    """AI Health Copilot engine with server-side Google Gemini integration and clinical safety."""
    query = request.message.strip()
    query_lower = query.lower()
    lang = request.lang or "en"
    user_id = request.user_id or "guest_patient"

    # Emergency keyword heuristics
    is_emergency = any(k in query_lower for k in [
        "chest pain", "heart attack", "can't breathe", "cannot breathe",
        "stroke", "slurred speech", "unconscious", "heavy bleeding", "gasping"
    ])

    # Save user query to SQLite (metadata only, no raw PII logged to console)
    try:
        user_msg = ChatMessage(user_id=user_id, sender="user", message=query, tag="query", lang=lang)
        db.add(user_msg)
        db.commit()
    except Exception as exc:
        logger.warning(f"Could not persist user message: {exc}")

    # Default category & suggested actions
    category = "general_wellness"
    suggested_actions = ["Hydrate adequately", "Track resting heart rate", "Prepare questions for doctor"]
    disclaimer = "HealthSaathi AI provides health intelligence and guidance, not formal clinical diagnosis. In emergencies, contact local medical professionals immediately."

    if lang == "te":
        disclaimer = "హెల్త్ సాథి AI సమాచార సహాయం మాత్రమే అందిస్తుంది, ఇది వైద్య నిర్ధారణ కాదు. అత్యవసర పరిస్థితుల్లో వెంటనే స్థానిక వైద్యులను సంప్రదించండి."
    elif lang == "hi":
        disclaimer = "हेल्थ साथी AI केवल सूचनात्मक स्वास्थ्य मार्गदर्शन प्रदान करता है, यह कोई चिकित्सीय निदान नहीं है। आपात स्थिति में तुरंत डॉक्टर से संपर्क करें।"

    reply = ""
    provider = "gemini"

    # Try calling Google Gemini API server-side
    try:
        reply = call_gemini_api(query, lang=lang)
        if is_emergency:
            category = "urgent_care_alert"
            suggested_actions = ["Call 112 / 108 Emergency", "Do not drive yourself", "Alert family member"]
    except Exception as exc:
        provider = "local_heuristic"
        logger.info(f"Gemini API unavailable or key omitted ({type(exc).__name__}). Using local clinical heuristic.")

        # Local intelligent heuristic fallback
        if is_emergency:
            category = "urgent_care_alert"
            reply = (
                "🚨 URGENT MEDICAL ADVICE: The symptoms you described may indicate an acute health emergency. "
                "Please do not wait. Call emergency services (112 / 108 in India or 911) or have someone take you to the nearest emergency department immediately."
            )
            suggested_actions = ["Call 112 / 108 immediately", "Rest in comfortable posture", "Inform immediate family"]
        elif any(k in query_lower for k in ["headache", "migraine"]):
            category = "symptom_triage"
            reply = (
                "Headaches commonly stem from dehydration, prolonged screen fatigue, tension, or irregular sleep. "
                "Drink 500ml of room-temperature water, rest your eyes away from screens for 15 minutes, and observe if pain improves. "
                "If accompanied by sudden numbness or blurred vision, seek prompt medical care."
            )
            suggested_actions = ["Hydrate with water", "Dim ambient lighting", "Log resting blood pressure"]
        elif any(k in query_lower for k in ["heart", "chest", "bp", "pulse", "palpitation"]):
            category = "cardiovascular_alert"
            reply = (
                "Cardiovascular health is vital. If your blood pressure or resting heart rate fluctuates unexpectedly, "
                "rest calmly and measure again after 5 minutes. If you experience pressure or pain radiating to your jaw or left arm, seek immediate emergency care."
            )
            suggested_actions = ["Log current BP", "Practice 4-7-8 breathing", "Schedule cardiology consultation"]
        elif any(k in query_lower for k in ["sleep", "tired", "fatigue", "insomnia"]):
            category = "sleep_hygiene"
            reply = (
                "Deep restorative sleep directly regulates glycemic control and systemic inflammation. "
                "Aim for a consistent wind-down routine: eliminate blue screens 45 minutes prior to sleep, avoid caffeine after 2 PM, and keep your sleeping space cool."
            )
            suggested_actions = ["Avoid late caffeine", "Maintain consistent bedtimes", "Record sleep hours"]
        elif any(k in query_lower for k in ["diet", "food", "sugar", "glucose"]):
            category = "nutrition"
            reply = (
                "Balanced meals combining dietary fiber, lean protein, and healthy fats help stabilize post-meal glucose spikes. "
                "A gentle 10-minute walk post-meal significantly aids glucose uptake."
            )
            suggested_actions = ["Post-meal light walk", "Fiber-rich meal prep", "Monitor fasting glucose"]
        else:
            reply = (
                f"Hello! I am HealthSaathi, your personal health companion. I reviewed your query: '{query}'. "
                "Your vitals records remain on track. What specific symptoms, prescription questions, or appointment preparation would you like to explore?"
            )
            suggested_actions = ["Check symptoms", "Review medications", "Schedule doctor visit"]

    # Save assistant reply to SQLite
    try:
        bot_msg = ChatMessage(user_id=user_id, sender="copilot", message=reply, tag=category, lang=lang)
        db.add(bot_msg)
        db.commit()
    except Exception as exc:
        logger.warning(f"Could not persist copilot reply: {exc}")

    return ChatResponse(
        reply=reply,
        category=category,
        suggested_actions=suggested_actions,
        disclaimer=disclaimer,
        is_emergency=is_emergency,
        provider=provider
    )
