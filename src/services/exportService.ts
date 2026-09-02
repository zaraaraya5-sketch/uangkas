import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentSummary, Payment, Expense, TransactionItem, CashOverview, ClassSettings } from '../types';

export const exportService = {
  // Export full financial data to Excel (.xlsx)
  exportToExcel(
    students: StudentSummary[] = [],
    payments: Payment[] = [],
    expenses: Expense[] = [],
    transactions: TransactionItem[] = [],
    overview: CashOverview,
    settings: ClassSettings
  ): void {
    const wb = XLSX.utils.book_new();

    // 1. Sheet: Ringkasan
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

    // 2. Sheet: Data Siswa & Status Pembayaran
    let wsStudents: XLSX.WorkSheet;
    if (students.length > 0) {
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
      wsStudents = XLSX.utils.json_to_sheet(studentRows);
    } else {
      wsStudents = XLSX.utils.aoa_to_sheet([
        ['No', 'No. Absen', 'Nama Siswa', 'Kelas', 'Target Kas (Rp)', 'Total Dibayar (Rp)', 'Tunggakan (Rp)', 'Status'],
        ['-', '-', '(Belum ada data siswa)', settings.className, '0', '0', '0', '-'],
      ]);
    }
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Status Pembayaran Siswa');

    // 3. Sheet: Riwayat Pemasukan
    let wsPayments: XLSX.WorkSheet;
    if (payments.length > 0) {
      const paymentRows = payments.map((p, idx) => ({
        No: idx + 1,
        Tanggal: p.paymentDate,
        'ID/Absen Siswa': p.studentId,
        'Nama Siswa': p.studentName || '-',
        'Nominal (Rp)': p.amount,
        Metode: p.paymentMethod,
        'Bulan / Minggu': p.monthName || '-',
        Keterangan: p.description,
        'Dicatat Oleh': p.createdBy,
      }));
      wsPayments = XLSX.utils.json_to_sheet(paymentRows);
    } else {
      wsPayments = XLSX.utils.aoa_to_sheet([
        ['No', 'Tanggal', 'Nama Siswa', 'Nominal (Rp)', 'Metode', 'Bulan / Minggu', 'Keterangan'],
        ['-', '-', '(Belum ada riwayat pembayaran)', '0', 'Tunai', '-', '-'],
      ]);
    }
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Pemasukan Kas');

    // 4. Sheet: Riwayat Pengeluaran
    let wsExpenses: XLSX.WorkSheet;
    if (expenses.length > 0) {
      const expenseRows = expenses.map((e, idx) => ({
        No: idx + 1,
        Tanggal: e.expenseDate,
        'Nama Pengeluaran': e.title,
        Kategori: e.category,
        'Nominal (Rp)': e.amount,
        Keterangan: e.description,
        'Dicatat Oleh': e.createdBy,
      }));
      wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
    } else {
      wsExpenses = XLSX.utils.aoa_to_sheet([
        ['No', 'Tanggal', 'Nama Pengeluaran', 'Kategori', 'Nominal (Rp)', 'Keterangan'],
        ['-', '-', '(Belum ada data pengeluaran)', '-', '0', '-'],
      ]);
    }
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Pengeluaran Kas');

    // 5. Sheet: Semua Transaksi (Buku Kas Umum)
    let wsTransactions: XLSX.WorkSheet;
    if (transactions.length > 0) {
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
      wsTransactions = XLSX.utils.json_to_sheet(transactionRows);
    } else {
      wsTransactions = XLSX.utils.aoa_to_sheet([
        ['No', 'Tanggal', 'Tipe', 'Transaksi', 'Kategori', 'Nominal (Rp)', 'Keterangan'],
        ['-', '-', '-', '(Belum ada mutasi transaksi)', '-', '0', '-'],
      ]);
    }
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Buku Kas Umum');

    // Write file using Blob anchor to guarantee proper filename and .xlsx extension
    const fileName = `Laporan_Kas_${settings.className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    try {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
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
  },

  // Export official PDF report
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
    doc.setTextColor(12, 140, 233); // Brand color
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
    doc.setTextColor(22, 163, 74); // Green
    doc.text(formatRupiah(overview.totalIncome), 20, 52);

    doc.setTextColor(220, 38, 38); // Red
    doc.text(formatRupiah(overview.totalExpense), 80, 52);

    doc.setTextColor(12, 140, 233); // Blue
    doc.text(formatRupiah(overview.currentBalance), 140, 52);

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${overview.paidStudentsCount}/${overview.totalStudents} Siswa Lunas (${overview.paymentPercentage.toFixed(0)}%)`, 20, 60);

    // Table: Transaksi Terbaru / Kas
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
