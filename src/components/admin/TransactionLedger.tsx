import React, { useState, useMemo, useEffect } from 'react';
import { useKas } from '../../context/KasContext';
import { Payment, Expense } from '../../types';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Download, 
  FileSpreadsheet,
  Edit,
  Trash2,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { PaymentModal } from './modals/PaymentModal';
import { ExpenseModal } from './modals/ExpenseModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { exportService } from '../../services/exportService';
import { CarouselBanner, CarouselSlide } from './common/CarouselBanner';
import { TablePagination } from '../common/TablePagination';

interface TransactionLedgerProps {
  onOpenImportModal?: (type: 'student' | 'payment' | 'expense') => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({ onOpenImportModal }) => {
  const { 
    payments, 
    expenses, 
    students,
    overview, 
    deletePayment, 
    deleteExpense, 
    currentUser,
    settings 
  } = useKas();

  const [typeFilter, setTypeFilter] = useState<'ALL' | 'income' | 'expense'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state (Max 20 rows per slide/page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals state
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; type: 'income' | 'expense'; title: string; amount: number } | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s.name])), [students]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, searchQuery]);

  // Unified Transactions
  const transactions = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      type: 'income' | 'expense';
      title: string;
      category?: string;
      method?: string;
      amount: number;
      description: string;
      createdBy: string;
      raw: Payment | Expense;
    }> = [];

    payments.forEach((p) => {
      const studentName = studentMap.get(p.studentId) || 'Siswa';
      list.push({
        id: p.id,
        date: p.paymentDate,
        type: 'income',
        title: `Setoran Kas: ${studentName}`,
        method: p.paymentMethod,
        amount: Number(p.amount),
        description: p.description || `Kas ${p.monthName || 'Bulan Ini'}`,
        createdBy: p.createdBy,
        raw: p,
      });
    });

    expenses.forEach((e) => {
      list.push({
        id: e.id,
        date: e.expenseDate,
        type: 'expense',
        title: e.title,
        category: e.category,
        amount: Number(e.amount),
        description: e.description,
        createdBy: e.createdBy,
        raw: e,
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, expenses, studentMap]);

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

  // Paginated Slices (Max 20 per slide/page)
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Carousel Slides
  const carouselSlides: CarouselSlide[] = useMemo(() => [
    {
      id: 'slide-balance-position',
      badge: 'Buku Kas Umum',
      badgeColor: 'bg-brand-500/20 text-brand-300 border border-brand-500/30',
      title: 'Posisi Saldo Kas Terkini',
      subtitle: `Total dana kas kelas aktif setelah seluruh pemasukan dikurangi total belanja pengeluaran.`,
      value: formatRupiah(overview.currentBalance),
      valueSubtitle: 'Saldo kas riil siap pakai',
      icon: Wallet,
      iconColor: 'text-brand-400',
      iconBg: 'bg-brand-500/20',
      details: [
        { label: 'Pemasukan (+)', value: formatRupiah(overview.totalIncome), color: 'text-emerald-400' },
        { label: 'Pengeluaran (-)', value: formatRupiah(overview.totalExpense), color: 'text-rose-400' },
      ],
    },
    {
      id: 'slide-mutasi-stats',
      badge: 'Aktivitas Arus Kas',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      title: 'Ringkasan Mutasi Keuangan',
      subtitle: `Tercatat ${payments.length} pemasukan kas dan ${expenses.length} pengeluaran kas dalam buku besar.`,
      value: `${transactions.length} Mutasi`,
      valueSubtitle: 'Total mutasi uang kas kelas',
      icon: TrendingUp,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      details: [
        { label: 'Pemasukan', value: `${payments.length} Setoran` },
        { label: 'Pengeluaran', value: `${expenses.length} Belanja` },
      ],
    },
    {
      id: 'slide-latest-mutation',
      badge: 'Mutasi Terbaru',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      title: 'Aktivitas Transaksi Terakhir',
      subtitle: transactions[0]
        ? `[${transactions[0].type === 'income' ? 'Pemasukan' : 'Pengeluaran'}] "${transactions[0].title}" senilai ${formatRupiah(transactions[0].amount)} (${formatDate(transactions[0].date)}).`
        : 'Belum ada catatan mutasi kas.',
      value: transactions[0] ? formatRupiah(transactions[0].amount) : 'Rp 0',
      valueSubtitle: transactions[0] ? `${transactions[0].category || transactions[0].method} • ${transactions[0].createdBy}` : 'Nihil',
      icon: Sparkles,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      details: [
        { label: 'Tipe', value: transactions[0]?.type === 'income' ? 'Pemasukan' : 'Pengeluaran', color: transactions[0]?.type === 'income' ? 'text-emerald-400' : 'text-rose-400' },
        { label: 'Tanggal', value: transactions[0] ? formatDate(transactions[0].date) : '-' },
      ],
    },
  ], [overview, payments.length, expenses.length, transactions]);

  const handleEditClick = (tx: (typeof transactions)[0]) => {
    if (tx.type === 'income') {
      setEditingPayment(tx.raw as Payment);
    } else {
      setEditingExpense(tx.raw as Expense);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    if (deletingItem.type === 'income') {
      await deletePayment(deletingItem.id);
    } else {
      await deleteExpense(deletingItem.id);
    }
    setDeletingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Interactive Multi-Slide Carousel */}
      <CarouselBanner slides={carouselSlides} autoPlayInterval={6000} />

      {/* 2. Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-800">
              Buku Kas Umum & Mutasi Transaksi
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Posisi Saldo Kas Terkini: <strong className="text-brand-600 font-bold">{formatRupiah(overview.currentBalance)}</strong> ({filtered.length} transaksi ditampilkan)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Export Full Ledger */}
          <button
            onClick={() => exportService.exportAllTransactionsToExcel(payments, expenses, students, settings)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
            title="Unduh Buku Kas Umum & Mutasi (.xlsx)"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Buku Kas</span>
          </button>

          {/* Import Modals */}
          {onOpenImportModal && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenImportModal('payment')}
                className="flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-all"
                title="Import Pembayaran Kas"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Import Setoran</span>
              </button>
              <button
                onClick={() => onOpenImportModal('expense')}
                className="flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-semibold transition-all"
                title="Import Pengeluaran Kas"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-600" />
                <span>+ Import Belanja</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Toolbar & Table */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari mutasi, keterangan, nama siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === 'ALL'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({transactions.length})
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowDownLeft className="w-3 h-3" />
              <span>Masuk ({payments.length})</span>
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              <span>Keluar ({expenses.length})</span>
            </button>
          </div>
        </div>

        {/* Table with responsive horizontal scroll */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[700px] text-left border-collapse">
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
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Tidak ada catatan transaksi yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx, index) => {
                  const isIncome = tx.type === 'income';
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">
                        {globalIndex}
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

        {/* 4. Table Pagination Carousel (Max 20 rows per slide) */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50]}
        />
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
        title={`Hapus Transaksi ${deletingItem?.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}?`}
        message={`Hapus transaksi "${deletingItem?.title}" senilai ${formatRupiah(deletingItem?.amount || 0)}? Saldo dan laporan kas akan disesuaikan otomatis.`}
        confirmText="Hapus Transaksi"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
};
