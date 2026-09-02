import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  // Expense CRUD
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Student CRUD
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<Student>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  // Settings
  updateSettings: (newSettings: Partial<ClassSettings>) => Promise<void>;
  resetDataToDefault: () => void;

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
    const user = storageService.getCurrentUser();
    if (user && (user.role === 'admin' || user.role === 'ketua_kelas')) return 'admin';
    if (user && user.role === 'siswa') return 'student';
    return 'landing';
  });
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('dashboard');
  const [activeStudentTab, setActiveStudentTab] = useState<StudentTab>('home');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);

  // Synchronize state from storage whenever a realtime message arrives
  const refreshFromStorage = useCallback(() => {
    setStudents(storageService.getStudents());
    setPayments(storageService.getPayments());
    setExpenses(storageService.getExpenses());
    setSettings(storageService.getSettings());
    setLastUpdated(Date.now());
  }, []);

  // Listen to realtime cross-tab broadcast and local updates
  useEffect(() => {
    const unsubscribe = storageService.subscribeRealtime((message: RealtimeMessage) => {
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

    return () => {
      unsubscribe();
    };
  }, [refreshFromStorage]);

  // Toast functions
  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration || 4000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Calculate Student Summaries
  const studentSummaries: StudentSummary[] = useMemo(() => {
    const target = settings.targetPerStudent || 50000;

    return students.map((student) => {
      const studentPayments = payments.filter((p) => p.studentId === student.id);
      const totalPaid = studentPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const remainingAmount = Math.max(0, target - totalPaid);

      let status: PaymentStatus = 'Belum Membayar';
      if (totalPaid >= target) {
        status = 'Lunas';
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

  // Unified Transactions List (Combined & Sorted)
  const transactions: TransactionItem[] = useMemo(() => {
    const studentMap = new Map(students.map((s) => [s.id, s.name]));

    const incomeTransactions: TransactionItem[] = payments.map((p) => {
      const sName = studentMap.get(p.studentId) || 'Siswa';
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
    
    // Students who paid anything (Full or Partial)
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

  // Real Auth Operations
  const loginWithCredentials = useCallback((
    usernameOrEmail: string, 
    passwordInput: string, 
    role: Role = 'siswa', 
    studentId?: string
  ): { success: boolean; message?: string } => {
    const cleanUsername = usernameOrEmail.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    // 1. Check Bendahara 1 (Lulu Maulida - lulumaulida1)
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
      setCurrentView('admin');
      setActiveAdminTab('dashboard');

      showToast({
        type: 'success',
        title: `Selamat datang, ${targetUser.name}!`,
        message: 'Berhasil masuk ke Dashboard Bendahara 1.',
      });
      return { success: true };
    }

    // 2. Check Bendahara 2 (Habib Ramadhan - habibramadhan2)
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
      setCurrentView('admin');
      setActiveAdminTab('dashboard');

      showToast({
        type: 'success',
        title: `Selamat datang, ${targetUser.name}!`,
        message: 'Berhasil masuk ke Dashboard Bendahara 2.',
      });
      return { success: true };
    }

    // 3. Check Admin Kas (Muhammad Rajib Zahir - rajibzahir123)
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
      setCurrentView('admin');
      setActiveAdminTab('dashboard');

      showToast({
        type: 'success',
        title: `Selamat datang, ${targetUser.name}!`,
        message: 'Berhasil masuk ke Dashboard Admin Kas (Akses Utama).',
      });
      return { success: true };
    }

    return { 
      success: false, 
      message: 'Username tidak terdaftar. Gunakan "bendahara 1", "bendahara 2", atau "adminkas".' 
    };

    // Siswa Login
    const targetStudent = students.find((s) => s.id === studentId || s.nis === cleanUsername || s.name.toLowerCase() === cleanUsername) || students[5];
    if (cleanPassword !== 'password123' && cleanPassword !== 'siswa123' && cleanPassword !== '123456') {
      return { success: false, message: 'Password salah. Silakan coba kembali.' };
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
    setCurrentView('student');
    setActiveStudentTab('home');

    showToast({
      type: 'success',
      title: `Selamat datang, ${targetUser.name}!`,
      message: 'Berhasil masuk ke Portal Siswa KasKelas.',
    });
    return { success: true };
  }, [students, showToast]);

  const loginAsRole = useCallback((role: Role, studentId?: string) => {
    loginWithCredentials(role === 'admin' ? 'bendahara' : role === 'ketua_kelas' ? 'ketuakelas' : '24110306', 'password123', role, studentId);
  }, [loginWithCredentials]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    storageService.saveCurrentUser(null);
    setCurrentView('landing');
    showToast({
      type: 'info',
      title: 'Sampai Jumpa!',
      message: 'Anda telah berhasil keluar dari akun KasKelas.',
    });
  }, [showToast]);

  // Payment CRUD
  const addPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> => {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newPayment, ...payments];
    setPayments(updated);
    storageService.savePayments(updated, true);
    storageService.broadcastEvent({ type: 'PAYMENT_ADDED', timestamp: Date.now(), payload: newPayment });

    // Check if this payment caused student to reach target
    const target = settings.targetPerStudent || 50000;
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

  const updatePayment = async (id: string, paymentData: Partial<Payment>): Promise<void> => {
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

  // Expense CRUD
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newExpense, ...expenses];
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

  const updateExpense = async (id: string, expenseData: Partial<Expense>): Promise<void> => {
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

  const deleteExpense = async (id: string): Promise<void> => {
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

  // Student CRUD
  const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>): Promise<Student> => {
    const newStudent: Student = {
      ...studentData,
      id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [...students, newStudent];
    setStudents(updated);
    storageService.saveStudents(updated, true);

    showToast({
      type: 'success',
      title: '✓ Data siswa berhasil ditambahkan',
      message: `${newStudent.name} (${newStudent.nis}) masuk daftar kelas.`,
    });

    return newStudent;
  };

  const updateStudent = async (id: string, studentData: Partial<Student>): Promise<void> => {
    const updated = students.map((s) => (s.id === id ? { ...s, ...studentData } : s));
    setStudents(updated);
    storageService.saveStudents(updated, true);

    showToast({
      type: 'success',
      title: '✓ Data siswa berhasil diperbarui',
    });
  };

  const deleteStudent = async (id: string): Promise<void> => {
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

  // Settings
  const updateSettings = async (newSettings: Partial<ClassSettings>): Promise<void> => {
    const merged = { ...settings, ...newSettings };
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
        lastUpdated,

        setCurrentView,
        setActiveAdminTab,
        setActiveStudentTab,

        loginAsRole,
        loginWithCredentials,
        logout,

        addPayment,
        updatePayment,
        deletePayment,

        addExpense,
        updateExpense,
        deleteExpense,

        addStudent,
        updateStudent,
        deleteStudent,

        updateSettings,
        resetDataToDefault,

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
