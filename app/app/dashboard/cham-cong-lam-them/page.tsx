import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSoDonViOptions } from '@/lib/office-scope'
import { isOfficeOrAdmin, effectiveToChucId } from '@/lib/overtime/access'
import { OT_STATUS_LABEL } from '@/lib/overtime/roles'
import { MonthGrid } from '@/components/overtime/month-grid'
import { AutoFillButton } from '@/components/overtime/auto-fill-button'
import { Clock, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ChamCongLamThemPage({
  searchParams,
}: {
  searchParams: Promise<{ nam?: string; phong?: string }>
}) {
  const sp = await searchParams
  const user = await requireAuth()
  const office = isOfficeOrAdmin(user)
  const nowYear = new Date().getFullYear()
  const nam = Number(sp.nam) || nowYear

  // Phòng được phép chấm công
  let deptOptions: { id: string; ten: string }[] = []
  if (office) {
    deptOptions = (await getSoDonViOptions()).map((d) => ({ id: d.id, ten: d.ten }))
  } else {
    const myId = await effectiveToChucId(user)
    if (myId) {
      const t = await db.toChuc.findUnique({ where: { id: myId }, select: { id: true, ten: true } })
      if (t) deptOptions = [{ id: t.id, ten: t.ten }]
    }
  }

  const selectedPhong = sp.phong && deptOptions.some((d) => d.id === sp.phong)
    ? sp.phong
    : deptOptions[0]?.id ?? null

  // Bảng của phòng+năm đang chọn → map theo tháng
  const sheets = selectedPhong
    ? await db.overtimeTimesheet.findMany({
        where: { toChucId: selectedPhong, nam },
        select: { id: true, thang: true, trangThai: true, _count: { select: { entries: true } } },
        orderBy: { thang: 'asc' },
      })
    : []
  const existing: Record<number, { id: string; soNguoi: number }> = {}
  for (const s of sheets) existing[s.thang] = { id: s.id, soNguoi: s._count.entries }

  const years = [nowYear + 1, nowYear, nowYear - 1, nowYear - 2]

  function hrefWith(params: Record<string, string | number>) {
    const u = new URLSearchParams()
    u.set('nam', String(params.nam ?? nam))
    if (params.phong ?? selectedPhong) u.set('phong', String(params.phong ?? selectedPhong))
    return `/dashboard/cham-cong-lam-them?${u.toString()}`
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Chấm công làm thêm giờ</h1>
          <p className="text-sm text-slate-500">
            Theo từng phòng ban · mỗi tháng một bảng (T1…T12) · xuất Excel & Văn bản thỏa thuận
          </p>
        </div>
      </div>

      {deptOptions.length === 0 ? (
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 text-sm text-amber-800">
          Tài khoản của bạn chưa được gắn với phòng/đơn vị nào nên chưa thể tạo bảng chấm công.
          Vui lòng liên hệ Văn phòng Sở để cập nhật đơn vị công tác.
        </div>
      ) : (
        <>
          {/* Bộ chọn phòng (VP Sở) + năm */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {office && deptOptions.length > 1 && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <div className="flex flex-wrap gap-1">
                  {deptOptions.map((d) => (
                    <Link
                      key={d.id}
                      href={hrefWith({ phong: d.id })}
                      className={`text-xs px-2 py-1 rounded-lg border ${
                        d.id === selectedPhong ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      {d.ten}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-slate-900 text-sm">
                {deptOptions.find((d) => d.id === selectedPhong)?.ten ?? ''} — năm {nam}
              </p>
              <div className="flex gap-1">
                {years.map((y) => (
                  <Link
                    key={y}
                    href={hrefWith({ nam: y })}
                    className={`text-xs px-2 py-1 rounded-lg border ${
                      y === nam ? 'bg-amber-600 text-white border-amber-600' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {y}
                  </Link>
                ))}
              </div>
            </div>

            {selectedPhong && <MonthGrid toChucId={selectedPhong} nam={nam} existing={existing} />}

            <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
              <p className="text-xs text-slate-500">
                Bấm vào tháng đã chấm để mở lại; bấm tháng <span className="text-slate-700">“chưa chấm”</span> để tạo bảng mới và nạp danh sách cán bộ.
              </p>
              {selectedPhong && (
                <AutoFillButton
                  toChucId={selectedPhong}
                  nam={nam}
                  tenPhong={deptOptions.find((d) => d.id === selectedPhong)?.ten ?? 'phòng'}
                />
              )}
            </div>
          </div>

          {/* Tóm tắt trạng thái các bảng trong năm */}
          {sheets.length > 0 && (
            <div className="rounded-xl border bg-white mt-4 overflow-hidden">
              <div className="px-4 py-2 border-b bg-slate-50 text-sm font-semibold text-slate-900">Trạng thái các tháng đã chấm</div>
              <ul className="divide-y">
                {sheets.map((s) => (
                  <li key={s.id}>
                    <Link href={`/dashboard/cham-cong-lam-them/${s.id}`} className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-sm">
                      <span className="font-medium text-slate-800">Tháng {s.thang}/{nam}</span>
                      <span className="text-xs text-slate-500">{s._count.entries} người · {OT_STATUS_LABEL[s.trangThai] ?? s.trangThai}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
