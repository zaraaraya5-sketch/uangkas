import React from 'react';
import { useKas, AdminTab } from '../../context/KasContext';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Receipt, 
  TrendingDown, 
  BarChart3, 
  Settings, 
  Sparkles, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  Globe,
  ExternalLink
} from 'lucide-react';

interface AdminSidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const { activeAdminTab, setActiveAdminTab, currentUser, settings, setCurrentView, logout } = useKas();

  const menuItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Data Siswa (45)', icon: Users },
    { id: 'payments', label: 'Pembayaran Kas', icon: Wallet },
    { id: 'expenses', label: 'Pengeluaran Kas', icon: TrendingDown },
    { id: 'transactions', label: 'Buku Transaksi', icon: Receipt },
    { id: 'reports', label: 'Rekapitulasi', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan & Cloud', icon: Settings },
  ];

  const handleSelect = (tab: AdminTab) => {
    setActiveAdminTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-300 ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Top: Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigoSoft-600 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-slate-900 leading-none">KasKelas</span>
              </div>
              <span className="text-xs font-bold text-brand-600 tracking-wide mt-1 block">
                {settings.className}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeAdminTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-xs border border-brand-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-brand-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Public view shortcut */}
        <div className="px-3 pt-2">
          <button
            onClick={() => setCurrentView('landing')}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-brand-600 hover:bg-slate-50 transition-colors border border-dashed border-slate-200"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Lihat Landing Page</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Bottom: Profile & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {currentUser?.name?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate leading-tight">
                {currentUser?.name || 'Administrator'}
              </div>
              <div className="text-[10px] text-brand-600 font-medium truncate flex items-center gap-1 mt-0.5">
                {isAdmin ? (
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                ) : (
                  <UserCheck className="w-3 h-3 text-indigoSoft-500" />
                )}
                <span>{isAdmin ? 'Bendahara (Admin)' : 'Ketua Kelas'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
