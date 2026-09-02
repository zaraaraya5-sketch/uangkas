import React from 'react';
import { useKas } from '../../context/KasContext';
import { Wallet, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { StatCard } from '../common/StatCard';

export const LiveCashOverview: React.FC = () => {
  const { overview } = useKas();

  return (
    <section id="statistik" className="py-12 bg-white/60 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Realtime Live Overview</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Ringkasan Keuangan Kas Kelas
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Data terhitung otomatis dan terhubung langsung dari pembukuan bendahara
          </p>
        </div>

        {/* 4 Core Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Saldo Kas Saat Ini"
            value={formatRupiah(overview.currentBalance)}
            subtitle="Pemasukan dikurangi Pengeluaran"
            icon={Wallet}
            variant="primary"
          />

          <StatCard
            title="Total Pemasukan"
            value={formatRupiah(overview.totalIncome)}
            subtitle="Iuran kas seluruh siswa"
            icon={TrendingUp}
            variant="success"
          />

          <StatCard
            title="Total Pengeluaran"
            value={formatRupiah(overview.totalExpense)}
            subtitle="Keperluan & peralatan kelas"
            icon={TrendingDown}
            variant="danger"
          />

          <StatCard
            title="Pembayaran Siswa"
            value={`${overview.paidStudentsCount + overview.partialStudentsCount} / ${overview.totalStudents} Siswa`}
            subtitle={`${overview.paidStudentsCount} Lunas, ${overview.partialStudentsCount} Sebagian`}
            icon={Users}
            variant="indigo"
          />
        </div>
      </div>
    </section>
  );
};
