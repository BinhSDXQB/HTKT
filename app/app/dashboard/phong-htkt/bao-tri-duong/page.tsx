import Link from 'next/link'
import { ChevronRight, Wrench, Route, BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { requireAuth, isLeadership } from '@/lib/auth'
import { getBaoTriTuyen, getDsDiaBan } from '@/lib/htkt/bao-tri-tuyen'
import { db } from '@/lib/db'
import BaoTriManageTable from '@/components/bao-tri/bao-tri-form'

export const dynamic = 'force-dynamic'

const ALLOWED_MA = ['BAN_BAO_TRI_GT', 'PHONG_HTKT']

type SP = { phuong?: string }

export default async function BaoTriDuongPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireAuth()
  const sp = await searchParams
  const filterDiaBan = sp.phuong || undefined

  // Kiểm tra quyền sửa
  let canEdit = false
  let wardDiaBan: string | null = null

  if (isLeadership(user)) {
    canEdit = true
  } else if (user.toChucId) {
    const tc = await db.toChuc.findUnique({ where: { id: user.toChucId }, select: { ma: true } })
    if (tc?.ma && ALLOWED_MA.includes(tc.ma)) canEdit = true
  }
  if (!canEdit && user.wardId) {
    const ward = await db.administrativeUnit.findUnique({ where: { id: user.wardId }, select: { name: true } })
    wardDiaBan = ward?.name ?? null
    if (wardDiaBan) canEdit = true
  }

  const [{ theoPhung, tongTuyen, tongKm }, dsDiaBan] = await Promise.all([
    getBaoTriTuyen(filterDiaBan),
    getDsDiaBan(),
  ])

  const tongTot   = theoPhung.reduce((s, p) => s + p.tot, 0)
  const tongTB    = theoPhung.reduce((s, p) => s + p.trungBinh, 0)
  const tongXC    = theoPhung.reduce((s, p) => s + p.xuongCap, 0)
  const tongChua  = theoPhung.reduce((s, p) => s + p.chuaXet, 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/dashboard/phong-htkt" className="hover:text-cyan-700">Phòng Hạ tầng kỹ thuật</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Báo cáo đường bảo trì</span>
      </nav>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Đường bảo trì theo phường/xã</h1>
            <p className="text-sm text-slate-500">
              Trung tâm Quản lý, bảo trì giao thông và HTKT · Tuyến đường mặt cắt ≥ 20m
            </p>
          </div>
        </div>
      </div>

      {/* Thẻ tổng hợp */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{tongTuyen}</p>
            <p className="text-xs text-slate-500">Tổng số tuyến</p>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{tongKm.toFixed(2)}</p>
            <p className="text-xs text-slate-500">Tổng chiều dài (km)</p>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-700">{tongTot}</p>
            <p className="text-xs text-slate-500">Tốt</p>
            <p className="text-sm font-semibold text-amber-600 leading-tight">{tongTB} trung bình</p>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rose-600">{tongXC}</p>
            <p className="text-xs text-slate-500">Xuống cấp</p>
            {tongChua > 0 && <p className="text-xs text-slate-400 leading-tight">{tongChua} chưa đánh giá</p>}
          </div>
        </div>
      </div>

      {/* Bộ lọc phường */}
      <div className="flex flex-wrap gap-2 mb-5 items-center">
        <span className="text-sm font-semibold text-slate-600">Phường/xã:</span>
        <Link
          href="/dashboard/phong-htkt/bao-tri-duong"
          className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${!filterDiaBan ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 hover:border-emerald-400'}`}
        >
          Tất cả
        </Link>
        {dsDiaBan.map(dia => (
          <Link
            key={dia}
            href={`/dashboard/phong-htkt/bao-tri-duong?phuong=${encodeURIComponent(dia)}`}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${filterDiaBan === dia ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 hover:border-emerald-400'}`}
          >
            {dia}
          </Link>
        ))}
      </div>

      {/* Bảng + CRUD */}
      <BaoTriManageTable
        phuongList={theoPhung}
        dsDiaBan={dsDiaBan}
        canEdit={canEdit}
        wardDiaBan={wardDiaBan}
        filterDiaBan={filterDiaBan}
      />

      <p className="text-xs text-slate-400 mt-4">
        Dữ liệu từ module Trung tâm Quản lý, bảo trì GT &amp; HTKT.
        {canEdit && ' Cán bộ phòng HTKT và Trung tâm Bảo trì có thể thêm, sửa, xoá tuyến đường trực tiếp.'}
      </p>
    </div>
  )
}
