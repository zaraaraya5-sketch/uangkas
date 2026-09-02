import * as XLSX from 'xlsx';
import { Student, Payment, Expense, ExpenseCategory } from '../types';

function saveExcelFile(wb: XLSX.WorkBook, fileName: string): void {
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
    console.error('Error saving excel file:', e);
    XLSX.writeFile(wb, fileName);
  }
}

export interface ParsedPaymentResult {
  payments: Omit<Payment, 'id' | 'createdAt'>[];
  autoCreatedStudents: Omit<Student, 'id' | 'createdAt'>[];
  previewRows: Array<{
    absen: string;
    name: string;
    amount: number;
    month: string;
    desc: string;
    isNewStudent: boolean;
  }>;
}

export const excelImportService = {
  // 1. Download Template Data Siswa (.xlsx)
  downloadStudentTemplate(className = 'XI PPLG 3'): void {
    const wb = XLSX.utils.book_new();
    const headers = [
      ['PETUNJUK: Masukkan data siswa di bawah header tabel ini. Kolom No. Absen dan Nama Siswa wajib diisi.'],
      [],
      ['No. Absen', 'Nama Siswa', 'Jenis Kelamin (L/P)', 'No. WhatsApp / HP'],
      ['1', 'Abyan Alfarizi', 'L', '081234567890'],
      ['2', 'Aisyah Chyntia Devantara', 'P', '081234567891'],
      ['3', 'Alivia Cahaya Lukmana', 'P', '081234567892'],
      ['4', 'Andini Noviani', 'P', '081234567893'],
      ['5', 'Asyifa Nurmaulidya', 'P', '081234567894'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(headers);
    ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
    saveExcelFile(wb, `Template_Data_Siswa_${className.replace(/\s+/g, '_')}.xlsx`);
  },

  // 2. Download Template Pembayaran Kas (.xlsx)
  downloadPaymentTemplate(className = 'XI PPLG 3', students: Student[] = []): void {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['PETUNJUK: Masukkan riwayat setoran uang kas. Kolom No. Absen / Nama Siswa dan Nominal (Rp) wajib diisi. Masukkan 0 jika belum ada bayar.'],
      [],
      ['No. Absen', 'Nama Siswa', 'Nominal (Rp)', 'Tanggal (YYYY-MM-DD)', 'Bulan / Minggu', 'Keterangan'],
    ];

    if (students.length > 0) {
      students.forEach((s, idx) => {
        rows.push([
          s.nis || String(idx + 1),
          s.name,
          '5000',
          new Date().toISOString().slice(0, 10),
          'Juli',
          `Kas Bulan Juli`,
        ]);
      });
    } else {
      rows.push(['1', 'Contoh Siswa 1', '5000', new Date().toISOString().slice(0, 10), 'Juli', 'Kas Bulan Juli']);
      rows.push(['2', 'Contoh Siswa 2', '0', new Date().toISOString().slice(0, 10), 'Juli', 'Belum Bayar']);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 16 }, { wch: 22 }, { wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Template Pembayaran');
    saveExcelFile(wb, `Template_Pembayaran_Kas_${className.replace(/\s+/g, '_')}.xlsx`);
  },

  // 3. Download Template Pengeluaran Kas (.xlsx)
  downloadExpenseTemplate(className = 'XI PPLG 3'): void {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['PETUNJUK: Masukkan pengeluaran kas kelas. Kolom Nama Pengeluaran dan Nominal wajib diisi.'],
      [],
      ['Nama Pengeluaran', 'Nominal (Rp)', 'Kategori', 'Tanggal (YYYY-MM-DD)', 'Keterangan'],
      ['Spidol & Penghapus Whiteboard', '25000', 'Keperluan Kelas', new Date().toISOString().slice(0, 10), 'Keperluan kelas'],
      ['Isi Galon Air Minum', '6000', 'Konsumsi', new Date().toISOString().slice(0, 10), 'Air galon'],
      ['Foto Copy Modul Pelajaran', '46000', 'Acara Kelas', new Date().toISOString().slice(0, 10), 'Fotocopy tugas'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Template Pengeluaran');
    saveExcelFile(wb, `Template_Pengeluaran_Kas_${className.replace(/\s+/g, '_')}.xlsx`);
  },

  // 4. Parse Student Excel File
  async parseStudentFile(file: File, className = 'XI PPLG 3'): Promise<Omit<Student, 'id' | 'createdAt'>[]> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const results: Omit<Student, 'id' | 'createdAt'>[] = [];

    // Find header row
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (Array.isArray(row)) {
        const rowText = row.map((c) => String(c || '').toLowerCase()).join(' ');
        if (rowText.includes('nama') || rowText.includes('absen') || rowText.includes('siswa')) {
          headerRowIndex = i;
          break;
        }
      }
    }

    const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

    for (let i = startIndex; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      let absen = '';
      let name = '';
      let gender: 'L' | 'P' = 'L';
      let phone = '';

      if (row[0] !== undefined && row[1] !== undefined) {
        absen = String(row[0] || '').trim();
        name = String(row[1] || '').trim();
        const rawGender = String(row[2] || '').trim().toUpperCase();
        gender = rawGender.startsWith('P') || rawGender.includes('PEREMPUAN') ? 'P' : 'L';
        phone = String(row[3] || '').trim();
      } else if (row[0] !== undefined) {
        name = String(row[0] || '').trim();
        absen = String(results.length + 1);
      }

      if (!name || name.toLowerCase().includes('petunjuk') || name.toLowerCase() === 'nama siswa') {
        continue;
      }

      // Remove any numeric prefix like "1. Abyan" -> name: "Abyan", absen: "1"
      const matchNumbered = name.match(/^(\d+)[.\s\-=]+(.*)/);
      if (matchNumbered) {
        if (!absen || isNaN(Number(absen))) {
          absen = matchNumbered[1];
        }
        name = matchNumbered[2].trim();
      }

      results.push({
        nis: absen || String(results.length + 1),
        name,
        gender,
        class: className,
        phone,
      });
    }

    return results;
  },

  // 5. Parse Payment Excel File (Auto detects students and handles 0 nominal gracefully)
  async parsePaymentFile(
    file: File,
    existingStudents: Student[],
    className = 'XI PPLG 3'
  ): Promise<ParsedPaymentResult> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const payments: Omit<Payment, 'id' | 'createdAt'>[] = [];
    const autoCreatedStudents: Omit<Student, 'id' | 'createdAt'>[] = [];
    const previewRows: ParsedPaymentResult['previewRows'] = [];

    // Track known students (existing + new during this parse)
    const currentStudents = [...existingStudents];

    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (Array.isArray(row)) {
        const rowText = row.map((c) => String(c || '').toLowerCase()).join(' ');
        if (rowText.includes('nominal') || rowText.includes('nama') || rowText.includes('jumlah') || rowText.includes('tunggakan')) {
          headerRowIndex = i;
          break;
        }
      }
    }

    const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

    for (let i = startIndex; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      let col0 = String(row[0] || '').trim(); // Absen / No
      let col1 = String(row[1] || '').trim(); // Nama
      let col2 = String(row[2] || '0').trim(); // Nominal / Tunggakan
      const col3 = String(row[3] || '').trim(); // Tanggal
      const col4 = String(row[4] || '').trim(); // Bulan/Minggu
      const col5 = String(row[5] || '').trim(); // Keterangan

      // Handle single cell format like "1. Abyan = Rp52.000"
      if (!col1 && col0.includes('=')) {
        const parts = col0.split('=');
        col1 = parts[0].trim();
        col2 = parts[1].trim();
      }

      // Check numbered name "1. Abyan"
      const matchNumbered = col1.match(/^(\d+)[.\s\-=]+(.*)/);
      if (matchNumbered) {
        if (!col0 || isNaN(Number(col0))) {
          col0 = matchNumbered[1];
        }
        col1 = matchNumbered[2].trim();
      }

      if (!col1 || col1.toLowerCase().includes('petunjuk') || col1.toLowerCase() === 'nama siswa') {
        continue;
      }

      // Clean nominal
      const cleanAmount = Number(String(col2).replace(/[^0-9]/g, '')) || 0;

      // Find student in current list
      let matchedStudent = currentStudents.find(
        (s) => s.nis === col0 || s.name.toLowerCase() === col1.toLowerCase()
      );

      let isNewStudent = false;

      // If student does not exist yet, auto create student record
      if (!matchedStudent) {
        const newAbsen = col0 || String(currentStudents.length + 1);
        const newStudentObj: Omit<Student, 'id' | 'createdAt'> = {
          nis: newAbsen,
          name: col1,
          gender: 'L',
          class: className,
        };
        autoCreatedStudents.push(newStudentObj);
        isNewStudent = true;

        // Temporary simulated student record for linking
        const simId = `sim-std-${newAbsen}-${Date.now()}`;
        matchedStudent = {
          ...newStudentObj,
          id: simId,
          createdAt: new Date().toISOString(),
        };
        currentStudents.push(matchedStudent);
      }

      // If cleanAmount > 0, create a payment transaction
      if (cleanAmount > 0) {
        payments.push({
          studentId: matchedStudent.id,
          amount: cleanAmount,
          paymentMethod: 'Tunai',
          paymentDate: col3 && col3.length === 10 ? col3 : new Date().toISOString().slice(0, 10),
          monthName: col4 || 'Juli',
          description: col5 || `Kas ${col4 || 'Bulan Juli'}`,
          createdBy: 'Import Excel',
        });
      }

      // Add to live preview rows (even with Rp 0)
      previewRows.push({
        absen: col0 || matchedStudent.nis,
        name: col1,
        amount: cleanAmount,
        month: col4 || 'Juli',
        desc: col5 || (cleanAmount > 0 ? `Kas ${col4 || 'Bulan Juli'}` : 'Belum Membayar (Rp 0)'),
        isNewStudent,
      });
    }

    return { payments, autoCreatedStudents, previewRows };
  },

  // 6. Parse Expense Excel File
  async parseExpenseFile(file: File): Promise<Omit<Expense, 'id' | 'createdAt'>[]> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const expenses: Omit<Expense, 'id' | 'createdAt'>[] = [];

    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (Array.isArray(row)) {
        const rowText = row.map((c) => String(c || '').toLowerCase()).join(' ');
        if (rowText.includes('pengeluaran') || rowText.includes('nominal') || rowText.includes('kategori')) {
          headerRowIndex = i;
          break;
        }
      }
    }

    const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

    for (let i = startIndex; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      const title = String(row[0] || '').trim();
      const rawAmount = String(row[1] || '').trim();
      const category = String(row[2] || 'Lainnya').trim();
      const date = String(row[3] || '').trim();
      const description = String(row[4] || '').trim();

      const cleanAmount = Number(rawAmount.replace(/[^0-9]/g, ''));
      if (!title || !cleanAmount || isNaN(cleanAmount) || cleanAmount <= 0) continue;
      if (title.toLowerCase().includes('petunjuk') || title.toLowerCase() === 'nama pengeluaran') continue;

      const cleanCategory: ExpenseCategory = 
        category === 'Keperluan Kelas' || category === 'Peralatan' || category === 'Acara Kelas' || category === 'Konsumsi'
          ? category
          : 'Lainnya';

      expenses.push({
        title,
        amount: cleanAmount,
        category: cleanCategory,
        expenseDate: date && date.length === 10 ? date : new Date().toISOString().slice(0, 10),
        description: description || title,
        createdBy: 'Import Excel',
      });
    }

    return expenses;
  },
};
