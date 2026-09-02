import React, { useState } from 'react';
import { useKas } from '../../context/KasContext';
import { ShieldCheck, UserCheck, GraduationCap, Globe, RefreshCw, ChevronDown, Sparkles } from 'lucide-react';

export const QuickRoleSwitcher: React.FC = () => {
  const { currentView, setCurrentView, currentUser, loginAsRole, students, resetDataToDefault } = useKas();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('std-06');

  return (
    <aside aria-label="Demo role selector" className="fixed bottom-4 left-4 z-40">
      <div className="relative">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/90 hover:bg-slate-900 text-white rounded-full shadow-soft-lg text-xs font-medium backdrop-blur-md border border-slate-700/60 transition-all hover:scale-105"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Role: <strong className="text-brand-300 font-semibold uppercase">{currentView === 'landing' ? 'Landing (Publik)' : currentUser?.role || currentView}</strong></span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute bottom-12 left-0 w-72 bg-white rounded-2xl p-3 shadow-soft-xl border border-slate-200 animate-scale-in text-slate-800">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Simulasi Akun & Device
              </span>
              <button
                onClick={() => {
                  if (window.confirm('Reset data kas ke awal 45 siswa XI PPLG 3?')) {
                    resetDataToDefault();
                    setIsOpen(false);
                  }
                }}
                className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1"
                title="Reset data ke dummy awal"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="space-y-1">
              {/* Landing Page */}
              <button
                onClick={() => {
                  setCurrentView('landing');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                  currentView === 'landing'
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="leading-tight">Landing Page Publik</div>
                  <div className="text-[10px] text-slate-400">Tampilan luar untuk umum & siswa</div>
                </div>
              </button>

              {/* Admin / Bendahara */}
              <button
                onClick={() => {
                  loginAsRole('admin');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                  currentView === 'admin' && currentUser?.role === 'admin'
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="leading-tight">Bendahara (Admin Full)</div>
                  <div className="text-[10px] text-slate-400">Siti Rahmawati — CRUD Penuh</div>
                </div>
              </button>

              {/* Ketua Kelas */}
              <button
                onClick={() => {
                  loginAsRole('ketua_kelas');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                  currentView === 'admin' && currentUser?.role === 'ketua_kelas'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="leading-tight">Ketua Kelas</div>
                  <div className="text-[10px] text-slate-400">Ahmad Fauzi — Monitoring & Laporan</div>
                </div>
              </button>

              {/* Student View */}
              <div className="pt-2 mt-1 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5 px-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-brand-500" />
                  Pilih Siswa (Student View):
                </div>
                <div className="flex gap-1.5">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:border-brand-500"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.gender})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      loginAsRole('siswa', selectedStudentId);
                      setIsOpen(false);
                    }}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shrink-0 shadow-sm"
                  >
                    Buka
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
