#!/usr/bin/env node
// Import dữ liệu CSCC & Đèn tín hiệu từ Phụ lục 2

import XLSX from 'xlsx';
import { Client } from 'pg';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDryRun = process.argv.includes('--dry');
const toChucId = 'tc_ban_bao_tri_gt';

const filePath = 'C:\\Troly\\Dulieu TT bao try\\Phụ lục 2. Tổng hợp ĐCSCC và ĐTH giao thông (Chốt).xlsx';

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
    if (!trimmed) return null;
    return trimmed;
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

async function importCsccByPhuong(wb, sheetName, phuongCode) {
  if (!wb.SheetNames.includes(sheetName)) {
    console.log(`⚠️  Sheet "${sheetName}" không tìm thấy`);
    return 0;
  }

  const ws = wb.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Header thường nằm ở row 0-5, dữ liệu bắt đầu từ row 6+
  // Tìm row dữ liệu: có cột TT (số thứ tự)
  let headerRowIdx = -1;
  for (let i = 0; i < 6 && i < rawData.length; i++) {
    const row = rawData[i];
    if (row.join('').toLowerCase().includes('tuyến')) {
      headerRowIdx = i;
    }
  }

  if (headerRowIdx < 0) headerRowIdx = 5;

  const records = [];
  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    const stt = parseInteger(row[0]);
    if (!stt || stt < 1) continue;

    records.push({
      id: randomUUID(),
      to_chuc_id: toChucId,
      phuong: phuongCode,
      stt: stt,
      ten_tuyen: normalizeValue(row[1]) || '',
      doan: normalizeValue(row[2]),
      chieu_dai_m: parseNumeric(row[3]),
      so_bong: parseInteger(row[4]),
      so_tu_dieu_khien: parseInteger(row[5]),
      nhan_hieu: normalizeValue(row[6]),
      loai_den: normalizeValue(row[7]),
      cong_suat_tong_w: parseNumeric(row[8]),
      nam_hoat_dong: normalizeValue(row[9]),
      la_duong_lien_phuong: !!normalizeValue(row[10]),
      mat_cat_lon: !!normalizeValue(row[11]),
      nguoi_quan_ly: normalizeValue(row[12]),
      vi_tri_tu: normalizeValue(row[13]),
      dim_tiet_giam: normalizeValue(row[14]),
      col_thep_de_gang: parseInteger(row[15]),
      col_thep_khong_de: parseInteger(row[16]),
      col_be_tong: parseInteger(row[17]),
      cap_ngam_m: parseNumeric(row[18]),
      cap_treo_m: parseNumeric(row[19]),
    });
  }

  if (!isDryRun) {
    for (const rec of records) {
      await client.query(
        `INSERT INTO bao_tri_cscc_tuyen (id, to_chuc_id, phuong, stt, ten_tuyen, doan, chieu_dai_m, so_bong, so_tu_dieu_khien, nhan_hieu, loai_den, cong_suat_tong_w, nam_hoat_dong, la_duong_lien_phuong, mat_cat_lon, nguoi_quan_ly, vi_tri_tu, dim_tiet_giam, col_thep_de_gang, col_thep_khong_de, col_be_tong, cap_ngam_m, cap_treo_m)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
        [rec.id, rec.to_chuc_id, rec.phuong, rec.stt, rec.ten_tuyen, rec.doan, rec.chieu_dai_m, rec.so_bong, rec.so_tu_dieu_khien, rec.nhan_hieu, rec.loai_den, rec.cong_suat_tong_w, rec.nam_hoat_dong, rec.la_duong_lien_phuong, rec.mat_cat_lon, rec.nguoi_quan_ly, rec.vi_tri_tu, rec.dim_tiet_giam, rec.col_thep_de_gang, rec.col_thep_khong_de, rec.col_be_tong, rec.cap_ngam_m, rec.cap_treo_m]
      );
    }
  }

  console.log(`✓ CSCC ${sheetName}: ${records.length} bản ghi${isDryRun ? ' (DRY RUN)' : ''}`);
  return records.length;
}

async function importDenTinHieu(wb) {
  const sheetName = 'DEN THGT';
  if (!wb.SheetNames.includes(sheetName)) {
    console.log(`⚠️  Sheet "${sheetName}" không tìm thấy`);
    return 0;
  }

  const ws = wb.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Header từ row 1-3, dữ liệu từ row 4+
  const records = [];
  for (let i = 3; i < rawData.length; i++) {
    const row = rawData[i];
    const stt = parseInteger(row[0]);
    if (!stt || stt < 1) continue;

    records.push({
      id: randomUUID(),
      to_chuc_id: toChucId,
      stt: stt,
      ten_nut_giao: normalizeValue(row[1]) || '',
      tuyen: normalizeValue(row[2]),
      chu_dau_tu: normalizeValue(row[3]),
      loai_den: normalizeValue(row[4]),
      tinh_trang: normalizeValue(row[5]),
      de_xuat: normalizeValue(row[6]),
      ghi_chu: normalizeValue(row[7]),
      dia_ban: normalizeValue(row[8]),
      nam_van_hanh: parseInteger(row[9]),
      don_vi_qlvh: normalizeValue(row[10]),
      don_vi_ql_tai_san: normalizeValue(row[11]),
      don_vi_tiep_nhan: normalizeValue(row[12]),
      cong_suat_w: parseNumeric(row[13]),
    });
  }

  if (!isDryRun) {
    await client.query('DELETE FROM bao_tri_den_tin_hieu WHERE to_chuc_id = $1', [toChucId]);
    for (const rec of records) {
      await client.query(
        `INSERT INTO bao_tri_den_tin_hieu (id, to_chuc_id, stt, ten_nut_giao, tuyen, chu_dau_tu, loai_den, tinh_trang, de_xuat, ghi_chu, dia_ban, nam_van_hanh, don_vi_qlvh, don_vi_ql_tai_san, don_vi_tiep_nhan, cong_suat_w)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [rec.id, rec.to_chuc_id, rec.stt, rec.ten_nut_giao, rec.tuyen, rec.chu_dau_tu, rec.loai_den, rec.tinh_trang, rec.de_xuat, rec.ghi_chu, rec.dia_ban, rec.nam_van_hanh, rec.don_vi_qlvh, rec.don_vi_ql_tai_san, rec.don_vi_tiep_nhan, rec.cong_suat_w]
      );
    }
  }

  console.log(`✓ Đèn tín hiệu giao thông: ${records.length} nút${isDryRun ? ' (DRY RUN)' : ''}`);
  return records.length;
}

async function main() {
  console.log('\n' + '='.repeat(100));
  console.log('📥 IMPORT DỮ LIỆU CSCC & ĐÈN TÍN HIỆU - Trung tâm Bảo trì Giao thông');
  console.log('='.repeat(100));
  console.log(`File: ${filePath}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'ACTUAL INSERT'}\n`);

  try {
    const wb = XLSX.readFile(filePath);
    console.log(`Sheets trong file: ${wb.SheetNames.filter(s => !s.startsWith('XXXX') && !s.startsWith('Recovered')).slice(-4).join(', ')}\n`);

    if (!isDryRun) {
      await client.connect();
      await client.query('DELETE FROM bao_tri_cscc_tuyen WHERE to_chuc_id = $1', [toChucId]);
    }

    let total = 0;
    total += await importCsccByPhuong(wb, 'CSCC Dong Hoi', 'DONG_HOI');
    total += await importCsccByPhuong(wb, 'CSCC Dong Son', 'DONG_SON');
    total += await importCsccByPhuong(wb, 'CSCC Dong Thuan', 'DONG_THUAN');
    total += await importDenTinHieu(wb);

    console.log(`\n✅ HOÀN THÀNH: ${total} bản ghi${isDryRun ? ' (DRY RUN)' : ''}`);
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
