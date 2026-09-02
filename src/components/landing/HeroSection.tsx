import React from 'react';
import { useKas } from '../../context/KasContext';
import { Shield, ArrowRight, Sparkles, TrendingUp, CheckCircle2, DollarSign, LogIn } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

interface HeroSectionProps {
  onOpenAdminLogin: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  onOpenAdminLogin, 
}) => {
  const { overview, settings } = useKas();

  return (
    <section id="beranda" className="relative pt-6 pb-16 md:py-20 overflow-hidden">
      {/* Background soft glow / mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-brand-100/40 via-indigoSoft-100/30 to-emerald-100/30 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200/70 text-brand-700 text-xs font-semibold shadow-xs animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Platform Manajemen Keuangan Kas Kelas</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Uang Kas Kelas,{' '}
                <span className="bg-gradient-to-r from-brand-600 to-indigoSoft-600 bg-clip-text text-transparent">
                  Lebih Transparan
                </span>{' '}
                dan Terorganisir.
              </h1>
              <p className="text-lg font-semibold text-brand-600">
                {settings.className} — SMK NEGERI 1 CIOMAS PPLG
              </p>
            </div>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Pantau pemasukan, pengeluaran, saldo kas, dan aktivitas keuangan kelas{' '}
              <span className="font-semibold text-slate-800">{settings.className}</span> dalam satu sistem yang terhubung secara realtime antar perangkat.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onOpenAdminLogin}
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-soft-lg hover:shadow-slate-400 transition-all flex items-center justify-center gap-2.5 text-base group"
              >
                <LogIn className="w-5 h-5 text-brand-400" />
                <span>Masuk Admin & Bendahara</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Micro proof badges */}
            <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>45 Siswa Terdaftar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Multi-Device Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Export PDF & Excel</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive App Preview Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              {/* Decorative background glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-indigoSoft-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-100 transition duration-1000"></div>

              {/* Main Preview Container */}
              <div className="relative bg-white rounded-3xl p-6 shadow-soft-xl border border-slate-100/80">
                {/* Header of card */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      KK
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Kas {settings.className}</h4>
                      <p className="text-[11px] text-slate-400">Live Realtime Dashboard</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Aktif
                  </span>
                </div>

                {/* Balance display inside preview */}
                <div className="my-5 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-soft">
                  <span className="text-[11px] text-slate-300 font-medium uppercase tracking-wider">
                    Saldo Kas Saat Ini
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
                    {formatRupiah(overview.currentBalance)}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/60 text-xs">
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Pemasukan: {formatRupiah(overview.totalIncome)}
                    </span>
                    <span className="text-slate-300">
                      {overview.paidStudentsCount}/{overview.totalStudents} Lunas
                    </span>
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Pengeluaran</span>
                    <div className="text-sm font-bold text-rose-600 mt-0.5">
                      {formatRupiah(overview.totalExpense)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Capaian Kas</span>
                    <div className="text-sm font-bold text-brand-600 mt-0.5">
                      {overview.paymentPercentage.toFixed(0)}% Selesai
                    </div>
                  </div>
                </div>

                {/* Action button inside preview */}
                <button
                  onClick={onOpenAdminLogin}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-soft transition-colors flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-brand-400" />
                  <span>Buka Dashboard Kas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
