import React from 'react';
import { useKas, StudentTab } from '../../context/KasContext';
import { Home, Wallet, Receipt, User } from 'lucide-react';

export const StudentMobileBottomNav: React.FC = () => {
  const { activeStudentTab, setActiveStudentTab } = useKas();

  const navItems: { id: StudentTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'my-payments', label: 'Kas Saya', icon: Wallet },
    { id: 'ledger', label: 'Riwayat Kas', icon: Receipt },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-2 shadow-soft-xl">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeStudentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveStudentTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 min-w-[64px] ${
                isActive
                  ? 'text-brand-600 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-700 font-medium'
              }`}
            >
              <div
                className={`w-10 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? 'bg-brand-100 text-brand-700' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
