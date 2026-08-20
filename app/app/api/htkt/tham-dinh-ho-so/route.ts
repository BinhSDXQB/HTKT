import { NextRequest, NextResponse } from 'next/server'
import { readdir, lstat } from 'node:fs/promises'
import path from 'node:path'
import { requireHtktAccess } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { danhSachThuMucGoc, giaiDuongDan } from '@/lib/tham-dinh/duong-dan'
import { quetThuMuc, bocTrichYeu, doiChieu, GIOI_HAN } from '@/lib/tham-dinh/quet-ho-so'
import { docDuToan } from '@/lib/tham-dinh/doc-du-toan'
import { QUY_TRINH_THAM_DINH } from '@/lib/htkt/tham-dinh'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * API kiểm kê hồ sơ thẩm định từ thư mục máy chủ — DÀNH CHO PHÒNG HẠ TẦNG KỸ THUẬT.
 *
 * Client KHÔNG bao giờ gửi đường dẫn tuyệt đối: chỉ gửi { rootId, duongDanCon }.
 * Mọi việc giải/kiểm chứng đường dẫn nằm ở lib/tham-dinh/duong-dan.ts.
 *
 * GET  ?hanhDong=goc            → danh sách thư mục gốc được cấu hình
 * GET  ?hanhDong=duyet&...      → liệt kê thư mục con 1 cấp (để chọn dần)
 * POST { rootId, duongDanCon, quyTrinh } → quét + đối chiếu + đọc dự toán
 */

export async function GET(req: NextRequest) {
  let user
  try { user = await requireHtktAccess() } catch { return NextResponse.json({ error: 'Không có quyền' }, { status: 403 }) }
  void user

  const sp = req.nextUrl.searchParams
  const hanhDong = sp.get('hanhDong') ?? 'goc'

  if (hanhDong === 'goc') {
    const gocs = danhSachThuMucGoc()
    // Kiểm tra máy chủ có thật sự với tới từng thư mục gốc không — báo sớm,
    // thay vì để người dùng chọn xong mới báo lỗi khó hiểu.
    const ds = await Promise.all(
      gocs.map(async (g) => {
        try {
          await lstat(g.duongDan)
          return { id: g.id, nhan: g.nhan, duongDan: g.duongDan, truyCapDuoc: true }
        } catch {
          return { id: g.id, nhan: g.nhan, duongDan: g.duongDan, truyCapDuoc: false }
        }
      }),
    )
    return NextResponse.json({
      goc: ds,
      quyTrinh: QUY_TRINH_THAM_DINH.map((q) => ({ key: q.key, ten: q.ten, soThanhPhan: q.hoSo.length })),
      chuaCauHinh: gocs.length === 0,
    })
  }

  if (hanhDong === 'duyet') {
    const rootId = sp.get('rootId') ?? ''
    const duongDanCon = sp.get('duongDanCon') ?? ''
    const giai = await giaiDuongDan(rootId, duongDanCon)
    if (!giai.ok) return NextResponse.json({ error: giai.loi }, { status: 400 })

    let muc
    try { muc = await readdir(giai.duongDanThat, { withFileTypes: true }) } catch {
      return NextResponse.json({ error: 'Không đọc được thư mục' }, { status: 400 })
    }

    const thuMucCon: { ten: string; duongDanCon: string }[] = []
    let soFile = 0
    for (const m of muc) {
      if (m.name.startsWith('.') || m.name.startsWith('~$')) continue
      const day = path.join(giai.duongDanThat, m.name)
      let st
      try { st = await lstat(day) } catch { continue }
      if (st.isSymbolicLink()) continue
      if (st.isDirectory()) {
        thuMucCon.push({ ten: m.name, duongDanCon: duongDanCon ? `${duongDanCon}/${m.name}` : m.name })
      } else if (st.isFile()) soFile++
    }
    thuMucCon.sort((a, b) => a.ten.localeCompare(b.ten, 'vi'))
    return NextResponse.json({ duongDanCon, thuMucCon, soFileTrucTiep: soFile, hienThi: giai.duongDanThat })
  }

  return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  let user
  try { user = await requireHtktAccess() } catch { return NextResponse.json({ error: 'Không có quyền' }, { status: 403 }) }

  const body = await req.json().catch(() => null)
  const rootId = String(body?.rootId ?? '')
  const duongDanCon = String(body?.duongDanCon ?? '')
  const quyTrinhKey = String(body?.quyTrinh ?? '')

  const giai = await giaiDuongDan(rootId, duongDanCon)
  if (!giai.ok) return NextResponse.json({ error: giai.loi }, { status: 400 })

  const qt = QUY_TRINH_THAM_DINH.find((q) => q.key === quyTrinhKey)
  if (!qt) return NextResponse.json({ error: 'Chưa chọn quy trình thẩm định' }, { status: 400 })

  const batDau = Date.now()
  const quet = await quetThuMuc(giai.duongDanThat, giai.duongDanThat)
  const doc = await bocTrichYeu(giai.duongDanThat, quet.files)
  const duToan = await docDuToan(giai.duongDanThat, quet.files)
  const dc = doiChieu(qt.hoSo, quet.files)

  // Đây là hồ sơ hành chính — ghi nhật ký ai đã quét thư mục nào.
  await logAction({
    userId: user.id, action: 'READ', module: 'htkt',
    targetId: rootId, targetType: 'ThamDinhHoSo',
    detail: `Kiểm kê hồ sơ thẩm định: ${giai.goc.nhan}${duongDanCon ? '/' + duongDanCon : ''} · quy trình ${qt.key} · ${quet.tongFile} tệp`,
  }).catch(() => {})

  return NextResponse.json({
    thuMuc: { goc: giai.goc.nhan, duongDanCon },
    quyTrinh: { key: qt.key, ten: qt.ten, hoSo: qt.hoSo },
    tongFile: quet.tongFile,
    theoNhom: quet.theoNhom,
    chamNguong: quet.chamNguong,
    files: quet.files,
    doiChieu: dc,
    duToan,
    thongKeDoc: { ...doc, gioiHan: GIOI_HAN },
    thoiGianMs: Date.now() - batDau,
  })
}
