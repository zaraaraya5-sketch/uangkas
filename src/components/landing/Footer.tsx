import React from 'react';
import { useKas } from '../../context/KasContext';
import { Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings } = useKas();

  return (
    <footer className="bg-white border-t border-slate-200 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900">KasKelas</span>
              <span className="mx-2 text-slate-300">•</span>
              <span className="text-sm font-semibold text-brand-600">{settings.className}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center sm:text-right flex items-center gap-1">
            <span>Dikelola oleh Tim Bendahara & Siswa {settings.className}</span>
            <span className="text-slate-300">|</span>
            <span>Tahun Ajaran {settings.academicYear}</span>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} KasKelas XI PPLG 3. Hak Cipta Dilindungi.</p>
          <p>Uang kas yang transparan, mudah, dan terhubung.</p>
        </div>
      </div>
    </footer>
  );
};
