import React, { useState, useEffect } from 'react';
import { useKas } from '../../context/KasContext';
import { Shield, LogIn, Menu, X, Sparkles } from 'lucide-react';
import { LivePulseIndicator } from '../common/LivePulseIndicator';

interface NavbarProps {
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin }) => {
  const { setCurrentView } = useKas();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-soft border-b border-slate-200/80 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                  KasKelas
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-brand-50 text-brand-700 border border-brand-200/60">
                  XI PPLG 3
                </span>
              </div>
              <p className="text-[10px] text-slate-600 font-medium tracking-wide">
                SMK TI REKAYASA PERANGKAT LUNAK
              </p>
            </div>
          </div>

          {/* Center Navigation Menu (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#beranda" className="hover:text-brand-600 transition-colors">
              Beranda
            </a>
            <a href="#statistik" className="hover:text-brand-600 transition-colors">
              Tentang Kas
            </a>
            <a href="#transparansi" className="hover:text-brand-600 transition-colors">
              Transparansi
            </a>
            <a href="#transaksi" className="hover:text-brand-600 transition-colors">
              Aktivitas Kas
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <LivePulseIndicator />

            <button
              onClick={onOpenLogin}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-soft hover:shadow-soft-lg transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Admin</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-4 pt-4 border-t border-slate-200/80 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-soft-lg space-y-3 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500">Status Sistem:</span>
              <LivePulseIndicator />
            </div>
            <a
              href="#beranda"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-brand-600 py-1"
            >
              Beranda
            </a>
            <a
              href="#statistik"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-brand-600 py-1"
            >
              Tentang Kas
            </a>
            <a
              href="#transparansi"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-brand-600 py-1"
            >
              Transparansi
            </a>
            <a
              href="#transaksi"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-brand-600 py-1"
            >
              Aktivitas Kas
            </a>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-xl text-center flex items-center justify-center gap-1.5 shadow-soft"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk Admin</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
