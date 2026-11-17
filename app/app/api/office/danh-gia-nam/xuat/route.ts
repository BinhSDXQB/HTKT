import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { MODULES } from '@/lib/permissions'
import { chuanNam, duLieuXuatCaNhan, kiemTraBang, tongHopTheoPhong, duocXemTongHopPhong } from '@/lib/danh-gia-nam/may-chu'
import { buildMauCaNhan, buildMau03, buildMau01, buildMau04 } from '@/lib/danh-gia-nam/xuat-mau'

// Xuất biểu mẫu đánh giá cuối năm: ?reviewId=&mau=2A|2B|2C|03|04  hoặc  ?phong=<toChucId>&nam=&mau=01
// Quyền theo từng hồ sơ (xem lib/danh-gia-nam/quyen.ts); mẫu cá nhân phải đúng đối tượng (mauApDung của hồ sơ).
// Mẫu 05, 06, 07, 4B, 6C, 6F1–6F4 chưa xuất: xem lib/danh-gia-nam/mau-bieu.ts.
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function tep(buf: Buffer, ten: string, mime: string) {
  return new NextResponse(new Uint8Array(buf), { headers: { 'Content-Type': mime, 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(ten)}` } })
}
const khongDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '')

export async function GET(req: NextRequest) {
  let user
  try { user = await requireAuth() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!(await kiemTraBang())) return NextResponse.json({ error: 'Chưa áp migration 058' }, { status: 503 })
  const q = req.nextUrl.searchParams
  const mau = q.get('mau') ?? ''

  if (mau === '01') {
    const phong = q.get('phong') ?? ''; const nam = chuanNam(q.get('nam')) ?? 2026
    if (!phong || !duocXemTongHopPhong(user, phong)) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
    const d = await tongHopTheoPhong(phong, nam)
    if (!d) return NextResponse.json({ error: 'Không tìm thấy đơn vị' }, { status: 404 })
    const buf = await buildMau01({ tenCoQuan: 'Sở Xây dựng Quảng Trị', tenDonVi: 'Sở Xây dựng Quảng Trị', nam, tenTapThe: d.tenPhong, duThaoNhanXet: d.duThao.filter((l) => !l.startsWith('Mức xếp loại tập thể')) })
    await logAction({ userId: user.id, action: 'EXPORT', module: MODULES.OFFICE, targetId: phong, targetType: 'office_year_dept_reviews', detail: `Xuất Mẫu 01 năm ${nam}` })
    return tep(buf, `Mau01_${khongDau(d.tenPhong)}_${nam}.docx`, DOCX)
  }

  const r = await duLieuXuatCaNhan(user, q.get('reviewId') ?? '')
  if (!r.ok) return NextResponse.json({ error: r.loi }, { status: r.ma })
  const base = `${khongDau(r.cb.hoTen)}_${r.hs.nam}`
  let out: NextResponse
  if (mau === '2A' || mau === '2B' || mau === '2C') {
    if (r.hs.mauApDung !== mau) return NextResponse.json({ error: `Mẫu ${mau} không đúng đối tượng; hồ sơ này áp dụng Mẫu ${r.hs.mauApDung ?? '(chưa xác định)'}.` }, { status: 400 })
    out = tep(await buildMauCaNhan(mau, r.du), `Mau${mau}_${base}.docx`, DOCX)
  } else if (mau === '03') out = tep(await buildMau03(r.du), `Mau03_${base}.docx`, DOCX)
  else if (mau === '04') out = tep(await buildMau04(r.hs.nam, r.cb.hoTen, r.tenNhiemVu.map((t) => ({ nhiemVu: t }))), `Mau04_${base}.xlsx`, XLSX)
  else return NextResponse.json({ error: 'Mẫu chưa được hỗ trợ (chưa có bản gốc đọc được).' }, { status: 400 })
  await logAction({ userId: user.id, action: 'EXPORT', module: MODULES.OFFICE, targetId: r.hs.id, targetType: 'office_year_reviews', detail: `Xuất Mẫu ${mau} năm ${r.hs.nam}` })
  return out
}
