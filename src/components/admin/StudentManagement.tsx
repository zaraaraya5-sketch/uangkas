import React, { useState, useMemo } from 'react';
import { useKas } from '../../context/KasContext';
import { Student, StudentSummary, PaymentStatus } from '../../types';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Wallet, 
  ArrowUpDown, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  FileSpreadsheet
} from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { StudentModal } from './modals/StudentModal';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface StudentManagementProps {
  onQuickPayForStudent?: (studentId: string) => void;
  onOpenImportModal?: (type: 'student' | 'payment' | 'expense') => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ 
  onQuickPayForStudent,
  onOpenImportModal,
}) => {
  const { studentSummaries, deleteStudent, currentUser, settings } = useKas();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [sortField, setSortField] = useState<'nis' | 'name' | 'totalPaid' | 'remainingAmount'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const isAdmin = currentUser?.role === 'admin';

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
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') {
          return sortAsc
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }

        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [studentSummaries, searchQuery, statusFilter, sortField, sortAsc]);

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

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
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
          {onOpenImportModal && (
            <button
              onClick={() => onOpenImportModal('student')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Import Excel</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-brand-200 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa</span>
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
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({studentSummaries.length})
            </button>
            <button
              onClick={() => setStatusFilter('Lunas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'Lunas'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🟢 Lunas ({studentSummaries.filter((s) => s.status === 'Lunas').length})
            </button>
            <button
              onClick={() => setStatusFilter('Sebagian')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'Sebagian'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🟡 Sebagian ({studentSummaries.filter((s) => s.status === 'Sebagian').length})
            </button>
            <button
              onClick={() => setStatusFilter('Belum Membayar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'Belum Membayar'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🔴 Belum ({studentSummaries.filter((s) => s.status === 'Belum Membayar').length})
            </button>
          </div>
        </div>

        {/* 45 Siswa Modern Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
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
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Tidak ada data siswa yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3 px-4 text-center font-medium text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {student.nis}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px] shrink-0">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        editStudent={editingStudent}
      />

      <ConfirmationModal
        isOpen={Boolean(deletingStudent)}
        title="Hapus Siswa ini?"
        message={`Apakah Anda yakin ingin menghapus ${deletingStudent?.name} (${deletingStudent?.nis})? Seluruh data pembayaran terkait akan ikut disesuaikan.`}
        confirmText="Hapus Siswa"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingStudent(null)}
      />
    </div>
  );
};
