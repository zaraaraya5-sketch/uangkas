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

// Helper: Smart Gender Detection for Indonesian Names
export const detectGenderByName = (name: string, rawVal?: string): 'L' | 'P' => {
  if (rawVal) {
    const cleanRaw = String(rawVal).trim().toUpperCase();
    if (cleanRaw === 'P' || cleanRaw === 'PR' || cleanRaw === 'PEREMPUAN' || cleanRaw === 'WANITA' || cleanRaw === 'FEMALE' || cleanRaw === 'W') {
      return 'P';
    }
    if (cleanRaw === 'L' || cleanRaw === 'LK' || cleanRaw === 'LAKI-LAKI' || cleanRaw === 'LAKI' || cleanRaw === 'PRIA' || cleanRaw === 'MALE' || cleanRaw === 'M') {
      return 'L';
    }
  }

  // Indonesian female name keywords & patterns
  const femalePatterns = [
    /\b(aisyah|alivia|andini|asyifa|aulia|aurel|aurora|anisa|annisa|ayu|amalia|anggraeni)\b/i,
    /\b(bella|cantika|celsi|chelsea|cindy|clara|dhea|dinda|dini|dewi|dia)\b/i,
    /\b(fani|farah|fauziah|febri|fitri|fitria|gita|hana|hany|indah|intan|ica|icha)\b/i,
    /\b(jessica|keisha|khansa|lulu|maulida|maya|mutia|maharani|marwah|mita)\b/i,
    /\b(nabila|nadia|nailah|nayla|nazwa|novia|nur|nuraeni|najwa|nisa)\b/i,
    /\b(putri|rahma|rahmawati|ratu|rika|rini|safitri|sabrina|salma|salsa|salsabila)\b/i,
    /\b(sarah|shifa|siti|suci|syifa|sheila|tasya|talitha|tiara|vanessa|viona)\b/i,
    /\b(widya|wulandari|yasmin|zahra|zara|zhafira|zulfa)\b/i,
  ];

  const lowerName = name.toLowerCase();
  for (const pattern of femalePatterns) {
    if (pattern.test(lowerName)) {
      return 'P';
    }
  }

  return 'L';
};

export const excelImportService = {
  // 1. Download Student Template
  downloadStudentTemplate(className = 'XI PPLG 3'): void {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['PETUNJUK: Masukkan data siswa kelas Anda. Kolom Gender wajib diisi L atau P.'],
      ['No. Absen', 'Nama Siswa', 'Gender (L/P)', 'No. HP Siswa / Orang Tua'],
      ['1', 'Abyan', 'L', '081234567890'],
      ['2', 'Aisyah C. D.', 'P', '081234567891'],
      ['3', 'Alivia C. L.', 'P', '081234567892'],
      ['4', 'Andini N.', 'P', '081234567893'],
      ['5', 'Asyifa N.', 'P', '081234567894'],
      ['6', 'Bagus P. P.', 'L', '081234567895'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 16 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
    saveExcelFile(wb, `Template_Data_Siswa_${className.replace(/\s+/g, '_')}.xlsx`);
  },

  // 2. Download Payment Template
  downloadPaymentTemplate(className = 'XI PPLG 3', students: Student[] = []): void {
    const wb = XLSX.utils.book_new();
    const rows: (string | number)[][] = [
      ['PETUNJUK: Masukkan data setoran iuran kas siswa. Jika lunas sebelum Juli, isi nominal 0.'],
      ['No. Absen', 'Nama Siswa', 'Nominal (Rp)', 'Tanggal (YYYY-MM-DD)', 'Bulan/Periode', 'Keterangan'],
    ];

    if (students.length > 0) {
      students.forEach((s) => {
        rows.push([
          s.nis,
          s.name,
          5000,
          new Date().toISOString().slice(0, 10),
          'Juli',
          'Kas Bulan Juli',
        ]);
      });
    } else {
      rows.push(
        ['1', 'Abyan', 52000, new Date().toISOString().slice(0, 10), 'Juli', 'Kas Laki-Laki'],
        ['2', 'Aisyah C. D.', 0, new Date().toISOString().slice(0, 10), 'Lunas Sebelum Juli', 'Lunas sebelum bulan Juli'],
        ['3', 'Alivia C. L.', 0, new Date().toISOString().slice(0, 10), 'Lunas Sebelum Juli', 'Lunas sebelum bulan Juli'],
        ['4', 'Andini N.', 0, new Date().toISOString().slice(0, 10), 'Lunas Sebelum Juli', 'Lunas sebelum bulan Juli'],
        ['5', 'Asyifa N.', 0, new Date().toISOString().slice(0, 10), 'Lunas Sebelum Juli', 'Lunas sebelum bulan Juli'],
        ['6', 'Bagus P. P.', 23000, new Date().toISOString().slice(0, 10), 'Juli', 'Kas Laki-Laki']
      );
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 16 }, { wch: 20 }, { wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Pembayaran Kas');
    saveExcelFile(wb, `Template_Pembayaran_Kas_${className.replace(/\s+/g, '_')}.xlsx`);
  },

  // 3. Download Expense Template
  downloadExpenseTemplate(className = 'XI PPLG 3'): void {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['PETUNJUK: Masukkan data belanja atau pengeluaran kas kelas.'],
      ['Nama Pengeluaran / Barang', 'Nominal (Rp)', 'Kategori', 'Tanggal (YYYY-MM-DD)', 'Keterangan / Rincian'],
      ['Spidol & Penghapus Whiteboard', '25000', 'Peralatan', new Date().toISOString().slice(0, 10), 'Pembelian ATK kelas'],
      ['Sapu & Pengki Kelas', '35000', 'Keperluan Kelas', new Date().toISOString().slice(0, 10), 'Peralatan kebersihan kelas'],
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

    // Find header row and column indexes
    let headerRowIndex = -1;
    let absenCol = 0;
    let nameCol = 1;
    let genderCol = -1;
    let phoneCol = -1;

    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (Array.isArray(row) && row.length > 1) {
        const rowText = row.map((c) => String(c || '').toLowerCase()).join(' ');
        if (!rowText.includes('petunjuk') && (rowText.includes('nama') || rowText.includes('absen') || rowText.includes('siswa'))) {
          headerRowIndex = i;
          row.forEach((colVal, colIdx) => {
            const val = String(colVal || '').toLowerCase();
            if (val.includes('absen') || val.includes('nis') || val === 'no' || val === 'no.') absenCol = colIdx;
            if (val.includes('nama') || val.includes('siswa')) nameCol = colIdx;
            if (val.includes('gender') || val.includes('jk') || val.includes('kelamin') || val === 'l/p' || val === 'p/l') genderCol = colIdx;
            if (val.includes('hp') || val.includes('telp') || val.includes('telepon') || val.includes('wa') || val.includes('kontak')) phoneCol = colIdx;
          });
          break;
        }
      }
    }

    const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

    for (let i = startIndex; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      let absen = String(row[absenCol] ?? '').trim();
      let name = String(row[nameCol] ?? '').trim();
      let rawGender = genderCol >= 0 ? String(row[genderCol] ?? '').trim() : '';
      let phone = phoneCol >= 0 ? String(row[phoneCol] ?? '').trim() : '';

      // If no nameCol or 1 column format
      if (!name && absen && isNaN(Number(absen))) {
        name = absen;
        absen = String(results.length + 1);
      }

      // Skip instruction or header rows
      if (
        !name || 
        name.toLowerCase().includes('petunjuk') || 
        name.toLowerCase() === 'nama siswa' ||
        name.toLowerCase() === 'nama' ||
        name.toLowerCase().includes('tunggakan uang kas') ||
        name.toLowerCase().includes('data siswa')
      ) {
        continue;
      }

      // Remove numeric prefix like "1. Abyan" -> name: "Abyan", absen: "1"
      const matchNumbered = name.match(/^(\d+)[.\s\-=]+(.*)/);
      if (matchNumbered) {
        absen = matchNumbered[1];
        name = matchNumbered[2].trim();
      }

      // If absen is non-numeric (e.g. 'Laki-laki', 'Perempuan', or header text), convert to gender & assign sequential number
      if (!absen || isNaN(Number(absen))) {
        if (!rawGender) {
          if (absen.toLowerCase().includes('perempuan') || absen.toLowerCase().includes('wanita') || absen.toLowerCase() === 'p') {
            rawGender = 'P';
          } else if (absen.toLowerCase().includes('laki') || absen.toLowerCase().includes('pria') || absen.toLowerCase() === 'l') {
            rawGender = 'L';
          }
        }
        absen = String(results.length + 1);
      }

      // Clean name
      name = name.replace(/~/g, '').trim();

      // Smart Gender Detection
      const gender = detectGenderByName(name, rawGender);

      // If phone column is duplicate of student name or status, clear it
      if (phone.toLowerCase() === name.toLowerCase() || phone.toLowerCase().includes('lunas') || phone.toLowerCase().includes('bayar')) {
        phone = '';
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

  // 5. Parse Payment Excel File (Handles any format, auto-syncs students, handles Rp 0)
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

    const currentStudents = [...existingStudents];

    // Find table header row, excluding any "PETUNJUK" row
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (Array.isArray(row) && row.length > 1) {
        const rowText = row.map((c) => String(c || '').toLowerCase()).join(' ');
        if (
          !rowText.includes('petunjuk') &&
          !rowText.includes('data tunggakan') &&
          (rowText.includes('nominal') || rowText.includes('nama') || rowText.includes('jumlah') || rowText.includes('absen'))
        ) {
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
      let col2 = String(row[2] || '').trim(); // Nominal / Tunggakan
      const col3 = String(row[3] || '').trim(); // Tanggal
      const col4 = String(row[4] || '').trim(); // Bulan/Minggu
      const col5 = String(row[5] || '').trim(); // Keterangan

      // Case 1: Single cell format like "1. Abyan = Rp52.000" or "~2. Aisyah = Rp0~"
      if (!col1 && col0.includes('=')) {
        const cleanedCol0 = col0.replace(/~/g, '');
        const parts = cleanedCol0.split('=');
        col1 = parts[0].trim();
        col2 = parts[1].trim();
      }

      // Case 2: Numbered name in col1 or col0 like "1. Abyan"
      if (col1) {
        const matchNumbered = col1.match(/^(\d+)[.\s\-=]+(.*)/);
        if (matchNumbered) {
          if (!col0 || isNaN(Number(col0))) {
            col0 = matchNumbered[1];
          }
          col1 = matchNumbered[2].trim();
        }
      } else if (col0 && !isNaN(Number(col0)) && row[1]) {
        col1 = String(row[1]).trim();
      } else if (col0) {
        const matchNumbered = col0.match(/^(\d+)[.\s\-=]+(.*)/);
        if (matchNumbered) {
          col0 = matchNumbered[1];
          col1 = matchNumbered[2].trim();
        }
      }

      // Clean strikethrough or special formatting
      col1 = col1.replace(/~/g, '').trim();
      col2 = col2.replace(/~/g, '').trim();

      // Skip instruction or header rows
      if (
        !col1 ||
        col1.toLowerCase().includes('petunjuk') ||
        col1.toLowerCase() === 'nama siswa' ||
        col1.toLowerCase() === 'nama' ||
        col1.toLowerCase().includes('tunggakan uang kas') ||
        col1.toLowerCase().includes('data tunggakan')
      ) {
        continue;
      }

      // Clean nominal
      const cleanAmount = Number(String(col2 || '0').replace(/[^0-9]/g, '')) || 0;

      // 1. Normalize name for matching
      const cleanCol1 = col1.toLowerCase().replace(/[^a-z0-9]/g, '');

      // 2. Prioritize exact or normalized Name match first
      let matchedStudent = currentStudents.find((s) => {
        const cleanSName = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanSName === cleanCol1 || s.name.toLowerCase() === col1.toLowerCase();
      });

      // 3. If not matched, check if one name contains the other (for abbreviations like M. Alif vs Muhammad Alif)
      if (!matchedStudent && cleanCol1.length >= 4) {
        matchedStudent = currentStudents.find((s) => {
          const cleanSName = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanSName.includes(cleanCol1) || cleanCol1.includes(cleanSName);
        });
      }

      // 4. If still not matched, only check NIS if candidate name is compatible
      if (!matchedStudent && col0 && !isNaN(Number(col0))) {
        const candidate = currentStudents.find((s) => s.nis === col0);
        if (candidate) {
          const candClean = candidate.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!cleanCol1 || candClean.startsWith(cleanCol1.slice(0, 3)) || cleanCol1.startsWith(candClean.slice(0, 3))) {
            matchedStudent = candidate;
          }
        }
      }

      let isNewStudent = false;

      // If student does not exist yet, auto create student record
      if (!matchedStudent) {
        const newAbsen = col0 || String(currentStudents.length + 1);
        const encodedName = encodeURIComponent(col1);
        const simId = `sim-std-${encodedName}-${Date.now()}`;
        const newStudentObj: Omit<Student, 'id' | 'createdAt'> = {
          nis: newAbsen,
          name: col1,
          gender: detectGenderByName(col1),
          class: className,
        };
        autoCreatedStudents.push(newStudentObj);
        isNewStudent = true;

        matchedStudent = {
          ...newStudentObj,
          id: simId,
          createdAt: new Date().toISOString(),
        };
        currentStudents.push(matchedStudent);
      }

      // Create a payment transaction for every student record in the excel (including Rp 0 / Lunas Sebelum Juli)
      const defaultDesc = cleanAmount > 0 
        ? (col5 || `Kas ${col4 || 'Bulan Juli'}`)
        : (col5 && !col5.toLowerCase().includes('belum bayar') && !col5.toLowerCase().includes('rp 0') ? col5 : 'Lunas sebelum bulan Juli');

      const defaultMonth = col4 || (cleanAmount === 0 ? 'Lunas Sebelum Juli' : 'Juli');

      payments.push({
        studentId: matchedStudent.id,
        amount: cleanAmount,
        paymentMethod: 'Tunai',
        paymentDate: col3 && col3.length === 10 ? col3 : new Date().toISOString().slice(0, 10),
        monthName: defaultMonth,
        description: defaultDesc,
        createdBy: 'Import Excel',
      });

      previewRows.push({
        absen: col0 || matchedStudent.nis,
        name: col1,
        amount: cleanAmount,
        month: defaultMonth,
        desc: defaultDesc,
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

    const results: Omit<Expense, 'id' | 'createdAt'>[] = [];

    // Find table header row & detect columns
    let headerRowIndex = -1;
    let titleCol = -1;
    let amountCol = -1;
    let dateCol = -1;
    let categoryCol = -1;

    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (Array.isArray(row) && row.length > 1) {
        const rowText = row.map((c) => String(c || '').toLowerCase()).join(' ');
        if (
          !rowText.includes('petunjuk') &&
          (rowText.includes('nominal') ||
            rowText.includes('keterangan') ||
            rowText.includes('pengeluaran') ||
            rowText.includes('tanggal') ||
            rowText.includes('barang'))
        ) {
          headerRowIndex = i;
          row.forEach((colVal, colIdx) => {
            const val = String(colVal || '').toLowerCase().trim();
            if (val.includes('tanggal') || val.includes('tgl') || val.includes('date')) {
              dateCol = colIdx;
            } else if (val.includes('nominal') || val.includes('jumlah') || val.includes('harga') || val.includes('total') || val.includes('biaya')) {
              amountCol = colIdx;
            } else if (val.includes('kategori') || val.includes('jenis')) {
              categoryCol = colIdx;
            } else if (val.includes('keterangan') || val.includes('nama') || val.includes('pengeluaran') || val.includes('barang') || val.includes('keperluan') || val.includes('rincian') || val.includes('deskripsi')) {
              titleCol = colIdx;
            }
          });
          break;
        }
      }
    }

    // Default fallbacks if specific header names were not found
    if (titleCol === -1) titleCol = 2; // Col C in user's excel
    if (amountCol === -1) amountCol = 3; // Col D in user's excel
    if (dateCol === -1) dateCol = 1; // Col B in user's excel

    const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

    for (let i = startIndex; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      let title = String(row[titleCol] !== undefined ? row[titleCol] : row[2] || row[0] || '').trim();
      let rawAmountVal = row[amountCol] !== undefined ? row[amountCol] : row[3] || row[1] || 0;
      let rawDateVal = row[dateCol] !== undefined ? row[dateCol] : row[1] || row[3];
      let rawCategory = categoryCol >= 0 ? String(row[categoryCol] || '').trim() : '';

      // Skip instructions, headers, or empty rows
      if (
        !title ||
        title.toLowerCase().includes('petunjuk') ||
        title.toLowerCase() === 'keterangan' ||
        title.toLowerCase() === 'nama pengeluaran' ||
        title.toLowerCase() === 'nama barang'
      ) {
        continue;
      }

      // If title is just a sequence number like '1' or '2', try finding description in other columns
      if (!isNaN(Number(title)) && Number(title) < 100) {
        for (let c = 0; c < row.length; c++) {
          const cellStr = String(row[c] || '').trim();
          if (cellStr && isNaN(Number(cellStr)) && cellStr.length > 3 && !/^\d{4}-\d{2}-\d{2}$/.test(cellStr)) {
            title = cellStr;
            break;
          }
        }
      }

      // Clean amount: clean commas, dots, Rp
      let cleanAmount = 0;
      if (typeof rawAmountVal === 'number') {
        cleanAmount = rawAmountVal;
      } else {
        const strAmount = String(rawAmountVal || '0').replace(/[^0-9]/g, '');
        cleanAmount = Number(strAmount) || 0;
      }

      if (cleanAmount <= 0) continue;

      // Clean & parse date
      let expenseDate = new Date().toISOString().slice(0, 10);
      if (typeof rawDateVal === 'number' && rawDateVal > 40000 && rawDateVal < 60000) {
        // Excel serial date number
        const jsDate = new Date(Math.round((rawDateVal - 25569) * 86400 * 1000));
        if (!isNaN(jsDate.getTime())) {
          expenseDate = jsDate.toISOString().slice(0, 10);
        }
      } else if (rawDateVal) {
        const strDate = String(rawDateVal).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(strDate)) {
          expenseDate = strDate;
        } else {
          // DD/MM/YYYY or DD-MM-YYYY
          const dmy = strDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
          if (dmy) {
            expenseDate = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
          } else {
            const parsed = new Date(strDate);
            if (!isNaN(parsed.getTime())) {
              expenseDate = parsed.toISOString().slice(0, 10);
            }
          }
        }
      }

      // Smart Category Detection
      let category: ExpenseCategory = 'Keperluan Kelas';
      const catLower = (rawCategory || title).toLowerCase();
      if (catLower.includes('alat') || catLower.includes('peralatan') || catLower.includes('atk') || catLower.includes('sapu') || catLower.includes('spidol')) {
        category = 'Peralatan';
      } else if (catLower.includes('makan') || catLower.includes('minum') || catLower.includes('konsumsi') || catLower.includes('snack') || catLower.includes('air')) {
        category = 'Konsumsi';
      } else if (catLower.includes('acara') || catLower.includes('kegiatan') || catLower.includes('lomba') || catLower.includes('dekor') || catLower.includes('hut') || catLower.includes('17an')) {
        category = 'Acara Kelas';
      } else if (catLower.includes('lain')) {
        category = 'Lainnya';
      }

      results.push({
        title,
        amount: cleanAmount,
        category,
        expenseDate,
        description: `Belanja: ${title}`,
        createdBy: 'Import Excel',
      });
    }

    return results;
  },
};
