// Phần QUYẾT ĐỊNH của prisma/sync-vbpl.mjs, tách riêng để test được (không CSDL, không OpenAI).
// Xem test: prisma/sync-vbpl-core.test.mjs
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

export const THU_MUC_MAC_DINH = 'G:\\My Drive\\Tailieu_VBPL'
export const LOAI_VBPL = 'VB_PHAP_LUAT'

// Cờ lạ trước đây bị bỏ qua và script CHẠY ĐỒNG BỘ THẬT (vd gõ nhầm --dry, --plan).
const CO_HOP_LE = new Set(['--report', '--recursive', '--allow-mass-delete'])

export function docThamSo(argv) {
  const loi = []
  const viTri = []
  for (const a of argv) {
    if (a.startsWith('-')) { if (!CO_HOP_LE.has(a)) loi.push(`Cờ không hỗ trợ: ${a}`) }
    else viTri.push(a)
  }
  if (viTri.length > 1) loi.push(`Chỉ nhận MỘT thư mục, đang có ${viTri.length}: ${viTri.join(' | ')}`)
  return {
    reportOnly: argv.includes('--report'),
    deQuy: argv.includes('--recursive'),
    choPhepXoaNhieu: argv.includes('--allow-mass-delete'),
    folder: chuanHoaThuMuc(viTri[0] || THU_MUC_MAC_DINH),
    loi,
  }
}

/** "G:/My Drive/Tailieu_VBPL/" và "G:\My Drive\Tailieu_VBPL" là MỘT kho (metadata.thuMuc lưu dạng '\'). */
// Giữ '\' của gốc ổ đĩa ("G:\"): "G:" trên Windows là thư mục HIỆN HÀNH của ổ G, không phải gốc.
export const chuanHoaThuMuc = (p) => String(p).replace(/\//g, '\\').replace(/(?<!:)\\+$/, '')
const cungThuMuc = (a, b) => chuanHoaThuMuc(a).toLowerCase() === chuanHoaThuMuc(b).toLowerCase()

/**
 * Liệt kê tệp (không phải thư mục) trong kho. Trả đường dẫn TƯƠNG ĐỐI, phân cách '/'.
 * Cấp gốc → đúng tên tệp như trước (khoá `nguon` của bản ghi cũ không đổi).
 * Đệ quy: bỏ thư mục bắt đầu bằng '_' (vd `_BanGoc`, lưu trữ không nạp) hoặc '.' (tạm của Drive).
 * Thư mục không tồn tại / chưa mount → readdirSync ném lỗi, script dừng trước bước xoá.
 */
export function lietKeTep(folder, { deQuy = false } = {}) {
  const out = []
  const quet = (dir, tienTo) => {
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      const rel = tienTo ? `${tienTo}/${d.name}` : d.name
      if (d.isDirectory()) {
        if (deQuy && !/^[_.]/.test(d.name)) quet(join(dir, d.name), rel)
      } else out.push(rel)   // ổ ảo (Drive) có thể trả kiểu "không rõ" → coi là tệp
    }
  }
  quet(folder, '')
  return out
}

/** Bản ghi có thuộc quyền quản lý của kho đồng bộ `folder` không. */
export function thuocKho(row, folder) {
  const thuMuc = row?.metadata?.thuMuc
  if (thuMuc) return cungThuMuc(thuMuc, folder)
  // Bản ghi do prisma/import-vbpl.mjs cũ nạp: không metadata, không người tạo, loại VBPL.
  // Tài liệu người dùng tải lên qua giao diện luôn có createdById → không bao giờ bị "nhận quyền".
  return !row?.createdById && row?.loai === LOAI_VBPL
}
export const chonBanGhiCuaKho = (rows, folder) => rows.find((r) => thuocKho(r, folder)) ?? null

/**
 * Bản ghi cùng tên trong kho, mã băm tệp đã khác → làm gì.
 *  - 'da_co'            : mã băm tệp trùng
 *  - 'cap_nhat_meta'    : byte khác nhưng chữ y hệt (lưu lại/ký số lại) → không nhúng lại
 *  - 'nap_lai_noi_dung' : nội dung ĐÃ SỬA → phải thay đoạn + véc-tơ, nếu không chatbot trả bản cũ.
 *    Bản ghi import cũ CHƯA có mã băm cũng vào đây (nạp lại MỘT lần): trước đây chỉ "backfill" mã băm
 *    của tệp hiện tại lên đoạn cũ → nếu tệp đã sửa trước đó thì nội dung cũ bị "chứng nhận" vĩnh viễn.
 */
export function quyetDinhTheoTen(row, { fileHash, noiDungHash }) {
  const m = row?.metadata || {}
  if (!m.fileHash) return 'nap_lai_noi_dung'
  if (m.fileHash === fileHash) return 'da_co'
  if (m.noiDungHash && m.noiDungHash === noiDungHash) return 'cap_nhat_meta'
  return 'nap_lai_noi_dung'
}

/**
 * Kế hoạch xoá đồng bộ, có NGƯỠNG AN TOÀN: Drive đang đồng bộ/lỗi cache có thể trả thư mục
 * rỗng hoặc thiếu → trước đây xoá mềm hàng loạt. Vượt ngưỡng thì chặn, trừ khi --allow-mass-delete.
 */
export function keHoachXoa(tatCa, coMat, { soTepQuetDuoc, choPhepXoaNhieu = false, deQuy = false } = {}) {
  // Không quét đệ quy thì KHÔNG xét bản ghi trong thư mục con (nguon có '/'): tác vụ định kỳ chạy
  // không cờ sẽ gỡ mọi thứ một lần chạy tay --recursive đã nạp (rồi lần sau lại nhúng lại, tốn phí).
  const managedRows = deQuy ? tatCa : tatCa.filter((m) => !String(m.nguon).includes('/'))
  const duKien = managedRows.filter((m) => !coMat.has(m.nguon))
  const nguong = Math.max(3, Math.ceil(managedRows.length * 0.1))
  let chan = null
  if (!choPhepXoaNhieu) {
    if (managedRows.length > 0 && soTepQuetDuoc === 0) chan = `thư mục không có tệp nào nhưng kho đang quản lý ${managedRows.length} bản ghi`
    else if (duKien.length > nguong) chan = `định gỡ ${duKien.length}/${managedRows.length} bản ghi, vượt ngưỡng an toàn ${nguong}`
  }
  return { xoa: chan ? [] : duKien, duKien, chan, nguong }
}

/** Hai danh sách đoạn (theo thứ tự) giống hệt nhau. */
export const cungDanhSachDoan = (a, b) => a.length > 0 && a.length === b.length && a.every((x, i) => x === b[i])

export const maThoat = ({ loi, hetHanMuc, xoaBiChan }) => (loi > 0 || hetHanMuc || xoaBiChan ? 1 : 0)

// Khoá cấp phiên PostgreSQL: tự nhả khi kết nối đóng (kể cả tiến trình chết).
export const KHOA_SYNC_VBPL = 73_102_026
export async function layKhoaChayDon(client, key = KHOA_SYNC_VBPL) {
  const r = await client.query('SELECT pg_try_advisory_lock($1) AS ok', [key])
  return r.rows[0]?.ok === true
}
