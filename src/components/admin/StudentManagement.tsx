import React, { useState, useMemo, useEffect } from 'react';
import { useKas } from '../../context/KasContext';
import { Student, PaymentStatus } from '../../types';
import { 
  Search, 
  Plus, 
  Users, 
  Edit, 
  Trash2, 
  ArrowUpDown,
  FileSpreadsheet,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { StudentModal } from './modals/StudentModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { exportService } from '../../services/exportService';
import { TablePagination } from '../common/TablePagination';

interface StudentManagementProps {
  onQuickPayForStudent?: (student: Student) => void;
  onOpenImportModal?: (type: 'student' | 'payment' | 'expense') => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ 
  onQuickPayForStudent,
  onOpenImportModal,
}) => {
  const { studentSummaries, deleteStudent, deleteAllStudents, currentUser, settings } = useKas();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [sortField, setSortField] = useState<'nis' | 'name' | 'totalPaid' | 'remainingAmount'>('nis');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination state (Max 20 rows per slide/page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortField, sortAsc]);

  // Filtered and sorted student list
  const filteredStudents = useMemo(() => {
    return studentSummaries
      .filter((student) => {
        const matchesSearch =
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.nis.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || student.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortField === 'nis') {
          const numA = parseInt(a.nis, 10) || 0;
          const numB = parseInt(b.nis, 10) || 0;
          return sortAsc ? numA - numB : numB - numA;
        }

        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') {
          return sortAsc
            ? (valA as string).localeCompare(valB as string, undefined, { numeric: true, sensitivity: 'base' })
            : (valB as string).localeCompare(valA as string, undefined, { numeric: true, sensitivity: 'base' });
        }

        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [studentSummaries, searchQuery, statusFilter, sortField, sortAsc]);

  // Paginated Slices (Max 20 per slide/page)
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const handleSort = (field: 'nis' | 'name' | 'totalPaid' | 'remainingAmount') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setIsStudentModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingStudent) {
      await deleteStudent(deletingStudent.id);
      setDeletingStudent(null);
    }
  };

  // Status counters
  const counts = useMemo(() => {
    return {
      all: studentSummaries.length,
      lunas: studentSummaries.filter((s) => s.status === 'Lunas').length,
      sebagian: studentSummaries.filter((s) => s.status === 'Sebagian').length,
      belum: studentSummaries.filter((s) => s.status === 'Belum Membayar').length,
    };
  }, [studentSummaries]);

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-800">
              Data Siswa Kelas {settings.className} ({studentSummaries.length} Siswa)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Target Kas: <strong>{formatRupiah(settings.targetPerStudent || 25000)}</strong> per siswa ({settings.totalMonths || 5} Bulan @ {formatRupiah(settings.monthlyFee || 5000)}/bulan)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => exportService.exportStudentsToExcel(studentSummaries, settings)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
            title="Unduh seluruh data siswa & status pembayaran (.xlsx)"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Excel</span>
          </button>

          {onOpenImportModal && (
            <button
              onClick={() => onOpenImportModal('student')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Import Excel</span>
            </button>
          )}

          {/* Delete All (Hapus Semua) */}
          {isAdmin && studentSummaries.length > 0 && (
            <button
              onClick={() => setIsDeleteAllOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all"
              title="Kosongkan seluruh data siswa kelas"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Hapus Semua</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-brand-200 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Siswa</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari nama atau NIS siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800 transition-colors"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-2xl w-full md:w-auto text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({counts.all})
            </button>
            <button
              onClick={() => setStatusFilter('Lunas')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                statusFilter === 'Lunas'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Lunas ({counts.lunas})</span>
            </button>
            <button
              onClick={() => setStatusFilter('Sebagian')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                statusFilter === 'Sebagian'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Sebagian ({counts.sebagian})</span>
            </button>
            <button
              onClick={() => setStatusFilter('Belum Membayar')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                statusFilter === 'Belum Membayar'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>Belum ({counts.belum})</span>
            </button>
          </div>
        </div>

        {/* Student Table with responsive horizontal scroll */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th
                  onClick={() => handleSort('nis')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>No. Absen</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>Nama Siswa</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalPaid')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Bayar</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                <th
                  onClick={() => handleSort('remainingAmount')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Tunggakan</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Tidak ada data siswa yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center font-medium text-slate-400">
                        {globalIndex}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {student.nis}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-[10px] shrink-0 ${
                            student.gender === 'P' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {student.gender}
                          </div>
                          <span className="truncate">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {formatRupiah(student.totalPaid)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={student.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-600">
                        {student.remainingAmount > 0 ? (
                          <span className="text-amber-600">
                            {formatRupiah(student.remainingAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isAdmin ? (
                            <>
                              <button
                                onClick={() => handleOpenEdit(student)}
                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                title="Edit Siswa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingStudent(student)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400">Read-only</span>
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
          totalItems={filteredStudents.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>

      {/* Modals */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        editStudent={editingStudent}
      />

      {/* Delete Single Student Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingStudent)}
        title="Hapus Siswa ini?"
        message={`Apakah Anda yakin ingin menghapus ${deletingStudent?.name} (${deletingStudent?.nis})? Seluruh data pembayaran terkait akan ikut disesuaikan.`}
        confirmText="Hapus Siswa"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingStudent(null)}
      />

      {/* Delete All Students Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteAllOpen}
        title="Hapus SEMUA Data Siswa?"
        message={`Apakah Anda yakin ingin mengosongkan seluruh (${studentSummaries.length}) data siswa kelas? Seluruh catatan kas siswa juga akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Semua Siswa"
        cancelText="Batal"
        isDangerous={true}
        onConfirm={async () => {
          await deleteAllStudents();
          setIsDeleteAllOpen(false);
        }}
        onCancel={() => setIsDeleteAllOpen(false)}
      />
    </div>
  );
};
