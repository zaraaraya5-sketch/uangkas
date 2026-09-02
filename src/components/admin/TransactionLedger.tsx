import React, { useState, useMemo } from 'react';
import { useKas } from '../../context/KasContext';
import { TransactionItem, Payment, Expense } from '../../types';
import { 
  Search, 
  Receipt, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Filter, 
  Edit, 
  Trash2, 
  Calendar 
} from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { PaymentModal } from './modals/PaymentModal';
import { ExpenseModal } from './modals/ExpenseModal';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const TransactionLedger: React.FC = () => {
  const { transactions, payments, expenses, deletePayment, deleteExpense, currentUser } = useKas();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'income' | 'expense'>('ALL');

  // Modals for editing/deleting through ledger
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingItem, setDeletingItem] = useState<TransactionItem | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = typeFilter === 'ALL' || t.type === typeFilter;
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [transactions, typeFilter, searchQuery]);

  const handleEditClick = (tx: TransactionItem) => {
    if (tx.type === 'income' && tx.rawPaymentId) {
      const pay = payments.find((p) => p.id === tx.rawPaymentId);
      if (pay) setEditingPayment(pay);
    } else if (tx.type === 'expense' && tx.rawExpenseId) {
      const exp = expenses.find((e) => e.id === tx.rawExpenseId);
      if (exp) setEditingExpense(exp);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    if (deletingItem.type === 'income' && deletingItem.rawPaymentId) {
      await deletePayment(deletingItem.rawPaymentId);
    } else if (deletingItem.type === 'expense' && deletingItem.rawExpenseId) {
      await deleteExpense(deletingItem.rawExpenseId);
    }
    setDeletingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-800">
              Buku Kas Umum (Semua Transaksi)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total {transactions.length} mutasi tercatat dalam pembukuan kas kelas
          </p>
        </div>
      </div>

      {/* Toolbar & Table */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari transaksi apa saja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-full md:w-auto text-xs">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                typeFilter === 'ALL'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua Mutasi ({transactions.length})
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                typeFilter === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pemasukan ({payments.length})
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                typeFilter === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pengeluaran ({expenses.length})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Deskripsi Transaksi</th>
                <th className="py-3 px-4">Kategori / Metode</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Tidak ada catatan transaksi yang sesuai.
                  </td>
                </tr>
              ) : (
                filtered.map((tx, index) => {
                  const isIncome = tx.type === 'income';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isIncome ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          <span>{isIncome ? 'Masuk' : 'Keluar'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div>{tx.title}</div>
                        {tx.description && (
                          <div className="text-[11px] font-normal text-slate-400 mt-0.5 truncate max-w-xs">
                            {tx.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-medium">
                          {tx.category || tx.method || 'Kas'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                        <span className={isIncome ? 'text-emerald-600' : 'text-rose-600'}>
                          {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {tx.createdBy}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isAdmin ? (
                            <>
                              <button
                                onClick={() => handleEditClick(tx)}
                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                title="Edit Transaksi"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingItem(tx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Payment Modal */}
      <PaymentModal
        isOpen={Boolean(editingPayment)}
        onClose={() => setEditingPayment(null)}
        editPayment={editingPayment}
      />

      {/* Edit Expense Modal */}
      <ExpenseModal
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        editExpense={editingExpense}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingItem)}
        title="Hapus Transaksi ini?"
        message={`Apakah Anda yakin ingin menghapus transaksi "${deletingItem?.title}" senilai ${formatRupiah(deletingItem?.amount || 0)}? Tindakan ini akan memengaruhi saldo kas dan seluruh laporan.`}
        confirmText="Hapus Transaksi"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
};
