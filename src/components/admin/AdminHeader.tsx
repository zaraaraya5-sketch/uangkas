import React from 'react';
import { useKas } from '../../context/KasContext';
import { Menu } from 'lucide-react';
import { LivePulseIndicator } from '../common/LivePulseIndicator';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  onOpenPaymentModal?: () => void;
  onOpenExpenseModal?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleSidebar,
}) => {
  const { activeAdminTab, settings } = useKas();

  const getTitle = () => {
    switch (activeAdminTab) {
      case 'dashboard':
        return { title: 'Dashboard Manajemen Kas', desc: `Ringkasan keuangan dan performa iuran kelas ${settings.className}` };
      case 'students':
        return { title: 'Data Siswa & Status Pembayaran', desc: `Manajemen 45 siswa kelas ${settings.className}` };
      case 'payments':
        return { title: 'Pembayaran Iuran Kas', desc: 'Pencatatan dan riwayat pemasukan iuran siswa' };
      case 'expenses':
        return { title: 'Pengeluaran Kas Kelas', desc: 'Pencatatan belanja keperluan, alat, dan kegiatan kelas' };
      case 'transactions':
        return { title: 'Buku Kas & Riwayat Transaksi', desc: 'Mutasi lengkap pemasukan dan pengeluaran kas' };
      case 'reports':
        return { title: 'Rekapitulasi & Laporan Keuangan', desc: 'Analisis periode dan ekspor data ke PDF / Excel' };
      case 'settings':
        return { title: 'Pengaturan Kelas & Supabase Sync', desc: 'Konfigurasi target kas, struktur bendahara, dan database realtime' };
      default:
        return { title: 'Admin KasKelas', desc: settings.className };
    }
  };

  const headerInfo = getTitle();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3.5 sm:px-6 lg:px-8 py-3 sm:py-3.5">
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Mobile Toggle & Tab Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 shrink-0"
            aria-label="Buka Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-800 leading-tight truncate">
              {headerInfo.title}
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block mt-0.5 truncate">
              {headerInfo.desc}
            </p>
          </div>
        </div>

        {/* Right: Live Realtime Indicator */}
        <div className="flex items-center shrink-0">
          <LivePulseIndicator />
        </div>
      </div>
    </header>
  );
};
