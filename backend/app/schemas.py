from datetime import datetime
from typing import Optional
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

class VitalsCreate(BaseModel):
    heart_rate: Optional[int] = Field(None, ge=30, le=240, description="Heart rate in bpm")
    blood_pressure_sys: Optional[int] = Field(None, ge=60, le=250, description="Systolic mmHg")
    blood_pressure_dia: Optional[int] = Field(None, ge=40, le=150, description="Diastolic mmHg")
    blood_glucose: Optional[float] = Field(None, ge=30.0, le=500.0, description="mg/dL")
    oxygen_level: Optional[int] = Field(None, ge=50, le=100, description="SpO2 percentage")
    sleep_hours: Optional[float] = Field(None, ge=0.0, le=24.0, description="Hours of sleep")
    notes: Optional[str] = Field(None, max_length=255)

class VitalsResponse(VitalsCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class HealthCheckResponse(BaseModel):
    status: str
    app_name: str
    database: str
    environment: str
    timestamp: datetime
    version: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User question or health symptom")
    lang: Optional[str] = Field("en", description="Language code: en, te, hi")
    user_id: Optional[str] = Field(None, description="Optional user identification")

class ChatResponse(BaseModel):
    reply: str
    category: str
    suggested_actions: list[str]
    disclaimer: str
    is_emergency: bool = False
    provider: str = "gemini"

