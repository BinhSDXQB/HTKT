import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { boDau, type FileHoSo, GIOI_HAN } from './quet-ho-so'
import type { KetQuaTongHopKinhPhi, KhoanMucChiPhi } from './kiem-tra-du-toan'

/**
 * BÓC SỐ TIỀN TRONG TỜ TRÌNH / THUYẾT MINH để đối chiếu với dự toán (Phụ lục 4 prompt
 * thẩm định: A = theo tờ trình, B = theo dự toán/TMĐT, Δ = B − A, % = Δ/A).
 *
 * Chỉ bóc các số đứng sau nhãn khoản mục trong cùng câu. Mọi số đều kèm ngữ cảnh 80 ký tự
 * để cán bộ tự xác nhận — văn bản thật hay ghi "12.000 triệu đồng", "2,5 tỷ đồng", số cũ
 * và số điều chỉnh cạnh nhau, nên KHÔNG chọn giúp số nào là "đúng".
 */

export type SoTienToTrinh = {
  tep: string
  khoanMuc: KhoanMucChiPhi['ma']
  nhan: string
  giaTri: number            // đã quy về đồng
  donViGoc: string          // "đồng" | "triệu đồng" | "tỷ đồng" | "(không ghi)"
  nguVanBan: string
}

export type DongDoiChieu = {
  khoanMuc: KhoanMucChiPhi['ma']
  ten: string
  theoToTrinh: number | null
  nguonToTrinh: string
  theoDuToan: number | null
  nguonDuToan: string
  chenhLech: number | null
  tyLe: number | null
  ungVienKhac: number
}

export type KetQuaDoiChieuToTrinh = {
  tepDaDoc: string[]
  soTien: SoTienToTrinh[]
  bang: DongDoiChieu[]
  canhBao: string[]
}

const NHAN: { ma: KhoanMucChiPhi['ma']; ten: string; tu: string[] }[] = [
  { ma: 'TONG', ten: 'Tổng mức đầu tư / Tổng dự toán', tu: ['tong muc dau tu', 'tong du toan', 'gia tri du toan', 'du toan xay dung cong trinh', 'du toan dieu chinh', 'du toan hang muc'] },
  { ma: 'BT_TDC', ten: 'Chi phí bồi thường, hỗ trợ và tái định cư', tu: ['chi phi boi thuong', 'boi thuong, ho tro'] },
  { ma: 'XD', ten: 'Chi phí xây dựng', tu: ['chi phi xay dung'] },
  { ma: 'TB', ten: 'Chi phí thiết bị', tu: ['chi phi thiet bi'] },
  { ma: 'QLDA', ten: 'Chi phí quản lý dự án', tu: ['chi phi quan ly du an'] },
  { ma: 'TV', ten: 'Chi phí tư vấn đầu tư xây dựng', tu: ['chi phi tu van'] },
  { ma: 'K', ten: 'Chi phí khác', tu: ['chi phi khac'] },
  { ma: 'DP', ten: 'Chi phí dự phòng', tu: ['chi phi du phong', 'du phong phi'] },
]

/** "186.568.705.000 đồng" / "12.000 triệu đồng" / "2,5 tỷ đồng" → đồng. */
function quyVeDong(soRaw: string, donVi: string): { giaTri: number; donViGoc: string } | null {
  let s = soRaw.trim()
  const dv = boDau(donVi)
  let heSo = 1
  let donViGoc = '(không ghi)'
  if (dv.includes('ty')) { heSo = 1e9; donViGoc = 'tỷ đồng' }
  else if (dv.includes('trieu')) { heSo = 1e6; donViGoc = 'triệu đồng' }
  else if (dv.includes('nghin') || dv.includes('ngan')) { heSo = 1e3; donViGoc = 'nghìn đồng' }
  else if (dv.includes('dong') || dv === 'd' || dv === 'vnd') { donViGoc = 'đồng' }
  // Số kiểu VN: 186.568.705.000 hoặc 2,5 hoặc 12.000
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.')
  else if (/^\d+,\d+$/.test(s)) s = s.replace(',', '.')
  else if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, '')
  else if (!/^\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s) * heSo
  if (!Number.isFinite(n) || n < 1000) return null      // dưới 1.000 đ: là số thứ tự/tỷ lệ
  return { giaTri: n, donViGoc }
}

function bocSoTien(tep: string, text: string): SoTienToTrinh[] {
  const ra: SoTienToTrinh[] = []
  const goc = text.replace(/\s+/g, ' ')
  const kd = boDau(goc)   // cùng độ dài? boDau bỏ dấu tổ hợp → độ dài đổi. Dùng regex trên bản gốc thay vì ánh xạ chỉ số.
  void kd
  // Tách câu; trong mỗi câu tìm nhãn rồi số phía sau nhãn (tối đa 160 ký tự)
  const cau = goc.split(/(?<=[.;:])\s+(?=[A-ZĐ0-9(+\-*])|\n/)
  const reSo = /(\d{1,3}(?:[.,]\d{3})+(?:,\d+)?|\d+(?:,\d+)?)\s*(tỷ đồng|triệu đồng|nghìn đồng|ngàn đồng|đồng|đ\b|VNĐ|VND)?/gi
  for (const c of cau) {
    const ckd = boDau(c)
    for (const nh of NHAN) {
      let viTri = -1
      for (const tu of nh.tu) { const i = ckd.indexOf(tu); if (i >= 0 && (viTri < 0 || i < viTri)) viTri = i }
      if (viTri < 0) continue
      // Lấy đoạn sau nhãn trong bản gốc: vì boDau đổi độ dài, tìm lại bằng cách cắt theo tỷ lệ gần đúng rồi mở rộng
      const tyLe = c.length / Math.max(ckd.length, 1)
      const batDau = Math.max(0, Math.floor(viTri * tyLe) - 5)
      const doan = c.slice(batDau, batDau + 200)
      reSo.lastIndex = 0
      let m: RegExpExecArray | null
      let dem = 0
      while ((m = reSo.exec(doan)) && dem < 3) {
        const q = quyVeDong(m[1], m[2] ?? '')
        if (!q) continue
        // Số không có đơn vị và < 1 triệu: nhiều khả năng là số văn bản (57/TTr, 2204) → bỏ
        if (q.donViGoc === '(không ghi)' && q.giaTri < 1e6) continue
        dem++
        const i0 = Math.max(0, batDau + m.index - 60)
        ra.push({
          tep, khoanMuc: nh.ma, nhan: nh.ten, giaTri: q.giaTri, donViGoc: q.donViGoc,
          nguVanBan: '…' + c.slice(i0, Math.min(c.length, batDau + m.index + m[0].length + 30)).trim() + '…',
        })
      }
    }
  }
  return ra
}

export async function docToTrinh(goc: string, files: FileHoSo[], tongHop: KetQuaTongHopKinhPhi[]): Promise<KetQuaDoiChieuToTrinh> {
  const { extractText } = await import('@/lib/rag/extract')
  const ra: KetQuaDoiChieuToTrinh = { tepDaDoc: [], soTien: [], bang: [], canhBao: [] }
  const ungVien = files.filter((f) => (f.nhom === 'TO_TRINH' || f.nhom === 'THUYET_MINH') && ['docx', 'pdf'].includes(f.duoi)).slice(0, 6)
  if (ungVien.length === 0) ra.canhBao.push('Không có tờ trình/thuyết minh dạng .docx/.pdf đọc được để đối chiếu số liệu.')
  for (const f of ungVien) {
    if (f.kichThuoc > GIOI_HAN.kichThuocDocToiDa) { ra.canhBao.push(`${f.ten}: vượt trần dung lượng.`); continue }
    try {
      const buf = await readFile(path.join(goc, f.duongDanTuongDoi))
      const { text } = await extractText(buf, f.ten)
      if (!text?.trim()) { ra.canhBao.push(`${f.ten}: không có lớp văn bản (scan).`); continue }
      ra.tepDaDoc.push(f.duongDanTuongDoi)
      ra.soTien.push(...bocSoTien(f.duongDanTuongDoi, text))
    } catch (e) {
      ra.canhBao.push(`${f.ten}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  // Bảng đối chiếu: A = số đầu tiên bóc được ở tờ trình (ưu tiên nhóm TO_TRINH), B = dự toán (bảng tổng hợp đầu tiên)
  const th = tongHop[0]
  const tepToTrinh = new Set(files.filter((f) => f.nhom === 'TO_TRINH').map((f) => f.duongDanTuongDoi))
  for (const nh of NHAN) {
    const cands = ra.soTien.filter((s) => s.khoanMuc === nh.ma).sort((a, b) => (tepToTrinh.has(a.tep) ? 0 : 1) - (tepToTrinh.has(b.tep) ? 0 : 1))
    const a = cands[0] ?? null
    const b = th?.khoanMuc.find((k) => k.ma === nh.ma) ?? null
    const bGia = b ? (b.sauThue ?? b.truocThue) : null
    if (!a && bGia === null) continue
    const chenh = a && bGia !== null ? bGia - a.giaTri : null
    ra.bang.push({
      khoanMuc: nh.ma, ten: nh.ten,
      theoToTrinh: a?.giaTri ?? null, nguonToTrinh: a ? `${a.tep} (${a.donViGoc})` : 'CHƯA CÓ TRONG HỒ SƠ',
      theoDuToan: bGia, nguonDuToan: b ? `${b.tep} · ${b.sheet}!dòng ${b.dong}${b.sauThue !== null ? ' (sau thuế)' : ' (trước thuế)'}` : 'CHƯA CÓ TRONG HỒ SƠ',
      chenhLech: chenh, tyLe: chenh !== null && a && a.giaTri !== 0 ? (chenh / a.giaTri) * 100 : null,
      ungVienKhac: Math.max(0, cands.length - 1),
    })
  }
  if (!th) ra.canhBao.push('Không nhận ra bảng tổng hợp kinh phí trong dự toán — cột B để trống.')
  return ra
}
