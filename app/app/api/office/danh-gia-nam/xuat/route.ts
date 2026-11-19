import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { MODULES } from '@/lib/permissions'
import { chuanNam, duLieuXuatCaNhan, duLieuXuatTrong, kiemTraBang, tongHopTheoPhong, duocXemTongHopPhong } from '@/lib/danh-gia-nam/may-chu'
import { buildMauCaNhan, buildMau03, buildMau01, buildMau04, buildMau0506, buildMau07, buildBienBan } from '@/lib/danh-gia-nam/xuat-mau'
import { layBienBan, chupYKien } from '@/lib/danh-gia-nam/bien-ban-db'
import { layHoSoTapThe, quyenTapThe, duocXemTongHopSo, duLieuTongHopSo } from '@/lib/danh-gia-nam/may-chu-bieu-mau'
import { lapMau05, lapMau06, chuaPhanLoai } from '@/lib/danh-gia-nam/bieu-mau-du-lieu'

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
    if (!phong || !((await duocXemTongHopPhong(user, phong)) || (await quyenTapThe(user, phong)).xem)) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
    const d = await tongHopTheoPhong(phong, nam)
    if (!d) return NextResponse.json({ error: 'Không tìm thấy đơn vị' }, { status: 404 })
    const tt = await layHoSoTapThe(phong, nam)
    const buf = await buildMau01({ tenCoQuan: 'Sở Xây dựng Quảng Trị', tenDonVi: d.tenPhong, nam, tenTapThe: d.tenPhong, duThaoNhanXet: d.duThao.filter((l) => !l.startsWith('Mức xếp loại tập thể')), bieuMau: tt?.bieuMau, mucTuDeXuat: tt?.mucTuDeXuat })
    await logAction({ userId: user.id, action: 'EXPORT', module: MODULES.OFFICE, targetId: phong, targetType: 'office_year_dept_reviews', detail: `Xuất Mẫu 01 năm ${nam}` })
    return tep(buf, `Mau01_${khongDau(d.tenPhong)}_${nam}.docx`, DOCX)
  }

  // Biên bản cuộc họp nhận xét, đánh giá cuối năm của phòng/đơn vị: ?phong=&nam=&mau=BB
  if (mau === 'BB') {
    const phong = q.get('phong') ?? ''; const nam = chuanNam(q.get('nam')) ?? 2026
    if (!phong || !(await quyenTapThe(user, phong)).xem) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
    const [tc, bb] = await Promise.all([db.toChuc.findUnique({ where: { id: phong }, select: { ten: true } }), layBienBan(phong, nam)])
    if (!tc) return NextResponse.json({ error: 'Không tìm thấy đơn vị' }, { status: 404 })
    if (!bb) return NextResponse.json({ error: 'Phòng/đơn vị chưa lập biên bản họp.' }, { status: 404 })
    const buf = await buildBienBan({ tenCoQuan: 'Sở Xây dựng Quảng Trị', tenDonVi: tc.ten, nam, bb, nguoi: bb.chot ? bb.chot.yKien : await chupYKien(phong, nam) })
    await logAction({ userId: user.id, action: 'EXPORT', module: MODULES.OFFICE, targetId: phong, targetType: 'office_year_dept_reviews', detail: `Xuất biên bản họp đánh giá năm ${nam}${bb.chot ? '' : ' (dự thảo)'}` })
    return tep(buf, `BienBan_${khongDau(tc.ten)}_${nam}.docx`, DOCX)
  }

  // Mẫu 05/06/07: tổng hợp toàn Sở từ hồ sơ ĐÃ PHÊ DUYỆT
  if (mau === '05' || mau === '06' || mau === '07') {
    if (!duocXemTongHopSo(user)) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
    const nam = chuanNam(q.get('nam')) ?? 2026
    const ds = await duLieuTongHopSo(nam)
    const buf = mau === '07' ? await buildMau07(nam, 'Sở Xây dựng Quảng Trị', ds) : await buildMau0506(mau, nam, 'Sở Xây dựng Quảng Trị', mau === '05' ? lapMau05(ds) : lapMau06(ds), chuaPhanLoai(ds).map((d) => d.hoTen))
    await logAction({ userId: user.id, action: 'EXPORT', module: MODULES.OFFICE, targetType: 'office_year_reviews', detail: `Xuất Mẫu ${mau} toàn Sở năm ${nam}` })
    return tep(buf, `Mau${mau}_SXD_${nam}.docx`, DOCX)
  }

  // Bản trống (chưa có hồ sơ): ?canBoId=&nam=&mau=  — chỉ thông tin hành chính, không có điểm/nhận xét
  if (!q.get('reviewId') && q.get('canBoId')) {
    const nam = chuanNam(q.get('nam')) ?? 2026
    const t = await duLieuXuatTrong(user, q.get('canBoId')!, nam)
    if (!t.ok) return NextResponse.json({ error: t.loi }, { status: t.ma })
    const b = `${khongDau(t.cb.hoTen)}_${nam}_trong`
    let o: NextResponse
    if (mau === '2A' || mau === '2B' || mau === '2C') {
      if (mau !== t.mau) return NextResponse.json({ error: `Mẫu ${mau} không đúng đối tượng; cán bộ này áp dụng Mẫu ${t.mau}.` }, { status: 400 })
      o = tep(await buildMauCaNhan(mau, t.du), `Mau${mau}_${b}.docx`, DOCX)
    } else if (mau === '03') o = tep(await buildMau03(t.du), `Mau03_${b}.docx`, DOCX)
    else if (mau === '04') o = tep(await buildMau04(nam, t.cb.hoTen, t.tenNhiemVu.map((x) => ({ nhiemVu: x }))), `Mau04_${b}.xlsx`, XLSX)
    else return NextResponse.json({ error: 'Mẫu chưa được hỗ trợ.' }, { status: 400 })
    await logAction({ userId: user.id, action: 'EXPORT', module: MODULES.OFFICE, targetId: t.cb.id, targetType: 'can_bo', detail: `Xuất Mẫu ${mau} bản trống năm ${nam}` })
    return o
  }

  const r = await duLieuXuatCaNhan(user, q.get('reviewId') ?? '')
  if (!r.ok) return NextResponse.json({ error: r.loi }, { status: r.ma })
  const base = `${khongDau(r.cb.hoTen)}_${r.hs.nam}`
  let out: NextResponse
  if (mau === '2A' || mau === '2B' || mau === '2C') {
    if (r.hs.mauApDung !== mau) return NextResponse.json({ error: `Mẫu ${mau} không đúng đối tượng; hồ sơ này áp dụng Mẫu ${r.hs.mauApDung ?? '(chưa xác định)'}.` }, { status: 400 })
    out = tep(await buildMauCaNhan(mau, r.du), `Mau${mau}_${base}.docx`, DOCX)
  } else if (mau === '03') out = tep(await buildMau03(r.du), `Mau03_${base}.docx`, DOCX)
  else if (mau === '04') {
    // Đã nhập bảng KPI thì xuất đúng các dòng đã nhập; chưa nhập thì liệt kê nhiệm vụ đang giao ở nhóm B để tự điền
    const m04 = r.hs.bieuMau.m04
    const coDong = !!m04 && (m04.A.length + m04.B.length) > 0
    out = tep(await buildMau04(r.hs.nam, r.cb.hoTen, coDong ? m04!.A : [], coDong ? m04!.B : r.tenNhiemVu.map((t) => ({ nhiemVu: t }))), `Mau04_${base}.xlsx`, XLSX)
  }
  else return NextResponse.json({ error: 'Mẫu chưa được hỗ trợ (chưa có bản gốc đọc được).' }, { status: 400 })
  await logAction({ userId: user.id, action: 'EXPORT', module: MODULES.OFFICE, targetId: r.hs.id, targetType: 'office_year_reviews', detail: `Xuất Mẫu ${mau} năm ${r.hs.nam}` })
  return out
}
