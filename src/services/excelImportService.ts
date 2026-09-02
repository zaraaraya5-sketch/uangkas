import * as XLSX from 'xlsx';
import { Student, Payment, Expense, ExpenseCategory } from '../types';

export const excelImportService = {
  // 1. Download Template Data Siswa
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
    XLSX.writeFile(wb, `Template_Data_Siswa_${className.replace(/\s+/g, '_')}.xlsx`);
  },

  // 2. Download Template Pembayaran Kas
  downloadPaymentTemplate(className = 'XI PPLG 3', students: Student[] = []): void {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['PETUNJUK: Masukkan riwayat setoran uang kas. Kolom No. Absen / Nama Siswa dan Nominal (Rp) wajib diisi.'],
      [],
      ['No. Absen', 'Nama Siswa', 'Nominal (Rp)', 'Tanggal (YYYY-MM-DD)', 'Bulan / Minggu', 'Keterangan'],
    ];

    if (students.length > 0) {
      students.slice(0, 5).forEach((s, idx) => {
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
      rows.push(['2', 'Contoh Siswa 2', '3000', new Date().toISOString().slice(0, 10), 'Minggu ke-1', 'Kas Minggu ke-1']);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 16 }, { wch: 22 }, { wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Template Pembayaran');
    XLSX.writeFile(wb, `Template_Pembayaran_Kas_${className.replace(/\s+/g, '_')}.xlsx`);
  },

  // 3. Download Template Pengeluaran Kas
  downloadExpenseTemplate(className = 'XI PPLG 3'): void {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['PETUNJUK: Masukkan pengeluaran kas kelas. Kolom Nama Pengeluaran dan Nominal wajib diisi.'],
      [],
      ['Nama Pengeluaran', 'Nominal (Rp)', 'Kategori', 'Tanggal (YYYY-MM-DD)', 'Keterangan'],
      ['Spidol & Penghapus Whiteboard', '25000', 'Alat Tulis & Kelas', new Date().toISOString().slice(0, 10), 'Keperluan kelas'],
      ['Isi Galon Air Minum', '6000', 'Konsumsi', new Date().toISOString().slice(0, 10), 'Air galon'],
      ['Foto Copy Modul MTK', '46000', 'Kegiatan & Lomba', new Date().toISOString().slice(0, 10), 'Fotocopy tugas'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Template Pengeluaran');
    XLSX.writeFile(wb, `Template_Pengeluaran_Kas_${className.replace(/\s+/g, '_')}.xlsx`);
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
        if (rowText.includes('nama') || rowText.includes('absen') || rowText.includes('nis')) {
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

      // Try finding values from row elements
      if (row[0] !== undefined && row[1] !== undefined) {
        // Standard format: [No/Absen, Nama, Gender, Phone]
        absen = String(row[0] || '').trim();
        name = String(row[1] || '').trim();
        const rawGender = String(row[2] || '').trim().toUpperCase();
        gender = rawGender.startsWith('P') || rawGender.includes('PEREMPUAN') ? 'P' : 'L';
        phone = String(row[3] || '').trim();
      } else if (row[0] !== undefined) {
        name = String(row[0] || '').trim();
        absen = String(results.length + 1);
      }

      // Skip title / instruction rows or empty names
      if (!name || name.toLowerCase().includes('petunjuk') || name.toLowerCase() === 'nama siswa') {
        continue;
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

  // 5. Parse Payment Excel File
  async parsePaymentFile(
    file: File,
    existingStudents: Student[]
  ): Promise<{ payments: Omit<Payment, 'id' | 'createdAt'>[]; unmatchedNames: string[] }> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const payments: Omit<Payment, 'id' | 'createdAt'>[] = [];
    const unmatchedNames: string[] = [];

    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (Array.isArray(row)) {
        const rowText = row.map((c) => String(c || '').toLowerCase()).join(' ');
        if (rowText.includes('nominal') || rowText.includes('nama') || rowText.includes('jumlah')) {
          headerRowIndex = i;
          break;
        }
      }
    }

    const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

    for (let i = startIndex; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      const col0 = String(row[0] || '').trim(); // Absen / No
      const col1 = String(row[1] || '').trim(); // Nama
      const col2 = String(row[2] || '').trim(); // Nominal
      const col3 = String(row[3] || '').trim(); // Tanggal
      const col4 = String(row[4] || '').trim(); // Bulan/Minggu
      const col5 = String(row[5] || '').trim(); // Keterangan

      // Clean nominal
      const cleanAmount = Number(String(col2).replace(/[^0-9]/g, ''));
      if (!cleanAmount || isNaN(cleanAmount) || cleanAmount <= 0) continue;

      // Find student by Absen (nis) or by Name
      let matchedStudent = existingStudents.find((s) => s.nis === col0 || s.id === col0);
      if (!matchedStudent && col1) {
        matchedStudent = existingStudents.find(
          (s) => s.name.toLowerCase() === col1.toLowerCase() || s.name.toLowerCase().includes(col1.toLowerCase())
        );
      }

      if (!matchedStudent) {
        unmatchedNames.push(col1 || `Absen ${col0}`);
        continue;
      }

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

    return { payments, unmatchedNames };
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
