import React from 'react';
import { useKas } from '../../context/KasContext';
import { User, CreditCard, Shield, CheckCircle2, Phone, School, Award, Sparkles } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

export const StudentProfileView: React.FC = () => {
  const { currentUser, studentSummaries, settings } = useKas();

  const studentData = studentSummaries.find(
    (s) => s.id === currentUser?.studentId || s.name === currentUser?.name
  ) || studentSummaries[5];

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigoSoft-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-soft-lg">
            {studentData.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-800">{studentData.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">NIS: {studentData.nis} • Kelas: {settings.className}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-200/60">
                Siswa Aktif
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                Tahun Ajaran {settings.academicYear}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Wali Kelas</span>
            <div className="text-sm font-bold text-slate-800">{settings.homeroomTeacher}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Ketua Kelas</span>
            <div className="text-sm font-bold text-slate-800">{settings.classPresident}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Bendahara 1 (Penerimaan Kas)</span>
            <div className="text-sm font-bold text-slate-800">{settings.treasurer1}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Bendahara 2</span>
            <div className="text-sm font-bold text-slate-800">{settings.treasurer2}</div>
          </div>
        </div>
      </div>

      {/* Payment Guide Card (Tunai & Transfer) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigoSoft-950 text-white rounded-3xl p-6 sm:p-8 shadow-soft-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium backdrop-blur-sm">
              <CreditCard className="w-3.5 h-3.5 text-brand-300" />
              <span>Metode Pembayaran Kas</span>
            </div>
            <h4 className="text-xl font-bold">Cara Bayar Kas {settings.className}</h4>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              Pembayaran kas sebesar <strong>{formatRupiah(settings.monthlyFee || 5000)}/bulan</strong> dapat dilakukan secara langsung atau transfer:
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 text-left list-disc list-inside pt-1">
              <li><strong>Tunai</strong>: Setor langsung ke Bendahara ({settings.treasurer1})</li>
              <li><strong>Transfer / E-Wallet</strong>: Kirim ke Rekening/Dana/GoPay/OVO Bendahara Kelas</li>
            </ul>
          </div>

          {/* Transfer & Cash Info Graphic */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 shrink-0 text-center text-white min-w-[200px]">
            <div className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-1">
              Setoran Kas Kelas
            </div>
            <div className="text-lg font-extrabold text-white">
              Tunai & Transfer
            </div>
            <div className="text-[11px] text-slate-300 mt-2 pt-2 border-t border-white/10">
              Konfirmasi langsung ke Bendahara setelah transfer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
