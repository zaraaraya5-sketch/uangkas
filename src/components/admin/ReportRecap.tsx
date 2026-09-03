import React, { useState } from 'react';
import { useKas } from '../../context/KasContext';
import { exportService } from '../../services/exportService';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Printer, 
  Sparkles 
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { StatCard } from '../common/StatCard';

export const ReportRecap: React.FC = () => {
  const { 
    studentSummaries, 
    payments, 
    expenses, 
    transactions, 
    overview, 
    settings,
    showToast
  } = useKas();

  const [periodFilter, setPeriodFilter] = useState<'Mingguan' | 'Bulanan' | 'Semester' | 'Tahunan'>('Bulanan');

  const handleExportExcel = () => {
    try {
      exportService.exportToExcel(
        studentSummaries,
        payments,
        expenses,
        transactions,
        overview,
        settings
      );
      showToast({
        type: 'success',
        title: '✓ File Excel berhasil diunduh',
        message: 'Laporan keuangan kas kelas siap dibuka di Microsoft Excel / Spreadsheet.',
      });
    } catch (e) {
      console.error(e);
      showToast({
        type: 'error',
        title: 'Gagal mengunduh Excel',
        message: 'Terjadi kendala saat menghasilkan file spreadsheet.',
      });
    }
  };

  const handleExportPDF = () => {
    try {
      exportService.exportToPDF(
        studentSummaries,
        transactions,
        overview,
        settings,
        `Periode ${periodFilter}`
      );
      showToast({
        type: 'success',
        title: '✓ Laporan PDF berhasil dibuat',
        message: 'File PDF resmi siap dicetak atau dibagikan ke grup kelas.',
      });
    } catch (e) {
      console.error(e);
      showToast({
        type: 'error',
        title: 'Gagal mengunduh PDF',
        message: 'Terjadi kendala saat menyusun dokumen PDF.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-600 shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Rekapitulasi Keuangan Kas Kelas
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan pembukuan resmi dan unduh arsip laporan kas {settings.className}
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-emerald-200 transition-all w-full sm:w-auto"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>Download Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-brand-200 transition-all w-full sm:w-auto"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Download PDF Resmi</span>
          </button>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div className="w-full overflow-x-auto pb-1 -mb-1">
        <div className="inline-flex items-center gap-1 sm:gap-2 bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200/80 shadow-soft min-w-max">
          <span className="text-xs font-bold text-slate-400 px-2 sm:px-3 flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            Filter Periode:
          </span>
          {(['Mingguan', 'Bulanan', 'Semester', 'Tahunan'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setPeriodFilter(period)}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                periodFilter === period
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Pemasukan"
          value={formatRupiah(overview.totalIncome)}
          subtitle="Iuran kas masuk"
          icon={TrendingUp}
          variant="success"
        />

        <StatCard
          title="Total Pengeluaran"
          value={formatRupiah(overview.totalExpense)}
          subtitle="Belanja keperluan kelas"
          icon={TrendingDown}
          variant="danger"
        />

        <StatCard
          title="Saldo Akhir Kas"
          value={formatRupiah(overview.currentBalance)}
          subtitle="Saldo kas bersih"
          icon={Wallet}
          variant="primary"
        />

        <StatCard
          title="Jumlah Siswa Lunas"
          value={`${overview.paidStudentsCount} Siswa`}
          subtitle={`Mencapai target ${formatRupiah(settings.targetPerStudent)}`}
          icon={CheckCircle2}
          variant="indigo"
        />

        <StatCard
          title="Siswa Belum Lunas"
          value={`${overview.partialStudentsCount + overview.unpaidStudentsCount} Siswa`}
          subtitle={`${overview.partialStudentsCount} sebagian, ${overview.unpaidStudentsCount} belum bayar`}
          icon={Users}
          variant="warning"
        />
      </div>

      {/* Printable Report Preview Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/80 shadow-soft space-y-6">
        <div className="border-b border-slate-200 pb-5 text-center">
          <h2 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight">
            LEMBAR LAPORAN PERTANGGUNGJAWABAN KAS KELAS
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-brand-600 mt-0.5">
            KELAS {settings.className} — TAHUN AJARAN {settings.academicYear}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            Periode: <strong>{periodFilter}</strong> • Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
          </p>
        </div>

        {/* Structured Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-xs">
          {/* Income Breakdown */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2.5">
            <h4 className="font-bold text-emerald-800 uppercase tracking-wider flex flex-wrap items-center justify-between gap-1">
              <span>Pemasukan Iuran Kas Siswa</span>
              <span className="font-bold">{formatRupiah(overview.totalIncome)}</span>
            </h4>
            <div className="space-y-1.5 text-slate-600 pt-1">
              <div className="flex justify-between items-center gap-2">
                <span>Target Iuran per Siswa:</span>
                <span className="font-semibold text-slate-800">{formatRupiah(settings.targetPerStudent)}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Total Siswa Terdaftar:</span>
                <span className="font-semibold text-slate-800">{overview.totalStudents} Siswa</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Siswa Lunas:</span>
                <span className="font-semibold text-emerald-700">{overview.paidStudentsCount} Siswa ({overview.paymentPercentage.toFixed(0)}%)</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Siswa Sebagian / Menunggak:</span>
                <span className="font-semibold text-amber-700">{overview.partialStudentsCount + overview.unpaidStudentsCount} Siswa</span>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2.5">
            <h4 className="font-bold text-rose-800 uppercase tracking-wider flex flex-wrap items-center justify-between gap-1">
              <span>Pengeluaran & Belanja Kas</span>
              <span className="font-bold">{formatRupiah(overview.totalExpense)}</span>
            </h4>
            <div className="space-y-1.5 text-slate-600 pt-1">
              <div className="flex justify-between items-center gap-2">
                <span>Total Transaksi Pengeluaran:</span>
                <span className="font-semibold text-slate-800">{expenses.length} Kegiatan/Belanja</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Kategori Terbanyak:</span>
                <span className="font-semibold text-slate-800 text-right">Peralatan & Keperluan Kelas</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span>Sisa Saldo Kas Kelas:</span>
                <span className="font-bold text-brand-600 text-sm">{formatRupiah(overview.currentBalance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Signatures preview */}
        <div className="pt-6 sm:pt-8 border-t border-slate-100 grid grid-cols-2 gap-4 text-center text-xs text-slate-600">
          <div>
            <p>Mengetahui,</p>
            <p className="font-semibold text-slate-800 mt-1">Ketua Kelas</p>
            <div className="h-12 sm:h-16"></div>
            <p className="font-bold text-slate-900 underline truncate">{settings.classPresident}</p>
            <p className="text-[10px] text-slate-400">NIS: 24110304</p>
          </div>

          <div>
            <p>Dilaporkan Oleh,</p>
            <p className="font-semibold text-slate-800 mt-1">Bendahara Kas Kelas</p>
            <div className="h-12 sm:h-16"></div>
            <p className="font-bold text-slate-900 underline truncate">{settings.treasurer1}</p>
            <p className="text-[10px] text-slate-400">NIS: 24110343</p>
          </div>
        </div>
      </div>
    </div>
  );
};
