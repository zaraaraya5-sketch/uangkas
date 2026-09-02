import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys for persistent Supabase connection if user sets it in Settings
const SUPABASE_URL_KEY = 'kaskelas_supabase_url';
const SUPABASE_ANON_KEY = 'kaskelas_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = localStorage.getItem(SUPABASE_URL_KEY) || import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = localStorage.getItem(SUPABASE_ANON_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return {
    url,
    anonKey,
    isConnected: Boolean(url && anonKey),
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (url && anonKey) {
    localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(SUPABASE_URL_KEY);
    localStorage.removeItem(SUPABASE_ANON_KEY);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConnected) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

// SQL Schema script for Supabase DB setup
export const SUPABASE_SQL_SCHEMA = `-- ===================================================
-- DATABASE SCHEMA KASKELAS XI PPLG 3 (SUPABASE POSTGRES)
-- ===================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nis VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    class VARCHAR(50) DEFAULT 'XI PPLG 3',
    gender VARCHAR(5) CHECK (gender IN ('L', 'P')),
    phone VARCHAR(20),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('Tunai', 'Transfer', 'QRIS')),
    payment_date DATE NOT NULL,
    week_number INT DEFAULT 1,
    description TEXT,
    created_by VARCHAR(100) DEFAULT 'Bendahara',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT,
    receipt_url TEXT,
    created_by VARCHAR(100) DEFAULT 'Bendahara',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Class Settings Table
CREATE TABLE IF NOT EXISTS public.class_settings (
    id INT PRIMARY KEY DEFAULT 1,
    class_name VARCHAR(50) DEFAULT 'XI PPLG 3',
    academic_year VARCHAR(20) DEFAULT '2025/2026',
    target_per_student NUMERIC(12, 2) DEFAULT 60000,
    monthly_fee NUMERIC(12, 2) DEFAULT 5000,
    total_months INT DEFAULT 12,
    homeroom_teacher VARCHAR(100) DEFAULT 'Firman Sidik, S.Pd',
    class_president VARCHAR(100) DEFAULT 'Muhammad Rajib Zahir',
    treasurer_1 VARCHAR(100) DEFAULT 'Lulu Maulida (Bendahara 1)',
    treasurer_2 VARCHAR(100) DEFAULT 'Habib Ramadhan (Bendahara 2)',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Realtime on all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_settings;
`;
