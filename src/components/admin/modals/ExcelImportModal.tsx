import React, { useState, useRef } from 'react';
import { useKas } from '../../../context/KasContext';
import { Student, Payment, Expense } from '../../../types';
import { excelImportService, ParsedPaymentResult } from '../../../services/excelImportService';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Trash2,
  Users,
  Wallet,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { formatRupiah } from '../../../utils/formatters';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'student' | 'payment' | 'expense';
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'student',
}) => {
  const { 
    students, 
    addStudentsBatch, 
    addPaymentsBatch, 
    addExpensesBatch, 
    settings, 
    showToast 
  } = useKas();

  const [activeType, setActiveType] = useState<'student' | 'payment' | 'expense'>(defaultType);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parsed data holders
  const [parsedStudents, setParsedStudents] = useState<Omit<Student, 'id' | 'createdAt'>[]>([]);
  const [parsedPaymentData, setParsedPaymentData] = useState<ParsedPaymentResult | null>(null);
  const [parsedExpenses, setParsedExpenses] = useState<Omit<Expense, 'id' | 'createdAt'>[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setFile(null);
    setParsedStudents([]);
    setParsedPaymentData(null);
    setParsedExpenses([]);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTabChange = (type: 'student' | 'payment' | 'expense') => {
    setActiveType(type);
    handleReset();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (activeType === 'student') {
        const data = await excelImportService.parseStudentFile(selectedFile, settings.className);
        if (data.length === 0) {
          setErrorMsg('Tidak ditemukan data siswa yang valid di file Excel ini.');
        } else {
          setParsedStudents(data);
        }
      } else if (activeType === 'payment') {
        const result = await excelImportService.parsePaymentFile(selectedFile, students, settings.className);
        if (result.previewRows.length === 0) {
          setErrorMsg('Tidak ditemukan baris data siswa / kas yang valid di file Excel ini.');
        } else {
          setParsedPaymentData(result);
        }
      } else if (activeType === 'expense') {
        const data = await excelImportService.parseExpenseFile(selectedFile);
        if (data.length === 0) {
          setErrorMsg('Tidak ditemukan data pengeluaran kas yang valid.');
        } else {
          setParsedExpenses(data);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal membaca file Excel. Pastikan format file adalah .xlsx atau .xls.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (activeType === 'student') {
      excelImportService.downloadStudentTemplate(settings.className);
    } else if (activeType === 'payment') {
      excelImportService.downloadPaymentTemplate(settings.className, students);
    } else {
      excelImportService.downloadExpenseTemplate(settings.className);
    }
  };

  const handleExecuteImport = async () => {
    setIsLoading(true);
    try {
      if (activeType === 'student' && parsedStudents.length > 0) {
        await addStudentsBatch(parsedStudents);
        showToast({
          type: 'success',
          title: '✓ Import Siswa Berhasil',
          message: `${parsedStudents.length} siswa berhasil ditambahkan ke kelas.`,
        });
      } else if (activeType === 'payment' && parsedPaymentData) {
        const { autoCreatedStudents, payments, previewRows } = parsedPaymentData;
        
        // 1. Batch create any students who are not registered yet
        const studentIdMap = new Map<string, string>();
        if (autoCreatedStudents.length > 0) {
          const createdStudents = await addStudentsBatch(autoCreatedStudents);
          createdStudents.forEach((cs) => {
            studentIdMap.set(cs.nis, cs.id);
            studentIdMap.set(cs.name.toLowerCase(), cs.id);
          });
        }

        // 2. Prepare payments linking with real IDs
        const finalPaymentsToSave: Omit<Payment, 'id' | 'createdAt'>[] = [];
        for (const p of payments) {
          let finalStudentId = p.studentId;
          if (p.studentId.startsWith('sim-std-')) {
            const matchedAbsen = p.studentId.split('-')[2];
            const realId = studentIdMap.get(matchedAbsen) || students.find((s) => s.nis === matchedAbsen)?.id;
            if (realId) {
              finalStudentId = realId;
            }
          }
          finalPaymentsToSave.push({
            ...p,
            studentId: finalStudentId,
          });
        }

        // 3. Batch save all payments
        if (finalPaymentsToSave.length > 0) {
          await addPaymentsBatch(finalPaymentsToSave);
        }

        showToast({
          type: 'success',
          title: '✓ Import Berhasil & Terhubung',
          message: `${previewRows.length} data siswa diproses (${autoCreatedStudents.length} siswa baru terdaftar, ${finalPaymentsToSave.length} transaksi kas dicatat).`,
        });
      } else if (activeType === 'expense' && parsedExpenses.length > 0) {
        await addExpensesBatch(parsedExpenses);
        showToast({
          type: 'success',
          title: '✓ Import Pengeluaran Berhasil',
          message: `${parsedExpenses.length} pengeluaran berhasil dicatat.`,
        });
      }

      onClose();
      handleReset();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Terjadi kendala saat menyimpan data ke sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasDataToImport =
    (activeType === 'student' && parsedStudents.length > 0) ||
    (activeType === 'payment' && (parsedPaymentData?.previewRows?.length || 0) > 0) ||
    (activeType === 'expense' && parsedExpenses.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-soft-xl border border-slate-100 animate-scale-in relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Import Data dari File Excel (.xlsx)</h3>
            <p className="text-xs text-slate-500">
              Upload file spreadsheet Excel atau Google Sheets untuk pencatatan otomatis
            </p>
          </div>
        </div>

        {/* Type Switcher Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-5 shrink-0">
          <button
            type="button"
            onClick={() => handleTabChange('student')}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all ${
              activeType === 'student'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            👥 Data Siswa
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('payment')}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all ${
              activeType === 'payment'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            💰 Pembayaran Kas
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('expense')}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all ${
              activeType === 'expense'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📤 Pengeluaran Kas
          </button>
        </div>

        {/* Action: Download Template Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 mb-5 shrink-0">
          <div className="text-xs text-emerald-900">
            <span className="font-bold">Template Excel:</span> Unduh template agar susunan kolom sesuai.
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-soft transition-all flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Template Excel (.xlsx)</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload Zone & Preview Area */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-soft flex items-center justify-center text-emerald-600 border border-slate-100">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Klik untuk Upload File Excel (.xlsx) atau Drag & Drop
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Format: <strong className="text-slate-700">Microsoft Excel (.xlsx / .xls)</strong>
                </p>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  * Otomatis membaca nomor absen, nama siswa, dan nominal kas/tunggakan (termasuk Rp 0)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File Info */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-xs">{file.name}</p>
                    <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ganti File</span>
                </button>
              </div>

              {/* Live Preview Table - Students */}
              {activeType === 'student' && parsedStudents.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Pratinjau Data Siswa ({parsedStudents.length} siswa siap diimport):
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">No. Absen</th>
                          <th className="py-2 px-3">Nama Siswa</th>
                          <th className="py-2 px-3">Gender</th>
                          <th className="py-2 px-3">No HP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedStudents.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-bold">{s.nis}</td>
                            <td className="py-1.5 px-3">{s.name}</td>
                            <td className="py-1.5 px-3">{s.gender}</td>
                            <td className="py-1.5 px-3 text-slate-400">{s.phone || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Live Preview Table - Payments */}
              {activeType === 'payment' && parsedPaymentData && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Pratinjau Setoran Kas ({parsedPaymentData.previewRows.length} baris terbaca):
                    </span>
                    {parsedPaymentData.autoCreatedStudents.length > 0 && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        {parsedPaymentData.autoCreatedStudents.length} siswa baru otomatis terdaftar
                      </span>
                    )}
                  </div>
                  <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">No. Absen</th>
                          <th className="py-2 px-3">Nama Siswa</th>
                          <th className="py-2 px-3">Nominal Bayar</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPaymentData.previewRows.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-bold text-slate-700">{r.absen}</td>
                            <td className="py-1.5 px-3 font-medium text-slate-800">
                              <div className="flex items-center gap-1.5">
                                <span>{r.name}</span>
                                {r.isNewStudent && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                                    Baru
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-1.5 px-3 font-bold">
                              {r.amount > 0 ? (
                                <span className="text-emerald-600">{formatRupiah(r.amount)}</span>
                              ) : (
                                <span className="text-slate-400 font-normal">Rp 0 (Belum Bayar)</span>
                              )}
                            </td>
                            <td className="py-1.5 px-3">
                              {r.amount > 0 ? (
                                <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200">
                                  Tercatat
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 font-semibold rounded-full border border-amber-200">
                                  Rp 0
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Live Preview Table - Expenses */}
              {activeType === 'expense' && parsedExpenses.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Pratinjau Pengeluaran ({parsedExpenses.length} transaksi siap diimport):
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Pengeluaran</th>
                          <th className="py-2 px-3">Nominal</th>
                          <th className="py-2 px-3">Kategori</th>
                          <th className="py-2 px-3">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedExpenses.map((exp, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-bold text-slate-800">{exp.title}</td>
                            <td className="py-1.5 px-3 font-bold text-rose-600">{formatRupiah(exp.amount)}</td>
                            <td className="py-1.5 px-3">{exp.category}</td>
                            <td className="py-1.5 px-3 text-slate-400">{exp.expenseDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={!hasDataToImport || isLoading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-emerald-200 transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Proses & Simpan ke Kas</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
