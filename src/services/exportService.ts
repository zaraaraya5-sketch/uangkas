import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentSummary, Payment, Expense, TransactionItem, CashOverview, ClassSettings } from '../types';

export const exportService = {
  // Export full financial data to Excel (.xlsx)
  exportToExcel(
    students: StudentSummary[],
    payments: Payment[],
    expenses: Expense[],
    transactions: TransactionItem[],
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
    const wsStudents = XLSX.utils.json_to_sheet(studentRows);
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Status Pembayaran Siswa');

    // 3. Sheet: Riwayat Pemasukan
    const paymentRows = payments.map((p, idx) => ({
      No: idx + 1,
      Tanggal: p.paymentDate,
      'Nama Siswa': p.studentName || '-',
      'Nominal (Rp)': p.amount,
      Metode: p.paymentMethod,
      Minggu: p.weekNumber ? `Minggu ${p.weekNumber}` : '-',
      Keterangan: p.description,
      'Dicatat Oleh': p.createdBy,
    }));
    const wsPayments = XLSX.utils.json_to_sheet(paymentRows);
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Pemasukan Kas');

    // 4. Sheet: Riwayat Pengeluaran
    const expenseRows = expenses.map((e, idx) => ({
      No: idx + 1,
      Tanggal: e.expenseDate,
      'Nama Pengeluaran': e.title,
      Kategori: e.category,
      'Nominal (Rp)': e.amount,
      Keterangan: e.description,
      'Dicatat Oleh': e.createdBy,
    }));
    const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Pengeluaran Kas');

    // 5. Sheet: Semua Transaksi (Buku Kas Umum)
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
    const wsTransactions = XLSX.utils.json_to_sheet(transactionRows);
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Buku Kas Umum');

    // Write file
    const fileName = `KasKelas_${settings.className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  },

  // Export official PDF report
  exportToPDF(
    students: StudentSummary[],
    transactions: TransactionItem[],
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

    const tableRows = transactions.slice(0, 30).map((t, index) => [
      index + 1,
      t.date,
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      t.title,
      t.category || t.method || '-',
      (t.type === 'income' ? '+ ' : '- ') + formatRupiah(t.amount),
    ]);

    autoTable(doc, {
      startY: 77,
      head: [['No', 'Tanggal', 'Tipe', 'Keterangan', 'Kategori/Metode', 'Nominal']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [12, 140, 233],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 22 },
        2: { cellWidth: 24, fontStyle: 'bold' },
        3: { cellWidth: 70 },
        4: { cellWidth: 30 },
        5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          if (data.cell.raw === 'Pemasukan') {
            data.cell.styles.textColor = [22, 163, 74];
          } else {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      },
    });

    // Signature Block at bottom
    const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : 230;
    
    // Add page if too low
    if (finalY > 240) {
      doc.addPage();
    }

    const sigY = finalY > 240 ? 30 : finalY;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    doc.text('Mengetahui,', 30, sigY);
    doc.text('Ketua Kelas', 30, sigY + 5);
    doc.text(settings.classPresident, 30, sigY + 25);
    doc.setDrawColor(148, 163, 184);
    doc.line(30, sigY + 26, 75, sigY + 26);

    doc.text('Dilaporkan oleh,', 140, sigY);
    doc.text('Bendahara Kas Kelas', 140, sigY + 5);
    doc.text(settings.treasurer1, 140, sigY + 25);
    doc.line(140, sigY + 26, 185, sigY + 26);

    const fileName = `Laporan_Kas_${settings.className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  }
};
