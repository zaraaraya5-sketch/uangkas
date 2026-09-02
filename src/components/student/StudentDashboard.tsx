import React from 'react';
import { useKas } from '../../context/KasContext';
import { StudentHeader } from './StudentHeader';
import { StudentPaymentCard } from './StudentPaymentCard';
import { MyPaymentHistory } from './MyPaymentHistory';
import { ClassLedgerTransparency } from './ClassLedgerTransparency';
import { StudentProfileView } from './StudentProfileView';
import { StudentMobileBottomNav } from './StudentMobileBottomNav';
import { Home, Wallet, Receipt, User, Sparkles } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { activeStudentTab, setActiveStudentTab } = useKas();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12">
      <StudentHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Desktop Tab Switcher */}
        <div className="hidden md:flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-soft w-fit">
          <button
            onClick={() => setActiveStudentTab('home')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeStudentTab === 'home'
                ? 'bg-brand-600 text-white shadow-soft'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Beranda Kas</span>
          </button>
          <button
            onClick={() => setActiveStudentTab('my-payments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeStudentTab === 'my-payments'
                ? 'bg-brand-600 text-white shadow-soft'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Pembayaran Saya</span>
          </button>
          <button
            onClick={() => setActiveStudentTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeStudentTab === 'ledger'
                ? 'bg-brand-600 text-white shadow-soft'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Transparansi Kas Kelas</span>
          </button>
          <button
            onClick={() => setActiveStudentTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeStudentTab === 'profile'
                ? 'bg-brand-600 text-white shadow-soft'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil & Cara Bayar</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeStudentTab === 'home' && (
          <div className="space-y-6 animate-fade-in">
            <StudentPaymentCard onOpenPayGuide={() => setActiveStudentTab('profile')} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <MyPaymentHistory />
              </div>
              <div className="lg:col-span-5">
                <ClassLedgerTransparency />
              </div>
            </div>
          </div>
        )}

        {activeStudentTab === 'my-payments' && (
          <div className="space-y-6 animate-fade-in">
            <StudentPaymentCard onOpenPayGuide={() => setActiveStudentTab('profile')} />
            <MyPaymentHistory />
          </div>
        )}

        {activeStudentTab === 'ledger' && (
          <div className="space-y-6 animate-fade-in">
            <ClassLedgerTransparency />
          </div>
        )}

        {activeStudentTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            <StudentProfileView />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <StudentMobileBottomNav />
    </div>
  );
};
