import React, { useState, useMemo, useEffect } from 'react';
import { useKas } from '../../context/KasContext';
import { Expense, ExpenseCategory } from '../../types';
import { 
  Search, 
  Plus, 
  TrendingDown, 
  Edit, 
  Trash2, 
  Calendar, 
  Tag, 
  FileText,
  FileSpreadsheet,
  Download,
  ShoppingBag,
  PieChart,
  Sparkles
} from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { ExpenseModal } from './modals/ExpenseModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { exportService } from '../../services/exportService';
import { CarouselBanner, CarouselSlide } from './common/CarouselBanner';
import { TablePagination } from '../common/TablePagination';

interface ExpenseManagementProps {
  onOpenAddModal: () => void;
  onOpenImportModal?: (type: 'student' | 'payment' | 'expense') => void;
}

export const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ 
  onOpenAddModal,
  onOpenImportModal,
}) => {
  const { expenses, deleteExpense, deleteAllExpenses, currentUser, settings } = useKas();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ExpenseCategory>('ALL');

  // Pagination state (Max 20 per carousel slide/page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const matchesSearch =
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = categoryFilter === 'ALL' || e.category === categoryFilter;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
  }, [expenses, searchQuery, categoryFilter]);

  // Paginated Slices (Max 20 rows per page/slide)
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });
    return map;
  }, [expenses]);

  const topCategory = useMemo(() => {
    const entries = Object.entries(categoryStats);
    if (entries.length === 0) return { name: 'Belum Ada', amount: 0 };
    entries.sort((a, b) => b[1] - a[1]);
    return { name: entries[0][0], amount: entries[0][1] };
  }, [categoryStats]);

  // Carousel Slides
  const carouselSlides: CarouselSlide[] = useMemo(() => [
    {
      id: 'slide-expense-summary',
      badge: 'Kas Kelas Keluar',
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      title: 'Total Pengeluaran Kas',
      subtitle: `Tercatat ${expenses.length} pengeluaran untuk keperluan, perlengkapan, dan kegiatan kelas ${settings.className}.`,
      value: formatRupiah(totalExpense),
      valueSubtitle: 'Total dana kas yang telah dibelanjakan',
      icon: TrendingDown,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/20',
      details: [
        { label: 'Total Belanja', value: `${expenses.length} Transaksi` },
        { label: 'Kategori Terbesar', value: topCategory.name, color: 'text-rose-400' },
      ],
    },
    {
      id: 'slide-category-breakdown',
      badge: 'Alokasi Anggaran',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      title: 'Kategori Belanja Utama',
      subtitle: `Alokasi belanja terbesar pada "${topCategory.name}" senilai ${formatRupiah(topCategory.amount)}.`,
      value: formatRupiah(topCategory.amount),
      valueSubtitle: `Kategori: ${topCategory.name}`,
      icon: PieChart,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      details: [
        { label: 'Keperluan Kelas', value: formatRupiah(categoryStats['Keperluan Kelas'] || 0) },
        { label: 'Peralatan', value: formatRupiah(categoryStats['Peralatan'] || 0) },
      ],
    },
    {
      id: 'slide-latest-expense',
      badge: 'Pengeluaran Terakhir',
      badgeColor: 'bg-brand-500/20 text-brand-300 border border-brand-500/30',
      title: 'Belanja Paling Baru',
      subtitle: expenses[0]
        ? `"${expenses[0].title}" senilai ${formatRupiah(expenses[0].amount)} pada ${formatDate(expenses[0].expenseDate)}.`
        : 'Belum ada pengeluaran kas tercatat.',
      value: expenses[0] ? formatRupiah(expenses[0].amount) : 'Rp 0',
      valueSubtitle: expenses[0] ? `${expenses[0].category} • ${expenses[0].createdBy}` : 'Nihil',
      icon: ShoppingBag,
      iconColor: 'text-brand-400',
      iconBg: 'bg-brand-500/20',
      details: [
        { label: 'Petugas', value: expenses[0]?.createdBy || 'Bendahara' },
        { label: 'Tanggal', value: expenses[0] ? formatDate(expenses[0].expenseDate) : '-' },
      ],
    },
  ], [expenses, settings, totalExpense, topCategory, categoryStats]);

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingExpense) {
      await deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Interactive Multi-Slide Carousel */}
      <CarouselBanner slides={carouselSlides} autoPlayInterval={6000} />

      {/* 2. Top Banner & Action Buttons */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-600" />
            <h3 className="text-lg font-bold text-slate-800">
              Pengeluaran & Belanja Kas Kelas
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total Pengeluaran: <strong className="text-rose-600 font-bold">{formatRupiah(totalExpense)}</strong> ({filteredExpenses.length} belanja tercatat)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Export Excel */}
          <button
            onClick={() => exportService.exportExpensesToExcel(expenses, settings)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
            title="Unduh seluruh rekapan pengeluaran kas (.xlsx)"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Excel</span>
          </button>

          {/* Import Excel */}
          {onOpenImportModal && (
            <button
              onClick={() => onOpenImportModal('expense')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Import Excel</span>
            </button>
          )}

          {/* Delete All (Hapus Semua) */}
          {isAdmin && expenses.length > 0 && (
            <button
              onClick={() => setIsDeleteAllOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all"
              title="Kosongkan seluruh riwayat belanja kas"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Hapus Semua</span>
            </button>
          )}

          {/* Add Expense */}
          {isAdmin && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-rose-200 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Pengeluaran</span>
            </button>
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
              placeholder="Cari nama barang atau keperluan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500 text-slate-800"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-2xl w-full md:w-auto text-xs">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                categoryFilter === 'ALL'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({expenses.length})
            </button>
            {(['Peralatan', 'Keperluan Kelas', 'Konsumsi', 'Acara Kelas', 'Lainnya'] as ExpenseCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  categoryFilter === cat
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table with responsive horizontal scroll */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Pengeluaran</th>
                <th className="py-3 px-4 text-center">Kategori</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4">Rincian / Keterangan</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Tidak ada catatan pengeluaran yang cocok.
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((exp, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">
                        {globalIndex}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {formatDate(exp.expenseDate)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {exp.title}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 text-[10px] font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200/70">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600 whitespace-nowrap">
                        -{formatRupiah(exp.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {exp.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {exp.createdBy}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isAdmin ? (
                            <>
                              <button
                                onClick={() => handleOpenEdit(exp)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Edit Pengeluaran"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingExpense(exp)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Pengeluaran"
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
          totalItems={filteredExpenses.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>

      {/* Edit Modal */}
      <ExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editExpense={editingExpense}
      />

      {/* Delete Single Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingExpense)}
        title="Hapus Pengeluaran ini?"
        message={`Hapus pengeluaran "${deletingExpense?.title}" senilai ${formatRupiah(deletingExpense?.amount || 0)}? Tindakan ini akan mengembalikan saldo kas dan memengaruhi laporan.`}
        confirmText="Hapus Pengeluaran"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingExpense(null)}
      />

      {/* Delete All Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteAllOpen}
        title="Hapus SEMUA Riwayat Pengeluaran?"
        message={`Apakah Anda yakin ingin mengosongkan seluruh (${expenses.length}) catatan belanja kas? Saldo kas akan dikembalikan utuh. Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Semua Pengeluaran"
        cancelText="Batal"
        isDangerous={true}
        onConfirm={async () => {
          await deleteAllExpenses();
          setIsDeleteAllOpen(false);
        }}
        onCancel={() => setIsDeleteAllOpen(false)}
      />
    </div>
  );
};
