import Link from 'next/link'
import { requireOfficeAccess } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSoToChucIds } from '@/lib/office-scope'
import { MUC_XEP_LOAI_LABEL, mucXepLoaiBadgeClass, HINH_THUC_KY_LUAT_LABEL } from '@/lib/office-labels'
import { Briefcase, ChevronRight, ClipboardCheck, ShieldAlert } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null | undefined): string {
  return d ? new Date(d).toLocaleDateString('vi-VN') : '—'
}

export default async function DanhGiaPage({ searchParams }: { searchParams: Promise<{ nam?: string }> }) {
  await requireOfficeAccess()
  const sp = await searchParams
  const nam = sp.nam ? parseInt(sp.nam, 10) : new Date().getFullYear()
  const soIds = await getSoToChucIds()

  const canBoList = await db.canBo.findMany({
    where: { toChucId: { in: soIds } },
    include: {
      chucDanh: true,
      annualEvaluations: { where: { nam } },
    },
    orderBy: [{ chucDanh: { capQuanLy: 'asc' } }, { hoTen: 'asc' }],
  })

  const discipline = await db.officeDisciplineRecord.findMany({
    where: { canBo: { toChucId: { in: soIds } } },
    include: { canBo: true },
    orderBy: { tuNgay: 'desc' },
  })

  const daDanhGia = canBoList.filter((c) => c.annualEvaluations.length > 0).length
  const chuaDanhGia = canBoList.length - daDanhGia
  const yearOpts = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/van-phong-so" className="hover:text-indigo-700 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />Văn phòng Sở
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Đánh giá, xếp loại & kỷ luật</span>
      </nav>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-900">Đánh giá, xếp loại hằng năm</h1>
        </div>
        <form className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Năm:</label>
          <select name="nam" defaultValue={nam} className="h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500">
            {yearOpts.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button type="submit" className="h-9 px-3 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Xem</button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white p-3">
          <p className="text-xs text-slate-500">Tổng cán bộ</p>
          <p className="text-2xl font-bold text-slate-900">{canBoList.length}</p>
        </div>
        <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-3">
          <p className="text-xs text-emerald-700">Đã đánh giá {nam}</p>
          <p className="text-2xl font-bold text-emerald-700">{daDanhGia}</p>
        </div>
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-3">
          <p className="text-xs text-amber-700">Chưa đánh giá {nam}</p>
          <p className="text-2xl font-bold text-amber-700">{chuaDanhGia}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Cán bộ</th>
              <th className="px-4 py-2.5 font-semibold">Chức danh</th>
              <th className="px-4 py-2.5 font-semibold">Xếp loại {nam}</th>
              <th className="px-4 py-2.5 font-semibold">CSTĐ</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {canBoList.map((cb) => {
              const ev = cb.annualEvaluations[0]
              return (
                <tr key={cb.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{cb.hoTen}</td>
                  <td className="px-4 py-2.5 text-slate-600">{cb.chucDanh?.ten ?? cb.chucVu ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    {ev ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${mucXepLoaiBadgeClass(ev.mucXepLoai)}`}>
                        {MUC_XEP_LOAI_LABEL[ev.mucXepLoai] ?? ev.mucXepLoai}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600">Chưa đánh giá</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{ev?.laChienSiThiDua ? 'Có' : '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/dashboard/van-phong-so/ho-so/${cb.id}`} className="text-indigo-600 hover:underline text-sm font-medium inline-flex items-center gap-1">
                      Hồ sơ <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              )
            })}
            {canBoList.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Chưa có dữ liệu cán bộ Văn phòng Sở.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Kỷ luật */}
      <div className="flex items-center gap-2 pt-2">
        <ShieldAlert className="w-5 h-5 text-red-600" />
        <h2 className="text-base font-bold text-slate-900">Kỷ luật, kéo dài nâng lương</h2>
        <span className="ml-1 text-sm text-slate-500">({discipline.length})</span>
      </div>
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Cán bộ</th>
              <th className="px-4 py-2.5 font-semibold">Hình thức</th>
              <th className="px-4 py-2.5 font-semibold">Từ ngày</th>
              <th className="px-4 py-2.5 font-semibold">Đến ngày</th>
              <th className="px-4 py-2.5 font-semibold text-right">Kéo dài NL (tháng)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {discipline.map((k) => (
              <tr key={k.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-900">{k.canBo.hoTen}</td>
                <td className="px-4 py-2.5 text-red-700">{HINH_THUC_KY_LUAT_LABEL[k.hinhThuc] ?? k.hinhThuc}</td>
                <td className="px-4 py-2.5 text-slate-600">{fmtDate(k.tuNgay)}</td>
                <td className="px-4 py-2.5 text-slate-600">{k.denNgay ? fmtDate(k.denNgay) : '—'}</td>
                <td className="px-4 py-2.5 text-right text-slate-700">{k.soThangKeoDaiNangLuong ?? '—'}</td>
              </tr>
            ))}
            {discipline.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Không có dữ liệu kỷ luật.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
