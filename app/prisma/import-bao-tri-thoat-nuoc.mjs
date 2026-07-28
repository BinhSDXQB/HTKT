#!/usr/bin/env node
// Import dữ liệu Thoát nước từ Phụ lục 3

import XLSX from 'xlsx';
import { Client } from 'pg';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDryRun = process.argv.includes('--dry');
const toChucId = 'tc_ban_bao_tri_gt';

const filePath = 'C:\\Troly\\Dulieu TT bao try\\Phụ lục 3. Tổng hợp hệ thống thoát nước giao Ban Bảo trì.xlsx';

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

async function importGiengTach(wb) {
  const sheetName = 'Giếng tách';
  if (!wb.SheetNames.includes(sheetName)) {
    console.log(`⚠️  Sheet "${sheetName}" không tìm thấy`);
    return 0;
  }

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  // Header row: row 0 có cột chính (dòng 1 trong Excel)
  // Row thực tế bắt đầu từ dòng 3-4
  const dataRows = rows.slice(2).filter(row => {
    const ten = normalizeValue(row['PHỤ LỤC 3: TỔNG HỢP HỆ THỐNG THU GOM, XỬ LÝ NƯỚC THẢI, HỆ THỐNG THOÁT NƯỚC BÀN GIAO BAN QUẢN LÝ, BẢO TRÌ GIAO THÔNG']);
    return ten && ten !== '' && /\d+/.test(ten);
  });

  const records = dataRows.map((row, idx) => ({
    id: randomUUID(),
    to_chuc_id: toChucId,
    stt: idx + 1,
    ten: normalizeValue(row['__EMPTY']) || '',
    vi_tri: normalizeValue(row['__EMPTY_1']),
    rong_m: parseNumeric(row['__EMPTY_2']),
    dai_m: parseNumeric(row['__EMPTY_3']),
    sau_m: parseNumeric(row['__EMPTY_4']),
    ngap_bun_m: parseNumeric(row['__EMPTY_5']),
    kl_bun_m3: parseNumeric(row['__EMPTY_6']),
    ghi_chu: normalizeValue(row['__EMPTY_7']),
  }));

  if (!isDryRun) {
    await client.query('DELETE FROM bao_tri_gieng_tach WHERE to_chuc_id = $1', [toChucId]);
    for (const rec of records) {
      await client.query(
        `INSERT INTO bao_tri_gieng_tach (id, to_chuc_id, stt, ten, vi_tri, rong_m, dai_m, sau_m, ngap_bun_m, kl_bun_m3, ghi_chu)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [rec.id, rec.to_chuc_id, rec.stt, rec.ten, rec.vi_tri, rec.rong_m, rec.dai_m, rec.sau_m, rec.ngap_bun_m, rec.kl_bun_m3, rec.ghi_chu]
      );
    }
  }

  console.log(`✓ Giếng tách: ${records.length} bản ghi${isDryRun ? ' (DRY RUN)' : ''}`);
  return records.length;
}

async function importTramBom(wb) {
  const sheetName = 'Trạm bơm';
  if (!wb.SheetNames.includes(sheetName)) {
    console.log(`⚠️  Sheet "${sheetName}" không tìm thấy`);
    return 0;
  }

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const dataRows = rows.slice(2).filter(row => {
    const ten = normalizeValue(row['II. Bảng tổng hợp trạm bơm ']);
    return ten && /\d+/.test(ten);
  });

  const records = dataRows.map((row, idx) => ({
    id: randomUUID(),
    to_chuc_id: toChucId,
    stt: idx + 1,
    ten: normalizeValue(row['__EMPTY']) || '',
    vi_tri: normalizeValue(row['__EMPTY_1']),
    kt_ho_bom_a_mm: parseNumeric(row['__EMPTY_2']),
    kt_ho_bom_b_mm: parseNumeric(row['__EMPTY_3']),
    sau_ngap_bun_mm: parseNumeric(row['__EMPTY_4']),
    kl_ngap_vat_m3: parseNumeric(row['__EMPTY_5']),
    ghi_chu: normalizeValue(row['__EMPTY_6']),
  }));

  if (!isDryRun) {
    await client.query('DELETE FROM bao_tri_tram_bom WHERE to_chuc_id = $1', [toChucId]);
    for (const rec of records) {
      await client.query(
        `INSERT INTO bao_tri_tram_bom (id, to_chuc_id, stt, ten, vi_tri, kt_ho_bom_a_mm, kt_ho_bom_b_mm, sau_ngap_bun_mm, kl_ngap_vat_m3, ghi_chu)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [rec.id, rec.to_chuc_id, rec.stt, rec.ten, rec.vi_tri, rec.kt_ho_bom_a_mm, rec.kt_ho_bom_b_mm, rec.sau_ngap_bun_mm, rec.kl_ngap_vat_m3, rec.ghi_chu]
      );
    }
  }

  console.log(`✓ Trạm bơm: ${records.length} bản ghi${isDryRun ? ' (DRY RUN)' : ''}`);
  return records.length;
}

async function importTuyenThoatNuocThai(wb) {
  const sheetName = 'Thoát nước thải R1, R2';
  if (!wb.SheetNames.includes(sheetName)) {
    console.log(`⚠️  Sheet "${sheetName}" không tìm thấy`);
    return 0;
  }

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const dataRows = rows.slice(2).filter(row => {
    const ten = normalizeValue(row['III. CÁC TUYẾN THOÁT NƯỚC THẢI']);
    return ten && /\d+/.test(ten);
  });

  const records = dataRows.map((row, idx) => ({
    id: randomUUID(),
    to_chuc_id: toChucId,
    stt: idx + 1,
    ten_tuyen: normalizeValue(row['__EMPTY']) || '',
    tu: normalizeValue(row['__EMPTY_1']),
    den: normalizeValue(row['__EMPTY_2']),
    tinh_chat_ket_cau: normalizeValue(row['__EMPTY_3']),
    loai_cong: normalizeValue(row['__EMPTY_4']),
    chieu_dai_m: parseNumeric(row['__EMPTY_5']),
    sl_ho_ga: parseInteger(row['__EMPTY_6']),
    loai_tuyen: normalizeValue(row['__EMPTY_7']) || normalizeValue(row['__EMPTY_8']) || normalizeValue(row['__EMPTY_9']),
    be_ngang_mat_duong: normalizeValue(row['__EMPTY_10']),
  }));

  if (!isDryRun) {
    await client.query('DELETE FROM bao_tri_tuyen_thoat_nuoc_thai WHERE to_chuc_id = $1', [toChucId]);
    for (const rec of records) {
      await client.query(
        `INSERT INTO bao_tri_tuyen_thoat_nuoc_thai (id, to_chuc_id, stt, ten_tuyen, tu, den, tinh_chat_ket_cau, loai_cong, chieu_dai_m, sl_ho_ga, loai_tuyen, be_ngang_mat_duong)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [rec.id, rec.to_chuc_id, rec.stt, rec.ten_tuyen, rec.tu, rec.den, rec.tinh_chat_ket_cau, rec.loai_cong, rec.chieu_dai_m, rec.sl_ho_ga, rec.loai_tuyen, rec.be_ngang_mat_duong]
      );
    }
  }

  console.log(`✓ Tuyến thoát nước thải: ${records.length} bản ghi${isDryRun ? ' (DRY RUN)' : ''}`);
  return records.length;
}

async function importTuyenThoatNuocChung(wb) {
  const sheetName = 'Thoát nước chung';
  if (!wb.SheetNames.includes(sheetName)) {
    console.log(`⚠️  Sheet "${sheetName}" không tìm thấy`);
    return 0;
  }

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const dataRows = rows.slice(2).filter(row => {
    const ten = normalizeValue(row[' IV- CÁC TUYẾN THOÁT NƯỚC CHUNG -']);
    return ten && /\d+/.test(ten);
  });

  const records = dataRows.map((row, idx) => ({
    id: randomUUID(),
    to_chuc_id: toChucId,
    stt: idx + 1,
    ten_tuyen: normalizeValue(row['__EMPTY']) || '',
    tu: normalizeValue(row['__EMPTY_1']),
    den: normalizeValue(row['__EMPTY_2']),
    tinh_chat_ket_cau: normalizeValue(row['__EMPTY_3']),
    loai_cong: normalizeValue(row['__EMPTY_4']),
    chieu_dai_m: parseNumeric(row['__EMPTY_5']),
    sl_ho_ga: parseInteger(row['__EMPTY_6']),
    duong_bn_lon: normalizeValue(row['__EMPTY_7']) === '≥20m',
    thuoc_phuong: normalizeValue(row['__EMPTY_8']) || normalizeValue(row['__EMPTY_9']) || normalizeValue(row['__EMPTY_10']),
  }));

  if (!isDryRun) {
    await client.query('DELETE FROM bao_tri_tuyen_thoat_nuoc_chung WHERE to_chuc_id = $1', [toChucId]);
    for (const rec of records) {
      await client.query(
        `INSERT INTO bao_tri_tuyen_thoat_nuoc_chung (id, to_chuc_id, stt, ten_tuyen, tu, den, tinh_chat_ket_cau, loai_cong, chieu_dai_m, sl_ho_ga, duong_bn_lon, thuoc_phuong)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [rec.id, rec.to_chuc_id, rec.stt, rec.ten_tuyen, rec.tu, rec.den, rec.tinh_chat_ket_cau, rec.loai_cong, rec.chieu_dai_m, rec.sl_ho_ga, rec.duong_bn_lon, rec.thuoc_phuong]
      );
    }
  }

  console.log(`✓ Tuyến thoát nước chung: ${records.length} bản ghi${isDryRun ? ' (DRY RUN)' : ''}`);
  return records.length;
}

async function importTuyenThoatNuocMua(wb) {
  const sheetName = 'Thoát nước mưa';
  if (!wb.SheetNames.includes(sheetName)) {
    console.log(`⚠️  Sheet "${sheetName}" không tìm thấy`);
    return 0;
  }

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const dataRows = rows.slice(2).filter(row => {
    const ten = normalizeValue(row[' V- CÁC TUYẾN THOÁT NƯỚC MƯA -']);
    return ten && /\d+/.test(ten);
  });

  const records = dataRows.map((row, idx) => ({
    id: randomUUID(),
    to_chuc_id: toChucId,
    stt: idx + 1,
    ten_tuyen: normalizeValue(row['__EMPTY']) || '',
    tu: normalizeValue(row['__EMPTY_1']),
    den: normalizeValue(row['__EMPTY_2']),
    tinh_chat_ket_cau: normalizeValue(row['__EMPTY_3']),
    chieu_dai_m: parseNumeric(row['__EMPTY_4']),
    sl_ho_ga: parseInteger(row['__EMPTY_5']),
    duong_bn_lon: normalizeValue(row['__EMPTY_6']) === '≥20',
    thuoc_phuong_dong_hoi: !!normalizeValue(row['__EMPTY_7']),
    thuoc_phuong_dong_thuan: !!normalizeValue(row['__EMPTY_8']),
    thuoc_phuong_dong_son: !!normalizeValue(row['__EMPTY_9']),
  }));

  if (!isDryRun) {
    await client.query('DELETE FROM bao_tri_tuyen_thoat_nuoc_mua WHERE to_chuc_id = $1', [toChucId]);
    for (const rec of records) {
      await client.query(
        `INSERT INTO bao_tri_tuyen_thoat_nuoc_mua (id, to_chuc_id, stt, ten_tuyen, tu, den, tinh_chat_ket_cau, chieu_dai_m, sl_ho_ga, duong_bn_lon, thuoc_phuong_dong_hoi, thuoc_phuong_dong_thuan, thuoc_phuong_dong_son)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [rec.id, rec.to_chuc_id, rec.stt, rec.ten_tuyen, rec.tu, rec.den, rec.tinh_chat_ket_cau, rec.chieu_dai_m, rec.sl_ho_ga, rec.duong_bn_lon, rec.thuoc_phuong_dong_hoi, rec.thuoc_phuong_dong_thuan, rec.thuoc_phuong_dong_son]
      );
    }
  }

  console.log(`✓ Tuyến thoát nước mưa: ${records.length} bản ghi${isDryRun ? ' (DRY RUN)' : ''}`);
  return records.length;
}

async function main() {
  console.log('\n' + '='.repeat(100));
  console.log('📥 IMPORT DỮ LIỆU THOÁT NƯỚC - Trung tâm Bảo trì Giao thông');
  console.log('='.repeat(100));
  console.log(`File: ${filePath}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'ACTUAL INSERT'}\n`);

  try {
    const wb = XLSX.readFile(filePath);
    console.log(`Sheets trong file: ${wb.SheetNames.join(', ')}\n`);

    if (!isDryRun) {
      await client.connect();
    }

    let total = 0;
    total += await importGiengTach(wb);
    total += await importTramBom(wb);
    total += await importTuyenThoatNuocThai(wb);
    total += await importTuyenThoatNuocChung(wb);
    total += await importTuyenThoatNuocMua(wb);

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
