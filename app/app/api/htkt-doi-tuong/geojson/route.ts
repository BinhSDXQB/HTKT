import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { quyenTrenXa } from '@/lib/htkt-doi-tuong/truy-van'
import { LINH_VUC_MAP } from '@/lib/htkt-doi-tuong/danh-muc'

// GeoJSON đối tượng HTKT của một xã cho bản đồ MapLibre. Thuộc tính (số hiệu, tên, tuyến) JOIN động từ
// v_htkt_doi_tuong nên đổi số hiệu/tên một lần là nhãn bản đồ đổi theo. Đối tượng chưa vẽ nhưng có toạ độ
// điểm đầu/cuối từ Biểu mẫu → nét thẳng "sơ bộ" (so_bo = true) chỉ để định vị, không lưu.

type Row = {
  id: string; ma_doi_tuong: string; linh_vuc: string; nhan: string | null; so_hieu_hien_thi: string | null
  cap_duong: string | null; tuyen_so_hieu: string | null; tuyen_ten: string | null
  geometry: unknown; thong_so: Record<string, unknown> | null
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const maXa = req.nextUrl.searchParams.get('maXa') ?? ''
    const q = await quyenTrenXa(user, maXa)
    if (!q) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })

    const rows = await db.$queryRaw<Row[]>`
      SELECT v.id, v.ma_doi_tuong, v.linh_vuc, v.nhan, v.so_hieu_hien_thi, v.cap_duong, v.tuyen_so_hieu, v.tuyen_ten,
             d.geometry, d.thong_so
        FROM v_htkt_doi_tuong v JOIN htkt_doi_tuong d ON d.id = v.id
       WHERE v.ma_xa = ${maXa}`

    const features = []
    for (const r of rows) {
      const props = {
        id: r.id, ma: r.ma_doi_tuong, linhVuc: r.linh_vuc, nhan: r.nhan ?? r.ma_doi_tuong,
        soHieu: r.so_hieu_hien_thi, capDuong: r.cap_duong, tuyen: r.tuyen_so_hieu ?? r.tuyen_ten,
        mau: LINH_VUC_MAP[r.linh_vuc]?.mau ?? '#334155', soBo: false,
      }
      if (r.geometry) { features.push({ type: 'Feature', geometry: r.geometry, properties: props }); continue }
      const a = r.thong_so?.toaDoDau as [number, number] | undefined
      const b = r.thong_so?.toaDoCuoi as [number, number] | undefined
      if (a && b) features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [a, b] }, properties: { ...props, soBo: true } })
      else if (a || b) features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: a ?? b }, properties: { ...props, soBo: true } })
    }
    return NextResponse.json({ type: 'FeatureCollection', features }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('[htkt-doi-tuong/geojson]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
