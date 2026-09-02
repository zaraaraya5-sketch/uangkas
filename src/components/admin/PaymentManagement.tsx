import React, { useState, useMemo } from 'react';
import { useKas } from '../../context/KasContext';
import { Payment, PaymentMethod } from '../../types';
import { 
  Search, 
  Plus, 
  Wallet, 
  Edit, 
  Trash2, 
  Calendar, 
  CreditCard, 
  ArrowDownLeft,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { PaymentModal } from './modals/PaymentModal';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface PaymentManagementProps {
  onOpenAddModal: () => void;
  onOpenImportModal?: (type: 'student' | 'payment' | 'expense') => void;
}

export const PaymentManagement: React.FC<PaymentManagementProps> = ({ 
  onOpenAddModal,
  onOpenImportModal,
}) => {
  const { payments, students, deletePayment, currentUser } = useKas();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s.name])), [students]);

  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        const studentName = studentMap.get(p.studentId) || '';
        const matchesSearch =
          studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
        return matchesSearch && matchesMethod;
      })
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [payments, searchQuery, methodFilter, studentMap]);

  const totalCollected = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const handleOpenEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setIsEditModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingPayment) {
      await deletePayment(deletingPayment.id);
      setDeletingPayment(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-800">
              Riwayat Pembayaran Kas Siswa
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total Pemasukan Tercatat: <strong className="text-emerald-600 font-bold">{formatRupiah(totalCollected)}</strong> ({filteredPayments.length} transaksi)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onOpenImportModal && (
            <button
              onClick={() => onOpenImportModal('payment')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Import Excel</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-emerald-200 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Pembayaran</span>
            </button>
          )}
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
              placeholder="Cari nama siswa atau keterangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 text-slate-800"
            />
          </div>

          {/* Method Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => setMethodFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                methodFilter === 'ALL'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua Metode
            </button>
            <button
              onClick={() => setMethodFilter('Tunai')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                methodFilter === 'Tunai'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              💵 Tunai
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
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Metode</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Tidak ada catatan pembayaran yang cocok.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, index) => {
                  const studentName = studentMap.get(payment.studentId) || 'Siswa';

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {studentName}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                        +{formatRupiah(payment.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 text-[10px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {payment.description || (payment.weekNumber ? `Minggu ${payment.weekNumber}` : '-')}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {payment.createdBy}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isAdmin ? (
                            <>
                              <button
                                onClick={() => handleOpenEdit(payment)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Edit Pembayaran"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingPayment(payment)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Pembayaran"
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

      {/* Edit Modal */}
      <PaymentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editPayment={editingPayment}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(deletingPayment)}
        title="Hapus Pembayaran ini?"
        message={`Hapus pembayaran senilai ${formatRupiah(deletingPayment?.amount || 0)}? Tindakan ini otomatis mengurangi saldo kas dan memperbarui tunggakan siswa.`}
        confirmText="Hapus Pembayaran"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPayment(null)}
      />
    </div>
  );
};
