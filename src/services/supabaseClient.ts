import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Student, Payment, Expense, ClassSettings } from '../types';

// Configuration keys for persistent Supabase connection if user sets it in Settings
const SUPABASE_URL_KEY = 'kaskelas_supabase_url';
const SUPABASE_ANON_KEY = 'kaskelas_supabase_anon_key';

const DEFAULT_SUPABASE_URL = 'https://uuixswhjwgaoyhdafqwn.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aXhzd2hqd2dhb3loZGFmcXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMjI2OTMsImV4cCI6MjEwMzg5ODY5M30.VIleyECK42P6W3s7CekksFfZgjlgepnwRSpURf1xlq4';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export function cleanSupabaseUrl(rawUrl: string): string {
  let cleaned = (rawUrl || '').trim();
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

export function getSupabaseConfig(): SupabaseConfig {
  let url = '';
  let anonKey = '';
  try {
    url = localStorage.getItem(SUPABASE_URL_KEY) || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    anonKey = localStorage.getItem(SUPABASE_ANON_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  } catch {
    url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  }

  const cleanedUrl = cleanSupabaseUrl(url);
  const cleanedKey = (anonKey || '').trim();

  return {
    url: cleanedUrl,
    anonKey: cleanedKey,
    isConnected: Boolean(cleanedUrl && cleanedKey),
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  try {
    const cleanedUrl = cleanSupabaseUrl(url);
    const cleanedKey = (anonKey || '').trim();
    if (cleanedUrl && cleanedKey) {
      localStorage.setItem(SUPABASE_URL_KEY, cleanedUrl);
      localStorage.setItem(SUPABASE_ANON_KEY, cleanedKey);
    } else {
      localStorage.removeItem(SUPABASE_URL_KEY);
      localStorage.removeItem(SUPABASE_ANON_KEY);
    }
    supabaseInstance = null; // reset client instance
  } catch (e) {
    console.warn('Could not save Supabase config to localStorage:', e);
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

// ----------------------------------------------------
// SUPABASE CLOUD DATABASE API HELPERS
// ----------------------------------------------------

export const supabaseDb = {
  // 1. Fetch Students
  async fetchStudents(): Promise<Student[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('students')
        .select('*')
        .order('nis', { ascending: true });
      if (error) throw error;
      if (!data) return [];
      return data.map((d: any) => ({
        id: String(d.id),
        nis: String(d.nis || ''),
        name: String(d.name || ''),
        class: String(d.class || 'XI PPLG 3'),
        gender: d.gender === 'P' ? 'P' : 'L',
        phone: d.phone || '',
        avatar: d.avatar || undefined,
        createdAt: d.created_at || new Date().toISOString(),
      }));
    } catch (e) {
      console.warn('Supabase fetchStudents failed:', e);
      return null;
    }
  },

  // Insert Student
  async insertStudent(student: Omit<Student, 'id' | 'createdAt'> & { id?: string }): Promise<Student | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const payload: any = {
        nis: student.nis,
        name: student.name,
        class: student.class,
        gender: student.gender,
        phone: student.phone || '',
        avatar: student.avatar || null,
      };
      if (student.id && !student.id.startsWith('std-') && !student.id.startsWith('sim-')) {
        payload.id = student.id;
      }
      const { data, error } = await client
        .from('students')
        .upsert(payload)
        .select()
        .single();
      if (error) throw error;
      return {
        id: String(data.id),
        nis: String(data.nis),
        name: String(data.name),
        class: String(data.class),
        gender: data.gender === 'P' ? 'P' : 'L',
        phone: data.phone || '',
        avatar: data.avatar || undefined,
        createdAt: data.created_at,
      };
    } catch (e) {
      console.warn('Supabase insertStudent failed:', e);
      return null;
    }
  },

  // Batch Insert Students
  async insertStudentsBatch(students: Omit<Student, 'id' | 'createdAt'>[]): Promise<Student[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const payloads = students.map((s) => ({
        id: (s as any).id || undefined,
        nis: String(s.nis),
        name: s.name,
        class: s.class || 'XI PPLG 3',
        gender: s.gender || 'L',
        phone: s.phone || '',
        avatar: s.avatar || null,
      }));
      const { data, error } = await client
        .from('students')
        .upsert(payloads, { onConflict: 'id' })
        .select();
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: String(d.id),
        nis: String(d.nis),
        name: String(d.name),
        class: String(d.class),
        gender: d.gender === 'P' ? 'P' : 'L',
        phone: d.phone || '',
        avatar: d.avatar || undefined,
        createdAt: d.created_at,
      }));
    } catch (e) {
      console.warn('Supabase insertStudentsBatch failed:', e);
      return null;
    }
  },

  // Update Student
  async updateStudent(id: string, updates: Partial<Student>): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.nis !== undefined) payload.nis = updates.nis;
      if (updates.class !== undefined) payload.class = updates.class;
      if (updates.gender !== undefined) payload.gender = updates.gender;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.avatar !== undefined) payload.avatar = updates.avatar;

      const { error } = await client.from('students').update(payload).eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase updateStudent failed:', e);
      return false;
    }
  },

  // Delete Student
  async deleteStudent(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('students').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase deleteStudent failed:', e);
      return false;
    }
  },

  // Delete All Students
  async deleteAllStudents(): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase deleteAllStudents failed:', e);
      return false;
    }
  },

  // 2. Fetch Payments
  async fetchPayments(): Promise<Payment[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });
      if (error) throw error;
      if (!data) return [];
      return data.map((d: any) => ({
        id: String(d.id),
        studentId: String(d.student_id),
        amount: Number(d.amount),
        paymentMethod: d.payment_method || 'Tunai',
        paymentDate: d.payment_date,
        weekNumber: d.week_number || undefined,
        description: d.description || '',
        createdBy: d.created_by || 'Bendahara',
        createdAt: d.created_at || new Date().toISOString(),
      }));
    } catch (e) {
      console.warn('Supabase fetchPayments failed:', e);
      return null;
    }
  },

  // Insert Payment
  async insertPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const payload: any = {
        student_id: payment.studentId,
        amount: payment.amount,
        payment_method: payment.paymentMethod,
        payment_date: payment.paymentDate,
        week_number: payment.weekNumber || 1,
        description: payment.description,
        created_by: payment.createdBy || 'Bendahara',
      };
      const { data, error } = await client.from('payments').insert(payload).select().single();
      if (error) throw error;
      return {
        id: String(data.id),
        studentId: String(data.student_id),
        amount: Number(data.amount),
        paymentMethod: data.payment_method,
        paymentDate: data.payment_date,
        weekNumber: data.week_number,
        description: data.description,
        createdBy: data.created_by,
        createdAt: data.created_at,
      };
    } catch (e) {
      console.warn('Supabase insertPayment failed:', e);
      return null;
    }
  },

  // Batch Insert Payments
  async insertPaymentsBatch(payments: Omit<Payment, 'id' | 'createdAt'>[]): Promise<Payment[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const payloads = payments.map((p) => ({
        id: (p as any).id || undefined,
        student_id: String(p.studentId),
        amount: Number(p.amount) || 0,
        payment_method: p.paymentMethod || 'Tunai',
        payment_date: p.paymentDate,
        week_number: p.weekNumber || 1,
        description: p.description || '',
        created_by: p.createdBy || 'Bendahara',
      }));
      const { data, error } = await client
        .from('payments')
        .upsert(payloads, { onConflict: 'id' })
        .select();
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: String(d.id),
        studentId: String(d.student_id),
        amount: Number(d.amount),
        paymentMethod: d.payment_method,
        paymentDate: d.payment_date,
        weekNumber: d.week_number,
        description: d.description,
        createdBy: d.created_by,
        createdAt: d.created_at,
      }));
    } catch (e) {
      console.warn('Supabase insertPaymentsBatch failed:', e);
      return null;
    }
  },

  // Update Payment
  async updatePayment(id: string, updates: Partial<Payment>): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const payload: any = {};
      if (updates.amount !== undefined) payload.amount = updates.amount;
      if (updates.paymentMethod !== undefined) payload.payment_method = updates.paymentMethod;
      if (updates.paymentDate !== undefined) payload.payment_date = updates.paymentDate;
      if (updates.weekNumber !== undefined) payload.week_number = updates.weekNumber;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.createdBy !== undefined) payload.created_by = updates.createdBy;

      const { error } = await client.from('payments').update(payload).eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase updatePayment failed:', e);
      return false;
    }
  },

  // Delete Payment
  async deletePayment(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('payments').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase deletePayment failed:', e);
      return false;
    }
  },

  // Delete All Payments
  async deleteAllPayments(): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase deleteAllPayments failed:', e);
      return false;
    }
  },

  // 3. Fetch Expenses
  async fetchExpenses(): Promise<Expense[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      if (error) throw error;
      if (!data) return [];
      return data.map((d: any) => ({
        id: String(d.id),
        title: String(d.title),
        amount: Number(d.amount),
        category: d.category || 'Lainnya',
        expenseDate: d.expense_date,
        description: d.description || '',
        receiptUrl: d.receipt_url || undefined,
        createdBy: d.created_by || 'Bendahara',
        createdAt: d.created_at || new Date().toISOString(),
      }));
    } catch (e) {
      console.warn('Supabase fetchExpenses failed:', e);
      return null;
    }
  },

  // Insert Expense
  async insertExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const payload: any = {
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        expense_date: expense.expenseDate,
        description: expense.description,
        receipt_url: expense.receiptUrl || null,
        created_by: expense.createdBy || 'Bendahara',
      };
      const { data, error } = await client.from('expenses').insert(payload).select().single();
      if (error) throw error;
      return {
        id: String(data.id),
        title: String(data.title),
        amount: Number(data.amount),
        category: data.category,
        expenseDate: data.expense_date,
        description: data.description,
        receiptUrl: data.receipt_url || undefined,
        createdBy: data.created_by,
        createdAt: data.created_at,
      };
    } catch (e) {
      console.warn('Supabase insertExpense failed:', e);
      return null;
    }
  },

  // Batch Insert Expenses
  async insertExpensesBatch(expenses: Omit<Expense, 'id' | 'createdAt'>[]): Promise<Expense[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const payloads = expenses.map((e) => ({
        id: (e as any).id || undefined,
        title: e.title,
        amount: Number(e.amount) || 0,
        category: e.category || 'Keperluan Kelas',
        expense_date: e.expenseDate,
        description: e.description || '',
        receipt_url: e.receiptUrl || null,
        created_by: e.createdBy || 'Bendahara',
      }));
      const { data, error } = await client
        .from('expenses')
        .upsert(payloads, { onConflict: 'id' })
        .select();
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: String(d.id),
        title: String(d.title),
        amount: Number(d.amount),
        category: d.category,
        expenseDate: d.expense_date,
        description: d.description,
        receiptUrl: d.receipt_url || undefined,
        createdBy: d.created_by,
        createdAt: d.created_at,
      }));
    } catch (e) {
      console.warn('Supabase insertExpensesBatch failed:', e);
      return null;
    }
  },

  // Update Expense
  async updateExpense(id: string, updates: Partial<Expense>): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.amount !== undefined) payload.amount = updates.amount;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.expenseDate !== undefined) payload.expense_date = updates.expenseDate;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.receiptUrl !== undefined) payload.receipt_url = updates.receiptUrl;
      if (updates.createdBy !== undefined) payload.created_by = updates.createdBy;

      const { error } = await client.from('expenses').update(payload).eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase updateExpense failed:', e);
      return false;
    }
  },

  // Delete Expense
  async deleteExpense(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase deleteExpense failed:', e);
      return false;
    }
  },

  // Delete All Expenses
  async deleteAllExpenses(): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase deleteAllExpenses failed:', e);
      return false;
    }
  },

  // 4. Fetch Class Settings
  async fetchSettings(): Promise<ClassSettings | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('class_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        className: data.class_name || 'XI PPLG 3',
        academicYear: data.academic_year || '2025/2026',
        targetPerStudent: Number(data.target_per_student) || 60000,
        monthlyFee: Number(data.monthly_fee) || 5000,
        totalMonths: Number(data.total_months) || 12,
        homeroomTeacher: data.homeroom_teacher || '',
        classPresident: data.class_president || '',
        treasurer1: data.treasurer_1 || '',
        treasurer2: data.treasurer_2 || '',
      };
    } catch (e) {
      console.warn('Supabase fetchSettings failed:', e);
      return null;
    }
  },

  // Save Settings
  async saveSettings(settings: ClassSettings): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const payload: any = {
        id: 1,
        class_name: settings.className,
        academic_year: settings.academicYear,
        target_per_student: settings.targetPerStudent,
        monthly_fee: settings.monthlyFee,
        total_months: settings.totalMonths,
        homeroom_teacher: settings.homeroomTeacher,
        class_president: settings.classPresident,
        treasurer_1: settings.treasurer1,
        treasurer_2: settings.treasurer2,
        updated_at: new Date().toISOString(),
      };
      const { error } = await client.from('class_settings').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase saveSettings failed:', e);
      return false;
    }
  },

  // 5. Subscribe to Supabase Realtime Channels
  subscribeRealtime(onDatabaseChange: (table: string, eventType: string) => void): () => void {
    const client = getSupabaseClient();
    if (!client) return () => {};

    try {
      const channel = client
        .channel('kaskelas_public_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'students' },
          () => onDatabaseChange('students', 'change')
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'payments' },
          () => onDatabaseChange('payments', 'change')
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'expenses' },
          () => onDatabaseChange('expenses', 'change')
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'class_settings' },
          () => onDatabaseChange('class_settings', 'change')
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Could not subscribe to Supabase realtime channel:', e);
      return () => {};
    }
  },
};

// SQL Schema script for Supabase DB setup
export const SUPABASE_SQL_SCHEMA = `-- ===================================================
-- DATABASE SCHEMA KASKELAS XI PPLG 3 (SUPABASE POSTGRES)
-- ===================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean old conflicting tables if recreating
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.class_settings CASCADE;

-- 3. Students Table (TEXT ID compatible with both UUID & string IDs)
CREATE TABLE public.students (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    nis VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    class VARCHAR(50) DEFAULT 'XI PPLG 3',
    gender VARCHAR(10) DEFAULT 'L',
    phone VARCHAR(50),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Payments Table (Supports Rp 0 for Lunas Sebelum Juli and TEXT student_id)
CREATE TABLE public.payments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    student_id TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Tunai',
    payment_date VARCHAR(50) NOT NULL,
    week_number INT DEFAULT 1,
    description TEXT,
    created_by VARCHAR(100) DEFAULT 'Bendahara',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Expenses Table
CREATE TABLE public.expenses (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title VARCHAR(200) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    category VARCHAR(50) NOT NULL DEFAULT 'Keperluan Kelas',
    expense_date VARCHAR(50) NOT NULL,
    description TEXT,
    receipt_url TEXT,
    created_by VARCHAR(100) DEFAULT 'Bendahara',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Class Settings Table
CREATE TABLE public.class_settings (
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

-- 7. Enable Realtime on all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_settings;
`;
