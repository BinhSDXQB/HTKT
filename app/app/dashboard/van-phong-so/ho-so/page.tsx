import Link from 'next/link'
import { requireOfficeAccess, canViewOfficeSensitive, canManageCanBo } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSoToChucIds, getSoDonViOptions } from '@/lib/office-scope'
import { boDauTiengViet } from '@/lib/utils'
import { Briefcase, ChevronRight, Users, Search, FileSpreadsheet, UserPlus } from 'lucide-react'

export const dynamic = 'force-dynamic'

function maskCccd(cccd: string, canSee: boolean): string {
  if (canSee) return cccd
  if (cccd.length < 4) return '••••'
  return '•'.repeat(cccd.length - 4) + cccd.slice(-4)
}

type SP = { q?: string; donVi?: string }

export default async function HoSoListPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireOfficeAccess()
  const canSee = canViewOfficeSensitive(user)
  const sp = await searchParams

  const [soIds, donViOptions] = await Promise.all([getSoToChucIds(), getSoDonViOptions()])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { toChucId: { in: sp.donVi ? [sp.donVi] : soIds } }

  let list = await db.canBo.findMany({
    where,
    include: { chucDanh: true, toChuc: { select: { ten: true, ma: true, thuTu: true } } },
    orderBy: [{ toChuc: { thuTu: 'asc' } }, { chucDanh: { capQuanLy: 'asc' } }, { hoTen: 'asc' }],
  })

  // Tìm kiếm KHÔNG phân biệt dấu: Postgres ILIKE không bỏ dấu nên lọc trong app
  // (scope toàn Sở chỉ vài trăm người → rất nhẹ). Gõ "Lieu" vẫn ra "Liễu".
  const qRaw = sp.q?.trim()
  if (qRaw) {
    const q = boDauTiengViet(qRaw)
    const qDigits = qRaw.replace(/\D/g, '')
    list = list.filter((cb) =>
      boDauTiengViet(cb.hoTen).includes(q) ||
      (qDigits.length > 0 && cb.cccd.includes(qDigits)) ||
      (cb.email ? boDauTiengViet(cb.email).includes(q) : false)
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/van-phong-so" className="hover:text-indigo-700 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />Văn phòng Sở
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Hồ sơ cán bộ</span>
      </nav>

      <div className="flex items-center gap-2 flex-wrap">
        <Users className="w-5 h-5 text-indigo-600" />
        <h1 className="text-xl font-bold text-slate-900">Hồ sơ cán bộ toàn Sở</h1>
        <span className="ml-2 text-sm text-slate-500">({list.length} người)</span>
        <span className="flex-1" />
        {canSee && (
          <a href={`/api/office/ho-so/export${sp.donVi ? `?donVi=${sp.donVi}` : ''}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50"
            title="Xuất danh sách QLNS (.xlsx) theo biểu mẫu 53 cột">
            <FileSpreadsheet className="w-4 h-4" />Xuất Excel QLNS
          </a>
        )}
        {canManageCanBo(user) && (
          <Link href="/dashboard/van-phong-so/ho-so/them"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg px-3 py-1.5 hover:bg-indigo-700">
            <UserPlus className="w-4 h-4" />Thêm cán bộ
          </Link>
        )}
      </div>

      <form method="GET" className="flex flex-wrap gap-2 bg-white rounded-xl border p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input name="q" defaultValue={sp.q} placeholder="Tìm họ tên, CCCD, email..." className="w-full h-9 pl-9 pr-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select name="donVi" defaultValue={sp.donVi ?? ''} className="h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">-- Tất cả đơn vị --</option>
          {donViOptions.map((d) => <option key={d.id} value={d.id}>{d.ten}</option>)}
        </select>
        <button type="submit" className="h-9 px-4 text-sm border rounded-lg bg-slate-50 hover:bg-slate-100">Lọc</button>
        {(sp.q || sp.donVi) && <Link href="/dashboard/van-phong-so/ho-so" className="h-9 px-3 text-sm text-slate-500 inline-flex items-center">Xoá lọc</Link>}
      </form>

      {!canSee && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Bạn không có quyền xem dữ liệu cá nhân nhạy cảm — số CCCD và lương được ẩn bớt.
        </p>
      )}

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Họ tên</th>
              <th className="px-4 py-2.5 font-semibold">Đơn vị</th>
              <th className="px-4 py-2.5 font-semibold">Chức danh</th>
              <th className="px-4 py-2.5 font-semibold">CCCD</th>
              <th className="px-4 py-2.5 font-semibold text-right">Hệ số lương</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.map((cb) => (
              <tr key={cb.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-900">{cb.hoTen}</td>
                <td className="px-4 py-2.5 text-slate-600 text-xs">{cb.toChuc?.ten ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{cb.chucVu ?? cb.chucDanh?.ten ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{maskCccd(cb.cccd, canSee)}</td>
                <td className="px-4 py-2.5 text-right text-slate-700">{canSee ? (cb.heSoLuong ?? '—') : '•••'}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}`} className="text-indigo-600 hover:underline text-sm font-medium inline-flex items-center gap-1">
                    Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Không có cán bộ phù hợp bộ lọc.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
