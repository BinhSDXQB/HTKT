import Link from 'next/link'
import { requireOfficeAccess, isOfficeLeader } from '@/lib/auth'
import { hasPermission, MODULES } from '@/lib/permissions'
import { db } from '@/lib/db'
import { getSoToChucIds } from '@/lib/office-scope'
import { GenerateReviewListForm } from '@/components/van-phong-so/generate-review-list-form'
import {
  TRANG_THAI_RA_SOAT_LABEL, trangThaiRaSoatBadgeClass, KET_LUAN_RA_SOAT_LABEL, LOAI_NANG_LUONG_LABEL,
} from '@/lib/office-labels'
import { Briefcase, ChevronRight, ScrollText } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null | undefined): string {
  return d ? new Date(d).toLocaleDateString('vi-VN') : '—'
}

const STATUS_TABS = ['DU_KIEN', 'DANG_RA_SOAT', 'CHO_DUYET', 'DA_DUYET', 'DA_BAN_HANH', 'TU_CHOI'] as const

export default async function NangLuongPage({ searchParams }: { searchParams: Promise<{ tt?: string }> }) {
  const user = await requireOfficeAccess()
  const canReview = isOfficeLeader(user) || hasPermission(user.permissions, MODULES.OFFICE, 'salary_review')
  const sp = await searchParams
  const filterTT = sp.tt && STATUS_TABS.includes(sp.tt as typeof STATUS_TABS[number]) ? sp.tt : null
  const soIds = await getSoToChucIds()

  const cases = await db.officeSalaryReviewCase.findMany({
    where: { canBo: { toChucId: { in: soIds } }, ...(filterTT ? { trangThai: filterTT as typeof STATUS_TABS[number] } : {}) },
    include: { canBo: { include: { chucDanh: true } } },
    orderBy: [{ updatedAt: 'desc' }],
  })

  const allForCount = await db.officeSalaryReviewCase.groupBy({
    by: ['trangThai'],
    where: { canBo: { toChucId: { in: soIds } } },
    _count: { _all: true },
  })
  const counts = Object.fromEntries(allForCount.map((g) => [g.trangThai, g._count._all]))
  const total = allForCount.reduce((s, g) => s + g._count._all, 0)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/van-phong-so" className="hover:text-indigo-700 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />Văn phòng Sở
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Nâng lương (quy trình)</span>
      </nav>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-900">Quy trình rà soát nâng lương</h1>
        </div>
        {canReview && <GenerateReviewListForm defaultNam={new Date().getFullYear()} />}
      </div>

      {/* Tabs trạng thái */}
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/van-phong-so/nang-luong" className={`text-xs font-medium px-3 py-1.5 rounded-full border ${!filterTT ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:border-slate-300'}`}>
          Tất cả ({total})
        </Link>
        {STATUS_TABS.map((s) => (
          <Link key={s} href={`/dashboard/van-phong-so/nang-luong?tt=${s}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${filterTT === s ? trangThaiRaSoatBadgeClass(s) + ' ring-1 ring-offset-1' : 'bg-white text-slate-600 hover:border-slate-300'}`}>
            {TRANG_THAI_RA_SOAT_LABEL[s]} ({counts[s] ?? 0})
          </Link>
        ))}
      </div>

      <p className="text-xs text-slate-500 bg-slate-50 border rounded-lg px-3 py-2">
        Quy trình: <b>Sinh danh sách đến hạn</b> → rà soát (đủ/chưa đủ/cần kiểm tra) → trình → lãnh đạo duyệt → ban hành QĐ.
        Hệ thống chỉ hỗ trợ quy trình và lưu vết — không tự quyết định nâng lương.
      </p>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Cán bộ</th>
              <th className="px-4 py-2.5 font-semibold">Loại</th>
              <th className="px-4 py-2.5 font-semibold">Năm</th>
              <th className="px-4 py-2.5 font-semibold">Đến hạn</th>
              <th className="px-4 py-2.5 font-semibold">Kết luận</th>
              <th className="px-4 py-2.5 font-semibold">Trạng thái</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-900">{c.canBo.hoTen}</td>
                <td className="px-4 py-2.5 text-slate-600">{LOAI_NANG_LUONG_LABEL[c.loai] ?? c.loai}</td>
                <td className="px-4 py-2.5 text-slate-600">{c.namRaSoat}</td>
                <td className="px-4 py-2.5 text-slate-600">{fmtDate(c.ngayDenHan)}</td>
                <td className="px-4 py-2.5 text-slate-600">{c.ketLuanRaSoat ? KET_LUAN_RA_SOAT_LABEL[c.ketLuanRaSoat] : '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${trangThaiRaSoatBadgeClass(c.trangThai)}`}>
                    {TRANG_THAI_RA_SOAT_LABEL[c.trangThai] ?? c.trangThai}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/dashboard/van-phong-so/nang-luong/${c.id}`} className="text-indigo-600 hover:underline text-sm font-medium inline-flex items-center gap-1">
                    Xử lý <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                Chưa có hồ sơ rà soát.{canReview ? ' Bấm "Sinh danh sách đến hạn" để bắt đầu.' : ''}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
