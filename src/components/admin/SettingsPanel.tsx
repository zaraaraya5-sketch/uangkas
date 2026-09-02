import React, { useState, useEffect } from 'react';
import { useKas } from '../../context/KasContext';
import { 
  Settings, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  Save, 
  Copy, 
  Check, 
  Shield, 
  Zap, 
  Sliders 
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  SUPABASE_SQL_SCHEMA 
} from '../../services/supabaseClient';

export const SettingsPanel: React.FC = () => {
  const { settings, updateSettings, resetDataToDefault, showToast } = useKas();

  // Class settings form
  const [className, setClassName] = useState(settings.className);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [targetPerStudent, setTargetPerStudent] = useState<number>(settings.targetPerStudent || 25000);
  const [monthlyFee, setMonthlyFee] = useState<number>(settings.monthlyFee || 5000);
  const [totalMonths, setTotalMonths] = useState<number>(settings.totalMonths || 5);
  const [homeroomTeacher, setHomeroomTeacher] = useState(settings.homeroomTeacher);
  const [classPresident, setClassPresident] = useState(settings.classPresident);
  const [treasurer1, setTreasurer1] = useState(settings.treasurer1);
  const [treasurer2, setTreasurer2] = useState(settings.treasurer2);

  // Supabase cloud config
  const initialCloudConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(initialCloudConfig.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialCloudConfig.anonKey);
  const [isCopiedSql, setIsCopiedSql] = useState(false);

  // Auto calculate target when monthly fee or total months change
  const handleMonthlyFeeChange = (val: number) => {
    setMonthlyFee(val);
    setTargetPerStudent(val * totalMonths);
  };

  const handleTotalMonthsChange = (val: number) => {
    setTotalMonths(val);
    setTargetPerStudent(monthlyFee * val);
  };

  const handleSaveClassSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      className,
      academicYear,
      targetPerStudent: Number(targetPerStudent),
      monthlyFee: Number(monthlyFee),
      totalMonths: Number(totalMonths),
      homeroomTeacher,
      classPresident,
      treasurer1,
      treasurer2,
    });
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    showToast({
      type: 'success',
      title: '✓ Konfigurasi Supabase Tersimpan',
      message: supabaseUrl ? 'Koneksi database remote telah dikonfigurasi.' : 'Koneksi kembali ke local realtime sync.',
    });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setIsCopiedSql(true);
    showToast({
      type: 'info',
      title: '✓ SQL Schema Tersalin',
      message: 'Tempelkan di Supabase SQL Editor untuk membuat tabel dan realtime channel.',
    });
    setTimeout(() => setIsCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Class Target & Info Settings */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
          <Sliders className="w-5 h-5 text-brand-600" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Pengaturan Kas & Struktur Kelas
            </h3>
            <p className="text-xs text-slate-400">
              Ubah nama kelas, target iuran, besaran bulanan (Rp 5.000/bulan), dan pengurus kelas
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveClassSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Kelas
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tahun Ajaran
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Iuran Kas Bulanan (Rp)
              </label>
              <input
                type="number"
                min={1000}
                step={500}
                value={monthlyFee}
                onChange={(e) => handleMonthlyFeeChange(Number(e.target.value))}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800 font-semibold"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Contoh: Rp 5.000 / bulan</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jumlah Bulan (Periode)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={totalMonths}
                onChange={(e) => handleTotalMonthsChange(Number(e.target.value))}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Contoh: 5 Bulan (Semester Ganjil)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Kas Total per Siswa (Rp)
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={targetPerStudent}
                onChange={(e) => setTargetPerStudent(Number(e.target.value))}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800 font-bold text-brand-600"
                required
              />
              <span className="text-[10px] text-emerald-600 font-medium mt-1 block">
                = {totalMonths} Bulan × Rp {monthlyFee.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Wali Kelas
              </label>
              <input
                type="text"
                value={homeroomTeacher}
                onChange={(e) => setHomeroomTeacher(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ketua Kelas
              </label>
              <input
                type="text"
                value={classPresident}
                onChange={(e) => setClassPresident(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Bendahara 1
              </label>
              <input
                type="text"
                value={treasurer1}
                onChange={(e) => setTreasurer1(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-brand-200 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Kelas</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Supabase Realtime Cloud Integration */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Koneksi Database Supabase & Realtime
              </h3>
              <p className="text-xs text-slate-400">
                Hubungkan dengan project Supabase PostgreSQL Anda untuk sinkronisasi cloud penuh
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Multi-Tab Realtime Aktif
          </span>
        </div>

        <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Supabase Project URL
            </label>
            <input
              type="url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 text-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Supabase Anon Public API Key
            </label>
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 text-slate-800 font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-slate-400">
              *Aplikasi bekerja secara realtime antar-tab dan window secara default.
            </p>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-emerald-200 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Kredensial Supabase</span>
            </button>
          </div>
        </form>

        {/* SQL Schema Preview */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">
              Script Supabase SQL Schema (DDL & Realtime Table)
            </span>
            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-semibold px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 transition-colors"
            >
              {isCopiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
            </button>
          </div>
          <pre className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-48">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>
      </div>

      {/* 3. Demo Data Reset */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800">
            Reset Data KasKelas (45 Siswa XI PPLG 3)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Kembalikan seluruh data siswa, transaksi, dan target kas bulanan (Rp 5.000/bulan) ke format awal.
          </p>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Apakah Anda yakin ingin mereset data ke format awal Rp 5.000/bulan untuk 45 siswa?')) {
              resetDataToDefault();
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset ke Data Awal</span>
        </button>
      </div>
    </div>
  );
};
