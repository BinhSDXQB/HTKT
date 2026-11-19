'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { chuanNam } from '@/lib/danh-gia-nam/may-chu'
import { luuBieuMauCaNhan, taoHoSoTapThe, luuTapThe, chuyenBuocTapThe, luuBienBan, chotBienBan, moLaiBienBan, type PhanBieuMau } from '@/lib/danh-gia-nam/may-chu-bieu-mau'

// Form nhập theo biểu mẫu. Kiểm quyền ở lib/danh-gia-nam/may-chu-bieu-mau.ts (không tin trường ẩn).
const s = (f: FormData, k: string) => String(f.get(k) ?? '')
const veCaNhan = (canBoId: string, nam: number, ma: string, loi?: string, tb?: string): never => {
  const q = new URLSearchParams({ nam: String(nam) }); if (loi) q.set('loi', loi); else if (tb) q.set('tb', tb)
  revalidatePath(`/dashboard/van-phong-so/ho-so/${canBoId}/danh-gia-nam/mau/${ma}`)
  redirect(`/dashboard/van-phong-so/ho-so/${canBoId}/danh-gia-nam/mau/${ma}?${q.toString()}`)
}
const PHAN: readonly PhanBieuMau[] = ['phanA', 'tuNhanMuc', 'm04', 'bangIII', 'yKienDonViCauThanh', 'm03', 'hopTapThe']

/** Gom các ô dòng Mẫu 04 dạng "A.3.soLuong" thành mảng theo nhóm. */
function gomDong(f: FormData): { A: Record<string, unknown>[]; B: Record<string, unknown>[] } {
  const ra = { A: [] as Record<string, unknown>[], B: [] as Record<string, unknown>[] }
  for (const [k, v] of f.entries()) {
    const m = k.match(/^([AB])\.(\d{1,3})\.(nhiemVu|congViec|sanPham|hanHoanThanh|ngayHoanThanh|diemDanhMuc|soLuong|hoanThanhThucTe|soLanChinhSua|soNgayCham)$/)
    if (!m) continue
    const nhom = m[1] as 'A' | 'B'; const i = Number(m[2])
    ra[nhom][i] ??= {}; ra[nhom][i][m[3]] = String(v)
  }
  return { A: ra.A.filter(Boolean), B: ra.B.filter(Boolean) }
}

export async function luuMauCaNhanAction(f: FormData) {
  const u = await requireAuth()
  const canBoId = s(f, 'canBoId'), nam = chuanNam(s(f, 'nam')) ?? 2026, ma = s(f, 'ma'), phan = s(f, 'phan') as PhanBieuMau
  if (!PHAN.includes(phan)) veCaNhan(canBoId, nam, ma, 'Phần biểu mẫu không hợp lệ.')
  const raw: Record<string, unknown> & { dong?: ReturnType<typeof gomDong> } = Object.fromEntries(f.entries())
  if (phan === 'm04') raw.dong = gomDong(f)
  const r = await luuBieuMauCaNhan(u, s(f, 'reviewId'), phan, raw)
  veCaNhan(canBoId, nam, ma, r.ok ? undefined : r.loi, 'Đã lưu.')
}

const veTapThe = (phong: string, nam: number, loi?: string, tb?: string): never => {
  const q = new URLSearchParams({ phong, nam: String(nam) }); if (loi) q.set('loi', loi); else if (tb) q.set('tb', tb)
  revalidatePath('/dashboard/van-phong-so/danh-gia/tong-hop/mau-01')
  redirect(`/dashboard/van-phong-so/danh-gia/tong-hop/mau-01?${q.toString()}`)
}

export async function taoTapTheAction(f: FormData) {
  const u = await requireAuth(); const phong = s(f, 'phong'), nam = chuanNam(s(f, 'nam')) ?? 2026
  const r = await taoHoSoTapThe(u, phong, nam); veTapThe(phong, nam, r.ok ? undefined : r.loi, 'Đã lập báo cáo tập thể.')
}
export async function luuTapTheAction(f: FormData) {
  const u = await requireAuth(); const phong = s(f, 'phong'), nam = chuanNam(s(f, 'nam')) ?? 2026
  const phan = s(f, 'phan') as 'phanA' | 'diem' | 'bangIII' | 'mucTuDeXuat'
  if (!['phanA', 'diem', 'bangIII', 'mucTuDeXuat'].includes(phan)) veTapThe(phong, nam, 'Phần không hợp lệ.')
  const r = await luuTapThe(u, phong, nam, phan, Object.fromEntries(f.entries())); veTapThe(phong, nam, r.ok ? undefined : r.loi, 'Đã lưu.')
}
export async function buocTapTheAction(f: FormData) {
  const u = await requireAuth(); const phong = s(f, 'phong'), nam = chuanNam(s(f, 'nam')) ?? 2026
  const t = s(f, 'thaoTac') as 'trinh' | 'duyet' | 'luu' | 'traVe'
  if (!['trinh', 'duyet', 'luu', 'traVe'].includes(t)) veTapThe(phong, nam, 'Thao tác không hợp lệ.')
  const r = await chuyenBuocTapThe(u, phong, nam, t, s(f, 'muc') || undefined, s(f, 'lyDo') || undefined)
  veTapThe(phong, nam, r.ok ? undefined : r.loi, 'Đã cập nhật.')
}

/** Kết quả họp đánh giá của tập thể phòng (ghi ở trang hồ sơ đánh giá năm). */
export async function luuHopTapTheAction(f: FormData) {
  const u = await requireAuth()
  const canBoId = s(f, 'canBoId'), nam = chuanNam(s(f, 'nam')) ?? 2026
  const r = await luuBieuMauCaNhan(u, s(f, 'reviewId'), 'hopTapThe', Object.fromEntries(f.entries()))
  const q = new URLSearchParams({ nam: String(nam), loai: 'CBCCVC' }); if (!r.ok) q.set('loi', r.loi); else q.set('tb', 'Đã lưu kết quả họp đánh giá của tập thể phòng.')
  revalidatePath(`/dashboard/van-phong-so/ho-so/${canBoId}/danh-gia-nam`)
  redirect(`/dashboard/van-phong-so/ho-so/${canBoId}/danh-gia-nam?${q.toString()}`)
}

/** Biên bản cuộc họp nhận xét, đánh giá cuối năm của phòng/đơn vị. */
export async function luuBienBanAction(f: FormData) {
  const u = await requireAuth(); const phong = s(f, 'phong'), nam = chuanNam(s(f, 'nam')) ?? 2026
  const r = await luuBienBan(u, phong, nam, Object.fromEntries(f.entries()))
  const q = new URLSearchParams({ phong, nam: String(nam) }); if (!r.ok) q.set('loi', r.loi); else q.set('tb', 'Đã lưu biên bản.')
  revalidatePath('/dashboard/van-phong-so/danh-gia/bien-ban')
  redirect(`/dashboard/van-phong-so/danh-gia/bien-ban?${q.toString()}`)
}

export async function chotBienBanAction(f: FormData) {
  const u = await requireAuth(); const phong = s(f, 'phong'), nam = chuanNam(s(f, 'nam')) ?? 2026
  const r = await chotBienBan(u, phong, nam, s(f, 'phienBan'))
  const q = new URLSearchParams({ phong, nam: String(nam) }); if (!r.ok) q.set('loi', r.loi); else q.set('tb', 'Đã chốt biên bản. Các hồ sơ cá nhân trình theo bản này.')
  revalidatePath('/dashboard/van-phong-so/danh-gia/bien-ban')
  redirect(`/dashboard/van-phong-so/danh-gia/bien-ban?${q.toString()}`)
}

export async function moLaiBienBanAction(f: FormData) {
  const u = await requireAuth(); const phong = s(f, 'phong'), nam = chuanNam(s(f, 'nam')) ?? 2026
  const r = await moLaiBienBan(u, phong, nam, s(f, 'lyDo'))
  const q = new URLSearchParams({ phong, nam: String(nam) }); if (!r.ok) q.set('loi', r.loi); else q.set('tb', 'Đã mở lại biên bản; sửa xong phải chốt lại.')
  revalidatePath('/dashboard/van-phong-so/danh-gia/bien-ban')
  redirect(`/dashboard/van-phong-so/danh-gia/bien-ban?${q.toString()}`)
}
