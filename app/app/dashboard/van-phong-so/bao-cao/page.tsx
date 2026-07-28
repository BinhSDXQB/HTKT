import Link from 'next/link'
import { requireOfficeAccess } from '@/lib/auth'
import { getOfficeSummary } from '@/lib/office-report'
import {
  TRANG_THAI_RA_SOAT_LABEL, MUC_XEP_LOAI_LABEL, HINH_THUC_KY_LUAT_LABEL,
} from '@/lib/office-labels'
import { Briefcase, ChevronRight, BarChart3, FileSpreadsheet } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TONE_CLASS: Record<string, string> = {
  slate: 'text-slate-700',
  amber: 'text-amber-700',
  emerald: 'text-emerald-700',
  indigo: 'text-indigo-700',
}

function StatCard({ label, value, tone = 'slate' }: { label: string; value: number | string; tone?: keyof typeof TONE_CLASS }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${TONE_CLASS[tone] ?? TONE_CLASS.slate}`}>{value}</p>
    </div>
  )
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const total = rows.reduce((s, r) => s + r.value, 0)
  return (
    <section className="rounded-xl border bg-white p-5">
      <h2 className="text-sm font-bold text-slate-900 mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Không có dữ liệu.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-4 text-sm border-b border-slate-100 pb-1.5">
              <span className="text-slate-600">{r.label}</span>
              <span className="font-semibold text-slate-800">{r.value}</span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-4 text-sm pt-1">
            <span className="text-slate-500 font-medium">Tổng</span>
            <span className="font-bold text-indigo-700">{total}</span>
          </li>
        </ul>
      )}
    </section>
  )
}

export default async function BaoCaoVPSPage({ searchParams }: { searchParams: Promise<{ nam?: string }> }) {
  await requireOfficeAccess()
  const sp = await searchParams
  const now = new Date().getFullYear()
  const nam = parseInt(sp.nam ?? '', 10) || now
  const namOptions = Array.from({ length: 5 }, (_, i) => now - i)

  const s = await getOfficeSummary(nam)

  const reviewRows = Object.entries(s.quyTrinhNangLuong)
    .map(([k, v]) => ({ label: TRANG_THAI_RA_SOAT_LABEL[k] ?? k, value: v }))
  const xepLoaiRows = Object.entries(s.xepLoai)
    .map(([k, v]) => ({ label: MUC_XEP_LOAI_LABEL[k] ?? k, value: v }))
  const kyLuatRows = Object.entries(s.kyLuat)
    .map(([k, v]) => ({ label: HINH_THUC_KY_LUAT_LABEL[k] ?? k, value: v }))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/van-phong-so" className="hover:text-indigo-700 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />Văn phòng Sở
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Báo cáo tổng hợp</span>
      </nav>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <h1 className="text-lg font-bold text-slate-900">Báo cáo tổng hợp Văn phòng Sở</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {namOptions.map((y) => (
              <Link
                key={y}
                href={`/dashboard/van-phong-so/bao-cao?nam=${y}`}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                  y === nam ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 hover:border-indigo-300'
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
          <a
            href={`/api/office/bao-cao?nam=${nam}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />Xuất Excel
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Cán bộ Văn phòng Sở" value={s.tongCanBo} tone="slate" />
        <StatCard label={`Khen thưởng năm ${nam}`} value={s.khenThuongCount} tone="amber" />
        <StatCard label={`Chiến sĩ thi đua năm ${nam}`} value={s.chienSiThiDua} tone="emerald" />
        <StatCard label="Văn bản đã sinh" value={s.vanBanTongCong} tone="indigo" />
      </div>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Cảnh báo nâng lương</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3"><p className="text-xs text-red-600">Quá hạn</p><p className="text-xl font-bold text-red-700">{s.canhBaoLuong.overdue}</p></div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3"><p className="text-xs text-orange-600">Trong 30 ngày</p><p className="text-xl font-bold text-orange-700">{s.canhBaoLuong.d30}</p></div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-xs text-amber-600">Trong 60 ngày</p><p className="text-xl font-bold text-amber-700">{s.canhBaoLuong.d60}</p></div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3"><p className="text-xs text-yellow-700">Trong 90 ngày</p><p className="text-xl font-bold text-yellow-700">{s.canhBaoLuong.d90}</p></div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Breakdown title="Phân theo chức danh" rows={s.theoChucDanh.map((r) => ({ label: r.ten, value: r.soLuong }))} />
        <Breakdown title={`Quy trình nâng lương (năm ${nam})`} rows={reviewRows} />
        <Breakdown title={`Xếp loại hằng năm (năm ${nam})`} rows={xepLoaiRows} />
        <Breakdown title={`Kỷ luật (năm ${nam})`} rows={kyLuatRows} />
      </div>

      <p className="text-xs text-slate-400">
        Số liệu tổng hợp tự động từ dữ liệu hồ sơ cán bộ, lương, thi đua – khen thưởng, đánh giá – kỷ luật và văn bản đã sinh
        của Văn phòng Sở. Phạm vi: cán bộ thuộc đơn vị Văn phòng Sở.
      </p>
    </div>
  )
}
