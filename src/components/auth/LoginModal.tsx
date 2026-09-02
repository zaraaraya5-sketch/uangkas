import React, { useState } from 'react';
import { useKas } from '../../context/KasContext';
import { X, Lock, User as UserIcon, Shield, ArrowRight, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'bendahara' | 'admin' | string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, defaultRole = 'bendahara' }) => {
  const { loginWithCredentials } = useKas();
  const [activeRole, setActiveRole] = useState<'bendahara' | 'admin'>(defaultRole === 'admin' ? 'admin' : 'bendahara');
  const [bendaharaSelection, setBendaharaSelection] = useState<'bendahara1' | 'bendahara2'>('bendahara1');
  const [username, setUsername] = useState(defaultRole === 'admin' ? 'adminkas' : 'bendahara 1');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleRoleTabChange = (newRole: 'bendahara' | 'admin') => {
    setActiveRole(newRole);
    setErrorMessage(null);
    if (newRole === 'admin') {
      setUsername('adminkas');
      setPassword('');
    } else {
      if (bendaharaSelection === 'bendahara1') {
        setUsername('bendahara 1');
      } else {
        setUsername('bendahara 2');
      }
      setPassword('');
    }
  };

  const handleBendaharaSelect = (sub: 'bendahara1' | 'bendahara2') => {
    setBendaharaSelection(sub);
    setErrorMessage(null);
    if (sub === 'bendahara1') {
      setUsername('bendahara 1');
    } else {
      setUsername('bendahara 2');
    }
    setPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const result = loginWithCredentials(
      username,
      password,
      'admin'
    );

    setIsLoading(false);

    if (result.success) {
      setPassword('');
      setErrorMessage(null);
      onClose();
    } else {
      setErrorMessage(result.message || 'Gagal masuk. Periksa kembali username dan password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-soft-xl border border-slate-100 animate-scale-in relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 mb-3 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Masuk KasKelas XI PPLG 3</h3>
          <p className="text-xs text-slate-500 mt-1">
            Autentikasi akun resmi Bendahara & Admin Kas
          </p>
        </div>

        {/* Main 2 Role Tabs: Bendahara & Admin */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => handleRoleTabChange('bendahara')}
            className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeRole === 'bendahara'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>💰 Bendahara</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('admin')}
            className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeRole === 'admin'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>⚡ Admin Kas</span>
          </button>
        </div>

        {/* Bendahara 1 & 2 Quick Selection if in Bendahara mode */}
        {activeRole === 'bendahara' && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => handleBendaharaSelect('bendahara1')}
              className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                bendaharaSelection === 'bendahara1'
                  ? 'bg-brand-50/80 border-brand-300 text-brand-900 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-[10px] text-brand-600 font-semibold uppercase">Bendahara 1</div>
              <div className="font-bold truncate mt-0.5">Lulu Maulida</div>
            </button>

            <button
              type="button"
              onClick={() => handleBendaharaSelect('bendahara2')}
              className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                bendaharaSelection === 'bendahara2'
                  ? 'bg-brand-50/80 border-brand-300 text-brand-900 font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-[10px] text-brand-600 font-semibold uppercase">Bendahara 2</div>
              <div className="font-bold truncate mt-0.5">Habib Ramadhan</div>
            </button>
          </div>
        )}

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Username
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-soft hover:shadow-soft-lg transition-all flex items-center justify-center gap-2 group"
            >
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Dashboard Kas'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
