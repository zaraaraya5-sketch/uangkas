import React, { useState, useMemo } from 'react';
import { useKas } from '../../context/KasContext';
import { Search, Filter, ArrowDownLeft, ArrowUpRight, Shield, Calendar, Sparkles } from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/formatters';

export const ClassLedgerTransparency: React.FC = () => {
  const { transactions, overview, settings } = useKas();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = filterType === 'all' || t.type === filterType;
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [transactions, filterType, searchQuery]);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-1 border border-emerald-100">
            <Shield className="w-3.5 h-3.5" />
            <span>Keterbukaan Kas Kelas {settings.className}</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800">Buku Kas & Transparansi Keuangan</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Semua catatan pemasukan dan pengeluaran kas kelas yang sah
          </p>
        </div>

        {/* Small Summary Pill */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 text-xs">
          <div className="px-2.5 py-1 rounded-xl bg-white text-emerald-600 font-bold shadow-xs">
            Masuk: {formatRupiah(overview.totalIncome)}
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-white text-rose-600 font-bold shadow-xs">
            Keluar: {formatRupiah(overview.totalExpense)}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari transaksi, keperluan, atau nama siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pengeluaran
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xs text-slate-400">Tidak ada data transaksi yang cocok.</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 transition-all gap-2.5"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                      isIncome
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                      {tx.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{tx.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <span>{formatDate(tx.date)}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                        {tx.category || tx.method || 'Kas'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                  <div
                    className={`text-sm font-bold ${
                      isIncome ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Oleh: {tx.createdBy}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
