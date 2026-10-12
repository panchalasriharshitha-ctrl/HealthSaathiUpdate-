-- ============================================================================
-- HealthSaathi AI - Supabase Database Schema with Row Level Security (RLS)
-- Run this script in your Supabase Project: SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Health Records Table (Vitals & Symptom Checks)
CREATE TABLE IF NOT EXISTS public.health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    record_type VARCHAR(50) NOT NULL DEFAULT 'vitals', -- 'vitals' or 'symptom_check'
    title VARCHAR(255),
    heart_rate INTEGER,
    blood_pressure_sys INTEGER,
    blood_pressure_dia INTEGER,
    blood_glucose NUMERIC(5,2),
    oxygen_level INTEGER,
    sleep_hours NUMERIC(4,2),
    summary TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on health_records
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

-- Policies for health_records: users can ONLY access and modify their own records
CREATE POLICY "Users can view own health records" 
    ON public.health_records FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health records" 
    ON public.health_records FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health records" 
    ON public.health_records FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health records" 
    ON public.health_records FOR DELETE 
    USING (auth.uid() = user_id);


-- 3. Doctor Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    doctor_name VARCHAR(150) NOT NULL,
    specialty VARCHAR(150) NOT NULL,
    hospital VARCHAR(200),
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL,
    consultation_mode VARCHAR(50) NOT NULL DEFAULT 'In-Person Clinic',
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Upcoming', -- 'Upcoming', 'Completed', 'Cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policies for appointments
CREATE POLICY "Users can view own appointments" 
    ON public.appointments FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments" 
    ON public.appointments FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments" 
    ON public.appointments FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments" 
    ON public.appointments FOR DELETE 
    USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_health_records_user ON public.health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.appointments(user_id);
