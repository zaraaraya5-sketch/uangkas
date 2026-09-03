import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Student, 
  Payment, 
  Expense, 
  User, 
  ClassSettings, 
  StudentSummary, 
  TransactionItem, 
  CashOverview,
  Role,
  PaymentStatus
} from '../types';
import { storageService, RealtimeMessage } from '../services/storageService';
import { supabaseDb, getSupabaseConfig } from '../services/supabaseClient';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

export type AppView = 'landing' | 'student' | 'admin';
export type AdminTab = 'dashboard' | 'students' | 'payments' | 'expenses' | 'transactions' | 'reports' | 'settings';
export type StudentTab = 'home' | 'my-payments' | 'ledger' | 'profile';

interface KasContextType {
  // State
  students: Student[];
  studentSummaries: StudentSummary[];
  payments: Payment[];
  expenses: Expense[];
  transactions: TransactionItem[];
  overview: CashOverview;
  settings: ClassSettings;
  currentUser: User | null;
  currentView: AppView;
  activeAdminTab: AdminTab;
  activeStudentTab: StudentTab;
  toasts: ToastMessage[];
  isRealtimeConnected: boolean;
  isCloudConnected: boolean;
  lastUpdated: number;

  // View Navigation
  setCurrentView: (view: AppView) => void;
  setActiveAdminTab: (tab: AdminTab) => void;
  setActiveStudentTab: (tab: StudentTab) => void;

  // Auth
  loginAsRole: (role: Role, studentId?: string) => void;
  loginWithCredentials: (usernameOrEmail: string, passwordInput: string, role?: Role, studentId?: string) => { success: boolean; message?: string };
  logout: () => void;

  // Payment CRUD
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<Payment>;
  addPaymentsBatch: (payments: Omit<Payment, 'id' | 'createdAt'>[]) => Promise<Payment[]>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  deleteAllPayments: () => Promise<void>;

  // Expense CRUD
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  addExpensesBatch: (expenses: Omit<Expense, 'id' | 'createdAt'>[]) => Promise<Expense[]>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  deleteAllExpenses: () => Promise<void>;

  // Student CRUD
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<Student>;
  addStudentsBatch: (students: Omit<Student, 'id' | 'createdAt'>[]) => Promise<Student[]>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  deleteAllStudents: () => Promise<void>;

  // Settings & Sync
  updateSettings: (newSettings: Partial<ClassSettings>) => Promise<void>;
  resetDataToDefault: () => void;
  syncFromCloud: () => Promise<void>;
  uploadAllToCloud: () => Promise<void>;

  // Toasts
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const KasContext = createContext<KasContextType | undefined>(undefined);

export const KasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(() => storageService.getStudents());
  const [payments, setPayments] = useState<Payment[]>(() => storageService.getPayments());
  const [expenses, setExpenses] = useState<Expense[]>(() => storageService.getExpenses());
  const [settings, setSettings] = useState<ClassSettings>(() => storageService.getSettings());
  const [currentUser, setCurrentUser] = useState<User | null>(() => storageService.getCurrentUser());
  
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const savedView = storageService.getCurrentView() as AppView | null;
    const user = storageService.getCurrentUser();
    if (savedView) {
      if (savedView === 'admin' && (!user || (user.role !== 'admin' && user.role !== 'ketua_kelas'))) {
        return 'landing';
      }
      return savedView;
    }
    if (user && (user.role === 'admin' || user.role === 'ketua_kelas')) return 'admin';
    if (user && user.role === 'siswa') return 'student';
    return 'landing';
  });

  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>(() => {
    const savedTab = storageService.getActiveAdminTab() as AdminTab | null;
    return savedTab || 'dashboard';
  });

  const [activeStudentTab, setActiveStudentTab] = useState<StudentTab>('home');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [isRealtimeConnected] = useState<boolean>(true);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(() => getSupabaseConfig().isConnected);

  const handleSetCurrentView = useCallback((view: AppView) => {
    setCurrentView(view);
    storageService.saveCurrentView(view);
  }, []);

  const handleSetActiveAdminTab = useCallback((tab: AdminTab) => {
    setActiveAdminTab(tab);
    storageService.saveActiveAdminTab(tab);
  }, []);

  // Toast functions
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration || 4000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  // Synchronize state from storage
  const refreshFromStorage = useCallback(() => {
    const stds = storageService.getStudents();
    const pays = storageService.getPayments();
    const exps = storageService.getExpenses();
    const sets = storageService.getSettings();
    setStudents(stds);
    setPayments(pays);
    setExpenses(exps);
    setSettings(sets);
    setLastUpdated(Date.now());
  }, []);

  const isSyncingRef = useRef(false);

  // Cloud Sync Handler with Auto-Seeding & Bidirectional Sync
  const syncFromCloud = useCallback(async () => {
    if (isSyncingRef.current) return;
    const config = getSupabaseConfig();
    setIsCloudConnected(config.isConnected);
    if (!config.isConnected) return;

    try {
      isSyncingRef.current = true;
      const [cloudStudents, cloudPayments, cloudExpenses, cloudSettings] = await Promise.all([
        supabaseDb.fetchStudents(),
        supabaseDb.fetchPayments(),
        supabaseDb.fetchExpenses(),
        supabaseDb.fetchSettings(),
      ]);

      const cloudHasStudents = Array.isArray(cloudStudents) && cloudStudents.length > 0;
      const cloudHasPayments = Array.isArray(cloudPayments) && cloudPayments.length > 0;
      const cloudHasExpenses = Array.isArray(cloudExpenses) && cloudExpenses.length > 0;
      const cloudHasData = cloudHasStudents || cloudHasPayments || cloudHasExpenses;

      const localStudents = storageService.getStudents();
      const localPayments = storageService.getPayments();
      const localExpenses = storageService.getExpenses();
      const localHasData = localStudents.length > 0 || localPayments.length > 0 || localExpenses.length > 0;

      // SCENARIO 1: Cloud is empty, BUT local device has data (e.g. mobile device with 45 students & transactions)
      // Automatically upload/seed local device data into Supabase Cloud!
      if (!cloudHasData && localHasData) {
        console.log('⚡ Auto-seeding empty cloud database from active local storage data...');
        await supabaseDb.saveSettings(storageService.getSettings());
        if (localStudents.length > 0) await supabaseDb.insertStudentsBatch(localStudents);
        if (localPayments.length > 0) await supabaseDb.insertPaymentsBatch(localPayments);
        if (localExpenses.length > 0) await supabaseDb.insertExpensesBatch(localExpenses);
        setLastUpdated(Date.now());
        return;
      }

      // SCENARIO 2: Cloud has data (or both empty) -> sync down to local state & storage
      if (cloudStudents !== null) {
        setStudents(cloudStudents);
        storageService.saveStudents(cloudStudents, false);
      }
      if (cloudPayments !== null) {
        setPayments(cloudPayments);
        storageService.savePayments(cloudPayments, false);
      }
      if (cloudExpenses !== null) {
        setExpenses(cloudExpenses);
        storageService.saveExpenses(cloudExpenses, false);
      }
      if (cloudSettings !== null) {
        setSettings(cloudSettings);
        storageService.saveSettings(cloudSettings, false);
      }
      setLastUpdated(Date.now());
    } catch (e) {
      console.warn('Cloud sync error:', e);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // Initial cloud fetch on mount
  useEffect(() => {
    syncFromCloud();
  }, [syncFromCloud]);

  // Listen to Supabase Realtime, BroadcastChannel, Tab Focus & Mobile Visibility
  useEffect(() => {
    const unsubscribeBroadcast = storageService.subscribeRealtime((message: RealtimeMessage) => {
      refreshFromStorage();
      if (message.type === 'PAYMENT_ADDED') {
        showToast({
          type: 'info',
          title: '⚡ Realtime Update',
          message: 'Data pembayaran kas baru telah diperbarui di sistem.',
        });
      } else if (message.type === 'EXPENSE_ADDED') {
        showToast({
          type: 'info',
          title: '⚡ Realtime Update',
          message: 'Data pengeluaran kas baru telah diperbarui di sistem.',
        });
      }
    });

    const unsubscribeSupabase = supabaseDb.subscribeRealtime(() => {
      syncFromCloud();
    });

    // Auto-sync when switching back to tab or unlocking mobile screen
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncFromCloud();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Heartbeat poll every 10 seconds to ensure multi-device sync
    const pollInterval = setInterval(() => {
      syncFromCloud();
    }, 10000);

    return () => {
      unsubscribeBroadcast();
      unsubscribeSupabase();
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(pollInterval);
    };
  }, [refreshFromStorage, syncFromCloud, showToast]);

  // Calculate Student Summaries
  const studentSummaries: StudentSummary[] = useMemo(() => {
    const target = settings.targetPerStudent || 60000;

    return students.map((student) => {
      const studentPayments = payments.filter((p) => {
        if (p.studentId === student.id) return true;
        if (p.studentId === student.nis) return true;
        if (p.studentId && p.studentId.includes(encodeURIComponent(student.name))) return true;
        return false;
      });
      
      const hasLunasSebelumJuli = studentPayments.some(
        (p) =>
          p.description?.toLowerCase().includes('lunas sebelum') ||
          p.monthName?.toLowerCase().includes('lunas sebelum') ||
          (Number(p.amount) === 0 && p.description?.toLowerCase().includes('lunas'))
      );

      const numericPaid = studentPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      let totalPaid = numericPaid;
      let remainingAmount = Math.max(0, target - numericPaid);
      let status: PaymentStatus = 'Belum Membayar';

      if (hasLunasSebelumJuli && numericPaid === 0) {
        status = 'Lunas';
        remainingAmount = 0;
        totalPaid = target;
      } else if (totalPaid >= target) {
        status = 'Lunas';
        remainingAmount = 0;
      } else if (hasLunasSebelumJuli) {
        status = 'Lunas';
        remainingAmount = 0;
      } else if (totalPaid > 0) {
        status = 'Sebagian';
      }

      const sortedPayments = [...studentPayments].sort(
        (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      );

      return {
        ...student,
        totalPaid,
        targetAmount: target,
        remainingAmount,
        status,
        paymentCount: studentPayments.length,
        lastPaymentDate: sortedPayments[0]?.paymentDate,
      };
    });
  }, [students, payments, settings.targetPerStudent]);

  // Unified Transactions List
  const transactions: TransactionItem[] = useMemo(() => {
    const studentMap = new Map(students.map((s) => [s.id, s.name]));

    const incomeTransactions: TransactionItem[] = payments.map((p) => {
      const sName = studentMap.get(p.studentId) || p.studentName || 'Siswa';
      return {
        id: `tx-pay-${p.id}`,
        type: 'income',
        title: `Pembayaran Kas: ${sName}`,
        studentId: p.studentId,
        studentName: sName,
        category: 'Kas Siswa',
        amount: Number(p.amount),
        date: p.paymentDate,
        method: p.paymentMethod,
        description: p.description || (p.monthName ? `Kas Bulan ${p.monthName}` : 'Pembayaran Kas'),
        createdBy: p.createdBy || 'Bendahara',
        createdAt: p.createdAt || new Date().toISOString(),
        rawPaymentId: p.id,
      };
    });

    const expenseTransactions: TransactionItem[] = expenses.map((e) => ({
      id: `tx-exp-${e.id}`,
      type: 'expense',
      title: e.title,
      category: e.category,
      amount: Number(e.amount),
      date: e.expenseDate,
      description: e.description,
      createdBy: e.createdBy || 'Bendahara',
      createdAt: e.createdAt || new Date().toISOString(),
      rawExpenseId: e.id,
    }));

    const combined = [...incomeTransactions, ...expenseTransactions];
    return combined.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [payments, expenses, students]);

  // Calculated Realtime Overview
  const overview: CashOverview = useMemo(() => {
    const totalIncome = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const currentBalance = totalIncome - totalExpense;

    const paidStudentsCount = studentSummaries.filter((s) => s.status === 'Lunas').length;
    const partialStudentsCount = studentSummaries.filter((s) => s.status === 'Sebagian').length;
    const unpaidStudentsCount = studentSummaries.filter((s) => s.status === 'Belum Membayar').length;
    const totalStudents = students.length || 45;
    
    const activeContributors = paidStudentsCount + partialStudentsCount;
    const paymentPercentage = totalStudents > 0 ? (activeContributors / totalStudents) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      currentBalance,
      paidStudentsCount,
      partialStudentsCount,
      unpaidStudentsCount,
      totalStudents,
      paymentPercentage,
    };
  }, [payments, expenses, studentSummaries, students.length]);

  // Auth Operations
  const loginWithCredentials = useCallback((
    usernameOrEmail: string, 
    passwordInput: string, 
    role: Role = 'siswa', 
    studentId?: string
  ): { success: boolean; message?: string } => {
    const cleanUsername = usernameOrEmail.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    // 1. Bendahara 1 (Lulu Maulida)
    if (
      cleanUsername === 'bendahara 1' || 
      cleanUsername === 'bendahara1' || 
      cleanUsername === 'bendahara' ||
      cleanUsername === 'lulumaulida' ||
      cleanUsername === 'lulu'
    ) {
      if (cleanPassword !== 'lulumaulida1' && cleanPassword !== 'password123') {
        return { success: false, message: 'Password salah untuk Bendahara 1. Silakan masukkan kata sandi yang sesuai.' };
      }

      const targetUser: User = {
        id: 'user-bendahara1',
        name: 'Lulu Maulida (Bendahara 1)',
        username: 'bendahara 1',
        email: 'bendahara1@kaskelas.id',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(targetUser);
      storageService.saveCurrentUser(targetUser);
      handleSetCurrentView('admin');
      handleSetActiveAdminTab('dashboard');

      showToast({
        type: 'success',
        title: `Selamat datang, ${targetUser.name}!`,
        message: 'Berhasil masuk ke Dashboard Bendahara 1.',
      });
      return { success: true };
    }

    // 2. Bendahara 2 (Habib Ramadhan)
    if (
      cleanUsername === 'bendahara 2' || 
      cleanUsername === 'bendahara2' || 
      cleanUsername === 'habibramadhan' ||
      cleanUsername === 'habib'
    ) {
      if (cleanPassword !== 'habibramadhan2' && cleanPassword !== 'password123') {
        return { success: false, message: 'Password salah untuk Bendahara 2. Silakan masukkan kata sandi yang sesuai.' };
      }

      const targetUser: User = {
        id: 'user-bendahara2',
        name: 'Habib Ramadhan (Bendahara 2)',
        username: 'bendahara 2',
        email: 'bendahara2@kaskelas.id',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(targetUser);
      storageService.saveCurrentUser(targetUser);
      handleSetCurrentView('admin');
      handleSetActiveAdminTab('dashboard');

      showToast({
        type: 'success',
        title: `Selamat datang, ${targetUser.name}!`,
        message: 'Berhasil masuk ke Dashboard Bendahara 2.',
      });
      return { success: true };
    }

    // 3. Admin Kas (Muhammad Rajib Zahir)
    if (
      cleanUsername === 'adminkas' || 
      cleanUsername === 'admin' || 
      cleanUsername === 'rajibzahir' ||
      cleanUsername === 'rajib'
    ) {
      if (cleanPassword !== 'rajibzahir123' && cleanPassword !== 'password123') {
        return { success: false, message: 'Password salah untuk Admin Kas. Silakan masukkan kata sandi yang sesuai.' };
      }

      const targetUser: User = {
        id: 'user-admin',
        name: 'Muhammad Rajib Zahir (Admin Kas)',
        username: 'adminkas',
        email: 'admin@kaskelas.id',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(targetUser);
      storageService.saveCurrentUser(targetUser);
      handleSetCurrentView('admin');
      handleSetActiveAdminTab('dashboard');

      showToast({
        type: 'success',
        title: `Selamat datang, ${targetUser.name}!`,
        message: 'Berhasil masuk ke Dashboard Admin Kas (Akses Utama).',
      });
      return { success: true };
    }

    // 4. Ketua Kelas (Muhammad Rajib Zahir)
    if (cleanUsername === 'ketuakelas' || cleanUsername === 'ketua') {
      if (cleanPassword !== 'password123' && cleanPassword !== 'rajibzahir123') {
        return { success: false, message: 'Password salah untuk Ketua Kelas.' };
      }

      const targetUser: User = {
        id: 'user-ketua',
        name: 'Muhammad Rajib Zahir (Ketua Kelas)',
        username: 'ketuakelas',
        email: 'ketua@kaskelas.id',
        role: 'ketua_kelas',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(targetUser);
      storageService.saveCurrentUser(targetUser);
      handleSetCurrentView('admin');
      handleSetActiveAdminTab('dashboard');

      showToast({
        type: 'success',
        title: `Selamat datang, ${targetUser.name}!`,
        message: 'Berhasil masuk ke Dashboard Ketua Kelas.',
      });
      return { success: true };
    }

    // 5. Siswa Login
    const targetStudent = students.find((s) => s.id === studentId || s.nis === cleanUsername || s.name.toLowerCase() === cleanUsername);
    if (targetStudent) {
      if (cleanPassword !== 'password123' && cleanPassword !== 'siswa123' && cleanPassword !== '123456') {
        return { success: false, message: 'Password salah. Password default siswa: password123' };
      }

      const targetUser: User = {
        id: `user-${targetStudent.id}`,
        name: targetStudent.name,
        username: targetStudent.nis,
        email: `${targetStudent.nis}@siswa.kaskelas.id`,
        role: 'siswa',
        studentId: targetStudent.id,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${targetStudent.name}`,
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(targetUser);
      storageService.saveCurrentUser(targetUser);
      handleSetCurrentView('student');
      setActiveStudentTab('home');

      showToast({
        type: 'success',
        title: `Selamat datang, ${targetUser.name}!`,
        message: 'Berhasil masuk ke Portal Siswa KasKelas.',
      });
      return { success: true };
    }

    return { 
      success: false, 
      message: 'Username / NIS tidak terdaftar. Gunakan "bendahara 1", "bendahara 2", "adminkas", atau No. Absen siswa.' 
    };
  }, [students, handleSetCurrentView, handleSetActiveAdminTab, showToast]);

  const loginAsRole = useCallback((role: Role, studentId?: string) => {
    loginWithCredentials(
      role === 'admin' ? 'bendahara' : role === 'ketua_kelas' ? 'ketuakelas' : '1',
      'password123',
      role,
      studentId
    );
  }, [loginWithCredentials]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    storageService.saveCurrentUser(null);
    handleSetCurrentView('landing');
    handleSetActiveAdminTab('dashboard');
    showToast({
      type: 'info',
      title: 'Sampai Jumpa!',
      message: 'Anda telah berhasil keluar dari akun KasKelas.',
    });
  }, [handleSetCurrentView, handleSetActiveAdminTab, showToast]);

  // ----------------------------------------------------
  // PAYMENT CRUD (Cloud + Local + Realtime)
  // ----------------------------------------------------

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> => {
    let newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    // Attempt Supabase Cloud Insert with id
    const cloudResult = await supabaseDb.insertPayment(newPayment);
    if (cloudResult) {
      newPayment = cloudResult;
    }

    const updated = [newPayment, ...payments.filter((p) => p.id !== newPayment.id)];
    setPayments(updated);
    storageService.savePayments(updated, true);
    storageService.broadcastEvent({ type: 'PAYMENT_ADDED', timestamp: Date.now(), payload: newPayment });

    // Confetti celebration if target reached
    const target = settings.targetPerStudent || 25000;
    const studentTotal = updated
      .filter((p) => p.studentId === newPayment.studentId)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    if (studentTotal >= target) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }

    const studentName = students.find((s) => s.id === newPayment.studentId)?.name || 'Siswa';
    showToast({
      type: 'success',
      title: '✓ Pembayaran berhasil ditambahkan',
      message: `${studentName} — Rp ${newPayment.amount.toLocaleString('id-ID')} (${newPayment.paymentMethod})`,
    });

    return newPayment;
  };

  const addPaymentsBatch = async (paymentsData: Omit<Payment, 'id' | 'createdAt'>[]): Promise<Payment[]> => {
    if (paymentsData.length === 0) return [];

    let newPayments: Payment[] = paymentsData.map((p, idx) => ({
      ...p,
      id: (p as any).id || `pay-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: (p as any).createdAt || new Date().toISOString(),
    }));

    // Attempt Cloud Batch Insert with newPayments containing valid IDs
    const cloudResults = await supabaseDb.insertPaymentsBatch(newPayments);
    if (cloudResults && cloudResults.length > 0) {
      newPayments = cloudResults;
    }

    const updated = [...newPayments, ...payments];
    setPayments(updated);
    storageService.savePayments(updated, true);
    storageService.broadcastEvent({ type: 'PAYMENT_ADDED', timestamp: Date.now() });

    return newPayments;
  };

  const updatePayment = async (id: string, paymentData: Partial<Payment>): Promise<void> => {
    await supabaseDb.updatePayment(id, paymentData);
    const updated = payments.map((p) => (p.id === id ? { ...p, ...paymentData } : p));
    setPayments(updated);
    storageService.savePayments(updated, true);
    storageService.broadcastEvent({ type: 'PAYMENT_UPDATED', timestamp: Date.now() });

    showToast({
      type: 'success',
      title: '✓ Pembayaran berhasil diperbarui',
      message: 'Data pembayaran telah disinkronisasi ke seluruh tampilan.',
    });
  };

  const deletePayment = async (id: string): Promise<void> => {
    await supabaseDb.deletePayment(id);
    const updated = payments.filter((p) => p.id !== id);
    setPayments(updated);
    storageService.savePayments(updated, true);
    storageService.broadcastEvent({ type: 'PAYMENT_DELETED', timestamp: Date.now() });

    showToast({
      type: 'warning',
      title: '✓ Pembayaran telah dihapus',
      message: 'Saldo kas dan status siswa otomatis dihitung ulang.',
    });
  };

  const deleteAllPayments = async (): Promise<void> => {
    await supabaseDb.deleteAllPayments();
    setPayments([]);
    storageService.savePayments([], true);
    storageService.broadcastEvent({ type: 'PAYMENT_DELETED', timestamp: Date.now() });

    showToast({
      type: 'warning',
      title: '✓ Semua riwayat pembayaran telah dihapus',
      message: 'Seluruh transaksi kas siswa telah dikosongkan.',
    });
  };

  // ----------------------------------------------------
  // EXPENSE CRUD (Cloud + Local + Realtime)
  // ----------------------------------------------------

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
    let newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    const cloudResult = await supabaseDb.insertExpense(newExpense);
    if (cloudResult) {
      newExpense = cloudResult;
    }

    const updated = [newExpense, ...expenses.filter((e) => e.id !== newExpense.id)];
    setExpenses(updated);
    storageService.saveExpenses(updated, true);
    storageService.broadcastEvent({ type: 'EXPENSE_ADDED', timestamp: Date.now(), payload: newExpense });

    showToast({
      type: 'success',
      title: '✓ Pengeluaran kas berhasil dicatat',
      message: `${newExpense.title} — Rp ${newExpense.amount.toLocaleString('id-ID')}`,
    });

    return newExpense;
  };

  const addExpensesBatch = async (expensesData: Omit<Expense, 'id' | 'createdAt'>[]): Promise<Expense[]> => {
    if (expensesData.length === 0) return [];

    let newExpenses: Expense[] = expensesData.map((e, idx) => ({
      ...e,
      id: (e as any).id || `exp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: (e as any).createdAt || new Date().toISOString(),
    }));

    const cloudResults = await supabaseDb.insertExpensesBatch(newExpenses);
    if (cloudResults && cloudResults.length > 0) {
      newExpenses = cloudResults;
    }

    const updated = [...newExpenses, ...expenses];
    setExpenses(updated);
    storageService.saveExpenses(updated, true);
    storageService.broadcastEvent({ type: 'EXPENSE_ADDED', timestamp: Date.now() });

    return newExpenses;
  };

  const updateExpense = async (id: string, expenseData: Partial<Expense>): Promise<void> => {
    await supabaseDb.updateExpense(id, expenseData);
    const updated = expenses.map((e) => (e.id === id ? { ...e, ...expenseData } : e));
    setExpenses(updated);
    storageService.saveExpenses(updated, true);
    storageService.broadcastEvent({ type: 'EXPENSE_UPDATED', timestamp: Date.now() });

    showToast({
      type: 'success',
      title: '✓ Pengeluaran berhasil diperbarui',
      message: 'Saldo kas telah otomatis disesuaikan.',
    });
  };

  const uploadAllToCloud = async (): Promise<void> => {
    try {
      showToast({
        type: 'info',
        title: '⏳ Menyinkronkan data ke Cloud...',
        message: 'Mengunggah seluruh data lokal ke Supabase database.',
        duration: 3000,
      });

      // 1. Clean any old duplicated cloud records sequentially (child tables first)
      await supabaseDb.deleteAllPayments();
      await supabaseDb.deleteAllExpenses();
      await supabaseDb.deleteAllStudents();

      // 2. Upload settings
      await supabaseDb.saveSettings(settings);

      // 3. Upload students (parent table first)
      if (students.length > 0) {
        await supabaseDb.insertStudentsBatch(students);
      }

      // 4. Upload payments (child table second)
      if (payments.length > 0) {
        await supabaseDb.insertPaymentsBatch(payments);
      }

      // 5. Upload expenses
      if (expenses.length > 0) {
        await supabaseDb.insertExpensesBatch(expenses);
      }

      showToast({
        type: 'success',
        title: '✓ Sukses! Seluruh Data Telah Diunggah ke Cloud',
        message: `${students.length} siswa, ${payments.length} setoran, dan ${expenses.length} pengeluaran kini aktif & bersih di Supabase.`,
        duration: 5000,
      });
    } catch (e) {
      console.error('Upload all to cloud error:', e);
      showToast({
        type: 'error',
        title: 'Gagal mengunggah ke Cloud',
        message: 'Pastikan koneksi Supabase Anda aktif & SQL Table sudah dibuat.',
      });
    }
  };

  const deleteExpense = async (id: string): Promise<void> => {
    await supabaseDb.deleteExpense(id);
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    storageService.saveExpenses(updated, true);
    storageService.broadcastEvent({ type: 'EXPENSE_DELETED', timestamp: Date.now() });

    showToast({
      type: 'warning',
      title: '✓ Pengeluaran telah dihapus',
      message: 'Saldo kas dan laporan otomatis disesuaikan.',
    });
  };

  const deleteAllExpenses = async (): Promise<void> => {
    await supabaseDb.deleteAllExpenses();
    setExpenses([]);
    storageService.saveExpenses([], true);
    storageService.broadcastEvent({ type: 'EXPENSE_DELETED', timestamp: Date.now() });

    showToast({
      type: 'warning',
      title: '✓ Semua riwayat pengeluaran telah dihapus',
      message: 'Seluruh belanja kas telah dikosongkan.',
    });
  };

  // ----------------------------------------------------
  // STUDENT CRUD (Cloud + Local + Realtime)
  // ----------------------------------------------------

  const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>): Promise<Student> => {
    let newStudent: Student = {
      ...studentData,
      id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    const cloudResult = await supabaseDb.insertStudent(newStudent);
    if (cloudResult) {
      newStudent = cloudResult;
    }

    const updated = [...students.filter((s) => s.id !== newStudent.id), newStudent];
    setStudents(updated);
    storageService.saveStudents(updated, true);

    showToast({
      type: 'success',
      title: '✓ Data siswa berhasil ditambahkan',
      message: `${newStudent.name} (${newStudent.nis}) masuk daftar kelas.`,
    });

    return newStudent;
  };

  const addStudentsBatch = async (studentsData: Omit<Student, 'id' | 'createdAt'>[]): Promise<Student[]> => {
    if (studentsData.length === 0) return [];

    let newStudents: Student[] = studentsData.map((s, idx) => ({
      ...s,
      id: (s as any).id || `std-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: (s as any).createdAt || new Date().toISOString(),
    }));

    const cloudResults = await supabaseDb.insertStudentsBatch(newStudents);
    if (cloudResults && cloudResults.length > 0) {
      newStudents = cloudResults;
    }

    // Merge without duplicates by student name
    const studentMap = new Map<string, Student>();
    students.forEach((s) => {
      const key = s.name.toLowerCase().trim();
      studentMap.set(key, s);
    });
    newStudents.forEach((ns) => {
      const key = ns.name.toLowerCase().trim();
      studentMap.set(key, ns);
    });
    const merged = Array.from(studentMap.values());

    setStudents(merged);
    storageService.saveStudents(merged, true);

    return newStudents;
  };

  const updateStudent = async (id: string, studentData: Partial<Student>): Promise<void> => {
    await supabaseDb.updateStudent(id, studentData);
    const updated = students.map((s) => (s.id === id ? { ...s, ...studentData } : s));
    setStudents(updated);
    storageService.saveStudents(updated, true);

    showToast({
      type: 'success',
      title: '✓ Data siswa berhasil diperbarui',
    });
  };

  const deleteStudent = async (id: string): Promise<void> => {
    await supabaseDb.deleteStudent(id);
    const updatedStudents = students.filter((s) => s.id !== id);
    const updatedPayments = payments.filter((p) => p.studentId !== id);

    setStudents(updatedStudents);
    setPayments(updatedPayments);
    storageService.saveStudents(updatedStudents, false);
    storageService.savePayments(updatedPayments, true);

    showToast({
      type: 'warning',
      title: '✓ Siswa telah dihapus',
      message: 'Semua catatan pembayaran terkait telah disinkronisasi.',
    });
  };

  const deleteAllStudents = async (): Promise<void> => {
    await supabaseDb.deleteAllStudents();
    setStudents([]);
    setPayments([]);
    storageService.saveStudents([], false);
    storageService.savePayments([], true);

    showToast({
      type: 'warning',
      title: '✓ Seluruh data siswa telah dikosongkan',
      message: 'Silakan lakukan Import Excel untuk memuat data siswa baru.',
    });
  };

  // ----------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------

  const updateSettings = async (newSettings: Partial<ClassSettings>): Promise<void> => {
    const merged = { ...settings, ...newSettings };
    await supabaseDb.saveSettings(merged);
    setSettings(merged);
    storageService.saveSettings(merged, true);

    showToast({
      type: 'success',
      title: '✓ Pengaturan kelas berhasil disimpan',
    });
  };

  const resetDataToDefault = (): void => {
    storageService.resetToDefault();
    refreshFromStorage();
    showToast({
      type: 'info',
      title: 'Data KasKelas Direset ke Awal',
      message: '45 siswa XI PPLG 3 & catatan kas awal telah dimuat ulang.',
    });
  };

  return (
    <KasContext.Provider
      value={{
        students,
        studentSummaries,
        payments,
        expenses,
        transactions,
        overview,
        settings,
        currentUser,
        currentView,
        activeAdminTab,
        activeStudentTab,
        toasts,
        isRealtimeConnected,
        isCloudConnected,
        lastUpdated,

        setCurrentView: handleSetCurrentView,
        setActiveAdminTab: handleSetActiveAdminTab,
        setActiveStudentTab,

        loginAsRole,
        loginWithCredentials,
        logout,

        addPayment,
        addPaymentsBatch,
        updatePayment,
        deletePayment,
        deleteAllPayments,

        addExpense,
        addExpensesBatch,
        updateExpense,
        deleteExpense,
        deleteAllExpenses,

        addStudent,
        addStudentsBatch,
        updateStudent,
        deleteStudent,
        deleteAllStudents,

        updateSettings,
        resetDataToDefault,
        syncFromCloud,
        uploadAllToCloud,

        showToast,
        removeToast,
      }}
    >
      {children}
    </KasContext.Provider>
  );
};

export const useKas = (): KasContextType => {
  const context = useContext(KasContext);
  if (!context) {
    throw new Error('useKas must be used within a KasProvider');
  }
  return context;
};
