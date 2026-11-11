import { routeAi, dbAi, docJson } from '@/lib/ai-content/may-chu'
import {
  chiTietBai, suaBai, luuBienThe, taoBienTheTheoQuyTac, guiDuyet, quyetDinhDuyet, thuHoiDuyet, datLich, tacGiaTrongPhamViDuyet, LoiNghiepVu,
} from '@/lib/ai-content/kho'
import { lyDoKhongDuocDuyet, CAU_HINH_KENH, NGAN_CACH_CHUOI, NHAN_AI } from '@/lib/ai-content/nghiep-vu'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type P = { id: string }

/** GET — chi tiết bài + phiên bản hiện hành, biến thể, nguồn, lịch sử duyệt, lịch đăng. */
export const GET = routeAi<P>(async ({ params, nd }) => {
  const ct = await chiTietBai(dbAi, params.id)
  const tacGia = tacGiaTrongPhamViDuyet(ct.bai, ct.phienBan, ct.bienThe)
  const lyDoKhongDuyet = tacGia.map((t) => lyDoKhongDuocDuyet(nd, t)).find(Boolean) ?? null
  return {
    ...ct, cauHinhKenh: CAU_HINH_KENH, nganCach: NGAN_CACH_CHUOI, nhanAi: NHAN_AI,
    quyen: { duyet: !lyDoKhongDuyet, lyDoKhongDuyet, thuHoi: nd.laAdmin || nd.laLanhDao },
  }
})

/** PUT — sửa bài (nội dung đổi → phiên bản mới; luôn về bản nháp, huỷ lịch chưa đăng). */
export const PUT = routeAi<P>(async ({ req, params, nd }) => {
  const b = await docJson(req)
  return suaBai(dbAi, nd, params.id, {
    tieuDe: String(b.tieuDe ?? ''), noiDung: String(b.noiDung ?? ''),
    phanLoai: b.phanLoai ? String(b.phanLoai) : undefined,
    doAiTao: b.doAiTao === true, coTheGayNhamLan: b.coTheGayNhamLan === true,
    nguonIds: Array.isArray(b.nguonIds) ? b.nguonIds.map(String) : [],
  })
})

/**
 * POST — hành động trên bài. Body { loai, ... }:
 *  bien_the {kenh, noiDung} · bien_the_tu_dong {kenh[]} · gui_duyet · duyet {bamDangXem, ghiChu?} · tu_choi {bamDangXem, ghiChu?}
 *  thu_hoi {ghiChu?} · dat_lich {kenh, ngay, gio, adapter?}
 * Người thực hiện luôn lấy từ phiên đăng nhập phía máy chủ, không nhận từ body.
 */
export const POST = routeAi<P>(async ({ req, params, nd }) => {
  const b = await docJson(req)
  const ghiChu = b.ghiChu ? String(b.ghiChu) : undefined
  switch (b.loai) {
    case 'bien_the': return luuBienThe(dbAi, nd, params.id, String(b.kenh ?? ''), String(b.noiDung ?? ''))
    case 'bien_the_tu_dong':
      return taoBienTheTheoQuyTac(dbAi, nd, params.id, Array.isArray(b.kenh) ? b.kenh.map(String).slice(0, 4) : [])
    case 'gui_duyet': return guiDuyet(dbAi, nd, params.id)
    // bamDangXem: băm của bản người duyệt đang thấy trên màn hình — lệch với CSDL thì từ chối (409)
    case 'duyet': return quyetDinhDuyet(dbAi, nd, params.id, 'APPROVED', String(b.bamDangXem ?? ''), ghiChu)
    case 'tu_choi': return quyetDinhDuyet(dbAi, nd, params.id, 'REJECTED', String(b.bamDangXem ?? ''), ghiChu)
    case 'thu_hoi': return thuHoiDuyet(dbAi, nd, params.id, ghiChu)
    case 'dat_lich':
      return datLich(dbAi, nd, params.id, {
        kenh: String(b.kenh ?? ''), ngay: String(b.ngay ?? ''), gio: String(b.gio ?? ''),
        adapter: b.adapter ? String(b.adapter) : undefined,
      })
    default: throw new LoiNghiepVu(400, 'Hành động không hợp lệ')
  }
})
