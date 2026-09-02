export type Role = 'admin' | 'ketua_kelas' | 'siswa';

export type PaymentMethod = 'Tunai' | 'Transfer';

export type ExpenseCategory = 
  | 'Keperluan Kelas' 
  | 'Peralatan' 
  | 'Acara Kelas' 
  | 'Konsumsi' 
  | 'Lainnya';

export type PaymentStatus = 'Lunas' | 'Sebagian' | 'Belum Membayar';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  studentId?: string; // Linked student record if role is 'siswa'
  avatar?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  userId?: string;
  nis: string;
  name: string;
  class: string;
  phone?: string;
  gender: 'L' | 'P';
  avatar?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName?: string; // computed or joined
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string; // YYYY-MM-DD
  monthName?: string; // e.g. "Juli", "Agustus", "September", dll
  weekNumber?: number;
  description: string;
  createdBy: string; // user name or role
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string; // YYYY-MM-DD
  description: string;
  receiptUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface TransactionItem {
  id: string;
  type: 'income' | 'expense';
  title: string;
  studentId?: string;
  studentName?: string;
  category?: ExpenseCategory | 'Kas Siswa';
  amount: number;
  date: string;
  method?: PaymentMethod;
  description: string;
  createdBy: string;
  createdAt: string;
  rawPaymentId?: string;
  rawExpenseId?: string;
}

export interface ClassSettings {
  className: string;
  academicYear: string;
  targetPerStudent: number; // e.g. Rp 25.000 (5 bulan @ Rp 5.000)
  monthlyFee: number; // e.g. Rp 5.000 per month
  totalMonths: number; // e.g. 5 bulan
  homeroomTeacher: string;
  classPresident: string;
  treasurer1: string;
  treasurer2: string;
}

export interface StudentSummary extends Student {
  totalPaid: number;
  targetAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  paymentCount: number;
  lastPaymentDate?: string;
}

export interface CashOverview {
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  paidStudentsCount: number;
  partialStudentsCount: number;
  unpaidStudentsCount: number;
  totalStudents: number;
  paymentPercentage: number;
}
