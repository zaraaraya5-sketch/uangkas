import React, { useState, useEffect } from 'react';
import { useKas } from '../../../context/KasContext';
import { Payment, PaymentMethod } from '../../../types';
import { X, Wallet, Calendar, DollarSign, FileText, User } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editPayment?: Payment | null;
}

const MONTH_OPTIONS = [
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
  'Lunas 5 Bulan (Juli - Nov)',
  'Lunas 1 Semester (6 Bulan)',
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  editPayment,
}) => {
  const { students, addPayment, updatePayment, currentUser, settings } = useKas();

  const [studentId, setStudentId] = useState(students[0]?.id || 'std-01');
  const [amount, setAmount] = useState<number>(settings.monthlyFee || 5000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [monthName, setMonthName] = useState<string>('Juli');
  const [description, setDescription] = useState<string>('Kas Bulan Juli');

  useEffect(() => {
    if (editPayment) {
      setStudentId(editPayment.studentId);
      setAmount(editPayment.amount);
      setPaymentMethod(editPayment.paymentMethod);
      setPaymentDate(editPayment.paymentDate);
      setMonthName(editPayment.monthName || 'Juli');
      setDescription(editPayment.description);
    } else {
      setStudentId(students[0]?.id || 'std-01');
      setAmount(settings.monthlyFee || 5000);
      setPaymentMethod('Tunai');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setMonthName('Juli');
      setDescription('Kas Bulan Juli');
    }
  }, [editPayment, isOpen, students, settings.monthlyFee]);

  if (!isOpen) return null;

  const handleMonthChange = (selectedMonth: string) => {
    setMonthName(selectedMonth);
    if (!editPayment) {
      if (selectedMonth.startsWith('Lunas')) {
        setDescription(selectedMonth);
        setAmount(settings.targetPerStudent || 25000);
      } else {
        setDescription(`Kas Bulan ${selectedMonth}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editPayment) {
      await updatePayment(editPayment.id, {
        studentId,
        amount: Number(amount),
        paymentMethod,
        paymentDate,
        monthName,
        description,
      });
    } else {
      await addPayment({
        studentId,
        amount: Number(amount),
        paymentMethod,
        paymentDate,
        monthName,
        description,
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
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {editPayment ? 'Edit Pembayaran Kas' : '+ Tambah Pembayaran Kas'}
            </h3>
            <p className="text-xs text-slate-500">
              Catat setoran iuran kas bulanan siswa kelas {settings.className} (Rp 5.000/bulan)
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih Nama Siswa ({students.length} Siswa)
            </label>
            {students.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                ⚠️ Belum ada data siswa. Silakan tambahkan siswa terlebih dahulu di menu <strong>Data Siswa</strong>.
              </div>
            ) : (
              <div className="relative">
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                  required
                >
                  {students.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      {idx + 1}. {s.name} ({s.gender})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Amount & Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nominal Pembayaran (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="number"
                min={1000}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 text-sm font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                required
              />
            </div>
            {/* Quick amount presets for Rp 5.000 / month */}
            <div className="flex flex-wrap gap-2 mt-2">
              {[5000, 10000, 15000, 20000, 25000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    amount === preset
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {(preset / 1000).toLocaleString('id-ID')}rb ({preset / 5000} bln)
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method (Tunai) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Metode Pembayaran
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span>💵</span>
              <span>Tunai (Setoran Langsung ke Bendahara)</span>
            </div>
          </div>

          {/* Date & Month */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Pembayaran
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Untuk Bulan
              </label>
              <select
                value={monthName}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 text-slate-800"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Keterangan / Catatan
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Kas Bulan Juli & Agustus / via Dana"
              className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 text-slate-800"
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-emerald-200 transition-all"
            >
              {editPayment ? 'Simpan Perubahan' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
