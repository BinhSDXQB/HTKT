import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canManageOvertimeFor } from '@/lib/overtime/access'
import { annualUsageByCanBo } from '@/lib/overtime/usage'
import { sumDayHours, monthDays, rangeDays, plainDate, type GioNgay } from '@/lib/overtime/policy'
import { OvertimeEditor } from '@/components/overtime/editor'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

function toDateInput(d: Date | null): string {
  if (!d) return ''
  const dt = new Date(d)
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const day = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default async function ChamCongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAuth()

  const ts = await db.overtimeTimesheet.findUnique({
    where: { id },
    include: {
      entries: { orderBy: { thuTu: 'asc' } },
      signatures: { where: { capCode: 'KY_TAY' }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })
  if (!ts) notFound()
  if (!(await canManageOvertimeFor(user, ts.toChucId))) redirect('/forbidden')

  const usage = await annualUsageByCanBo(ts.nam)
  const rd = rangeDays(plainDate(ts.tuNgay), plainDate(ts.denNgay))
  const days = rd.length ? rd : monthDays(ts.nam, ts.thang)

  const data = {
    id: ts.id,
    tenPhong: ts.tenPhong,
    thang: ts.thang,
    nam: ts.nam,
    tuNgay: toDateInput(ts.tuNgay),
    denNgay: toDateInput(ts.denNgay),
    ngayKy: toDateInput(ts.ngayKy),
    diaDiem: ts.diaDiem ?? '',
    lyDo: ts.lyDo ?? '',
    nguoiChamCong: ts.nguoiChamCong ?? '',
    truongPhong: ts.truongPhong ?? '',
    lanhDaoSo: ts.lanhDaoSo ?? '',
    chucDanhLanhDao: ts.chucDanhLanhDao ?? '',
    ghiChu: ts.ghiChu ?? '',
    trangThai: ts.trangThai,
    banKy: ts.signatures[0]
      ? { fileName: ts.signatures[0].fileName, at: ts.signatures[0].createdAt.toISOString() }
      : null,
    days,
    entries: ts.entries.map((e) => {
      const gioNgay = (e.gioNgay ?? {}) as GioNgay
      const tongThang = sumDayHours(gioNgay)
      const u = e.canBoId ? usage.get(e.canBoId) : undefined
      const luyKeNam = u?.hours ?? tongThang
      const soThang = Math.max(u?.months ?? (tongThang > 0 ? 1 : 0), tongThang > 0 ? 1 : 0)
      const tbThang = soThang > 0 ? Math.round((luyKeNam / soThang) * 10) / 10 : 0
      return {
        id: e.id,
        hoTen: e.hoTen,
        chucVu: e.chucVu ?? '',
        gioNgay,
        ghiChu: e.ghiChu ?? '',
        luyKeNam,
        tbThang,
        duKienNam: Math.round(tbThang * 12 * 10) / 10,
      }
    }),
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Link href="/dashboard/cham-cong-lam-them" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </Link>
      <OvertimeEditor data={data} />
    </div>
  )
}
