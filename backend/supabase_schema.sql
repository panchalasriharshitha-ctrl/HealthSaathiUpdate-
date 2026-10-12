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

-- 4. Lab Reports Table (With Strict Row Level Security)
CREATE TABLE IF NOT EXISTS public.lab_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    laboratory_name VARCHAR(255),
    report_date DATE,
    test_category VARCHAR(150),
    report_data JSONB NOT NULL,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lab reports" 
    ON public.lab_reports FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lab reports" 
    ON public.lab_reports FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lab reports" 
    ON public.lab_reports FOR DELETE 
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lab_reports_user ON public.lab_reports(user_id);

-- 5. Prescriptions Table (With Strict Row Level Security)
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(200),
    clinic_or_hospital VARCHAR(255),
    prescription_date DATE,
    medicines JSONB NOT NULL,
    doctor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prescriptions" 
    ON public.prescriptions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prescriptions" 
    ON public.prescriptions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prescriptions" 
    ON public.prescriptions FOR DELETE 
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_prescriptions_user ON public.prescriptions(user_id);
