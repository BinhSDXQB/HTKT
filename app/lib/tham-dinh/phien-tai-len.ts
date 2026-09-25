import 'server-only'
import { mkdir, readFile, writeFile, open, readdir, rm, stat, statfs } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import { duongDanConHopLe, namTrong } from './duong-dan'

/**
 * PHIÊN TẢI LÊN HỒ SƠ DỰ ÁN TỪ MÁY CÁN BỘ.
 *
 * Cán bộ dùng phần mềm qua trình duyệt, thư mục hồ sơ nằm trên máy của họ (hoặc ổ Google Drive
 * của họ) — máy chủ không nhìn thấy. Nên cán bộ tự CHỌN THƯ MỤC DỰ ÁN (mỗi dự án một thư mục,
 * không có thư mục mặc định), trình duyệt tải các tệp lên một phiên tạm riêng của người đó, rồi
 * mọi bước kiểm kê / hỏi đáp chạy trên phiên này.
 *
 *   - Mỗi phiên là 1 thư mục THU_MUC_PHIEN/<phienId> (id ngẫu nhiên 96 bit) + .phien.json ghi chủ
 *     sở hữu. Người khác (kể cả cùng phòng) KHÔNG đọc được phiên của nhau.
 *   - Đường dẫn tương đối do trình duyệt gửi được kiểm như đường dẫn con của kho máy chủ (chặn "..",
 *     ổ đĩa, UNC, ADS, ký tự đại diện) + chặn tên thiết bị Windows (CON, NUL, COM1…).
 *   - Tệp gửi theo mảnh (≤ 8MB/lần) vì IIS chặn request > 50MB.
 *   - pm2 chạy 2 tiến trình → KHÔNG giữ bộ đếm trong .phien.json (2 tab/2 tiến trình ghi đè nhau).
 *     .phien.json ghi MỘT lần lúc tạo; dung lượng/số tệp tính lại từ đĩa mỗi lần kiểm hạn mức.
 *     Mảnh ghi theo vị trí (pwrite) nên gửi lại cùng mảnh cho kết quả như nhau.
 *   - Chống đầy ổ C: mỗi người tối đa 3 phiên (tạo phiên mới xoá phiên cũ nhất), tổng mọi phiên
 *     ≤ 3GB, và luôn chừa ≥ 1,5GB trống trên ổ đĩa. Phiên quá 24 giờ tự xoá.
 */

export const THU_MUC_PHIEN = path.join(os.tmpdir(), 'qlhtkt-ho-so-tham-dinh')

export const GIOI_HAN_PHIEN = {
  kichThuocManhToiDa: 8 * 1024 * 1024,
  kichThuocTepToiDa: 200 * 1024 * 1024,
  tongDungLuongToiDa: 600 * 1024 * 1024,
  soTepToiDa: 400,
  soPhienMoiNguoi: 3,
  tongMoiPhien: 3 * 1024 * 1024 * 1024,
  chuaTrongOdia: 1.5 * 1024 * 1024 * 1024,
  thoiHanMs: 24 * 60 * 60 * 1000,
} as const

// Bắt đầu bằng dấu chấm để bộ quét (quet-ho-so.ts) tự bỏ qua như tệp ẩn.
const TEP_META = '.phien.json'

type MetaPhien = { userId: string; taoLuc: number; tenThuMuc: string }

const ID_HOP_LE = /^[a-f0-9]{24}$/
const TEN_THIET_BI = /^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³]|conin\$|conout\$)$/i

function thuMucCuaPhien(phienId: string): string | null {
  if (!ID_HOP_LE.test(phienId)) return null
  return path.join(THU_MUC_PHIEN, phienId)
}

async function docMeta(dir: string): Promise<MetaPhien | null> {
  try { return JSON.parse(await readFile(path.join(dir, TEP_META), 'utf8')) as MetaPhien } catch { return null }
}

/** Dung lượng + số tệp thật đang có trên đĩa của 1 thư mục phiên (không tính .phien.json). */
async function dungLuong(dir: string): Promise<{ byte: number; soTep: number }> {
  let byte = 0, soTep = 0
  async function di(d: string) {
    let ds
    try { ds = await readdir(d, { withFileTypes: true }) } catch { return }
    for (const e of ds) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) await di(p)
      else if (e.isFile() && !(d === dir && e.name === TEP_META)) {
        try { byte += (await stat(p)).size; soTep++ } catch { /* tệp vừa bị xoá */ }
      }
    }
  }
  await di(dir)
  return { byte, soTep }
}

type PhienTrenDia = { id: string; dir: string; meta: MetaPhien | null; taoLuc: number }

async function danhSachPhien(): Promise<PhienTrenDia[]> {
  let ds: string[]
  try { ds = await readdir(THU_MUC_PHIEN) } catch { return [] }
  const out: PhienTrenDia[] = []
  for (const ten of ds) {
    const dir = thuMucCuaPhien(ten)
    if (!dir) continue
    const meta = await docMeta(dir)
    let taoLuc = meta?.taoLuc
    if (!taoLuc) { try { taoLuc = (await stat(dir)).mtimeMs } catch { continue } }
    out.push({ id: ten, dir, meta, taoLuc })
  }
  return out
}

/** Xoá phiên quá hạn + phiên cũ vượt số phiên cho phép của người dùng. */
async function donPhien(userId?: string): Promise<void> {
  const nay = Date.now()
  const ds = await danhSachPhien()
  for (const p of ds) {
    if (nay - p.taoLuc > GIOI_HAN_PHIEN.thoiHanMs) await rm(p.dir, { recursive: true, force: true }).catch(() => {})
  }
  if (userId) {
    const cuaToi = ds.filter((p) => p.meta?.userId === userId && nay - p.taoLuc <= GIOI_HAN_PHIEN.thoiHanMs)
      .sort((a, b) => b.taoLuc - a.taoLuc)
    // Chừa chỗ cho phiên sắp tạo: giữ (soPhienMoiNguoi - 1) phiên mới nhất.
    for (const p of cuaToi.slice(GIOI_HAN_PHIEN.soPhienMoiNguoi - 1)) await rm(p.dir, { recursive: true, force: true }).catch(() => {})
  }
}

async function conTrongOdia(): Promise<number> {
  try { const s = await statfs(THU_MUC_PHIEN); return s.bavail * s.bsize } catch { return Number.POSITIVE_INFINITY }
}

/** Tên thư mục dự án người dùng đã chọn — chỉ để hiển thị, lọc ký tự lạ. */
function tenHienThi(s: string): string {
  return s.normalize('NFC').replace(/[\\/:*?"<>|\0]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150) || 'Hồ sơ dự án'
}

export async function taoPhien(userId: string, tenThuMuc: string): Promise<{ ok: true; phienId: string } | { ok: false; loi: string }> {
  await mkdir(THU_MUC_PHIEN, { recursive: true })
  await donPhien(userId)
  if (await conTrongOdia() < GIOI_HAN_PHIEN.chuaTrongOdia + GIOI_HAN_PHIEN.tongDungLuongToiDa) {
    return { ok: false, loi: 'Ổ đĩa máy chủ sắp đầy — tạm thời không nhận tải lên. Báo quản trị viên.' }
  }
  const phienId = randomBytes(12).toString('hex')
  const dir = path.join(THU_MUC_PHIEN, phienId)
  await mkdir(dir, { recursive: true })
  const meta: MetaPhien = { userId, taoLuc: Date.now(), tenThuMuc: tenHienThi(tenThuMuc) }
  await writeFile(path.join(dir, TEP_META), JSON.stringify(meta))
  return { ok: true, phienId }
}

export type KetQuaPhien =
  | { ok: true; duongDanThat: string; tenThuMuc: string }
  | { ok: false; loi: string }

/** Giải phiên → thư mục thật, CHỈ khi phiên thuộc đúng người đang đăng nhập và chưa hết hạn. */
export async function giaiPhien(phienId: string, userId: string): Promise<KetQuaPhien> {
  const dir = thuMucCuaPhien(phienId)
  if (!dir) return { ok: false, loi: 'Mã phiên không hợp lệ' }
  const meta = await docMeta(dir)
  if (!meta || meta.userId !== userId) return { ok: false, loi: 'Không tìm thấy phiên hồ sơ (có thể đã hết hạn 24 giờ) — hãy chọn lại thư mục.' }
  if (Date.now() - meta.taoLuc > GIOI_HAN_PHIEN.thoiHanMs) return { ok: false, loi: 'Phiên hồ sơ đã hết hạn 24 giờ — hãy chọn lại thư mục.' }
  return { ok: true, duongDanThat: dir, tenThuMuc: meta.tenThuMuc }
}

/** Kiểm đường dẫn tương đối của tệp tải lên; trả về các đoạn đã chuẩn hoá NFC hoặc lỗi. */
export function kiemDuongDanTaiLen(duongDanTuongDoi: string): { ok: true; doan: string[] } | { ok: false; loi: string } {
  const rel = (duongDanTuongDoi || '').normalize('NFC').replace(/\\/g, '/').replace(/^\/+/, '')
  const loi = rel ? duongDanConHopLe(rel) : 'Thiếu tên tệp'
  if (loi) return { ok: false, loi }
  if (/[<>"|]/.test(rel) || /[\x00-\x1f]/.test(rel)) return { ok: false, loi: 'Tên tệp chứa ký tự không hợp lệ' }
  const doan = rel.split('/').filter((d) => d && d !== '.')
  if (!doan.length) return { ok: false, loi: 'Thiếu tên tệp' }
  for (const d of doan) {
    // Windows coi "CON", "NUL.pdf", "com1.docx"… là thiết bị, bất kể phần mở rộng.
    if (TEN_THIET_BI.test(d.split('.')[0].trim())) return { ok: false, loi: `Tên "${d}" trùng tên thiết bị Windows` }
    if (d.length > 200) return { ok: false, loi: 'Tên tệp/thư mục quá dài' }
  }
  if (doan[0] === TEP_META) return { ok: false, loi: 'Tên tệp không hợp lệ' }
  return { ok: true, doan }
}

/**
 * Ghi một mảnh của một tệp. offset = 0 là mảnh đầu (tạo/ghi đè tệp); các mảnh sau phải nối
 * đúng vị trí cuối tệp hiện tại (hoặc gửi lại đúng mảnh vừa ghi) — lệch thì báo lỗi.
 */
export async function ghiManh(
  phienId: string, userId: string, duongDanTuongDoi: string, offset: number, tongKichThuoc: number, manh: Buffer,
): Promise<{ ok: true } | { ok: false; loi: string }> {
  const p = await giaiPhien(phienId, userId)
  if (!p.ok) return p

  const kd = kiemDuongDanTaiLen(duongDanTuongDoi)
  if (!kd.ok) return kd
  if (manh.length > GIOI_HAN_PHIEN.kichThuocManhToiDa) return { ok: false, loi: 'Mảnh dữ liệu quá lớn' }
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(tongKichThuoc)) return { ok: false, loi: 'Thông số mảnh không hợp lệ' }
  if (tongKichThuoc <= 0) return { ok: false, loi: 'Tệp rỗng (0 byte) — bỏ qua' }
  if (tongKichThuoc > GIOI_HAN_PHIEN.kichThuocTepToiDa) return { ok: false, loi: 'Tệp vượt 200MB — bỏ qua' }
  if (manh.length === 0 || offset + manh.length > tongKichThuoc) return { ok: false, loi: 'Mảnh không khớp kích thước tệp đã khai' }

  const dich = path.join(p.duongDanThat, ...kd.doan)
  if (!namTrong(p.duongDanThat, dich) || dich === p.duongDanThat) return { ok: false, loi: 'Đường dẫn nằm ngoài phiên' }

  // Hạn mức tính từ đĩa thật (không tin bộ đếm) — xem chú thích đầu tệp.
  const dl = await dungLuong(p.duongDanThat)
  let hienCo = -1
  try { hienCo = (await stat(dich)).size } catch { /* chưa có */ }
  const tangThem = Math.max(0, offset + manh.length - Math.max(hienCo, 0))
  if (offset === 0 && hienCo < 0 && dl.soTep >= GIOI_HAN_PHIEN.soTepToiDa) return { ok: false, loi: `Quá ${GIOI_HAN_PHIEN.soTepToiDa} tệp trong một phiên` }
  if (dl.byte + tangThem > GIOI_HAN_PHIEN.tongDungLuongToiDa) {
    return { ok: false, loi: `Tổng dung lượng vượt ${GIOI_HAN_PHIEN.tongDungLuongToiDa / 1048576}MB — hãy chọn thư mục dự án cụ thể hơn` }
  }
  if (offset === 0) {
    await donPhien()
    let tong = 0
    for (const ph of await danhSachPhien()) tong += (await dungLuong(ph.dir)).byte
    if (tong + tongKichThuoc > GIOI_HAN_PHIEN.tongMoiPhien || await conTrongOdia() < GIOI_HAN_PHIEN.chuaTrongOdia + tongKichThuoc) {
      return { ok: false, loi: 'Ổ đĩa máy chủ không đủ chỗ cho hồ sơ tải lên — báo quản trị viên.' }
    }
  }

  try {
    await mkdir(path.dirname(dich), { recursive: true })
    if (offset === 0) {
      // Gửi lại mảnh đầu (mạng chập chờn) khi tệp ĐÃ có các mảnh sau: nếu nội dung đầu trùng thì bỏ qua,
      // không ghi đè — ghi đè sẽ cắt cụt tệp về 8MB mà vẫn báo thành công.
      if (hienCo > manh.length && hienCo <= tongKichThuoc) {
        const fh = await open(dich, 'r')
        const dau = Buffer.alloc(manh.length)
        try { await fh.read(dau, 0, manh.length, 0) } finally { await fh.close() }
        if (dau.equals(manh)) return { ok: true }
      }
      await writeFile(dich, manh)                     // mảnh đầu: tạo mới / tải lại tệp khác từ đầu
    } else {
      // Chỉ nhận mảnh nối tiếp (offset == kích thước hiện có) hoặc gửi lại mảnh vừa ghi (idempotent).
      if (hienCo < 0) return { ok: false, loi: 'Chưa có mảnh đầu của tệp' }
      if (offset !== hienCo && offset + manh.length !== hienCo) {
        return { ok: false, loi: `Mảnh lệch vị trí (tệp đang ${hienCo} byte, mảnh bắt đầu ${offset})` }
      }
      const fh = await open(dich, 'r+')
      try { await fh.write(manh, 0, manh.length, offset) } finally { await fh.close() }
    }
  } catch (e) {
    return { ok: false, loi: `Không ghi được tệp: ${e instanceof Error ? e.message.slice(0, 150) : String(e)}` }
  }
  return { ok: true }
}

/** Người dùng chủ động xoá phiên (chọn lại thư mục khác) — giải phóng ổ đĩa ngay. Xoá được cả phiên đã hết hạn. */
export async function xoaPhien(phienId: string, userId: string): Promise<void> {
  const dir = thuMucCuaPhien(phienId)
  if (!dir) return
  const meta = await docMeta(dir)
  if (meta?.userId === userId) await rm(dir, { recursive: true, force: true }).catch(() => {})
}

/**
 * Dọn phiên quá 24 giờ. Không có tác vụ nền riêng nên gọi ở những chỗ hay chạy: mở trang Kiểm kê
 * (GET cấu hình), tạo phiên, mảnh đầu của mỗi tệp. Rẻ: chỉ đọc 1 tệp meta/phiên.
 */
export async function donPhienHetHan(): Promise<void> {
  await donPhien()
}
