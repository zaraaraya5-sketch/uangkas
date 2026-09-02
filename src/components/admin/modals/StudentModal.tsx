import React, { useState, useEffect } from 'react';
import { useKas } from '../../../context/KasContext';
import { Student } from '../../../types';
import { X, Users, User, Hash, Phone } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editStudent?: Student | null;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  editStudent,
}) => {
  const { addStudent, updateStudent, students, settings } = useKas();

  const [name, setName] = useState('');
  const [nis, setNis] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (editStudent) {
      setName(editStudent.name);
      setNis(editStudent.nis);
      setGender(editStudent.gender);
      setPhone(editStudent.phone || '');
    } else {
      setName('');
      setNis(String(students.length + 1));
      setGender('L');
      setPhone('');
    }
  }, [editStudent, isOpen, students.length]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nis.trim()) return;

    if (editStudent) {
      await updateStudent(editStudent.id, {
        name: name.trim(),
        nis: nis.trim(),
        gender,
        phone: phone.trim(),
      });
    } else {
      await addStudent({
        name: name.trim(),
        nis: nis.trim(),
        gender,
        class: settings.className,
        phone: phone.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-soft-xl border border-slate-100 animate-scale-in relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {editStudent ? 'Edit Data Siswa' : '+ Tambah Siswa Baru'}
            </h3>
            <p className="text-xs text-slate-500">
              Daftar siswa kelas {settings.className}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nomor Absen */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nomor Absen Siswa
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">No.</span>
              <input
                type="text"
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                placeholder="Contoh: 1, 2, 3..."
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800 font-bold"
                required
              />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Lengkap Siswa
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Muhammad Bintang"
              className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800"
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jenis Kelamin
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('L')}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                  gender === 'L'
                    ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Laki-laki (L)
              </button>
              <button
                type="button"
                onClick={() => setGender('P')}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                  gender === 'P'
                    ? 'bg-pink-50 border-pink-300 text-pink-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Perempuan (P)
              </button>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              No. WhatsApp / HP (Opsional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-500 text-slate-800"
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
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-brand-200 transition-all"
            >
              {editStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
