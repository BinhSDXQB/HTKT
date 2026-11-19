// Đọc thành phần triệu tập và biên bản họp đánh giá cuối năm (không phụ thuộc may-chu.ts để tránh vòng import).
// Biên bản lưu trong office_year_dept_reviews."bieuMau"->'bienBan' (một biên bản / phòng / năm).
import 'server-only'
import { db } from '@/lib/db'
import type { HopTapThe } from './bieu-mau-du-lieu'
import { kiemTraBienBan, kiemTraTrinhTheoBienBan, type BienBanHop, type LoaiCuocHop, type NguoiTrieuTap, type ViPhamBienBan, type YKienChot } from './bien-ban-hop'

const LOAI_DON_VI_CAU_THANH = ['VAN_PHONG', 'PHONG', 'BAN', 'DON_VI_TRUC_THUOC']
const chon = { id: true, hoTen: true, chucVu: true, toChucId: true, chucDanh: { select: { capQuanLy: true } } } as const
type NguoiDb = { id: string; hoTen: string; chucVu: string | null; toChucId: string | null; chucDanh: { capQuanLy: number } | null }
const capCua = (x: NguoiDb) => x.chucDanh?.capQuanLy ?? 9
const theoCap = (a: NguoiDb, b: NguoiDb) => capCua(a) - capCua(b) || a.hoTen.localeCompare(b.hoTen, 'vi')

/**
 * Thành phần triệu tập theo quy định, tính ĐỘNG từ hồ sơ cán bộ (toChucId, chức danh) — không lưu cờ tay.
 * - Phòng/văn phòng thuộc Sở; đơn vị sự nghiệp KHÔNG có đơn vị cấu thành: toàn thể nhân sự đang công tác.
 * - LANH_DAO_SO: người thuộc đơn vị lãnh đạo Sở + Trưởng (cấp 3) các phòng/đơn vị cùng Sở. Không xác định được Sở (thiếu đơn vị cha) → null.
 * - Đơn vị sự nghiệp CÓ đơn vị cấu thành (con đang hoạt động): lãnh đạo đơn vị (nhân sự trực tiếp của đơn vị) + người đứng đầu
 *   (chức danh cao nhất, tối đa cấp 4) của từng đơn vị cấu thành. Đại diện cấp ủy / tổ chức chính trị - xã hội ghi tay trên biên bản.
 */
export async function thanhPhanTrieuTap(toChucId: string): Promise<{ ten: string; loai: LoaiCuocHop; ds: NguoiTrieuTap[]; ghiChu?: string } | null> {
  const tc = await db.toChuc.findUnique({ where: { id: toChucId }, select: { ten: true, loai: true, parentId: true } })
  if (!tc) return null
  const truc = (await db.canBo.findMany({ where: { toChucId, trangThai: 'DANG_CONG_TAC' }, select: chon })).sort(theoCap)
  const thanhVien = (xs: NguoiDb[], vaiTro: NguoiTrieuTap['vaiTro']) => xs.map((x) => ({ canBoId: x.id, hoTen: x.hoTen, chucVu: x.chucVu, vaiTro }))

  if (tc.loai === 'LANH_DAO_SO') {
    if (!tc.parentId) return { ten: tc.ten, loai: 'LANH_DAO_SO', ds: thanhVien(truc, 'LANH_DAO'), ghiChu: 'Không xác định được Sở (đơn vị lãnh đạo Sở chưa gắn đơn vị cha) nên chưa lấy được người đứng đầu các phòng, đơn vị.' }
    const truong = await db.canBo.findMany({
      where: { trangThai: 'DANG_CONG_TAC', chucDanh: { is: { capQuanLy: 3 } }, toChuc: { is: { isActive: true, parentId: tc.parentId, loai: { in: LOAI_DON_VI_CAU_THANH as never } } } },
      select: { ...chon, toChuc: { select: { ten: true, thuTu: true } } },
    })
    truong.sort((a, b) => (a.toChuc?.thuTu ?? 0) - (b.toChuc?.thuTu ?? 0) || a.hoTen.localeCompare(b.hoTen, 'vi'))
    return {
      ten: tc.ten, loai: 'LANH_DAO_SO',
      ds: [...thanhVien(truc, 'LANH_DAO'), ...truong.filter((x) => !truc.some((l) => l.id === x.id))
        .map((x) => ({ canBoId: x.id, hoTen: x.hoTen, chucVu: [x.chucVu, x.toChuc?.ten].filter(Boolean).join(', ') || null, vaiTro: 'TRUONG_DON_VI' as const }))],
    }
  }

  if (tc.loai === 'DON_VI_TRUC_THUOC') {
    const con = await db.toChuc.findMany({ where: { parentId: toChucId, isActive: true }, select: { id: true, ten: true, thuTu: true }, orderBy: { thuTu: 'asc' } })
    if (con.length) {
      const nsCon = await db.canBo.findMany({ where: { toChucId: { in: con.map((c) => c.id) }, trangThai: 'DANG_CONG_TAC' }, select: chon })
      const dauCon: NguoiTrieuTap[] = []
      for (const c of con) {
        const ns = nsCon.filter((x) => x.toChucId === c.id)
        const capMin = Math.min(...ns.map(capCua))
        if (!ns.length || capMin > 4) continue
        for (const x of ns.filter((n) => capCua(n) === capMin).sort(theoCap)) dauCon.push({ canBoId: x.id, hoTen: x.hoTen, chucVu: [x.chucVu, c.ten].filter(Boolean).join(', ') || null, vaiTro: 'TRUONG_DON_VI' })
      }
      return { ten: tc.ten, loai: 'LANH_DAO_DON_VI', ds: [...thanhVien(truc, 'LANH_DAO'), ...dauCon],
        ghiChu: 'Đơn vị có đơn vị cấu thành: biên bản này dùng để đánh giá lãnh đạo đơn vị; viên chức thuộc đơn vị cấu thành họp tại đơn vị cấu thành của mình.' }
    }
  }
  return { ten: tc.ten, loai: 'PHONG', ds: thanhVien(truc, 'THANH_VIEN') }
}

export async function layBienBan(toChucId: string, nam: number): Promise<BienBanHop | null> {
  const r = await db.$queryRaw<{ bb: BienBanHop | null }[]>`select "bieuMau"->'bienBan' bb from office_year_dept_reviews where "toChucId" = ${toChucId} and nam = ${nam}`
  const bb = r[0]?.bb
  return bb && Array.isArray(bb.thanhVien) ? bb : null
}

/** Kiểm tra biên bản của phòng/đơn vị, so với thành phần triệu tập hiện tại và những người có hồ sơ đánh giá năm đó. */
export async function kiemTraBienBanPhong(toChucId: string | null, nam: number): Promise<{ bb: BienBanHop | null; viPham: ViPhamBienBan[] }> {
  if (!toChucId) return { bb: null, viPham: [{ mucDo: 'LOI', thongDiep: 'Hồ sơ chưa gắn phòng/đơn vị nên không xác định được cuộc họp.' }] }
  const bb = await layBienBan(toChucId, nam)
  const tp = await thanhPhanTrieuTap(toChucId)
  const dg = await db.$queryRaw<{ canBoId: string }[]>`select "canBoId" from office_year_reviews where nam = ${nam} and "loaiHoSo" = 'CBCCVC' and "toChucId" = ${toChucId}`
  return { bb, viPham: kiemTraBienBan(bb, tp?.ds ?? [], dg.map((x) => x.canBoId)) }
}

/** Điều kiện trình của MỘT hồ sơ theo biên bản đã chốt của đơn vị ghi trên hồ sơ. Trả kèm phiên bản để khoá lại trong giao dịch. */
export async function kiemTraTrinh(toChucId: string | null, nam: number, canBoId: string): Promise<{ loi: ViPhamBienBan[]; phienBan: string | null }> {
  if (!toChucId) return { loi: [{ mucDo: 'LOI', thongDiep: 'Hồ sơ chưa gắn phòng/đơn vị nên không xác định được cuộc họp.' }], phienBan: null }
  const bb = await layBienBan(toChucId, nam)
  const tp = await thanhPhanTrieuTap(toChucId)
  return { loi: kiemTraTrinhTheoBienBan(bb, tp?.ds ?? [], canBoId), phienBan: bb?.phienBan ?? null }
}

/** Người được nhận xét tại cuộc họp (có hồ sơ CBCCVC năm đó thuộc phòng) — KHÔNG đọc thông tin Đảng, CCCD, lương. */
export async function nguoiDuocDanhGia(toChucId: string, nam: number): Promise<{ canBoId: string; hoTen: string; chucVu: string | null; tongDiem: number | null; tuNhanMuc: string | null; hop: HopTapThe | null }[]> {
  return db.$queryRaw`
    select r."canBoId", cb."hoTen", cb."chucVu", r."tongDiem"::float8 "tongDiem", r."bieuMau"->>'tuNhanMuc' "tuNhanMuc", r."bieuMau"->'hopTapThe' hop
    from office_year_reviews r join can_bo cb on cb.id = r."canBoId" left join chuc_danh cd on cd.id = cb."chucDanhId"
    where r.nam = ${nam} and r."loaiHoSo" = 'CBCCVC' and r."toChucId" = ${toChucId}
    order by cd."capQuanLy" nulls last, cb."hoTen"`
}

/** Ảnh chụp ý kiến từng người để đưa vào bản chốt (Word xuất theo bản chốt, không đọc lại hồ sơ sống). */
export async function chupYKien(toChucId: string, nam: number): Promise<YKienChot[]> {
  return (await nguoiDuocDanhGia(toChucId, nam)).map((n) => ({
    canBoId: n.canBoId, hoTen: n.hoTen, chucVu: n.chucVu, tongDiem: n.tongDiem, tuNhanMuc: n.tuNhanMuc,
    yKien: n.hop?.yKien?.trim() || null, bieuQuyet: (n.hop?.bieuQuyet as YKienChot['bieuQuyet']) ?? null, mucTapTheDeXuat: n.hop?.mucTapTheDeXuat ?? null,
  }))
}
