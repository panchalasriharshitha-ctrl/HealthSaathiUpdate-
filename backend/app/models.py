from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, Text, Boolean
from app.database import Base

class VitalsRecord(Base):
    __tablename__ = "vitals_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=True, default="guest_patient")
    heart_rate = Column(Integer, nullable=True) # bpm
    blood_pressure_sys = Column(Integer, nullable=True) # mmHg
    blood_pressure_dia = Column(Integer, nullable=True) # mmHg
    blood_glucose = Column(Float, nullable=True) # mg/dL
    oxygen_level = Column(Integer, nullable=True) # %
    sleep_hours = Column(Float, nullable=True)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=True, default="guest_patient")
    sender = Column(String(50), nullable=False) # 'user' or 'copilot'
    message = Column(Text, nullable=False)
    tag = Column(String(50), nullable=True)
    lang = Column(String(10), nullable=True, default="en")
    created_at = Column(DateTime, default=datetime.utcnow)

class AppointmentRecord(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=True, default="guest_patient")
    doctor = Column(String(150), nullable=False)
    specialty = Column(String(150), nullable=False)
    hospital = Column(String(200), nullable=True)
    date = Column(String(50), nullable=False)
    time = Column(String(50), nullable=False)
    mode = Column(String(50), default="In-Person Clinic")
    reason = Column(String(255), nullable=True)
    status = Column(String(50), default="Upcoming") # 'Upcoming', 'Completed', 'Cancelled'
    created_at = Column(DateTime, default=datetime.utcnow)

class HistoryRecord(Base):
    __tablename__ = "history_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=True, default="guest_patient")
    type = Column(String(50), nullable=False) # 'vitals' or 'symptom_check'
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    urgency = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
