import 'server-only'
import { readdir, lstat, readFile } from 'node:fs/promises'
import path from 'node:path'
import { namTrong } from './duong-dan'

/**
 * QUÉT & KIỂM KÊ HỒ SƠ THẨM ĐỊNH.
 *
 * NGUYÊN TẮC: đây là TRỢ LÝ KIỂM KÊ, không phải hệ thống kết luận.
 * Phân loại dựa trên tên file + dấu hiệu trong nội dung — cả hai đều có thể sai
 * (hồ sơ thật hay có "scan001.pdf", "HS bo sung lan 2.pdf", hoặc một PDF scan gộp
 * nhiều thành phần). Vì vậy KHÔNG bao giờ trả nhãn "ĐỦ": chỉ có
 *   TIM_THAY (có ứng viên) · CAN_XAC_NHAN (dấu hiệu yếu) · CHUA_TIM_THAY
 * và cán bộ phải xác nhận trước khi dùng kết quả.
 */

export const GIOI_HAN = {
  doSauToiDa: 5,
  soFileToiDa: 400,
  kichThuocDocToiDa: 25 * 1024 * 1024,   // chỉ đọc nội dung file <= 25MB
  soFileDocNoiDung: 60,                  // số file được bóc nội dung mỗi lần quét
  tongByteDoc: 150 * 1024 * 1024,
} as const

export type NhomHoSo =
  | 'TO_TRINH' | 'THUYET_MINH' | 'BAN_VE' | 'DU_TOAN'
  | 'PHAP_LY' | 'KHAO_SAT' | 'NANG_LUC' | 'KHAC'

export const NHAN_NHOM: Record<NhomHoSo, string> = {
  TO_TRINH: 'Tờ trình',
  THUYET_MINH: 'Thuyết minh',
  BAN_VE: 'Bản vẽ',
  DU_TOAN: 'Dự toán / Tổng mức đầu tư',
  PHAP_LY: 'Văn bản pháp lý',
  KHAO_SAT: 'Khảo sát xây dựng',
  NANG_LUC: 'Hồ sơ năng lực',
  KHAC: 'Khác / chưa phân loại',
}

/** Bỏ dấu để so khớp tên file viết không dấu (rất phổ biến trong hồ sơ thật). */
export function boDau(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()
}

type LuatPhanLoai = { nhom: NhomHoSo; tuKhoa: string[]; duoi?: string[] }

// Đặt TO_TRINH trước THUYET_MINH: "to trinh tham dinh thuyet minh" phải ra tờ trình.
const LUAT: LuatPhanLoai[] = [
  { nhom: 'TO_TRINH',    tuKhoa: ['to trinh', 'totrinh', 'ttr', 'don de nghi tham dinh'] },
  { nhom: 'DU_TOAN',     tuKhoa: ['du toan', 'dutoan', 'tong muc dau tu', 'tmdt', 'khai toan', 'don gia', 'bang gia', 'chi phi'] },
  { nhom: 'BAN_VE',      tuKhoa: ['ban ve', 'banve', 'bvtc', 'ban ve thi cong', 'thiet ke co so', 'tkcs', 'mat bang', 'mat cat', 'trac doc', 'trac ngang'], duoi: ['dwg', 'dxf'] },
  { nhom: 'THUYET_MINH', tuKhoa: ['thuyet minh', 'thuyetminh', 'bao cao nghien cuu kha thi', 'bcnckt', 'bao cao kinh te ky thuat', 'bcktkt'] },
  { nhom: 'KHAO_SAT',    tuKhoa: ['khao sat', 'khaosat', 'dia chat', 'dia hinh', 'trac dia'] },
  { nhom: 'NANG_LUC',    tuKhoa: ['nang luc', 'chung chi', 'dang ky kinh doanh', 'chung nhan'] },
  { nhom: 'PHAP_LY',     tuKhoa: ['quyet dinh', 'chu truong', 'quy hoach', 'giay phep', 'cong van', 'nghi quyet', 'phe duyet', 'thoa thuan', 'bien ban'] },
]

const DUOI_BAN_VE = ['dwg', 'dxf']
const DUOI_BANG_TINH = ['xlsx', 'xls', 'xlsm']
const DUOI_VAN_BAN = ['pdf', 'docx', 'doc']

export type FileHoSo = {
  ten: string
  duongDanTuongDoi: string
  duoi: string
  kichThuoc: number
  sua: string
  nhom: NhomHoSo
  doTinCay: 'cao' | 'trung binh' | 'thap'
  lyDo: string
  /** Trích yếu đọc được từ nội dung (nếu có bóc) */
  trichYeu?: string
  /** Ghi chú khi không đọc được (PDF scan, .doc cũ, DWG...) */
  ghiChuDoc?: string
}

/** Phân loại theo tên file + phần mở rộng. Luôn kèm lý do để cán bộ soi lại. */
export function phanLoai(tenFile: string): Pick<FileHoSo, 'nhom' | 'doTinCay' | 'lyDo'> {
  const duoi = (tenFile.split('.').pop() || '').toLowerCase()
  const ten = boDau(tenFile)

  for (const l of LUAT) {
    const khop = l.tuKhoa.find((k) => ten.includes(k))
    if (khop) return { nhom: l.nhom, doTinCay: 'trung binh', lyDo: `tên file chứa "${khop}"` }
  }
  if (DUOI_BAN_VE.includes(duoi)) {
    return { nhom: 'BAN_VE', doTinCay: 'cao', lyDo: `định dạng .${duoi} là tệp bản vẽ` }
  }
  if (DUOI_BANG_TINH.includes(duoi)) {
    return { nhom: 'DU_TOAN', doTinCay: 'thap', lyDo: `là bảng tính .${duoi} — chưa chắc là dự toán, cần xác nhận` }
  }
  return { nhom: 'KHAC', doTinCay: 'thap', lyDo: 'tên file không có dấu hiệu nhận biết' }
}

export type KetQuaQuet = {
  duongDanHienThi: string
  files: FileHoSo[]
  tongFile: number
  chamNguong: string[]     // các giới hạn đã chạm phải
  theoNhom: Record<NhomHoSo, number>
}

/** Duyệt cây thư mục, bỏ qua junction/symlink và mọi thứ ra ngoài gốc. */
async function duyetCay(
  goc: string, hienTai: string, doSau: number, thu: FileHoSo[], chamNguong: string[],
): Promise<void> {
  if (doSau > GIOI_HAN.doSauToiDa) {
    if (!chamNguong.includes('doSau')) chamNguong.push('doSau')
    return
  }
  if (thu.length >= GIOI_HAN.soFileToiDa) {
    if (!chamNguong.includes('soFile')) chamNguong.push('soFile')
    return
  }

  let muc
  try { muc = await readdir(hienTai, { withFileTypes: true }) } catch { return }

  for (const m of muc) {
    if (thu.length >= GIOI_HAN.soFileToiDa) {
      if (!chamNguong.includes('soFile')) chamNguong.push('soFile')
      return
    }
    if (m.name.startsWith('~$') || m.name.startsWith('.')) continue   // file tạm Office

    const day = path.join(hienTai, m.name)
    let st
    try { st = await lstat(day) } catch { continue }
    if (st.isSymbolicLink()) continue                                  // junction: bỏ qua
    if (!namTrong(goc, day)) continue

    if (st.isDirectory()) {
      await duyetCay(goc, day, doSau + 1, thu, chamNguong)
      continue
    }
    if (!st.isFile()) continue

    const duoi = (m.name.split('.').pop() || '').toLowerCase()
    thu.push({
      ten: m.name,
      duongDanTuongDoi: path.relative(goc, day),
      duoi,
      kichThuoc: st.size,
      sua: st.mtime.toISOString(),
      ...phanLoai(m.name),
    })
  }
}

export async function quetThuMuc(duongDanThat: string, hienThi: string): Promise<KetQuaQuet> {
  const files: FileHoSo[] = []
  const chamNguong: string[] = []
  await duyetCay(duongDanThat, duongDanThat, 0, files, chamNguong)

  files.sort((a, b) => a.duongDanTuongDoi.localeCompare(b.duongDanTuongDoi, 'vi'))

  const theoNhom = Object.fromEntries(
    (Object.keys(NHAN_NHOM) as NhomHoSo[]).map((k) => [k, files.filter((f) => f.nhom === k).length]),
  ) as Record<NhomHoSo, number>

  return { duongDanHienThi: hienThi, files, tongFile: files.length, chamNguong, theoNhom }
}

// ── Bóc nội dung để lấy trích yếu ───────────────────────────────────────────
// Chỉ bóc file văn bản, có trần số lượng và dung lượng. PDF scan không có lớp
// text sẽ ra rỗng -> ghi rõ "chưa đọc được", KHÔNG suy đoán.

export async function bocTrichYeu(
  goc: string, files: FileHoSo[],
): Promise<{ daDoc: number; tongByte: number }> {
  const { extractText } = await import('@/lib/rag/extract')
  let daDoc = 0
  let tongByte = 0

  for (const f of files) {
    if (daDoc >= GIOI_HAN.soFileDocNoiDung || tongByte >= GIOI_HAN.tongByteDoc) break
    if (!DUOI_VAN_BAN.includes(f.duoi)) continue

    if (f.duoi === 'doc') {
      f.ghiChuDoc = 'Định dạng .doc cũ — chưa đọc được. Lưu lại thành .docx hoặc PDF.'
      continue
    }
    if (f.kichThuoc > GIOI_HAN.kichThuocDocToiDa) {
      f.ghiChuDoc = `Tệp ${(f.kichThuoc / 1048576).toFixed(1)} MB vượt trần đọc nội dung.`
      continue
    }

    try {
      const buf = await readFile(path.join(goc, f.duongDanTuongDoi))
      tongByte += buf.length
      daDoc++
      const { text } = await extractText(buf, f.ten)
      const sach = (text || '').replace(/\[Trang \d+\]/g, ' ').replace(/\s+/g, ' ').trim()
      if (!sach) {
        f.ghiChuDoc = 'Không có lớp văn bản (nhiều khả năng là bản scan) — chưa đọc được nội dung.'
        continue
      }
      f.trichYeu = sach.slice(0, 300)
      // Có nội dung thì nâng độ tin cậy nếu nội dung xác nhận nhóm đã đoán
      const nd = boDau(sach.slice(0, 1500))
      const luat = LUAT.find((l) => l.nhom === f.nhom)
      if (luat && luat.tuKhoa.some((k) => nd.includes(k))) {
        f.doTinCay = 'cao'
        f.lyDo += ' + nội dung xác nhận'
      }
    } catch (e) {
      f.ghiChuDoc = `Lỗi đọc tệp: ${e instanceof Error ? e.message : String(e)}`
    }
  }
  return { daDoc, tongByte }
}

// ── Đối chiếu với thành phần hồ sơ của quy trình ────────────────────────────

export type TrangThaiTP = 'TIM_THAY' | 'CAN_XAC_NHAN' | 'CHUA_TIM_THAY'

export type DoiChieuTP = {
  thanhPhan: string
  nhomSuyRa: NhomHoSo | null
  trangThai: TrangThaiTP
  ungVien: string[]      // đường dẫn tương đối các file ứng viên
  ghiChu: string
}

/** Suy nhóm hồ sơ từ câu mô tả thành phần trong QuyTrinh.hoSo[]. */
export function nhomTuThanhPhan(mo: string): NhomHoSo | null {
  const t = boDau(mo)
  if (t.includes('to trinh')) return 'TO_TRINH'
  if (t.includes('du toan') || t.includes('tong muc dau tu') || t.includes('chi phi')) return 'DU_TOAN'
  if (t.includes('ban ve') || t.includes('thiet ke')) return 'BAN_VE'
  if (t.includes('thuyet minh')) return 'THUYET_MINH'
  if (t.includes('khao sat')) return 'KHAO_SAT'
  if (t.includes('nang luc')) return 'NANG_LUC'
  if (t.includes('phap ly') || t.includes('chu truong') || t.includes('quy hoach') || t.includes('moi truong')) return 'PHAP_LY'
  return null
}

/**
 * Đối chiếu danh sách file với checklist thành phần hồ sơ.
 * KHÔNG kết luận "đủ" — chỉ nêu ứng viên và mức độ chắc chắn.
 */
export function doiChieu(hoSo: string[], files: FileHoSo[]): DoiChieuTP[] {
  return hoSo.map((tp) => {
    const nhom = nhomTuThanhPhan(tp)
    if (!nhom) {
      return {
        thanhPhan: tp, nhomSuyRa: null, trangThai: 'CAN_XAC_NHAN' as TrangThaiTP, ungVien: [],
        ghiChu: 'Chưa suy được nhóm hồ sơ từ mô tả — cán bộ tự đối chiếu.',
      }
    }
    const ungVien = files.filter((f) => f.nhom === nhom)
    if (ungVien.length === 0) {
      return {
        thanhPhan: tp, nhomSuyRa: nhom, trangThai: 'CHUA_TIM_THAY' as TrangThaiTP, ungVien: [],
        ghiChu: `Không thấy tệp nào được xếp vào nhóm "${NHAN_NHOM[nhom]}". Có thể hồ sơ thiếu, HOẶC nằm trong một tệp scan gộp — cần kiểm tra tay.`,
      }
    }
    const coTinCayCao = ungVien.some((f) => f.doTinCay === 'cao')
    return {
      thanhPhan: tp,
      nhomSuyRa: nhom,
      trangThai: (coTinCayCao ? 'TIM_THAY' : 'CAN_XAC_NHAN') as TrangThaiTP,
      ungVien: ungVien.map((f) => f.duongDanTuongDoi),
      ghiChu: coTinCayCao
        ? 'Có tệp ứng viên — vẫn cần cán bộ mở kiểm tra nội dung.'
        : 'Dấu hiệu nhận biết yếu (chỉ dựa vào tên tệp) — cần xác nhận.',
    }
  })
}
