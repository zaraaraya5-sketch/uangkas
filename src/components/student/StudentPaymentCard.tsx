import React from 'react';
import { useKas } from '../../context/KasContext';
import { Wallet, CheckCircle2, AlertCircle, Clock, ArrowUpRight, QrCode } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';

interface StudentPaymentCardProps {
  onOpenPayGuide?: () => void;
}

export const StudentPaymentCard: React.FC<StudentPaymentCardProps> = ({ onOpenPayGuide }) => {
  const { currentUser, studentSummaries, overview, settings } = useKas();

  // Find currently logged-in student record
  const studentData = studentSummaries.find(
    (s) => s.id === currentUser?.studentId || s.name === currentUser?.name
  ) || studentSummaries[5]; // fallback Andi Pratama (std-06)

  const firstName = studentData?.name?.split(' ')[0] || 'Siswa';
  const progressPercent = Math.min(
    100,
    Math.round((studentData.totalPaid / (studentData.targetAmount || 50000)) * 100)
  );

  return (
    <div className="space-y-5">
      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-brand-600 via-brand-700 to-indigoSoft-700 text-white rounded-3xl p-6 sm:p-8 shadow-soft-lg relative overflow-hidden">
        {/* Glow */}
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-sm mb-1">
            <span>NIS: {studentData.nis}</span>
            <span>•</span>
            <span>{settings.className}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Halo, {firstName} 👋
          </h1>
          <p className="text-sm text-brand-100 max-w-md">
            Pantau status iuran kas kelasmu dan transparansi pembukuan kas {settings.className}.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:items-end gap-2 pt-2 sm:pt-0">
          <div className="text-xs text-brand-200">Status Pembayaran Anda:</div>
          <div className="bg-white rounded-2xl px-4 py-2 text-slate-800 shadow-md">
            <StatusBadge status={studentData.status} size="md" />
          </div>
        </div>
      </div>

      {/* 3 Metric Cards Grid for Student */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Total Pembayaran Saya */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft hover-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Pembayaran Saya
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1 tracking-tight">
            {formatRupiah(studentData.totalPaid)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dari Target {formatRupiah(studentData.targetAmount)}</span>
            <span className="font-semibold text-emerald-600">{progressPercent}%</span>
          </div>
        </div>

        {/* 2. Tunggakan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft hover-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tunggakan Kas
          </span>
          <div
            className={`text-2xl font-extrabold mt-1 tracking-tight ${
              studentData.remainingAmount > 0 ? 'text-amber-600' : 'text-slate-400'
            }`}
          >
            {formatRupiah(studentData.remainingAmount)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{studentData.status === 'Lunas' ? 'Sudah Lunas' : 'Belum Terpenuhi'}</span>
            {studentData.remainingAmount > 0 && onOpenPayGuide && (
              <button
                onClick={onOpenPayGuide}
                className="font-semibold text-brand-600 hover:underline flex items-center gap-0.5"
              >
                <span>Bayar Kas</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Saldo Kas Kelas (Shared Live Realtime Data) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft hover-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Saldo Kas Kelas
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="text-2xl font-extrabold text-brand-600 mt-1 tracking-tight">
            {formatRupiah(overview.currentBalance)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Kas Bersih Kelas</span>
            <span className="font-medium text-slate-700">{overview.totalStudents} Siswa</span>
          </div>
        </div>
      </div>
    </div>
  );
};
