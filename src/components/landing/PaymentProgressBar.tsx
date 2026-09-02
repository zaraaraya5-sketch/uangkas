import React from 'react';
import { useKas } from '../../context/KasContext';
import { CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

export const PaymentProgressBar: React.FC = () => {
  const { overview, settings, loginAsRole } = useKas();
  const percentage = Math.min(100, Math.round(overview.paymentPercentage));
  const activePaidCount = overview.paidStudentsCount + overview.partialStudentsCount;

  return (
    <section className="py-14 bg-gradient-to-b from-transparent to-slate-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-soft-lg relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-brand-50 rounded-full blur-2xl -z-10"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2 border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Target Kas Kelas {settings.className}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
                Progress Pembayaran Kas
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                <strong className="text-brand-600 font-semibold">{activePaidCount} dari {overview.totalStudents} siswa</strong> telah berpartisipasi membayar kas.
              </p>
            </div>

            <div className="text-right flex items-baseline md:flex-col md:items-end justify-between">
              <span className="text-4xl font-extrabold text-brand-600 tracking-tight">
                {percentage}%
              </span>
              <span className="text-xs text-slate-600 font-medium">
                {overview.paidStudentsCount} Siswa Lunas
              </span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="space-y-2">
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
              <div
                className="bg-gradient-to-r from-brand-500 via-brand-600 to-indigoSoft-500 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span>0 Siswa</span>
              <span className="font-medium text-slate-600">{activePaidCount} Siswa Aktif</span>
              <span>Target: {overview.totalStudents} Siswa</span>
            </div>
          </div>

          {/* Quick info row */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                {overview.paidStudentsCount}
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-800">Status Lunas</div>
                <div className="text-slate-600">Mencapai target Rp {settings.targetPerStudent.toLocaleString('id-ID')}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                {overview.partialStudentsCount}
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-800">Sebagian Dibayar</div>
                <div className="text-slate-600">Masih memiliki tunggakan</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                {overview.unpaidStudentsCount}
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-800">Belum Membayar</div>
                <div className="text-slate-600">Belum ada catatan pembayaran</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
