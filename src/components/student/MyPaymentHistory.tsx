import React from 'react';
import { useKas } from '../../context/KasContext';
import { CheckCircle2, Calendar, CreditCard, Tag, ArrowDownLeft } from 'lucide-react';
import { formatRupiah, formatDateFull } from '../../utils/formatters';

export const MyPaymentHistory: React.FC = () => {
  const { currentUser, payments } = useKas();

  const studentId = currentUser?.studentId || 'std-06';
  const myPayments = payments
    .filter((p) => p.studentId === studentId)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Riwayat Pembayaran Saya</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh setoran kas yang telah dicatat oleh bendahara
          </p>
        </div>
        <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-semibold border border-brand-200/60">
          {myPayments.length} Pembayaran
        </span>
      </div>

      {myPayments.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-700">Belum Ada Riwayat Pembayaran</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            Anda belum memiliki catatan setoran kas. Silakan hubungi bendahara kelas untuk melakukan pembayaran kas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {myPayments.map((p, index) => (
            <div
              key={p.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 transition-all gap-3"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-800">
                      {p.description || (p.monthName ? `Kas Bulan ${p.monthName}` : `Setoran Kas ke-${myPayments.length - index}`)}
                    </h4>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Berhasil
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateFull(p.paymentDate)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      Metode: {p.paymentMethod}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                <div className="text-base font-extrabold text-emerald-600">
                  +{formatRupiah(p.amount)}
                </div>
                <span className="text-[11px] text-slate-400">
                  Dicatat oleh {p.createdBy || 'Bendahara'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
