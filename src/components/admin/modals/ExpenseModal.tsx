import React, { useState, useEffect } from 'react';
import { useKas } from '../../../context/KasContext';
import { Expense, ExpenseCategory } from '../../../types';
import { X, TrendingDown, Calendar, Tag, FileText } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editExpense?: Expense | null;
}

const CATEGORIES: ExpenseCategory[] = [
  'Keperluan Kelas',
  'Peralatan',
  'Acara Kelas',
  'Konsumsi',
  'Lainnya',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  editExpense,
}) => {
  const { addExpense, updateExpense, currentUser, settings } = useKas();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(50000);
  const [category, setCategory] = useState<ExpenseCategory>('Peralatan');
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editExpense) {
      setTitle(editExpense.title);
      setAmount(editExpense.amount);
      setCategory(editExpense.category);
      setExpenseDate(editExpense.expenseDate);
      setDescription(editExpense.description);
    } else {
      setTitle('');
      setAmount(50000);
      setCategory('Peralatan');
      setExpenseDate(new Date().toISOString().slice(0, 10));
      setDescription('');
    }
  }, [editExpense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    if (editExpense) {
      await updateExpense(editExpense.id, {
        title: title.trim(),
        amount: Number(amount),
        category,
        expenseDate,
        description: description.trim(),
      });
    } else {
      await addExpense({
        title: title.trim(),
        amount: Number(amount),
        category,
        expenseDate,
        description: description.trim(),
        createdBy: currentUser?.name || 'Bendahara',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-soft-xl border border-slate-100 animate-scale-in relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {editExpense ? 'Edit Pengeluaran Kas' : '+ Tambah Pengeluaran Kas'}
            </h3>
            <p className="text-xs text-slate-500">
              Catat pembelian perlengkapan atau biaya kegiatan kelas {settings.className}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Pengeluaran / Barang
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pembelian Spidol & Penghapus Whiteboard"
              className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nominal Pengeluaran (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="number"
                min={1000}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 text-sm font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-rose-600"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kategori Pengeluaran
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500 text-slate-800"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tanggal Pengeluaran
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500 text-slate-800"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Rincian / Keterangan
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: 3 buah spidol snowman warna hitam dan biru di Toko ATK Bintang"
              className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500 text-slate-800"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-rose-200 transition-all"
            >
              {editExpense ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
