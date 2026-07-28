// Nạp DANH MỤC ĐƯỜNG GIAO THÔNG BÀN GIAO Trung tâm Quản lý, bảo trì giao thông & HTKT
// từ file bàn giao chính thức (1 sheet, chia nhóm theo phường bằng dòng số La Mã).
//   Nguồn : C:\Phụ lục 1. Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật.xlsx
//   linhVuc  = 'trung-tam-bao-tri/tuyen-duong-mat-cat-lon'
//   toChucId = 'tc_ban_bao_tri_gt'
// Cột: STT(0) Tên(1) Điểm đầu(2) Điểm cuối(3) Dài km(4) Rộng HT(5) Rộng QH(6) Kết cấu(7) Ghi chú(8)
// CHẾ ĐỘ THAY THẾ: xoá sạch bản ghi cũ của lĩnh vực+đơn vị rồi nạp lại đúng danh mục bàn giao.
// Chạy: node prisma/import-tuyen-duong-bao-tri.cjs   (--dry để chỉ in, không ghi)
const XLSX = require('xlsx');
const crypto = require('crypto');
const { Client } = require('pg');

const DRY = process.argv.includes('--dry');
const FILE = 'C:\\Phụ lục 1. Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ thuật.xlsx';
const LINH_VUC = 'trung-tam-bao-tri/tuyen-duong-mat-cat-lon';
const TO_CHUC_ID = 'tc_ban_bao_tri_gt';

const PHUONG_MAP = {
  'PHƯỜNG ĐỒNG HỚI': { ten: 'Phường Đồng Hới', code: 'DH' },
  'PHƯỜNG ĐỒNG SƠN': { ten: 'Phường Đồng Sơn', code: 'DS' },
  'PHƯỜNG ĐỒNG THUẬN': { ten: 'Phường Đồng Thuận', code: 'DT' },
};

function clean(v) { return String(v == null ? '' : v).replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim(); }
function num(v) { const s = String(v == null ? '' : v).replace(/,/g, '').replace(/\s/g, '').trim(); if (!s || s === '-') return null; const m = s.match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; }

function parseFile() {
  const wb = XLSX.readFile(FILE);
  const records = [];
  const counters = {};
  for (const sheet of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, raw: false, defval: '' });
    let phuong = null;
    for (const r of rows) {
      const stt = clean(r[0]);
      const ten = clean(r[1]);
      // dòng tiêu đề phường: STT số La Mã + có tên
      if (/^[IVX]+$/.test(stt) && ten) { phuong = PHUONG_MAP[ten.toUpperCase()] || { ten, code: 'XX' }; continue; }
      if (!/^\d+$/.test(stt) || !ten || !phuong) continue; // chỉ nhận dòng tuyến (STT là số)
      const htr = num(r[5]); const qh = num(r[6]);
      const cf = {
        ...(htr != null ? { matCat: htr } : {}),
        ...(qh != null ? { matCatQH: qh } : {}),
        ...(num(r[4]) != null ? { chieuDai: num(r[4]) } : {}),
        ...(clean(r[2]) ? { diemDau: clean(r[2]) } : {}),
        ...(clean(r[3]) ? { diemCuoi: clean(r[3]) } : {}),
        ...(clean(r[7]) ? { ketCau: clean(r[7]) } : {}),
      };
      counters[phuong.code] = (counters[phuong.code] || 0) + 1;
      records.push({
        maBanGhi: `BT-${phuong.code}-${String(counters[phuong.code]).padStart(2, '0')}`,
        tieuDe: ten,
        diaBan: phuong.ten,
        ghiChu: clean(r[8]) || null,
        customFields: cf,
      });
    }
  }
  return records;
}

(async () => {
  const records = parseFile();
  const byP = {};
  records.forEach(r => { byP[r.diaBan] = (byP[r.diaBan] || 0) + 1; });
  console.log('Đọc từ file bàn giao:');
  Object.entries(byP).forEach(([k, v]) => console.log('  ', k, ':', v));
  console.log('TỔNG:', records.length, 'tuyến.' + (DRY ? ' (DRY — không ghi)' : ''));
  if (DRY) { records.forEach(r => console.log(' ', r.maBanGhi, '|', r.tieuDe, '| HT', r.customFields.matCat ?? '-', '| QH', r.customFields.matCatQH ?? '-')); return; }

  const c = new Client({ host: 'localhost', user: 'postgres', password: 'PR_2026_PgAdmin!Secure', database: 'ql_htkt', port: 5432 });
  await c.connect();
  await c.query('BEGIN');
  try {
    const del = await c.query(`DELETE FROM nghiep_vu_ban_ghi WHERE "linhVuc"=$1 AND "toChucId"=$2`, [LINH_VUC, TO_CHUC_ID]);
    for (const r of records) {
      await c.query(
        `INSERT INTO nghiep_vu_ban_ghi
           (id,"linhVuc","toChucId","maBanGhi","tieuDe","trangThai","diaBan","ghiChu","customFields","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,'MOI',$6,$7,$8::jsonb,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        [crypto.randomUUID(), LINH_VUC, TO_CHUC_ID, r.maBanGhi, r.tieuDe, r.diaBan, r.ghiChu, JSON.stringify(r.customFields)]
      );
    }
    await c.query('COMMIT');
    console.log(`Đã xoá ${del.rowCount} bản ghi cũ · nạp mới ${records.length} tuyến.`);
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    await c.end();
  }
})().catch(e => { console.error(e.message); process.exit(1); });
