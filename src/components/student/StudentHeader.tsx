import React from 'react';
import { useKas } from '../../context/KasContext';
import { LogOut, ArrowLeft, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { LivePulseIndicator } from '../common/LivePulseIndicator';

export const StudentHeader: React.FC = () => {
  const { currentUser, settings, setCurrentView, logout } = useKas();

  const firstName = currentUser?.name?.split(' ')[0] || 'Siswa';

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between">
          {/* Left: Back / Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('landing')}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="Kembali ke Landing Page"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">KasKelas</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-brand-50 text-brand-700 border border-brand-200/60">
                  {settings.className}
                </span>
              </div>
              <p className="text-xs text-slate-500">Student Portal</p>
            </div>
          </div>

          {/* Right: Live Sync & Profile Button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <LivePulseIndicator />
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                {firstName.substring(0, 2).toUpperCase()}
              </div>

              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser?.name || 'Siswa'}
                </div>
                <div className="text-[10px] text-slate-400">XI PPLG 3</div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
