import 'server-only'
import { readFile, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import path from 'node:path'

/**
 * NẠP GÓI DỮ LIỆU "BẢNG TRA" CỦA PHẦN MỀM DuToanAI (kho phát hành C:\PhatHanh\dutoanai).
 *
 * Nguyên tắc: KHÔNG chép lại định mức/tỷ lệ vào mã nguồn — DuToanAI đã trích từ bản
 * ký số của Bộ Xây dựng (CV 9947/BXD-VPB, TT 36/2026, 37/2026, 38/2026, 40/2026) và đã
 * có quy trình cập nhật riêng. Ứng dụng này chỉ ĐỌC gói đó để đối chiếu tỷ lệ chi phí
 * trong dự toán trình thẩm định. Gói đổi phiên bản → kết quả đối chiếu tự đổi theo.
 *
 * An toàn: gói phải khớp SHA-512 ghi trong du-lieu-danh-muc.json. Không khớp → coi như KHÔNG có
 * dữ liệu, không dùng.
 *
 * ⚠️ GIỚI HẠN ĐÃ BIẾT (Codex rà chéo 24/9/26): SHA-512 chỉ bảo đảm gói .goi.gz KHỚP với entry
 * "tenFile"/"sha512" đang ghi TRONG CHÍNH tệp danh mục — KHÔNG xác thực chữ ký "# chu-ky-dutoanai"
 * ở cuối tệp (chưa có public key DuToanAI để verify, nên KHÔNG giả vờ đã kiểm chứng). Nghĩa là
 * nếu ai đó có quyền ghi vào C:\PhatHanh\dutoanai (chỉ script đồng bộ máy chủ — dong-bo-dutoanai.ps1
 * — và admin mới ghi được) sửa cả danh mục lẫn gói kèm sha mới thì vẫn qua được. Chấp nhận được vì
 * thư mục này do máy chủ ứng dụng (Administrator) kiểm soát hoàn toàn, không phải nguồn bên ngoài
 * ghi trực tiếp được — nhưng KHÔNG được coi đây là "đã xác thực nguồn gốc Bộ Xây dựng".
 */

export type DongTyLe = { quyMo: number; tyLe: number }
/** bang-ty-le.json: mã bảng → tên loại công trình → dãy bậc quy mô (tỷ đồng) tăng dần. */
export type BangTyLe = Record<string, Record<string, DongTyLe[]>>

export type DuLieuDuToanAI = {
  coDuLieu: boolean
  /** Lý do khi không có dữ liệu (thiếu thư mục, sai chữ ký...). */
  ghiChu: string
  ma?: string
  phienBan?: string
  ngay?: string
  vanBan?: string
  bangTyLe?: BangTyLe
}

const THU_MUC_MAC_DINH = 'C:\\PhatHanh\\dutoanai'

let cache: { key: string; data: DuLieuDuToanAI } | null = null

function thuMucGoi(): string {
  return (process.env.DUTOANAI_DATA_DIR || THU_MUC_MAC_DINH).trim()
}

/** du-lieu-danh-muc.json có dòng chữ ký "# chu-ky-dutoanai: ..." ở cuối — phải bỏ trước khi parse. */
function parseDanhMuc(raw: string): { goi: DanhMucGoi[] } {
  const sach = raw.split(/\r?\n/).filter((d) => !d.trimStart().startsWith('#')).join('\n')
  return JSON.parse(sach)
}

type DanhMucGoi = {
  ma: string; ten: string; nhom: string; vanBan?: string; phienBan: string; ngay: string
  tenFile: string; kichThuoc: number; sha512: string
}

function sha512Base64(buf: Buffer): string {
  return createHash('sha512').update(buf).digest('base64')
}

/** Nạp (có cache theo mtime tệp danh mục) gói bảng tra. Không bao giờ ném lỗi. */
export async function napDuLieuDuToanAI(): Promise<DuLieuDuToanAI> {
  const dir = thuMucGoi()
  const tepDanhMuc = path.join(dir, 'du-lieu-danh-muc.json')
  let mtime = 0
  try { mtime = (await stat(tepDanhMuc)).mtimeMs } catch {
    return { coDuLieu: false, ghiChu: `Không thấy kho DuToanAI tại ${dir} (đặt DUTOANAI_DATA_DIR nếu để nơi khác).` }
  }
  const key = `${dir}|${mtime}`
  if (cache && cache.key === key) return cache.data

  let data: DuLieuDuToanAI
  try {
    const dm = parseDanhMuc(await readFile(tepDanhMuc, 'utf8'))
    const goi = (dm.goi || []).find((g) => g.nhom === 'bang-tra')
    if (!goi) {
      data = { coDuLieu: false, ghiChu: 'Danh mục DuToanAI không có gói nhóm "bang-tra".' }
    } else {
      const buf = await readFile(path.join(dir, goi.tenFile))
      if (sha512Base64(buf) !== goi.sha512) {
        data = { coDuLieu: false, ghiChu: `Gói ${goi.tenFile} không khớp SHA-512 trong danh mục — không dùng.` }
      } else {
        // Giới hạn kích thước sau giải nén — phòng gói bất thường làm nổ bộ nhớ trên máy 6GB RAM.
        const noiDung = JSON.parse(gunzipSync(buf, { maxOutputLength: 64 * 1024 * 1024 }).toString('utf8')) as { ma: string; phienBan: string; tep: Record<string, unknown> }
        const bang = noiDung.tep?.['db/bang-ty-le.json'] as BangTyLe | undefined
        if (!bang || typeof bang !== 'object') {
          data = { coDuLieu: false, ghiChu: 'Gói bảng tra không có db/bang-ty-le.json.' }
        } else {
          data = {
            coDuLieu: true, ghiChu: '',
            ma: goi.ma, phienBan: goi.phienBan, ngay: goi.ngay, vanBan: goi.vanBan, bangTyLe: bang,
          }
        }
      }
    }
  } catch (e) {
    data = { coDuLieu: false, ghiChu: `Lỗi đọc gói DuToanAI: ${e instanceof Error ? e.message : String(e)}` }
  }
  cache = { key, data }
  return data
}

/**
 * Tra tỷ lệ (%) theo bậc quy mô: bậc là "≤ quyMo" — lấy dòng đầu tiên có quyMo >= x.
 * Trả null nếu không có bảng/loại.
 */
export function traTyLe(bang: BangTyLe | undefined, maBang: string, loai: string, quyMoTyDong: number): { tyLe: number; bac: number } | null {
  const ds = bang?.[maBang]?.[loai]
  if (!ds || ds.length === 0) return null
  const sorted = [...ds].sort((a, b) => a.quyMo - b.quyMo)
  const dong = sorted.find((d) => quyMoTyDong <= d.quyMo) ?? sorted[sorted.length - 1]
  return { tyLe: dong.tyLe, bac: dong.quyMo }
}
