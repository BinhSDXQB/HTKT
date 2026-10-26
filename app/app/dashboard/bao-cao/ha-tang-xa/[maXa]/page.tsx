import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { quyenTrenXa, danhSachDoiTuong, daiSoHieu, canhBao } from '@/lib/htkt-doi-tuong/truy-van'
import HoSoHaTang from '@/components/htkt-doi-tuong/ho-so-ha-tang'

// Không gian làm việc hồ sơ HTKT của một xã/phường: nhập liệu mọi lĩnh vực, số hiệu đường (QĐ 56 Đ5),
// vẽ/định vị trên bản đồ, nạp từ 7 Biểu mẫu, xuất Excel lưu trữ.

type Props = { params: Promise<{ maXa: string }> }
type ChuaLk = { bang: string; nam: number; n: bigint }

export default async function HoSoHaTangXaPage({ params }: Props) {
  const { maXa } = await params
  const user = await requireAuth()
  const q = await quyenTrenXa(user, maXa)
  if (!q) notFound()

  const [ds, dai, streets, chuaLk] = await Promise.all([
    danhSachDoiTuong(maXa),
    daiSoHieu(maXa),
    q.xa.laPhuong ? db.street.findMany({ where: { wardId: q.xa.id, isActive: true }, select: { id: true, code: true, name: true }, orderBy: { name: 'asc' } }) : [],
    db.$queryRaw<ChuaLk[]>`
      SELECT 'Đường' AS bang, year AS nam, count(*) AS n FROM report_duong WHERE "wardId" = ${q.xa.id} AND "doiTuongId" IS NULL GROUP BY year
      UNION ALL SELECT 'Chiếu sáng', year, count(*) FROM report_dien_cs WHERE "wardId" = ${q.xa.id} AND "doiTuongId" IS NULL GROUP BY year
      UNION ALL SELECT 'Thoát nước', year, count(*) FROM report_thoat_nuoc WHERE "wardId" = ${q.xa.id} AND "doiTuongId" IS NULL GROUP BY year
      UNION ALL SELECT 'Cây xanh', year, count(*) FROM report_cay_xanh WHERE "wardId" = ${q.xa.id} AND "doiTuongId" IS NULL GROUP BY year
      UNION ALL SELECT 'Công viên', year, count(*) FROM report_cong_vien WHERE "wardId" = ${q.xa.id} AND "doiTuongId" IS NULL GROUP BY year
      UNION ALL SELECT 'Cấp nước', year, count(*) FROM report_cap_nuoc WHERE "wardId" = ${q.xa.id} AND "doiTuongId" IS NULL GROUP BY year
      UNION ALL SELECT 'Bãi đỗ xe', year, count(*) FROM report_bai_do_xe WHERE "wardId" = ${q.xa.id} AND "doiTuongId" IS NULL GROUP BY year`,
  ])

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <nav className="text-xs text-slate-500 mb-3 flex flex-wrap items-center gap-1.5">
        <Link href="/dashboard/bao-cao/ha-tang-xa" className="hover:text-blue-700">Hồ sơ HTKT & số hiệu đường</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">{q.xa.name}</span>
      </nav>
      <HoSoHaTang
        xa={q.xa}
        ghi={q.ghi}
        laSo={q.laSo}
        dsBanDau={ds}
        dai={dai}
        canhBao={canhBao(ds, q.xa.laPhuong)}
        streets={streets}
        chuaLienKet={chuaLk.map((r) => ({ bang: r.bang, nam: Number(r.nam), n: Number(r.n) }))}
      />
    </div>
  )
}
