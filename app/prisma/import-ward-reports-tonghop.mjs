#!/usr/bin/env node
// Import dữ liệu báo cáo phường/xã từ G:\My Drive\HTKT\Tonghop (năm 2025)
// Pattern: xoá toàn bộ 8 bảng report_*, sau đó nhập lại từ 24 file Excel

import XLSX from 'xlsx';
import { Client } from 'pg';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const isDryRun = process.argv.includes('--dry');
const skipDelete = process.argv.includes('--skip-delete');
const targetWard = process.argv.find(arg => arg.startsWith('--ward='))?.split('=')[1] || null;

const TONGHOP_DIR = 'G:\\My Drive\\HTKT\\Tonghop';
const YEAR = 2025;

// WARD_MAP: Dùng tên chính xác từ filename (với dấu) để map đơn vị
const WARD_MAP = {
  'Phường Bắc Gianh': 'cmpq5ktej000a0gumn3sba1s6',
  'Phường Quảng Trị': 'cmpq4peg6002cekumzxocofzb',
  'Xã Cam Lộ': 'cmpq5ktjd001z0gumfg0dhtnv',
  'Xã Quảng Ninh': 'cmpq4ped1000vekumjloetxpx',
  'Xã Vĩnh Linh': 'cmpq4peg8002eekumv6pwjw0s',
  'Xã Phong Nha': 'cmpq5ktgm000y0gumdyoao0xs',
  'Xã Nam Trạch': 'cmpq4pecv000sekum23ixnse4',
  'Xã Lệ Thuỷ': 'cmpq4pedm001aekumne9psrmr',
  'Xã Đồng Lê': 'cmpq5kteu000j0gum8a1q7tiv',
  'Xã Triệu Phong': 'cmpq5ktjg00210gumapjjsw8e',
  'Xã Nam Gianh': 'cmpq5ktgg000v0gumprncqqi2',
  'Xã Hướng Hiệp': 'cmpq5kths001u0gum1atbphww',
  'Xã Cửa Việt': 'cmpq5kthp001r0gumk4pb4j4z',
  'Xã Minh Hóa': 'cmpq5kteo000e0gum3puh6zr4',
  'Xã Diên Sanh': 'cmpq5ktjo00260gumzuc52v3r',
  'Xã Lệ Ninh': 'cmpq4pedk0019ekumyzzul9eg',
  'Phường Đồng Hới': 'cmpq5kteg00080gumgrszty7w',
  'Phường Ba Đồn': 'cmpq5ktei00090gum438p1s8y',
  'Phường Đông Hà': 'cmpq4pefm0023ekumwkdzu9c0',
  'Xã Cửa Tùng': 'cmpq4pegs002wekum86tsvojk',
  'Phường Đồng Sơn': 'cmpq5ktef00070gumpth7z9wl',
  'Xã Lao Bảo': 'cmpq4peh20033ekumr6hy6zkk',
  'Xã Khe Sanh': 'cmpq4peh10032ekum0w7pc7o1',
  'Phường Nam Đông Hà': 'cmpq4peg00029ekumy60ycm2n',
};

const client = new Client({
  host: 'localhost',
  user: 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  database: 'ql_htkt',
  port: 5432,
});

function normalizeValue(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed === '' ? null : trimmed;
  }
  return val;
}

function parseNumeric(val) {
  const normalized = normalizeValue(val);
  if (normalized === null) return null;
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

function parseInteger(val) {
  const normalized = normalizeValue(val);
  if (normalized === null) return null;
  const num = parseInt(normalized, 10);
  return isNaN(num) ? null : num;
}

function parseBoolean(val) {
  const normalized = normalizeValue(val);
  if (normalized === null) return null;
  return /^(có|yes|true|1)$/i.test(normalized);
}

function normalizeLoaiDenChuan(loaiDen) {
  if (!loaiDen || typeof loaiDen !== 'string') return 'KHAC';
  const lower = loaiDen.toLowerCase();
  if (lower.includes('led')) return 'LED';
  if (lower.includes('sodium') || lower.includes('son') || lower.includes('natri')) return 'SODIUM';
  if (lower.includes('huỳnh quang') || lower.includes('compact') || lower.includes('cfl')) return 'CFL';
  return 'KHAC';
}

function findHeaderRow(sheet) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  for (let r = 0; r <= Math.min(5, range.e.r); r++) {
    let nonEmptyCount = 0;
    for (let c = 0; c <= range.e.c && c < 15; c++) {
      const cell = sheet[XLSX.utils.encode_col(c) + (r + 1)];
      if (cell && cell.v !== null && cell.v !== undefined && cell.v !== '') {
        nonEmptyCount++;
      }
    }
    if (nonEmptyCount >= 3) return r;
  }
  return 0;
}

function getSheetType(sheetName) {
  const lower = sheetName.toLowerCase();
  if (lower.includes('duong') || lower.includes('giao thông')) return 'DUONG';
  if (lower.includes('dien') || lower.includes('chiếu')) return 'DIEN_CS';
  if (lower.includes('thoat') || lower.includes('nước')) return 'THOAT_NUOC';
  if (lower.includes('cay') || lower.includes('xanh')) return 'CAY_XANH';
  if (lower.includes('cong vien') || lower.includes('quang truong')) return 'CONG_VIEN';
  if (lower.includes('cap nuoc') || lower.includes('nước')) return 'CAP_NUOC';
  if (lower.includes('bai') || lower.includes('xe')) return 'BAI_XE';
  return null;
}

function isValidDataRow(row, colCount = 8) {
  const sttVal = row[0];
  const nameVal = row[1];

  const stt = parseInteger(sttVal);
  const name = normalizeValue(nameVal);

  // Bỏ qua STT là chữ (nhóm), hoặc rỗng, hoặc số âm/0
  if (!stt || stt <= 0) return false;
  if (!name) return false;

  return true;
}

async function deleteAllData() {
  const truncateQuery = `
    TRUNCATE TABLE report_duong, report_dien_cs, report_thoat_nuoc,
                   report_cay_xanh, report_cong_vien, report_cap_nuoc,
                   report_bai_do_xe, ward_reports CASCADE;
  `;
  await client.query(truncateQuery);
  console.log('✓ Xoá hết dữ liệu cũ (8 bảng)');
}

async function getAdminUserId() {
  const result = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', ['admin@htkt.com.vn']);
  if (result.rows.length === 0) {
    throw new Error('Admin user (admin@htkt.com.vn) not found!');
  }
  return result.rows[0].id;
}

async function importSheet(client, wardId, sheetType, sheetName, data, sourceFile, adminId, stats) {
  if (!sheetType || data.length === 0) return;

  for (const row of data) {
    let record = {
      id: randomUUID(),
      wardId: wardId,
      year: YEAR,
      status: 'DA_DUYET',
      sourceFile: sourceFile,
      createdById: adminId,
    };

    switch (sheetType) {
      case 'DUONG':
        if (!isValidDataRow(row)) continue;
        record.stt = normalizeValue(row[0]);
        record.ten_duong = normalizeValue(row[1]) || '';
        record.diem_dau = normalizeValue(row[2]);
        record.diem_cuoi = normalizeValue(row[3]);
        record.chieu_dai_km = parseNumeric(row[4]);
        record.nen_m = parseNumeric(row[5]);
        record.mat_m = parseNumeric(row[6]);
        record.he_trai_m = parseNumeric(row[7]);
        record.he_phai_m = parseNumeric(row[8]);
        record.giai_phan_cach_m = parseNumeric(row[9]);
        record.ket_cau_mat = normalizeValue(row[10]);
        record.ghi_chu = normalizeValue(row[11]);

        if (!record.ten_duong) continue;
        await client.query(
          `INSERT INTO report_duong (id, "wardId", year, stt, "tenDuong", "diemDau", "diemCuoi",
            "chieuDaiKm", "nenM", "matM", "heTraiM", "hePhaiM", "giaiPhanCachM", "ketCauMat",
            "ghiChu", status, "sourceFile", "createdById", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW(),NOW())`,
          [record.id, record.wardId, record.year, record.stt, record.ten_duong, record.diem_dau,
           record.diem_cuoi, record.chieu_dai_km, record.nen_m, record.mat_m, record.he_trai_m,
           record.he_phai_m, record.giai_phan_cach_m, record.ket_cau_mat, record.ghi_chu,
           record.status, record.sourceFile, record.createdById]
        );
        stats.report_duong++;
        break;

      case 'DIEN_CS':
        if (!isValidDataRow(row)) continue;
        record.stt = normalizeValue(row[0]);
        record.tuyen_duong = normalizeValue(row[1]) || '';
        record.chieu_dai_cs_km = parseNumeric(row[2]);
        record.so_col_den = parseInteger(row[3]);
        record.loai_den = normalizeValue(row[4]);
        record.loai_den_chuan = normalizeLoaiDenChuan(record.loai_den);
        record.cong_suat_w = parseNumeric(row[5]);
        record.chieu_sang_phia = normalizeValue(row[6]);
        record.nam_dau_tu = parseInteger(row[7]);
        record.ghi_chu = normalizeValue(row[8]);

        if (!record.tuyen_duong) continue;
        await client.query(
          `INSERT INTO report_dien_cs (id, "wardId", year, stt, "tuyenDuong", "chieuDaiCSKm",
            "soColDen", "loaiDen", "loaiDenChuan", "congSuatW", "chieuSangPhia", "namDauTu",
            "ghiChu", status, "sourceFile", "createdById", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW())`,
          [record.id, record.wardId, record.year, record.stt, record.tuyen_duong,
           record.chieu_dai_cs_km, record.so_col_den, record.loai_den, record.loai_den_chuan,
           record.cong_suat_w, record.chieu_sang_phia, record.nam_dau_tu, record.ghi_chu,
           record.status, record.sourceFile, record.createdById]
        );
        stats.report_dien_cs++;
        break;

      case 'THOAT_NUOC':
        if (!isValidDataRow(row)) continue;
        record.stt = normalizeValue(row[0]);
        record.tuyen = normalizeValue(row[1]) || '';
        record.diem_dau = normalizeValue(row[2]);
        record.diem_cuoi = normalizeValue(row[3]);
        record.loai_nuoc = normalizeValue(row[4]);
        record.chieu_dai_m = parseNumeric(row[5]);
        record.chieu_sang_phia = normalizeValue(row[6]);
        record.kich_thuoc_cong = normalizeValue(row[7]);
        record.nam_su_dung = parseInteger(row[8]);
        record.ghi_chu = normalizeValue(row[9]);

        if (!record.tuyen) continue;
        await client.query(
          `INSERT INTO report_thoat_nuoc (id, "wardId", year, stt, tuyen, "diemDau", "diemCuoi",
            "loaiNuoc", "chieuDaiM", "chieuSangPhia", "kichThuocCong", "namSuDung", "ghiChu",
            status, "sourceFile", "createdById", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW())`,
          [record.id, record.wardId, record.year, record.stt, record.tuyen, record.diem_dau,
           record.diem_cuoi, record.loai_nuoc, record.chieu_dai_m, record.chieu_sang_phia,
           record.kich_thuoc_cong, record.nam_su_dung, record.ghi_chu, record.status,
           record.sourceFile, record.createdById]
        );
        stats.report_thoat_nuoc++;
        break;

      case 'CAY_XANH':
        if (!isValidDataRow(row)) continue;
        record.stt = normalizeValue(row[0]);
        record.tuyen = normalizeValue(row[1]) || '';
        record.diem_dau = normalizeValue(row[2]);
        record.diem_cuoi = normalizeValue(row[3]);
        record.so_luong_cay = parseInteger(row[4]);
        record.chieu_sang_phia = normalizeValue(row[5]);
        record.chung_loai_cay = normalizeValue(row[6]);
        record.ghi_chu = normalizeValue(row[7]);

        if (!record.tuyen) continue;
        await client.query(
          `INSERT INTO report_cay_xanh (id, "wardId", year, stt, tuyen, "diemDau", "diemCuoi",
            "soLuongCay", "chieuSangPhia", "chungLoaiCay", "ghiChu", status, "sourceFile", "createdById", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())`,
          [record.id, record.wardId, record.year, record.stt, record.tuyen, record.diem_dau,
           record.diem_cuoi, record.so_luong_cay, record.chieu_sang_phia, record.chung_loai_cay,
           record.ghi_chu, record.status, record.sourceFile, record.createdById]
        );
        stats.report_cay_xanh++;
        break;

      case 'CONG_VIEN':
        if (!isValidDataRow(row)) continue;
        record.stt = normalizeValue(row[0]);
        record.ten_cong_vien = normalizeValue(row[1]) || '';
        record.vi_tri = normalizeValue(row[2]);
        record.dien_tich_m2 = parseNumeric(row[3]);
        record.dien_tich_tham_co_m2 = parseNumeric(row[4]);
        record.so_luong_cay = parseInteger(row[5]);
        record.chung_loai_cay = normalizeValue(row[6]);
        record.ghi_chu = normalizeValue(row[7]);

        if (!record.ten_cong_vien) continue;
        await client.query(
          `INSERT INTO report_cong_vien (id, "wardId", year, stt, "tenCongVien", "viTri",
            "dienTichM2", "dienTichThamCoM2", "soLuongCay", "chungLoaiCay", "ghiChu",
            status, "sourceFile", "createdById", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())`,
          [record.id, record.wardId, record.year, record.stt, record.ten_cong_vien, record.vi_tri,
           record.dien_tich_m2, record.dien_tich_tham_co_m2, record.so_luong_cay,
           record.chung_loai_cay, record.ghi_chu, record.status, record.sourceFile, record.createdById]
        );
        stats.report_cong_vien++;
        break;

      case 'CAP_NUOC':
        if (!isValidDataRow(row)) continue;
        record.stt = normalizeValue(row[0]);
        record.tuyen_duong = normalizeValue(row[1]) || '';
        record.dia_chi = normalizeValue(row[2]);
        record.so_ho_gia_dinh = parseInteger(row[3]);
        record.hien_trang = normalizeValue(row[4]);
        record.du_kien_nguon = normalizeValue(row[5]);
        record.ghi_chu = normalizeValue(row[6]);

        if (!record.tuyen_duong) continue;
        await client.query(
          `INSERT INTO report_cap_nuoc (id, "wardId", year, stt, "tuyenDuong", "diaChi",
            "soHoGiaDinh", "hienTrang", "duKienNguon", "ghiChu", status, "sourceFile", "createdById", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`,
          [record.id, record.wardId, record.year, record.stt, record.tuyen_duong, record.dia_chi,
           record.so_ho_gia_dinh, record.hien_trang, record.du_kien_nguon, record.ghi_chu,
           record.status, record.sourceFile, record.createdById]
        );
        stats.report_cap_nuoc++;
        break;

      case 'BAI_XE':
        if (!isValidDataRow(row)) continue;
        record.stt = normalizeValue(row[0]);
        record.ten_bai = normalizeValue(row[1]) || '';
        record.dia_diem = normalizeValue(row[2]);
        record.dien_tich_m2 = parseNumeric(row[3]);
        record.so_vi_tri_do = parseInteger(row[4]);
        record.co_tram_sac_dien = parseBoolean(row[5]);
        record.ghi_chu = normalizeValue(row[6]);

        if (!record.ten_bai) continue;
        await client.query(
          `INSERT INTO report_bai_do_xe (id, "wardId", year, stt, "tenBai", "diaDiem",
            "dienTichM2", "soViTriDo", "coTramSacDien", "ghiChu", status, "sourceFile", "createdById", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`,
          [record.id, record.wardId, record.year, record.stt, record.ten_bai, record.dia_diem,
           record.dien_tich_m2, record.so_vi_tri_do, record.co_tram_sac_dien, record.ghi_chu,
           record.status, record.sourceFile, record.createdById]
        );
        stats.report_bai_do_xe++;
        break;
    }
  }
}

async function main() {
  console.log('\n' + '='.repeat(100));
  console.log('📥 IMPORT DỮ LIỆU BÁO CÁO PHƯỜNG/XÃ - Năm 2025');
  console.log('='.repeat(100));
  console.log(`Thư mục: ${TONGHOP_DIR}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'ACTUAL INSERT'}`);
  if (targetWard) console.log(`Chỉ xử lý: ${targetWard}`);
  console.log('');

  try {
    const files = fs.readdirSync(TONGHOP_DIR).filter(f => f.endsWith('.xlsx'));
    console.log(`Tìm thấy ${files.length} file Excel\n`);

    if (!isDryRun) {
      await client.connect();

      if (!skipDelete) {
        await deleteAllData();
      }

      const adminId = await getAdminUserId();
      console.log(`Admin userId: ${adminId}\n`);
    }

    const stats = {
      report_duong: 0,
      report_dien_cs: 0,
      report_thoat_nuoc: 0,
      report_cay_xanh: 0,
      report_cong_vien: 0,
      report_cap_nuoc: 0,
      report_bai_do_xe: 0,
    };

    for (const file of files) {
      const filePath = path.join(TONGHOP_DIR, file);

      // Extract ward key từ tên file: "PHỤ LỤC 1_[KEY].xlsx"
      let wardKey = file.replace(/^PHỤ LỤC 1_|^PHU LUC 1_/i, '').replace(/\.xlsx$/i, '').trim();

      // Tìm match trực tiếp trong WARD_MAP
      const wardId = WARD_MAP[wardKey];

      if (!wardId) {
        console.log(`⚠️  Bỏ qua: ${file} — wardKey '${wardKey}' không tìm thấy`);
        continue;
      }

      if (targetWard && wardKey !== targetWard) {
        continue;
      }

      console.log(`📄 ${file} → ${wardKey}`);

      const wb = XLSX.readFile(filePath);

      for (const sheetName of wb.SheetNames) {
        const sheetType = getSheetType(sheetName);
        if (!sheetType) continue;

        const ws = wb.Sheets[sheetName];
        const headerRow = findHeaderRow(ws);
        const range = XLSX.utils.decode_range(ws['!ref']);

        const rawData = [];
        for (let r = headerRow + 1; r <= range.e.r; r++) {
          const row = [];
          for (let c = 0; c <= range.e.c && c < 15; c++) {
            const cell = ws[XLSX.utils.encode_col(c) + (r + 1)];
            row.push(cell ? cell.v : null);
          }
          rawData.push(row);
        }

        if (!isDryRun && rawData.length > 0) {
          const adminId = (await client.query('SELECT id FROM users WHERE email=$1', ['admin@htkt.com.vn'])).rows[0].id;
          await importSheet(client, wardId, sheetType, sheetName, rawData, file, adminId, stats);
        } else if (isDryRun && rawData.length > 0) {
          // Dry run: simulate stats counting
          const dataRows = rawData.filter(r => isValidDataRow(r));
          if (sheetType === 'DUONG') stats.report_duong += dataRows.length;
          if (sheetType === 'DIEN_CS') stats.report_dien_cs += dataRows.length;
          if (sheetType === 'THOAT_NUOC') stats.report_thoat_nuoc += dataRows.length;
          if (sheetType === 'CAY_XANH') stats.report_cay_xanh += dataRows.length;
          if (sheetType === 'CONG_VIEN') stats.report_cong_vien += dataRows.length;
          if (sheetType === 'CAP_NUOC') stats.report_cap_nuoc += dataRows.length;
          if (sheetType === 'BAI_XE') stats.report_bai_do_xe += dataRows.length;
        }

        console.log(`  ✓ ${sheetType}: ${rawData.length} bản ghi`);
      }
    }

    console.log(`\n✅ HOÀN THÀNH${isDryRun ? ' (DRY RUN)' : ''}:`);
    console.log(`  report_duong: ${stats.report_duong}`);
    console.log(`  report_dien_cs: ${stats.report_dien_cs}`);
    console.log(`  report_thoat_nuoc: ${stats.report_thoat_nuoc}`);
    console.log(`  report_cay_xanh: ${stats.report_cay_xanh}`);
    console.log(`  report_cong_vien: ${stats.report_cong_vien}`);
    console.log(`  report_cap_nuoc: ${stats.report_cap_nuoc}`);
    console.log(`  report_bai_do_xe: ${stats.report_bai_do_xe}`);
    console.log(`  TỔNG: ${Object.values(stats).reduce((a, b) => a + b, 0)} bản ghi`);
  } catch (err) {
    console.error('\n❌ LỖI:', err.message);
    process.exit(1);
  } finally {
    if (!isDryRun) {
      await client.end();
    }
  }
}

main();
