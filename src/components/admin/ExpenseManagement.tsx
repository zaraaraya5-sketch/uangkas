import React, { useState, useMemo } from 'react';
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
  FileText 
} from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { ExpenseModal } from './modals/ExpenseModal';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface ExpenseManagementProps {
  onOpenAddModal: () => void;
}

export const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ onOpenAddModal }) => {
  const { expenses, deleteExpense, currentUser } = useKas();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ExpenseCategory>('ALL');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const isAdmin = currentUser?.role === 'admin';

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

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

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
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-600" />
            <h3 className="text-lg font-bold text-slate-800">
              Pengeluaran & Belanja Kas Kelas
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total Pengeluaran: <strong className="text-rose-600 font-bold">{formatRupiah(totalExpense)}</strong> ({filteredExpenses.length} belanja)
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-rose-200 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Pengeluaran</span>
          </button>
        )}
      </div>

      {/* Toolbar & Table */}
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

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
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
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Tidak ada catatan pengeluaran yang cocok.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp, index) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">
                      {index + 1}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <ExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editExpense={editingExpense}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingExpense)}
        title="Hapus Pengeluaran ini?"
        message={`Hapus pengeluaran "${deletingExpense?.title}" senilai ${formatRupiah(deletingExpense?.amount || 0)}? Tindakan ini akan mengembalikan saldo kas dan memengaruhi laporan.`}
        confirmText="Hapus Pengeluaran"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingExpense(null)}
      />
    </div>
  );
};
