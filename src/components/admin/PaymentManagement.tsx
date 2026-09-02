import React, { useState, useMemo, useEffect } from 'react';
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
  FileSpreadsheet,
  Download,
  Sparkles,
  TrendingUp,
  Users,
  AlertTriangle
} from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { PaymentModal } from './modals/PaymentModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { exportService } from '../../services/exportService';
import { CarouselBanner, CarouselSlide } from './common/CarouselBanner';
import { TablePagination } from '../common/TablePagination';

interface PaymentManagementProps {
  onOpenAddModal: () => void;
  onOpenImportModal?: (type: 'student' | 'payment' | 'expense') => void;
}

export const PaymentManagement: React.FC<PaymentManagementProps> = ({ 
  onOpenAddModal,
  onOpenImportModal,
}) => {
  const { payments, students, studentSummaries, deletePayment, deleteAllPayments, currentUser, settings } = useKas();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');

  // Pagination state (Max 20 rows per page/slide)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const studentObjMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s.name])), [students]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, methodFilter]);

  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        const student = studentObjMap.get(p.studentId);
        const studentName = student?.name || studentMap.get(p.studentId) || '';
        const matchesSearch =
          studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
        return matchesSearch && matchesMethod;
      })
      .sort((a, b) => {
        const studentA = studentObjMap.get(a.studentId);
        const studentB = studentObjMap.get(b.studentId);
        const nisA = Number(studentA?.nis) || 999;
        const nisB = Number(studentB?.nis) || 999;
        if (nisA !== nisB) return nisA - nisB;
        return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
      });
  }, [payments, searchQuery, methodFilter, studentObjMap, studentMap]);

  // Paginated Slices (Max 20 per slide/page)
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paidCount = studentSummaries.filter((s) => s.status === 'Lunas').length;
  const partialCount = studentSummaries.filter((s) => s.status === 'Sebagian').length;
  const lunasBeforeJulyCount = payments.filter((p) => Number(p.amount) === 0 || p.description.toLowerCase().includes('lunas sebelum')).length;

  // Carousel Slides
  const carouselSlides: CarouselSlide[] = useMemo(() => [
    {
      id: 'slide-income-summary',
      badge: 'Kas Kelas Masuk',
      title: 'Total Pemasukan Kas',
      subtitle: `Tercatat ${payments.length} transaksi pembayaran kas dari seluruh siswa kelas ${settings.className}.`,
      value: formatRupiah(totalCollected),
      valueSubtitle: 'Total akumulasi uang kas masuk',
      icon: Wallet,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      details: [
        { label: 'Total Transaksi', value: `${payments.length} Setoran` },
        { label: 'Target / Siswa', value: formatRupiah(settings.targetPerStudent || 60000), color: 'text-emerald-400' },
      ],
    },
    {
      id: 'slide-student-status',
      badge: 'Status Capaian',
      title: 'Status Pelunasan Kas Siswa',
      subtitle: `${paidCount} siswa telah Lunas, ${partialCount} membayar sebagian, dan ${lunasBeforeJulyCount} tercatat lunas sebelum Juli.`,
      value: `${paidCount} / ${students.length} Lunas`,
      valueSubtitle: 'Siswa yang sudah memenuhi target iuran',
      icon: Users,
      iconColor: 'text-brand-400',
      iconBg: 'bg-brand-500/20',
      details: [
        { label: 'Lunas Penuh', value: `${paidCount} Siswa`, color: 'text-emerald-400' },
        { label: 'Sebagian / Cicil', value: `${partialCount} Siswa`, color: 'text-amber-400' },
      ],
    },
    {
      id: 'slide-latest-payments',
      badge: 'Aktivitas Terkini',
      title: 'Setoran Kas Paling Baru',
      subtitle: payments[0] 
        ? `${studentMap.get(payments[0].studentId) || 'Siswa'} menyetor ${formatRupiah(payments[0].amount)} (${payments[0].description}).`
        : 'Belum ada transaksi pembayaran kas yang tercatat.',
      value: payments[0] ? formatRupiah(payments[0].amount) : 'Rp 0',
      valueSubtitle: payments[0] ? `${formatDate(payments[0].paymentDate)} • ${payments[0].paymentMethod}` : 'Menunggu setoran',
      icon: Sparkles,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      details: [
        { label: 'Metode Terbanyak', value: 'Tunai (💵)' },
        { label: 'Petugas', value: payments[0]?.createdBy || 'Bendahara' },
      ],
    },
  ], [payments, settings, totalCollected, paidCount, partialCount, lunasBeforeJulyCount, students.length, studentMap]);

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

  const handleConfirmDeleteAll = async () => {
    await deleteAllPayments();
    setIsDeleteAllOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Interactive Multi-Slide Carousel */}
      <CarouselBanner slides={carouselSlides} autoPlayInterval={6000} />

      {/* 2. Top Banner & Action Buttons */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-800">
              Riwayat Pembayaran Kas Siswa
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total Tercatat: <strong className="text-emerald-600 font-bold">{formatRupiah(totalCollected)}</strong> ({filteredPayments.length} transaksi)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Export Excel */}
          <button
            onClick={() => exportService.exportPaymentsToExcel(payments, students, settings)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
            title="Unduh seluruh rekapan riwayat setoran uang kas (.xlsx)"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Excel</span>
          </button>

          {/* Import Excel */}
          {onOpenImportModal && (
            <button
              onClick={() => onOpenImportModal('payment')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Import Excel</span>
            </button>
          )}

          {/* Delete All (Hapus Semua) */}
          {isAdmin && payments.length > 0 && (
            <button
              onClick={() => setIsDeleteAllOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all"
              title="Kosongkan seluruh data pembayaran kas"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Hapus Semua</span>
            </button>
          )}

          {/* Add Payment */}
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

      {/* 3. Toolbar & Table */}
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
              Semua Metode ({payments.length})
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

        {/* Table with responsive horizontal scroll */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Metode</th>
                <th className="py-3 px-4">Keterangan / Periode</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Tidak ada catatan pembayaran yang cocok.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((payment, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;
                  const studentObj = studentObjMap.get(payment.studentId);
                  const studentName = studentObj?.name || studentMap.get(payment.studentId) || 'Siswa';
                  const isZeroLunas = Number(payment.amount) === 0;

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">
                        {globalIndex}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          {studentObj?.nis && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                              Absen {studentObj.nis}
                            </span>
                          )}
                          <span>{studentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                        {isZeroLunas ? (
                          <span className="text-emerald-700 font-medium">Rp 0 (Lunas sebelum Juli)</span>
                        ) : (
                          <span className="text-emerald-600">+{formatRupiah(payment.amount)}</span>
                        )}
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

        {/* 4. Table Pagination Carousel (Max 20 rows per slide) */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredPayments.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>

      {/* Edit Modal */}
      <PaymentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editPayment={editingPayment}
      />

      {/* Delete Single Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingPayment)}
        title="Hapus Pembayaran ini?"
        message={`Hapus pembayaran senilai ${formatRupiah(deletingPayment?.amount || 0)}? Tindakan ini otomatis mengurangi saldo kas dan memperbarui tunggakan siswa.`}
        confirmText="Hapus Pembayaran"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPayment(null)}
      />

      {/* Delete All Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteAllOpen}
        title="Hapus SEMUA Riwayat Pembayaran Kas?"
        message={`Apakah Anda yakin ingin mengosongkan seluruh (${payments.length}) catatan pembayaran kas? Seluruh saldo pemasukan akan direset menjadi Rp 0. Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Semua Pembayaran"
        cancelText="Batal"
        isDangerous={true}
        onConfirm={handleConfirmDeleteAll}
        onCancel={() => setIsDeleteAllOpen(false)}
      />
    </div>
  );
};
