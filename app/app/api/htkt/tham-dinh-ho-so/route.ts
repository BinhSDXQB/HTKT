import { NextRequest, NextResponse } from 'next/server'
import { readdir, lstat } from 'node:fs/promises'
import path from 'node:path'
import { requireHtktAccess } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { danhSachThuMucGoc, giaiDuongDan } from '@/lib/tham-dinh/duong-dan'
import { giaiNguonHoSo } from '@/lib/tham-dinh/nguon-ho-so'
import { donPhienHetHan } from '@/lib/tham-dinh/phien-tai-len'
import { quetThuMuc, bocTrichYeu, doiChieu, GIOI_HAN } from '@/lib/tham-dinh/quet-ho-so'
import { docDuToan } from '@/lib/tham-dinh/doc-du-toan'
import { kiemTraDuToan, NHAN_LOAI_CONG_TRINH, type LoaiCongTrinhChiPhi } from '@/lib/tham-dinh/kiem-tra-du-toan'
import { docToTrinh } from '@/lib/tham-dinh/doc-to-trinh'
import { napDuLieuDuToanAI } from '@/lib/tham-dinh/du-lieu-dutoanai'
import { QUY_TRINH_THAM_DINH } from '@/lib/htkt/tham-dinh'

const LOAI_CONG_TRINH_HOP_LE = new Set<LoaiCongTrinhChiPhi>([
  'dan-dung', 'cong-nghiep', 'giao-thong', 'nong-nghiep-moi-truong', 'ha-tang-ky-thuat',
])

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
    // Mở trang Kiểm kê = dịp dọn phiên tải lên quá 24 giờ (không chặn phản hồi).
    void donPhienHetHan().catch(() => {})
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
    const dl = await napDuLieuDuToanAI()
    return NextResponse.json({
      goc: ds,
      quyTrinh: QUY_TRINH_THAM_DINH.map((q) => ({ key: q.key, ten: q.ten, soThanhPhan: q.hoSo.length })),
      duLieuDuToanAI: { coDuLieu: dl.coDuLieu, ghiChu: dl.ghiChu, phienBan: dl.phienBan, ngay: dl.ngay },
      loaiCongTrinhChiPhi: Object.entries(NHAN_LOAI_CONG_TRINH).map(([ma, ten]) => ({ ma, ten })),
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
  // Bước kiểm tra dự toán (đọc lại toàn bộ công thức Excel, nặng hơn kiểm kê thường) —
  // TẮT MẶC ĐỊNH, chỉ chạy khi cán bộ chủ động bấm ở bước 2 để tránh chậm bước kiểm kê 1.
  const kiemTraChiPhi = body?.kiemTraChiPhi === true
  const loaiCongTrinhRaw = String(body?.loaiCongTrinh ?? '')
  const loaiCongTrinh: LoaiCongTrinhChiPhi | null = LOAI_CONG_TRINH_HOP_LE.has(loaiCongTrinhRaw as LoaiCongTrinhChiPhi)
    ? (loaiCongTrinhRaw as LoaiCongTrinhChiPhi) : null
  const theoTuyen = body?.theoTuyen === true

  // Nguồn hồ sơ: phiên tải lên từ máy cán bộ (phienId) HOẶC thư mục trong kho máy chủ (rootId).
  const phienId = String(body?.phienId ?? '')
  const giai = await giaiNguonHoSo({ phienId, rootId, duongDanCon }, user.id)
  if (!giai.ok) return NextResponse.json({ error: giai.loi }, { status: 400 })

  const qt = QUY_TRINH_THAM_DINH.find((q) => q.key === quyTrinhKey)
  if (!qt) return NextResponse.json({ error: 'Chưa chọn quy trình thẩm định' }, { status: 400 })

  const batDau = Date.now()
  const quet = await quetThuMuc(giai.duongDanThat, giai.duongDanThat)
  const doc = await bocTrichYeu(giai.duongDanThat, quet.files)
  const duToan = await docDuToan(giai.duongDanThat, quet.files)
  const dc = doiChieu(qt.hoSo, quet.files)

  // Kiểm tra khối lượng → THKP → tổng hợp dự toán/TMĐT, đối chiếu với tờ trình.
  // Chạy tuần tự (không Promise.all) — cả hai đều đọc lại cùng những tệp Excel/Word,
  // chạy song song trên máy 6GB RAM dễ đội bộ nhớ hơn là chậm thêm vài trăm ms.
  let kiemTraChiPhiKq: Awaited<ReturnType<typeof kiemTraDuToan>> | null = null
  let doiChieuToTrinh: Awaited<ReturnType<typeof docToTrinh>> | null = null
  if (kiemTraChiPhi) {
    kiemTraChiPhiKq = await kiemTraDuToan(giai.duongDanThat, quet.files, { loaiCongTrinh, theoTuyen })
    doiChieuToTrinh = await docToTrinh(giai.duongDanThat, quet.files, kiemTraChiPhiKq.tongHopKinhPhi)
  }

  // Đây là hồ sơ hành chính — ghi nhật ký ai đã quét thư mục nào.
  await logAction({
    userId: user.id, action: 'READ', module: 'htkt',
    targetId: phienId || rootId, targetType: 'ThamDinhHoSo',
    detail: `Kiểm kê hồ sơ thẩm định: ${giai.nhan}${!phienId && duongDanCon ? '/' + duongDanCon : ''} · quy trình ${qt.key} · ${quet.tongFile} tệp`,
  }).catch(() => {})

  return NextResponse.json({
    thuMuc: { goc: giai.nhan, duongDanCon: phienId ? '' : duongDanCon },
    quyTrinh: { key: qt.key, ten: qt.ten, hoSo: qt.hoSo },
    tongFile: quet.tongFile,
    theoNhom: quet.theoNhom,
    chamNguong: quet.chamNguong,
    files: quet.files,
    doiChieu: dc,
    duToan,
    kiemTraChiPhi: kiemTraChiPhiKq,
    doiChieuToTrinh,
    thongKeDoc: { ...doc, gioiHan: GIOI_HAN },
    thoiGianMs: Date.now() - batDau,
  })
}
