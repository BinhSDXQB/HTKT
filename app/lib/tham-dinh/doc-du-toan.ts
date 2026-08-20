import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import * as XLSX from 'xlsx'
import { boDau, type FileHoSo, GIOI_HAN } from './quet-ho-so'

/**
 * ĐỌC SỐ LIỆU TIỀN TRONG DỰ TOÁN EXCEL.
 *
 * Đây là chỗ dễ sai nhất và hậu quả nặng nhất: hiện một con số sai cho cán bộ
 * thẩm định. Dự toán thật thường có NHIỀU sheet, NHIỀU dòng tổng, đơn vị ghi
 * "nghìn đồng"/"triệu đồng", ô gộp, và công thức chưa có giá trị đã tính.
 *
 * Vì vậy module này:
 *   - KHÔNG chọn ra "một con số kết quả". Trả về TẤT CẢ ứng viên.
 *   - Mỗi ứng viên kèm NGUỒN đầy đủ: tệp, sheet, ô, nhãn nằm cạnh.
 *   - Ghi rõ đơn vị phát hiện được; không tự quy đổi.
 *   - Ô là công thức mà không có giá trị đã tính (v) thì ghi "chưa có giá trị",
 *     KHÔNG tự tính.
 *   - Cán bộ phải tự chọn số dùng chính thức.
 */

export type UngVienTien = {
  tep: string
  sheet: string
  o: string
  nhan: string
  giaTri: number | null
  hienThi: string
  donViPhatHien: string | null
  laCongThuc: boolean
  uuTien: number          // điểm ưu tiên nhãn (cao = sát "tổng mức đầu tư" hơn)
}

const NHAN_UU_TIEN: { tu: string; diem: number }[] = [
  { tu: 'tong muc dau tu', diem: 100 },
  { tu: 'tmdt', diem: 95 },
  { tu: 'tong hop kinh phi', diem: 80 },
  { tu: 'gia tri du toan', diem: 78 },
  { tu: 'tong du toan', diem: 75 },
  { tu: 'tong gia tri', diem: 60 },
  { tu: 'tong kinh phi', diem: 60 },
  { tu: 'tong cong', diem: 40 },
  // KHONG dung tu khoa tran 'cong': trong tieng Viet no khop ca dia danh
  // ("Cong Hoa", "Cong Ba") -> tung tra ve so tien vo nghia. Da kiem chung 20/8/2026.
  { tu: 'cong:', diem: 25 },
  { tu: 'cong tri gia', diem: 25 },
]

/** Dò đơn vị tiền ghi trong tiêu đề sheet: "Đơn vị: nghìn đồng". */
function doDonVi(vanBanDau: string): string | null {
  const t = boDau(vanBanDau)
  if (t.includes('nghin dong') || t.includes('1.000 dong') || t.includes('1000 dong')) return 'nghìn đồng'
  if (t.includes('trieu dong')) return 'triệu đồng'
  if (t.includes('ty dong')) return 'tỷ đồng'
  if (t.includes('dong')) return 'đồng'
  return null
}

function diemNhan(nhan: string): number {
  const t = boDau(nhan)
  for (const n of NHAN_UU_TIEN) if (t.includes(n.tu)) return n.diem
  return 0
}

/**
 * Quét một workbook, trả các ô số nằm cùng dòng với nhãn tổng.
 * Duyệt theo ô có nhãn rồi lấy số ở các ô bên phải trong cùng dòng.
 */
function quetWorkbook(wb: XLSX.WorkBook, tenTep: string): UngVienTien[] {
  const ra: UngVienTien[] = []

  for (const tenSheet of wb.SheetNames) {
    const ws = wb.Sheets[tenSheet]
    if (!ws || !ws['!ref']) continue
    const vung = XLSX.utils.decode_range(ws['!ref'])

    // Lấy ~15 dòng đầu làm ngữ cảnh để dò đơn vị tiền
    let dauSheet = ''
    for (let r = vung.s.r; r <= Math.min(vung.s.r + 14, vung.e.r); r++) {
      for (let c = vung.s.c; c <= Math.min(vung.s.c + 12, vung.e.c); c++) {
        const o = ws[XLSX.utils.encode_cell({ r, c })]
        if (o && typeof o.v === 'string') dauSheet += ' ' + o.v
      }
    }
    const donVi = doDonVi(dauSheet)

    for (let r = vung.s.r; r <= vung.e.r; r++) {
      for (let c = vung.s.c; c <= vung.e.c; c++) {
        const o = ws[XLSX.utils.encode_cell({ r, c })]
        if (!o || typeof o.v !== 'string') continue
        const diem = diemNhan(o.v)
        if (diem === 0) continue

        // Lấy số đầu tiên bên phải trong cùng dòng (tối đa 12 cột)
        for (let c2 = c + 1; c2 <= Math.min(c + 12, vung.e.c); c2++) {
          const o2 = ws[XLSX.utils.encode_cell({ r, c: c2 })]
          if (!o2) continue
          const laCongThuc = typeof o2.f === 'string'
          const coGiaTri = typeof o2.v === 'number' && Number.isFinite(o2.v)
          if (!coGiaTri && !laCongThuc) continue
          if (coGiaTri && Math.abs(o2.v as number) < 1000) continue   // bỏ số thứ tự, hệ số

          ra.push({
            tep: tenTep,
            sheet: tenSheet,
            o: XLSX.utils.encode_cell({ r, c: c2 }),
            nhan: o.v.replace(/\s+/g, ' ').trim().slice(0, 120),
            giaTri: coGiaTri ? (o2.v as number) : null,
            hienThi: coGiaTri
              ? (o2.v as number).toLocaleString('vi-VN')
              : 'chưa có giá trị đã tính (ô là công thức)',
            donViPhatHien: donVi,
            laCongThuc,
            uuTien: diem,
          })
          break
        }
      }
    }
  }

  // Ưu tiên nhãn sát nghĩa nhất, rồi tới giá trị lớn
  ra.sort((a, b) => b.uuTien - a.uuTien || (b.giaTri ?? 0) - (a.giaTri ?? 0))
  return ra.slice(0, 40)
}

export type KetQuaDuToan = {
  ungVien: UngVienTien[]
  tepDaDoc: string[]
  canhBao: string[]
}

/** Đọc các tệp bảng tính trong danh sách, gom ứng viên số tiền. */
export async function docDuToan(goc: string, files: FileHoSo[]): Promise<KetQuaDuToan> {
  const bangTinh = files.filter((f) => ['xlsx', 'xls', 'xlsm'].includes(f.duoi))
  const ungVien: UngVienTien[] = []
  const tepDaDoc: string[] = []
  const canhBao: string[] = []

  for (const f of bangTinh.slice(0, 12)) {
    if (f.kichThuoc > GIOI_HAN.kichThuocDocToiDa) {
      canhBao.push(`${f.ten}: ${(f.kichThuoc / 1048576).toFixed(1)} MB vượt trần đọc — chưa bóc số liệu.`)
      continue
    }
    try {
      const buf = await readFile(path.join(goc, f.duongDanTuongDoi))
      const wb = XLSX.read(buf, { type: 'buffer', cellFormula: true, cellNF: false, sheetStubs: false })
      const kq = quetWorkbook(wb, f.duongDanTuongDoi)
      if (kq.length === 0) canhBao.push(`${f.ten}: không thấy dòng tổng nào có nhãn nhận biết được.`)
      ungVien.push(...kq)
      tepDaDoc.push(f.duongDanTuongDoi)
    } catch (e) {
      canhBao.push(`${f.ten}: lỗi đọc — ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  if (bangTinh.length > 12) {
    canhBao.push(`Có ${bangTinh.length} tệp bảng tính, chỉ đọc 12 tệp đầu.`)
  }
  const coCongThuc = ungVien.some((u) => u.laCongThuc && u.giaTri === null)
  if (coCongThuc) {
    canhBao.push('Một số ô là công thức chưa lưu giá trị đã tính — mở tệp bằng Excel và lưu lại để hệ thống đọc được.')
  }
  const donVis = [...new Set(ungVien.map((u) => u.donViPhatHien).filter(Boolean))]
  if (donVis.length > 1) {
    canhBao.push(`Phát hiện nhiều đơn vị tiền khác nhau (${donVis.join(', ')}) — đối chiếu kỹ trước khi so sánh số.`)
  }

  ungVien.sort((a, b) => b.uuTien - a.uuTien || (b.giaTri ?? 0) - (a.giaTri ?? 0))
  return { ungVien: ungVien.slice(0, 60), tepDaDoc, canhBao }
}
