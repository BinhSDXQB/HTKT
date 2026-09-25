import 'server-only'
import { giaiDuongDan } from './duong-dan'
import { giaiPhien } from './phien-tai-len'

/**
 * Nguồn hồ sơ dự án cho kiểm kê / hỏi đáp: cán bộ TỰ CHỌN theo từng dự án, một trong hai:
 *   - phienId: thư mục đã tải lên từ máy cán bộ (chỉ chủ phiên truy cập được)
 *   - rootId + duongDanCon: thư mục dự án trong kho máy chủ (whitelist THAM_DINH_ROOTS)
 */
export type NguonHoSo = { phienId?: string; rootId?: string; duongDanCon?: string }

export type KetQuaNguon =
  | { ok: true; duongDanThat: string; nhan: string }
  | { ok: false; loi: string }

export async function giaiNguonHoSo(n: NguonHoSo, userId: string): Promise<KetQuaNguon> {
  if (n.phienId) {
    const p = await giaiPhien(n.phienId, userId)
    return p.ok ? { ok: true, duongDanThat: p.duongDanThat, nhan: p.tenThuMuc } : p
  }
  if (!n.rootId) return { ok: false, loi: 'Chưa chọn thư mục hồ sơ dự án' }
  // Gốc kho chứa nhiều dự án — bắt buộc chọn thư mục của MỘT dự án (quét cả kho: chậm, lẫn hồ sơ).
  if (!(n.duongDanCon ?? '').replace(/[\\/.\s]/g, '')) return { ok: false, loi: 'Hãy đi vào thư mục của dự án cụ thể, không dùng thư mục gốc của kho' }
  const g = await giaiDuongDan(n.rootId, n.duongDanCon ?? '')
  if (!g.ok) return g
  const cuoi = (n.duongDanCon ?? '').split(/[\\/]/).filter(Boolean).pop()
  return { ok: true, duongDanThat: g.duongDanThat, nhan: cuoi ? `${g.goc.nhan} › ${cuoi}` : g.goc.nhan }
}
