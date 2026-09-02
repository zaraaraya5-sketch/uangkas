import React, { useState, useEffect } from 'react';
import { useKas } from '../../../context/KasContext';
import { Payment, PaymentMethod } from '../../../types';
import { X, Wallet, Calendar, DollarSign, FileText, Clock, AlertCircle } from 'lucide-react';

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
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Lunas 5 Bulan (Juli - Nov)',
  'Lunas 1 Semester (6 Bulan)',
  'Lunas 1 Tahun Penuh (12 Bulan)',
];

const WEEK_OPTIONS = [
  'Minggu ke-1',
  'Minggu ke-2',
  'Minggu ke-3',
  'Minggu ke-4',
  'Minggu ke-5',
  'Pelunasan Kas Mingguan (3rb/minggu)',
  'Tunggakan Kas Periode Lama',
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  editPayment,
}) => {
  const { students, addPayment, updatePayment, currentUser, settings } = useKas();

  const [paymentCategory, setPaymentCategory] = useState<'bulanan' | 'mingguan'>('bulanan');
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [amount, setAmount] = useState<number | string>(settings.monthlyFee || 5000);
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
      if (editPayment.monthName?.toLowerCase().includes('minggu') || editPayment.description?.toLowerCase().includes('minggu') || editPayment.description?.toLowerCase().includes('tunggak')) {
        setPaymentCategory('mingguan');
      } else {
        setPaymentCategory('bulanan');
      }
    } else {
      setStudentId(students[0]?.id || '');
      setAmount(5000);
      setPaymentMethod('Tunai');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setMonthName('Juli');
      setDescription('Kas Bulan Juli');
      setPaymentCategory('bulanan');
    }
  }, [editPayment, isOpen, students, settings.monthlyFee]);

  if (!isOpen) return null;

  const handleCategoryChange = (cat: 'bulanan' | 'mingguan') => {
    setPaymentCategory(cat);
    if (cat === 'bulanan') {
      setMonthName('Juli');
      setDescription('Kas Bulan Juli');
      if (!editPayment) setAmount(5000);
    } else {
      setMonthName('Minggu ke-1');
      setDescription('Pelunasan Tunggakan Kas Mingguan');
      if (!editPayment) setAmount(3000);
    }
  };

  const handlePeriodChange = (selectedPeriod: string) => {
    setMonthName(selectedPeriod);
    if (!editPayment) {
      if (paymentCategory === 'bulanan') {
        setDescription(`Kas Bulan ${selectedPeriod}`);
      } else {
        setDescription(`Pelunasan Kas (${selectedPeriod})`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (editPayment) {
      await updatePayment(editPayment.id, {
        studentId,
        amount: numAmount,
        paymentMethod,
        paymentDate,
        monthName,
        description: description.trim() || (paymentCategory === 'bulanan' ? `Kas Bulan ${monthName}` : `Kas ${monthName}`),
      });
    } else {
      await addPayment({
        studentId,
        amount: numAmount,
        paymentMethod,
        paymentDate,
        monthName,
        description: description.trim() || (paymentCategory === 'bulanan' ? `Kas Bulan ${monthName}` : `Kas ${monthName}`),
        createdBy: currentUser?.name || 'Bendahara 1',
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
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {editPayment ? 'Edit Pembayaran Kas' : '+ Catat Pembayaran Kas'}
            </h3>
            <p className="text-xs text-slate-500">
              Pencatatan kas kelas {settings.className}
            </p>
          </div>
        </div>

        {/* 2 Opsi Tipe Kas: Bulanan & Mingguan (Khusus Nunggak) */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Pilih Jenis Iuran Kas:
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => handleCategoryChange('bulanan')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                paymentCategory === 'bulanan'
                  ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <span>📅 Kas Perbulan</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange('mingguan')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                paymentCategory === 'mingguan'
                  ? 'bg-white text-amber-800 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <span>⏳ Kas Perminggu / Nunggak</span>
            </button>
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
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Belum ada data siswa. Silakan tambahkan siswa di menu <strong>Data Siswa</strong> terlebih dahulu.</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-medium"
                  required
                >
                  {students.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      Absen {s.nis || idx + 1}. {s.name} ({s.gender})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Amount (Free typed input) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nominal Pembayaran (Ketik Nominal Bebas)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="number"
                min={100}
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ketik jumlah uang kas, contoh: 3000, 5000, 10000"
                className="w-full pl-10 pr-4 py-2.5 text-sm font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              * Bebas ketik nominal sesuai pembayaran siswa (contoh: 3000 untuk 1 minggu, 5000 untuk 1 bulan, atau nominal pelunasan tunggakan).
            </p>
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

          {/* Date & Period */}
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
                {paymentCategory === 'bulanan' ? 'Untuk Bulan' : 'Untuk Minggu / Tunggakan'}
              </label>
              <select
                value={monthName}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 text-slate-800 font-medium"
              >
                {paymentCategory === 'bulanan'
                  ? MONTH_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))
                  : WEEK_OPTIONS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Keterangan / Catatan Pembayaran
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Kas Bulan Juli / Bayar Tunggakan Minggu 1-3"
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
              disabled={students.length === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-emerald-200 transition-all"
            >
              {editPayment ? 'Simpan Perubahan' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
