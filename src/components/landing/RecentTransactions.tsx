import React from 'react';
import { useKas } from '../../context/KasContext';
import { ArrowDownLeft, ArrowUpRight, Clock, ArrowRight } from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/formatters';

interface RecentTransactionsProps {
  onOpenTransactions?: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ onOpenTransactions }) => {
  const { transactions } = useKas();
  const recentList = transactions.slice(0, 6);

  return (
    <section id="transaksi" className="py-14 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Aktivitas Kas Terkini</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Transaksi Kas Terbaru
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Catatan mutasi pemasukan dan pengeluaran secara realtime
            </p>
          </div>

          {onOpenTransactions && (
            <button
              onClick={onOpenTransactions}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            >
              <span>Lihat Semua Transaksi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Transactions Grid / List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentList.map((tx) => {
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-all hover-card"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-100/70 text-emerald-600 border border-emerald-200/60'
                        : 'bg-rose-100/70 text-rose-600 border border-rose-200/60'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 truncate">
                      {tx.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{formatDate(tx.date)}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-medium">
                        {tx.category || tx.method || 'Kas'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <div
                    className={`text-sm font-bold ${
                      isIncome ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {tx.method ? `via ${tx.method}` : 'Oleh Bendahara'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
