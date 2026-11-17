/**
 * LÕI NGHIỆP VỤ thuần của module Nội dung AI: băm nội dung, lịch, cổng xuất bản, kênh, thử lại, quyền.
 * Không import CSDL/Next — để test được bằng node:test và để worker (.mjs) dùng chung quy tắc.
 */
import { createHash, randomInt } from 'node:crypto'
import { chuanHoa, NHAN_AI, NGAN_CACH_CHUOI, loiNhanAi, thongBaoLoiNhanAi } from './nhan-ai'

export * from './nhan-ai'

// ── Băm nội dung ───────────────────────────────────────────────────────────────
/** SHA-256 của tiêu đề + thân bài. Phê duyệt gắn với băm này: nội dung đổi 1 ký tự là phê duyệt hết khớp. */
export function bamNoiDung(tieuDe: string, noiDung: string): string {
  return createHash('sha256').update(chuanHoa(tieuDe) + '\n\u0000\n' + chuanHoa(noiDung), 'utf8').digest('hex')
}

// ── Lịch ───────────────────────────────────────────────────────────────────────
export const MUI_GIO_MAC_DINH = 'Asia/Ho_Chi_Minh'

function doLechPhut(utc: Date, muiGio: string): number {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: muiGio, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(utc)
  const g = (t: string) => Number(p.find((x) => x.type === t)!.value)
  const local = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'))
  return Math.round((local - utc.getTime()) / 60000)
}

/**
 * Đổi "ngày + giờ địa phương" sang thời điểm UTC để lưu (cột scheduled_at_utc).
 * VD ('2026-11-12', '08:30', 'Asia/Ho_Chi_Minh') → 2026-11-12T01:30:00.000Z.
 */
export function gioDiaPhuongSangUtc(ngay: string, gio: string, muiGio: string = MUI_GIO_MAC_DINH): Date {
  const m1 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay)
  const m2 = /^(\d{2}):(\d{2})$/.exec(gio)
  if (!m1 || !m2) throw new Error('Ngày phải dạng YYYY-MM-DD và giờ dạng HH:mm')
  const [y, mo, d, h, mi] = [m1[1], m1[2], m1[3], m2[1], m2[2]].map(Number)
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) throw new Error('Ngày giờ không hợp lệ')
  const gia = Date.UTC(y, mo - 1, d, h, mi)
  if (new Date(gia).getUTCDate() !== d) throw new Error('Ngày không tồn tại')
  // Hai vòng để đúng cả khi múi giờ có đổi giờ mùa (VN không có, nhưng không giả định).
  let utc = new Date(gia - doLechPhut(new Date(gia), muiGio) * 60000)
  utc = new Date(gia - doLechPhut(utc, muiGio) * 60000)
  return utc
}

// ── Phân loại dữ liệu & cổng xuất bản ─────────────────────────────────────────
export const PHAN_LOAI = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'] as const
export type PhanLoai = (typeof PHAN_LOAI)[number]

export type NguonTrich = { tieuDe: string; phamVi: string; tinhTrangHieuLuc: string; daXoa?: boolean }

export type DauVaoCong = {
  phanLoai: string
  bamPhienBan: string
  /** Quyết định MỚI NHẤT của đúng phiên bản sắp đăng (null = chưa có). */
  pheDuyet: { quyetDinh: string; bam: string; phienBanId: string } | null
  phienBanId: string
  nguon: NguonTrich[]
  doAiTao: boolean
  coTheGayNhamLan: boolean
  /** Văn bản thực sự sẽ đăng (biến thể kênh) — để kiểm có nhãn thông báo AI hay chưa. */
  noiDungSeDang: string
}

/**
 * CỔNG XUẤT BẢN — fail-closed: trả danh sách lý do chặn; rỗng mới được đăng.
 */
export function kiemTraCongXuatBan(d: DauVaoCong): string[] {
  const loi: string[] = []
  if (d.phanLoai !== 'PUBLIC') loi.push('Nội dung chưa được phân loại CÔNG KHAI (PUBLIC).')
  if (!d.pheDuyet) loi.push('Chưa có phê duyệt cho phiên bản này.')
  else {
    if (d.pheDuyet.quyetDinh !== 'APPROVED') loi.push('Phê duyệt mới nhất không phải "đã duyệt" (bị từ chối hoặc đã thu hồi).')
    if (d.pheDuyet.phienBanId !== d.phienBanId) loi.push('Phê duyệt thuộc phiên bản khác.')
    if (d.pheDuyet.bam !== d.bamPhienBan) loi.push('Nội dung đã thay đổi sau khi duyệt (mã băm không khớp).')
  }
  for (const n of d.nguon) {
    if (n.daXoa) loi.push(`Tài liệu nguồn đã bị gỡ khỏi kho: ${n.tieuDe}`)
    if (n.phamVi !== 'CONG_KHAI') loi.push(`Tài liệu nguồn không thuộc phạm vi công khai: ${n.tieuDe}`)
    if (n.tinhTrangHieuLuc !== 'con_hieu_luc') loi.push(`Tài liệu nguồn chưa xác nhận còn hiệu lực: ${n.tieuDe}`)
  }
  if (d.doAiTao && d.coTheGayNhamLan) {
    // Chuỗi nhiều bài (Threads): người đọc tiếp cận bài ĐẦU trước → thông báo phải nằm ở bài đầu.
    const l = loiNhanAi(d.noiDungSeDang.split(NGAN_CACH_CHUOI)[0])
    if (l) loi.push(thongBaoLoiNhanAi(l))
  }
  return loi
}

// ── Kênh ───────────────────────────────────────────────────────────────────────
export const KENH = ['facebook', 'linkedin', 'threads', 'website'] as const
export type Kenh = (typeof KENH)[number]

export type CauHinhKenh = { ten: string; gioiHanKyTu: number | null; daXacMinh: boolean; ghiChu: string }

/**
 * Giới hạn kênh là CẤU HÌNH, không phải sự thật cố định: daXacMinh=false nghĩa là số liệu lấy từ nguồn
 * bên thứ ba, phải đối chiếu tài liệu chính thức của nền tảng trước khi bật đăng tự động.
 */
export const CAU_HINH_KENH: Record<Kenh, CauHinhKenh> = {
  facebook: { ten: 'Facebook (Trang)', gioiHanKyTu: null, daXacMinh: false, ghiChu: 'Chưa đối chiếu giới hạn chính thức' },
  linkedin: { ten: 'LinkedIn', gioiHanKyTu: null, daXacMinh: false, ghiChu: 'Chưa đối chiếu giới hạn chính thức' },
  threads: { ten: 'Threads', gioiHanKyTu: 500, daXacMinh: false, ghiChu: '500 ký tự theo tài liệu bên thứ ba (11/11/2026)' },
  website: { ten: 'Website', gioiHanKyTu: null, daXacMinh: true, ghiChu: 'Không giới hạn' },
}

/** Miền hợp lệ của đường dẫn bài đã đăng, theo kênh. Website: tên miền riêng của đơn vị, chưa cấu hình → chỉ cần https. */
const MIEN_KENH: Record<Kenh, string[] | null> = {
  facebook: ['facebook.com', 'fb.com', 'fb.watch', 'fb.me'],
  linkedin: ['linkedin.com', 'lnkd.in'],
  threads: ['threads.net', 'threads.com'],
  website: null,
}

/** Chuẩn hoá + kiểm đường dẫn bài đã đăng cho một kênh. Trả chuỗi URL đã chuẩn hoá hoặc ném Error có thông báo. */
export function kiemTraUrlBaiDang(kenh: string, tho: unknown): string {
  const s = String(tho ?? '').trim()
  if (!/^https:\/\/[^\s]{4,500}$/i.test(s)) throw new Error('Cần đường dẫn https của bài đã đăng')
  let u: URL
  try { u = new URL(s) } catch { throw new Error('Cần đường dẫn https của bài đã đăng') }
  if (u.protocol !== 'https:' || u.username || u.password) throw new Error('Đường dẫn không được chứa tên đăng nhập/mật khẩu')
  // Tham số trông như thông tin xác thực (token, chữ ký…) sẽ bị chép vào nhật ký bất biến → từ chối, không chuẩn hoá lặng lẽ.
  // Khớp CẢ TÊN (không khớp chuỗi con: "postcode", "design" là hợp lệ), kiểm cả query lẫn fragment (#access_token=…).
  const TEN_XAC_THUC = /^(access_?token|refresh_?token|id_?token|auth_?token|token|api_?key|apikey|key|client_?secret|secret|password|passwd|pwd|sig|signature|auth|authorization|bearer|session|session_?id|sid|code)$/i
  const thamSo = [...u.searchParams.keys(), ...new URLSearchParams(u.hash.replace(/^#/, '').replace(/^[^=]*\?/, '')).keys()]
  for (const ten of thamSo) {
    if (TEN_XAC_THUC.test(ten)) throw new Error(`Đường dẫn có tham số "${ten}" giống thông tin xác thực — chỉ xoá tham số đó rồi nhập lại (giữ các tham số định danh bài)`)
  }
  const mien = MIEN_KENH[kenh as Kenh]
  if (mien === undefined) throw new Error('Kênh không hợp lệ')
  if (mien) {
    const h = u.hostname.toLowerCase().replace(/\.$/, '')
    if (!mien.some((m) => h === m || h.endsWith('.' + m))) throw new Error(`Đường dẫn phải thuộc ${mien.join(', ')} (kênh ${CAU_HINH_KENH[kenh as Kenh].ten})`)
  }
  return u.href
}


export function laKenh(s: string): s is Kenh {
  return (KENH as readonly string[]).includes(s)
}

function boMarkdown(s: string): string {
  return s
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)')
    .replace(/^\s*[-*]\s+/gm, '• ')
}

/** Cắt văn bản thành các đoạn ≤ gioiHan ký tự, ưu tiên ngắt ở cuối đoạn/câu/từ. */
export function chiaDoan(s: string, gioiHan: number): string[] {
  const kq: string[] = []
  let con = s.trim()
  while (con.length > gioiHan) {
    const khuc = con.slice(0, gioiHan + 1)
    let vt = Math.max(khuc.lastIndexOf('\n\n'), khuc.lastIndexOf('. ') + 1, khuc.lastIndexOf('\n'))
    if (vt < gioiHan * 0.4) vt = khuc.lastIndexOf(' ')
    if (vt <= 0) vt = gioiHan
    kq.push(con.slice(0, vt).trim())
    con = con.slice(vt).trim()
  }
  if (con) kq.push(con)
  return kq
}

/**
 * Chuyển thể THEO QUY TẮC (không gọi AI): bản nền an toàn, chạy được khi chưa cấu hình dịch vụ AI.
 * Người soạn chỉnh tay hoặc dùng AI viết lại sau; mọi bản đều phải qua duyệt.
 */
export function chuyenTheTheoQuyTac(kenh: Kenh, tieuDe: string, noiDung: string, themNhanAi: boolean, cauNhan: string = NHAN_AI): string {
  const than = chuanHoa(noiDung)
  // Thông báo AI đặt NGAY SAU tiêu đề: người đọc thấy trước khi đọc nội dung, và luôn nằm ở bài đầu của chuỗi.
  const nhan = themNhanAi ? `(${cauNhan})\n\n` : ''
  if (kenh === 'website') return `# ${chuanHoa(tieuDe)}\n\n${nhan}${than}`
  const phang = boMarkdown(than)
  if (kenh === 'threads') {
    const gh = CAU_HINH_KENH.threads.gioiHanKyTu!
    const doan = chiaDoan(`${chuanHoa(tieuDe)}\n\n${nhan}${phang}`, gh - 8)
    return doan.length === 1 ? doan[0] : doan.map((d, i) => `${d} (${i + 1}/${doan.length})`).join(NGAN_CACH_CHUOI)
  }
  return `${chuanHoa(tieuDe).toUpperCase()}\n\n${nhan}${phang}`
}

/** Lỗi định dạng của một biến thể theo cấu hình kênh (rỗng = hợp lệ). */
export function kiemTraBienThe(kenh: Kenh, noiDung: string): string[] {
  const loi: string[] = []
  if (!noiDung.trim()) loi.push('Nội dung trống.')
  const gh = CAU_HINH_KENH[kenh].gioiHanKyTu
  if (gh) {
    const doan = kenh === 'threads' ? noiDung.split(NGAN_CACH_CHUOI) : [noiDung]
    doan.forEach((d, i) => {
      if (d.length > gh) loi.push(`Đoạn ${i + 1} dài ${d.length} ký tự, vượt giới hạn ${gh} của ${CAU_HINH_KENH[kenh].ten}.`)
    })
  }
  return loi
}

// ── Thử lại ────────────────────────────────────────────────────────────────────
export const SO_LAN_THU_TOI_DA = 4

/** Thời gian chờ (ms) trước lần thử kế: luỹ thừa 2 từ 1 phút, trần 1 giờ, cộng jitter 0–20%. */
export function thoiGianCho(lanThu: number, ngauNhien: () => number = () => randomInt(0, 1000) / 1000): number {
  const co = Math.min(60_000 * 2 ** Math.max(0, lanThu - 1), 3_600_000)
  return Math.round(co * (1 + 0.2 * ngauNhien()))
}

export type LoaiLoi = 'TAM_THOI' | 'VINH_VIEN' | 'KHONG_RO'

/**
 * Phân loại lỗi đăng bài. KHONG_RO (timeout, mất kết nối sau khi đã gửi) → UNKNOWN_OUTCOME:
 * tuyệt đối không tự đăng lại vì bài có thể ĐÃ lên; phải đối soát trước.
 */
export function phanLoaiLoi(e: { ma?: string; httpStatus?: number; daGui?: boolean }): LoaiLoi {
  if (e.daGui && (e.ma === 'TIMEOUT' || e.ma === 'ECONNRESET' || !e.httpStatus)) return 'KHONG_RO'
  if (e.httpStatus === 429 || (e.httpStatus && e.httpStatus >= 500)) return e.daGui && e.httpStatus >= 500 ? 'KHONG_RO' : 'TAM_THOI'
  if (e.ma === 'TIMEOUT' || e.ma === 'ECONNRESET' || e.ma === 'ECONNREFUSED') return 'TAM_THOI'
  return 'VINH_VIEN'
}

/** Trạng thái lịch kế tiếp sau một lần đăng lỗi. */
export function trangThaiSauLoi(loai: LoaiLoi, soLanDaThu: number): 'RETRY_PENDING' | 'FAILED' | 'UNKNOWN_OUTCOME' {
  if (loai === 'KHONG_RO') return 'UNKNOWN_OUTCOME'
  if (loai === 'TAM_THOI' && soLanDaThu < SO_LAN_THU_TOI_DA) return 'RETRY_PENDING'
  return 'FAILED'
}

// ── Quyền & cờ tính năng ──────────────────────────────────────────────────────
/** Cờ tắt/bật toàn module. Mặc định TẮT: chỉ bật khi AI_CONTENT_ENABLED đúng bằng '1'. */
export function aiContentBat(env: Record<string, string | undefined> = process.env): boolean {
  return env.AI_CONTENT_ENABLED?.trim() === '1'
}

export type NguoiDungToiThieu = { id: string; laAdmin: boolean; laVanPhong: boolean; laLanhDao: boolean }

export function duocSoan(u: NguoiDungToiThieu): boolean {
  return u.laAdmin || u.laVanPhong || u.laLanhDao
}

/** Người duyệt phải là admin/lãnh đạo VÀ khác người tạo phiên bản (nguyên tắc bốn mắt). */
export function lyDoKhongDuocDuyet(u: NguoiDungToiThieu, nguoiTaoPhienBanId: string): string | null {
  if (!(u.laAdmin || u.laLanhDao)) return 'Chỉ lãnh đạo Sở hoặc quản trị viên được duyệt nội dung công khai.'
  if (u.id === nguoiTaoPhienBanId) return 'Người duyệt phải khác người soạn phiên bản này.'
  return null
}

/**
 * Chống giả mạo yêu cầu chéo trang cho thao tác ghi: Origin (nếu trình duyệt gửi) phải trỏ về một host của hệ thống.
 * Không có Origin (công cụ dòng lệnh, cùng nguồn kiểu cũ) → cho qua vì cookie phiên đã đặt SameSite=Lax.
 * Origin không phân tích được (vd "null" từ trang sandbox) → từ chối.
 */
export function nguonGocHopLe(origin: string | null | undefined, hostHopLe: (string | null | undefined)[]): boolean {
  if (!origin) return true
  let host: string
  try { host = new URL(origin).host.toLowerCase() } catch { return false }
  return hostHopLe.some((h) => !!h && h.toLowerCase() === host)
}
