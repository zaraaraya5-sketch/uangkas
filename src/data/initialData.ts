import { Student, Payment, Expense, User, ClassSettings } from '../types';

export const INITIAL_CLASS_SETTINGS: ClassSettings = {
  className: 'XI PPLG 3',
  academicYear: '2025/2026',
  targetPerStudent: 60000, // Periode Kas
  monthlyFee: 5000, // Rp 5.000 per bulan
  totalMonths: 12,
  homeroomTeacher: 'Firman Sidik, S.Pd',
  classPresident: 'Muhammad Rajib Zahir',
  treasurer1: 'Lulu Maulida (Bendahara 1)',
  treasurer2: 'Habib Ramadhan (Bendahara 2)',
};

// Data Siswa Kelas XI PPLG 3 (Dikosongkan untuk diinput manual oleh pengguna)
export const INITIAL_STUDENTS: Student[] = [];

// Akun Resmi Pengelola Kas
export const INITIAL_USERS: User[] = [
  {
    id: 'user-bendahara1',
    name: 'Lulu Maulida',
    username: 'bendahara 1',
    email: 'bendahara1@kaskelas.id',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-08-01',
  },
  {
    id: 'user-bendahara2',
    name: 'Habib Ramadhan',
    username: 'bendahara 2',
    email: 'bendahara2@kaskelas.id',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-08-01',
  },
  {
    id: 'user-admin',
    name: 'Muhammad Rajib Zahir',
    username: 'adminkas',
    email: 'admin@kaskelas.id',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-08-01',
  },
];

// Data Pembayaran Kas (Dikosongkan untuk diinput manual oleh pengguna)
export const INITIAL_PAYMENTS: Payment[] = [];

// Data Pengeluaran Kas (Dikosongkan untuk diinput manual oleh pengguna)
export const INITIAL_EXPENSES: Expense[] = [];
