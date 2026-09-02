import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentSummary, Student, Payment, Expense, TransactionItem, CashOverview, ClassSettings } from '../types';

function saveExcelBlob(wb: XLSX.WorkBook, fileName: string): void {
  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 200);
  } catch (e) {
    console.error('Error saving export file:', e);
    XLSX.writeFile(wb, fileName);
  }
}

export const exportService = {
  // 1. Export Khusus Data Siswa (.xlsx)
  exportStudentsToExcel(students: StudentSummary[] = [], settings: ClassSettings): void {
    const wb = XLSX.utils.book_new();
    const rows = students.map((s, idx) => ({
      'No': idx + 1,
      'No. Absen / NIS': s.nis,
      'Nama Siswa': s.name,
      'Jenis Kelamin': s.gender,
      'Kelas': s.class,
      'No. WhatsApp / HP': s.phone || '-',
      'Target Kas (Rp)': s.targetAmount,
      'Total Bayar (Rp)': s.totalPaid,
      'Tunggakan (Rp)': s.remainingAmount,
      'Status Pembayaran': s.status,
      'Jumlah Setoran': s.paymentCount,
      'Setoran Terakhir': s.lastPaymentDate || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Keterangan': 'Tidak ada data siswa' }]);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 28 },
      { wch: 14 },
      { wch: 12 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');

    const fileName = `Data_Siswa_${settings.className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveExcelBlob(wb, fileName);
  },

  // 2. Export Khusus Pembayaran Kas (.xlsx)
  exportPaymentsToExcel(payments: Payment[] = [], students: Student[] = [], settings: ClassSettings): void {
    const wb = XLSX.utils.book_new();
    const studentMap = new Map(students.map((s) => [s.id, s.name]));
    const studentNisMap = new Map(students.map((s) => [s.id, s.nis]));

    const rows = payments.map((p, idx) => ({
      'No': idx + 1,
      'Tanggal Bayar': p.paymentDate,
      'No. Absen': studentNisMap.get(p.studentId) || '-',
      'Nama Siswa': studentMap.get(p.studentId) || p.studentName || 'Siswa',
      'Nominal (Rp)': p.amount,
      'Metode Pembayaran': p.paymentMethod,
      'Bulan / Minggu': p.monthName || (p.weekNumber ? `Minggu ${p.weekNumber}` : '-'),
      'Keterangan': p.description || '-',
      'Petugas Penerima': p.createdBy || 'Bendahara',
    }));

    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Keterangan': 'Tidak ada riwayat pembayaran' }]);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 12 },
      { wch: 28 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 26 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Pemasukan Kas');

    const fileName = `Rekap_Pembayaran_Kas_${settings.className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveExcelBlob(wb, fileName);
  },

  // 3. Export Khusus Pengeluaran Kas (.xlsx)
  exportExpensesToExcel(expenses: Expense[] = [], settings: ClassSettings): void {
    const wb = XLSX.utils.book_new();
    const rows = expenses.map((e, idx) => ({
      'No': idx + 1,
      'Tanggal Pengeluaran': e.expenseDate,
      'Nama Pengeluaran / Barang': e.title,
      'Kategori': e.category,
      'Nominal (Rp)': e.amount,
      'Rincian / Keterangan': e.description || '-',
      'Dicatat Oleh': e.createdBy || 'Bendahara',
    }));

    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Keterangan': 'Tidak ada data pengeluaran' }]);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 30 },
      { wch: 18 },
      { wch: 16 },
      { wch: 30 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Pengeluaran Kas');

    const fileName = `Rekap_Pengeluaran_Kas_${settings.className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveExcelBlob(wb, fileName);
  },

  // 4. Export Buku Kas Umum & Mutasi Transaksi (.xlsx)
  exportAllTransactionsToExcel(
    payments: Payment[] = [],
    expenses: Expense[] = [],
    students: Student[] = [],
    settings: ClassSettings
  ): void {
    const wb = XLSX.utils.book_new();
    const studentMap = new Map(students.map((s) => [s.id, s.name]));

    const allTx: Array<{
      date: string;
      type: string;
      title: string;
      categoryOrMethod: string;
      income: number | string;
      expense: number | string;
      description: string;
      officer: string;
    }> = [];

    payments.forEach((p) => {
      const sName = studentMap.get(p.studentId) || 'Siswa';
      allTx.push({
        date: p.paymentDate,
        type: 'Pemasukan',
        title: `Setoran Kas: ${sName}`,
        categoryOrMethod: p.paymentMethod,
        income: p.amount,
        expense: '-',
        description: p.description || '-',
        officer: p.createdBy,
      });
    });

    expenses.forEach((e) => {
      allTx.push({
        date: e.expenseDate,
        type: 'Pengeluaran',
        title: e.title,
        categoryOrMethod: e.category,
        income: '-',
        expense: e.amount,
        description: e.description || '-',
        officer: e.createdBy,
      });
    });

    allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const rows = allTx.map((t, idx) => ({
      'No': idx + 1,
      'Tanggal Transaksi': t.date,
      'Tipe Mutasi': t.type,
      'Deskripsi / Nama Transaksi': t.title,
      'Kategori / Metode': t.categoryOrMethod,
      'Pemasukan (Rp)': t.income,
      'Pengeluaran (Rp)': t.expense,
      'Rincian / Keterangan': t.description,
      'Dicatat Oleh': t.officer,
    }));

    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Keterangan': 'Tidak ada data mutasi kas' }]);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 14 },
      { wch: 30 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 30 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Buku Kas Umum');

    const fileName = `Buku_Kas_Umum_${settings.className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveExcelBlob(wb, fileName);
  },

  // 4. Export Full Financial Report (Excel)
  exportToExcel(
    students: StudentSummary[] = [],
    payments: Payment[] = [],
    expenses: Expense[] = [],
    transactions: TransactionItem[] = [],
    overview: CashOverview,
    settings: ClassSettings
  ): void {
    const wb = XLSX.utils.book_new();

    // Sheet: Ringkasan
    const summaryData = [
      ['LAPORAN KAS KELAS ' + settings.className],
      ['Tahun Ajaran', settings.academicYear],
      ['Wali Kelas', settings.homeroomTeacher],
      ['Ketua Kelas', settings.classPresident],
      ['Bendahara 1', settings.treasurer1],
      ['Bendahara 2', settings.treasurer2],
      ['Tanggal Cetak', new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })],
      [],
      ['RINGKASAN KEUANGAN'],
      ['Total Pemasukan', overview.totalIncome],
      ['Total Pengeluaran', overview.totalExpense],
      ['Saldo Kas Akhir', overview.currentBalance],
      ['Total Siswa', overview.totalStudents],
      ['Siswa Lunas', overview.paidStudentsCount],
      ['Siswa Sebagian', overview.partialStudentsCount],
      ['Siswa Belum Bayar', overview.unpaidStudentsCount],
      ['Persentase Capaian Kas', `${overview.paymentPercentage.toFixed(1)}%`],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Kas');

    // Sheet: Data Siswa
    const studentRows = students.map((s, idx) => ({
      No: idx + 1,
      'No. Absen': s.nis,
      'Nama Siswa': s.name,
      Kelas: s.class,
      'Target Kas (Rp)': s.targetAmount,
      'Total Dibayar (Rp)': s.totalPaid,
      'Tunggakan (Rp)': s.remainingAmount,
      Status: s.status,
      'Jumlah Pembayaran': s.paymentCount,
      'Pembayaran Terakhir': s.lastPaymentDate || '-',
    }));
    const wsStudents = XLSX.utils.json_to_sheet(studentRows.length > 0 ? studentRows : [{ 'Keterangan': 'Belum ada data' }]);
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Status Siswa');

    // Sheet: Pemasukan
    const studentMap = new Map(students.map((s) => [s.id, s.name]));
    const paymentRows = payments.map((p, idx) => ({
      No: idx + 1,
      Tanggal: p.paymentDate,
      'Nama Siswa': studentMap.get(p.studentId) || p.studentName || '-',
      'Nominal (Rp)': p.amount,
      Metode: p.paymentMethod,
      'Bulan / Minggu': p.monthName || '-',
      Keterangan: p.description,
      'Dicatat Oleh': p.createdBy,
    }));
    const wsPayments = XLSX.utils.json_to_sheet(paymentRows.length > 0 ? paymentRows : [{ 'Keterangan': 'Belum ada pemasukan' }]);
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Pemasukan Kas');

    // Sheet: Pengeluaran
    const expenseRows = expenses.map((e, idx) => ({
      No: idx + 1,
      Tanggal: e.expenseDate,
      'Nama Pengeluaran': e.title,
      Kategori: e.category,
      'Nominal (Rp)': e.amount,
      Keterangan: e.description,
      'Dicatat Oleh': e.createdBy,
    }));
    const wsExpenses = XLSX.utils.json_to_sheet(expenseRows.length > 0 ? expenseRows : [{ 'Keterangan': 'Belum ada pengeluaran' }]);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Pengeluaran Kas');

    // Sheet: Buku Kas Umum
    const transactionRows = transactions.map((t, idx) => ({
      No: idx + 1,
      Tanggal: t.date,
      Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      Transaksi: t.title,
      Kategori: t.category || '-',
      'Nominal (Rp)': t.amount,
      Metode: t.method || '-',
      Keterangan: t.description,
      'Petugas': t.createdBy,
    }));
    const wsTransactions = XLSX.utils.json_to_sheet(transactionRows.length > 0 ? transactionRows : [{ 'Keterangan': 'Belum ada transaksi' }]);
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Buku Kas Umum');

    const fileName = `Laporan_Kas_${settings.className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveExcelBlob(wb, fileName);
  },

  // 5. Export official PDF report
  exportToPDF(
    students: StudentSummary[] = [],
    transactions: TransactionItem[] = [],
    overview: CashOverview,
    settings: ClassSettings,
    periodLabel: string = 'Semua Periode'
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const formatRupiah = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(12, 140, 233);
    doc.text(`LAPORAN KAS KELAS ${settings.className}`, 105, 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tahun Ajaran: ${settings.academicYear} | Periode: ${periodLabel}`, 105, 24, { align: 'center' });
    doc.text(`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`, 105, 29, { align: 'center' });

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 33, 196, 33);

    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 37, 182, 28, 3, 3, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 37, 182, 28, 3, 3, 'S');

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('TOTAL PEMASUKAN', 20, 44);
    doc.text('TOTAL PENGELUARAN', 80, 44);
    doc.text('SALDO KAS SAAT INI', 140, 44);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(22, 163, 74);
    doc.text(formatRupiah(overview.totalIncome), 20, 52);

    doc.setTextColor(220, 38, 38);
    doc.text(formatRupiah(overview.totalExpense), 80, 52);

    doc.setTextColor(12, 140, 233);
    doc.text(formatRupiah(overview.currentBalance), 140, 52);

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${overview.paidStudentsCount}/${overview.totalStudents} Siswa Lunas (${overview.paymentPercentage.toFixed(0)}%)`, 20, 60);

    // Table: Transaksi
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Buku Kas & Riwayat Transaksi', 14, 73);

    const tableRows =
      transactions.length > 0
        ? transactions.slice(0, 30).map((t, index) => [
            index + 1,
            t.date,
            t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
            t.title,
            t.category || t.method || '-',
            (t.type === 'income' ? '+ ' : '- ') + formatRupiah(t.amount),
          ])
        : [['-', '-', '-', 'Belum ada transaksi kas tercatat', '-', 'Rp 0']];

    autoTable(doc, {
      startY: 77,
      head: [['No', 'Tanggal', 'Tipe', 'Keterangan', 'Kategori/Metode', 'Nominal']],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
      },
    });

    // Signature Footer
    const finalY = (doc as any).lastAutoTable?.finalY || 180;
    const signY = finalY > 230 ? 245 : Math.min(240, finalY + 20);

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Mengetahui,', 25, signY);
    doc.text('Wali Kelas', 25, signY + 5);
    doc.text(settings.homeroomTeacher || 'Firman Sidik, S.Pd', 25, signY + 25);

    doc.text('Ketua Kelas,', 90, signY);
    doc.text(settings.classPresident || 'Muhammad Rajib Zahir', 90, signY + 25);

    doc.text('Bendahara Kelas,', 150, signY);
    doc.text(settings.treasurer1 || 'Lulu Maulida (Bendahara 1)', 150, signY + 25);

    doc.save(`Laporan_Kas_${settings.className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  },
};
