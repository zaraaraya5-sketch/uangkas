import React from 'react';
import { Eye, ShieldCheck, RefreshCw, Zap, Users, Smartphone } from 'lucide-react';

export const TransparencySection: React.FC = () => {
  return (
    <section id="transparansi" className="py-16 bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fondasi Kepercayaan Kelas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Transparan, Terorganisir, dan Terhubung
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Dirancang khusus untuk mendukung keterbukaan tata kelola keuangan kelas XI PPLG 3
          </p>
        </div>

        {/* 3 Main Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 1. Transparan */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-soft hover-card">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center mb-6">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Transparan</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Seluruh aktivitas keuangan, baik pemasukan dari iuran maupun pengeluaran untuk kebutuhan kelas dapat dipantau oleh setiap siswa secara terbuka kapan saja.
            </p>
          </div>

          {/* 2. Terorganisir */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-soft hover-card">
            <div className="w-12 h-12 rounded-2xl bg-indigoSoft-50 text-indigoSoft-600 border border-indigoSoft-100 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Terorganisir</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Semua transaksi tercatat rapi dengan tanggal, kategori, dan metode pembayaran (Tunai & Transfer Bank/E-Wallet). Laporan dapat diunduh otomatis dalam format PDF dan Excel.
            </p>
          </div>

          {/* 3. Terhubung */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-soft hover-card">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-6">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Terhubung</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Satu database tunggal dengan sistem sinkronisasi realtime. Setiap perubahan dari bendahara di laptop akan langsung muncul di ponsel siswa tanpa perlu refresh halaman.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
