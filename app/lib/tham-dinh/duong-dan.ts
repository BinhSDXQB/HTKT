import 'server-only'
import { lstat } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import path from 'node:path'

/**
 * GIẢI ĐƯỜNG DẪN AN TOÀN cho tính năng thẩm định hồ sơ từ thư mục máy chủ.
 *
 * Ứng dụng chạy dưới quyền Administrator và có tên miền công khai, nên một lỗi
 * ở đây là đọc được .env, backup CSDL, khoá riêng. Vì vậy:
 *
 *   - Client KHÔNG BAO GIỜ gửi đường dẫn tuyệt đối. Chỉ gửi { rootId, duongDanCon }.
 *   - rootId tra trong whitelist cấu hình qua .env (THAM_DINH_ROOTS).
 *   - Chặn trước các dạng đặc thù Windows: UNC \\server\share, device path \\?\,
 *     drive-relative "C:foo", alternate data stream "file.pdf:secret", tên có
 *     dấu chấm/khoảng trắng ở cuối.
 *   - Sau khi ghép, realpath cả gốc lẫn đích rồi so bằng path.relative — KHÔNG
 *     dùng startsWith (kinh điển: "G:\HoSo" lọt cho cả "G:\HoSo_Evil").
 *   - lstat TỪNG CẤP để phát hiện junction/symlink trỏ ra ngoài whitelist.
 */

export type ThuMucGoc = { id: string; nhan: string; duongDan: string }

/**
 * Đọc whitelist từ .env. Định dạng:
 *   THAM_DINH_ROOTS="Hồ sơ thẩm định|G:\HoSo_ThamDinh;Lưu trữ|E:\LuuTru"
 * Không có nhãn thì lấy tên thư mục làm nhãn.
 */
export function danhSachThuMucGoc(): ThuMucGoc[] {
  const raw = (process.env.THAM_DINH_ROOTS || '').trim()
  if (!raw) return []
  return raw
    .split(';')
    .map((phan) => phan.trim())
    .filter(Boolean)
    .map((phan, i) => {
      const viTri = phan.indexOf('|')
      const nhan = viTri > 0 ? phan.slice(0, viTri).trim() : ''
      const duongDan = (viTri > 0 ? phan.slice(viTri + 1) : phan).trim()
      return {
        id: `goc${i + 1}`,
        nhan: nhan || path.basename(duongDan) || duongDan,
        duongDan,
      }
    })
    .filter((g) => g.duongDan.length > 0)
}

/** Ký tự/dạng đường dẫn con bị từ chối thẳng, không cần chạm đĩa. */
function duongDanConHopLe(dc: string): string | null {
  if (dc === '') return null                       // rỗng = chính thư mục gốc, hợp lệ
  if (dc.length > 400) return 'Đường dẫn quá dài'
  if (dc.includes('\0')) return 'Đường dẫn chứa ký tự không hợp lệ'
  if (/^[\\/]{2}/.test(dc)) return 'Không chấp nhận đường dẫn mạng (UNC)'
  if (dc.includes('?') || dc.includes('*')) return 'Đường dẫn chứa ký tự đại diện'
  if (/^[A-Za-z]:/.test(dc)) return 'Chỉ nhận đường dẫn tương đối, không nhận ổ đĩa'
  if (dc.includes(':')) return 'Đường dẫn chứa dấu hai chấm (luồng dữ liệu phụ)'

  for (const doan of dc.split(/[\\/]+/)) {
    if (doan === '' || doan === '.') continue
    if (doan === '..') return 'Không được dùng ".." để đi ra khỏi thư mục gốc'
    // Windows tự cắt dấu chấm / khoảng trắng cuối tên -> lệch với chuỗi app kiểm tra
    if (/[. ]$/.test(doan)) return 'Tên thư mục không được kết thúc bằng dấu chấm hoặc khoảng trắng'
  }
  return null
}

export type KetQuaGiai =
  | { ok: true; duongDanThat: string; goc: ThuMucGoc }
  | { ok: false; loi: string }

/**
 * Giải { rootId, duongDanCon } thành đường dẫn thật đã kiểm chứng nằm trong gốc.
 * Kiểm cả junction/symlink ở TỪNG cấp, vì một thư mục con trong whitelist có thể
 * trỏ sang C:\Windows hoặc share mạng.
 */
export async function giaiDuongDan(rootId: string, duongDanCon: string): Promise<KetQuaGiai> {
  const gocs = danhSachThuMucGoc()
  if (gocs.length === 0) {
    return { ok: false, loi: 'Chưa cấu hình thư mục hồ sơ (THAM_DINH_ROOTS trong .env). Liên hệ quản trị viên.' }
  }
  const goc = gocs.find((g) => g.id === rootId)
  if (!goc) return { ok: false, loi: 'Thư mục gốc không hợp lệ' }

  const dc = (duongDanCon || '').trim().replace(/^[\\/]+/, '')
  const loiDinhDang = duongDanConHopLe(dc)
  if (loiDinhDang) return { ok: false, loi: loiDinhDang }

  let gocThat: string
  try {
    // realpathSync.native dung API cua Windows: chuan hoa ca ten 8.3 (HOSO_T~1)
    // va giai junction — dieu ma ban khong-native khong bao dam.
    gocThat = realpathSync.native(goc.duongDan)
  } catch {
    return {
      ok: false,
      loi: `Máy chủ không truy cập được thư mục gốc "${goc.duongDan}". Kiểm tra ổ đĩa/quyền truy cập của tiến trình ứng dụng.`,
    }
  }

  // Duyệt từng cấp, chặn junction/symlink ngay khi gặp
  let hienTai = gocThat
  for (const doan of dc.split(/[\\/]+/).filter((x) => x && x !== '.')) {
    const thu = path.join(hienTai, doan)
    try {
      const st = await lstat(thu)
      if (st.isSymbolicLink()) {
        return { ok: false, loi: `"${doan}" là liên kết (junction/symlink) — không được phép đi qua` }
      }
      if (!st.isDirectory()) {
        return { ok: false, loi: `"${doan}" không phải thư mục` }
      }
    } catch {
      return { ok: false, loi: `Không tìm thấy thư mục "${doan}"` }
    }
    hienTai = thu
  }

  let dichThat: string
  try {
    dichThat = realpathSync.native(hienTai)
  } catch {
    return { ok: false, loi: 'Không truy cập được thư mục đã chọn' }
  }

  if (!namTrong(gocThat, dichThat)) {
    return { ok: false, loi: 'Thư mục nằm ngoài phạm vi cho phép' }
  }
  return { ok: true, duongDanThat: dichThat, goc }
}

/**
 * Kiểm tra `dich` có nằm trong `goc` không — dùng path.relative thay vì startsWith.
 * So sánh không phân biệt hoa thường vì Windows không phân biệt.
 */
export function namTrong(goc: string, dich: string): boolean {
  const rel = path.relative(goc.toLowerCase(), dich.toLowerCase())
  if (rel === '') return true                       // chính nó
  if (path.isAbsolute(rel)) return false             // khác ổ đĩa
  return !rel.startsWith('..')
}
