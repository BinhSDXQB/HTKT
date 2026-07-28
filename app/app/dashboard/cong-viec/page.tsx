import Link from 'next/link'
import { ClipboardList, Plus, AlertTriangle, LayoutGrid, List as ListIcon, CalendarDays, GanttChartSquare } from 'lucide-react'
import { db } from '@/lib/db'
import { requireAuth, canViewAllCongViec } from '@/lib/auth'
import { congViecScopeWhere } from '@/app/actions/cong-viec'
import { lichScopeWhere } from '@/lib/lich-scope'
import { CalendarView, type LichItem, type TaskDeadline } from '@/components/cong-viec/calendar-view'
import { GanttView, type GanttTask } from '@/components/cong-viec/gantt-view'
import { SearchBox } from '@/components/cong-viec/search-box'
import { buildCongViecSearchAND } from '@/lib/cong-viec-search'
import { CONG_VIEC_TRANG_THAI, CONG_VIEC_UU_TIEN, TRANG_THAI_OPTIONS, UU_TIEN_OPTIONS } from '@/lib/cong-viec-labels'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null) {
  return d ? new Date(d).toLocaleDateString('vi-VN') : '—'
}
function pad(n: number) { return String(n).padStart(2, '0') }

type SP = { tt?: string; ut?: string; q?: string; qh?: string; view?: string; ym?: string }

/** Tạo href giữ nguyên các bộ lọc hiện tại, ghi đè (hoặc xoá khi giá trị rỗng) một số tham số. */
function hrefWith(current: SP, patch: SP): string {
  const merged: Record<string, string> = {}
  for (const [k, v] of Object.entries({ ...current, ...patch })) {
    if (v != null && v !== '') merged[k] = String(v)
  }
  const qs = new URLSearchParams(merged).toString()
  return qs ? `/dashboard/cong-viec?${qs}` : '/dashboard/cong-viec'
}

export default async function CongViecListPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireAuth()
  const sp = await searchParams
  const { tt, ut, q, qh, view, ym } = sp
  const isBoard = view === 'board'
  const isCalendar = view === 'calendar'
  const isGantt = view === 'gantt'
  const scope = await congViecScopeWhere()

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const quaHanCond = { ngayHetHan: { lt: today }, trangThai: { notIn: ['HOAN_THANH', 'HUY'] } }

  // ── Dữ liệu khung Lịch: lưới 6 tuần (bắt đầu Thứ 2) của tháng ?ym=YYYY-MM ──
  const nowD = new Date()
  const [yy, mm] = ym && /^\d{4}-\d{1,2}$/.test(ym) ? ym.split('-').map(Number) : [nowD.getFullYear(), nowD.getMonth() + 1]
  const ymNorm = `${yy}-${pad(mm)}`
  let lichItems: LichItem[] = []
  let taskDeadlines: TaskDeadline[] = []
  if (isCalendar) {
    const first = new Date(yy, mm - 1, 1)
    const offset = (first.getDay() + 6) % 7
    const gridStart = new Date(yy, mm - 1, 1 - offset)
    const gridEnd = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + 42)
    const [lichs, tasks] = await Promise.all([
      db.lichCaNhan.findMany({
        where: { ...lichScopeWhere(user), batDau: { gte: gridStart, lt: gridEnd } } as never,
        include: { user: { select: { name: true } } },
        orderBy: { batDau: 'asc' },
      }),
      db.congViec.findMany({
        where: { ...scope, ngayHetHan: { gte: gridStart, lt: gridEnd } } as never,
        select: { id: true, tieuDe: true, ngayHetHan: true, trangThai: true },
      }),
    ])
    lichItems = lichs.map((l) => ({
      id: l.id, tieuDe: l.tieuDe, loai: l.loai, mauSac: l.mauSac,
      batDau: l.batDau.toISOString(), ketThuc: l.ketThuc ? l.ketThuc.toISOString() : null,
      diaDiem: l.diaDiem, moTa: l.moTa, congKhai: l.congKhai, userId: l.userId, ownerName: l.user.name,
    }))
    taskDeadlines = tasks.filter((t) => t.ngayHetHan).map((t) => ({
      id: t.id, tieuDe: t.tieuDe, ngayHetHan: (t.ngayHetHan as Date).toISOString(), trangThai: t.trangThai,
    }))
  }

  // Where hiệu lực theo bộ lọc. Lưu ý: scope có thể chứa OR (phạm vi xem) → dùng
  // AND cho tìm kiếm để không ghi đè OR phạm vi.
  const where: Record<string, unknown> = { ...scope }
  if (qh) Object.assign(where, quaHanCond)
  else if (tt) where.trangThai = tt
  if (ut) where.uuTien = ut
  const searchAND = buildCongViecSearchAND(q)
  if (searchAND) where.AND = searchAND

  const [rows, statusGroups, quaHanCount, total] = await Promise.all([
    isCalendar ? Promise.resolve([]) : db.congViec.findMany({
      where: where as never,
      include: {
        toChuc: { select: { ten: true, tenVietTat: true } },
        loai: { select: { ten: true } },
        nguoiPhuTrach: { select: { name: true } },
        congViecCha: { select: { tieuDe: true } },
      },
      orderBy: [{ trangThai: 'asc' }, { ngayHetHan: 'asc' }, { createdAt: 'desc' }],
      take: 300,
    }),
    db.congViec.groupBy({ by: ['trangThai'], where: scope as never, _count: { _all: true } }),
    db.congViec.count({ where: { ...scope, ...quaHanCond } as never }),
    db.congViec.count({ where: scope as never }),
  ])

  const countOf = (st: string) => statusGroups.find((g) => g.trangThai === st)?._count._all ?? 0
  const isQuaHan = (r: { ngayHetHan: Date | null; trangThai: string }) =>
    r.ngayHetHan != null && new Date(r.ngayHetHan) < today && r.trangThai !== 'HOAN_THANH' && r.trangThai !== 'HUY'

  // Dữ liệu Gantt — lấy ĐỘNG từ rows (phòng/loại/việc cha/customFields qua FK & jsonb).
  const toISO = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : null)
  const ganttTasks: GanttTask[] = isGantt ? rows.map((r) => ({
    id: r.id, maCongViec: r.maCongViec, tieuDe: r.tieuDe,
    trangThai: r.trangThai, uuTien: r.uuTien, tienDo: r.tienDo,
    start: toISO(r.ngayBatDau), end: toISO(r.ngayHetHan),
    phong: r.toChuc?.tenVietTat || r.toChuc?.ten || '',
    loai: r.loai?.ten ?? null,
    cha: r.congViecCha?.tieuDe ?? null,
    phuTrach: r.nguoiPhuTrach?.name ?? null,
    custom: r.customFields && typeof r.customFields === 'object' && !Array.isArray(r.customFields)
      ? (r.customFields as Record<string, unknown>) : null,
  })) : []

  // Thẻ thống kê (bấm để lọc) — phản chiếu khung Dashboard của bản thiết kế gốc.
  const toList = { view: '', ym: '' }
  const stats = [
    { key: 'all',        label: 'Tổng việc',  value: total,                 active: !isCalendar && !tt && !qh, href: hrefWith(sp, { tt: '', qh: '', ...toList }), cls: 'text-slate-900' },
    { key: 'MOI',        label: 'Mới',        value: countOf('MOI'),        active: !isCalendar && tt === 'MOI' && !qh, href: hrefWith(sp, { tt: 'MOI', qh: '', ...toList }), cls: 'text-slate-700' },
    { key: 'DANG_LAM',   label: 'Đang làm',   value: countOf('DANG_LAM'),   active: !isCalendar && tt === 'DANG_LAM' && !qh, href: hrefWith(sp, { tt: 'DANG_LAM', qh: '', ...toList }), cls: 'text-blue-700' },
    { key: 'CHO_DUYET',  label: 'Chờ duyệt',  value: countOf('CHO_DUYET'),  active: !isCalendar && tt === 'CHO_DUYET' && !qh, href: hrefWith(sp, { tt: 'CHO_DUYET', qh: '', ...toList }), cls: 'text-violet-700' },
    { key: 'HOAN_THANH', label: 'Hoàn thành', value: countOf('HOAN_THANH'), active: !isCalendar && tt === 'HOAN_THANH' && !qh, href: hrefWith(sp, { tt: 'HOAN_THANH', qh: '', ...toList }), cls: 'text-green-700' },
    { key: 'qh',         label: 'Quá hạn',    value: quaHanCount,           active: !isCalendar && !!qh, href: hrefWith(sp, { qh: '1', tt: '', ...toList }), cls: 'text-red-600' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Quản lý công việc</h1>
            <p className="text-sm text-slate-500">
              {canViewAllCongViec(user) ? 'Toàn bộ công việc các phòng' : 'Công việc của phòng & việc liên quan đến bạn'} · {total} việc
            </p>
          </div>
        </div>
        <Link href="/dashboard/cong-viec/moi" className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Tạo công việc
        </Link>
      </div>

      {/* Thẻ thống kê tổng quan — bấm để lọc */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
        {stats.map((s) => (
          <Link key={s.key} href={s.href}
            className={`rounded-xl border bg-white px-4 py-3 transition hover:shadow-sm ${s.active ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-slate-300'}`}>
            <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Thanh công cụ: tìm kiếm + lọc ưu tiên + chuyển khung nhìn */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        {!isCalendar && (
          <>
            <SearchBox
              defaultValue={q || ''}
              hidden={{ tt, ut, qh, view: isBoard ? 'board' : undefined }}
            />

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1">Ưu tiên:</span>
              <Link href={hrefWith(sp, { ut: '' })}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${!ut ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:border-slate-300'}`}>Tất cả</Link>
              {UU_TIEN_OPTIONS.map((o) => (
                <Link key={o.value} href={hrefWith(sp, { ut: o.value })}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border ${ut === o.value ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:border-slate-300'}`}>{o.label}</Link>
              ))}
            </div>
          </>
        )}

        <div className="lg:ml-auto inline-flex rounded-lg border bg-white overflow-hidden">
          <Link href={hrefWith(sp, { view: '', ym: '' })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${!isBoard && !isCalendar && !isGantt ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <ListIcon className="w-3.5 h-3.5" /> Danh sách
          </Link>
          <Link href={hrefWith(sp, { view: 'board', ym: '' })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-l ${isBoard ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <LayoutGrid className="w-3.5 h-3.5" /> Bảng
          </Link>
          <Link href={hrefWith(sp, { view: 'gantt', ym: '' })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-l ${isGantt ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <GanttChartSquare className="w-3.5 h-3.5" /> Gantt
          </Link>
          <Link href={hrefWith(sp, { view: 'calendar' })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-l ${isCalendar ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <CalendarDays className="w-3.5 h-3.5" /> Lịch
          </Link>
        </div>
      </div>

      {isCalendar ? (
        <CalendarView ym={ymNorm} events={lichItems} tasks={taskDeadlines} meId={user.id} canShare={!!user.toChucId} />
      ) : isGantt ? (
        <GanttView tasks={ganttTasks} />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-slate-500 text-sm">
          {q || ut || tt || qh ? 'Không có công việc khớp bộ lọc.' : <>Chưa có công việc nào. Bấm <span className="font-medium text-blue-600">Tạo công việc</span> để bắt đầu.</>}
        </div>
      ) : isBoard ? (
        /* ── KHUNG BẢNG (KANBAN) THEO TRẠNG THÁI ── */
        <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-3 overflow-x-auto pb-2">
          {TRANG_THAI_OPTIONS.map((st) => {
            const items = rows.filter((r) => r.trangThai === st.value)
            const meta = CONG_VIEC_TRANG_THAI[st.value]
            return (
              <div key={st.value} className="rounded-xl bg-slate-50 border p-2.5">
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.cls}`}>{st.label}</span>
                  <span className="text-xs text-slate-400 font-medium">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((r) => {
                    const uu = CONG_VIEC_UU_TIEN[r.uuTien] ?? { label: r.uuTien, cls: 'bg-slate-100 text-slate-600' }
                    const quaHan = isQuaHan(r)
                    return (
                      <Link key={r.id} href={`/dashboard/cong-viec/${r.id}`}
                        className="block rounded-lg border bg-white p-3 hover:shadow-sm hover:border-blue-300 transition">
                        <p className="text-sm font-medium text-slate-900 line-clamp-2">{r.tieuDe}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${uu.cls}`}>{uu.label}</span>
                          {r.ngayHetHan && (
                            <span className={`inline-flex items-center gap-1 text-[11px] ${quaHan ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                              {quaHan && <AlertTriangle className="w-3 h-3" />}{fmtDate(r.ngayHetHan)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                          <span className="truncate">{r.nguoiPhuTrach?.name || r.toChuc?.tenVietTat || ''}</span>
                          <span>{r.tienDo}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
                          <div className="h-full bg-blue-500" style={{ width: `${r.tienDo}%` }} />
                        </div>
                      </Link>
                    )
                  })}
                  {items.length === 0 && <p className="text-xs text-slate-300 text-center py-3">—</p>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── KHUNG DANH SÁCH ── */
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">Công việc</th>
                <th className="text-left font-medium px-3 py-2.5 hidden md:table-cell">Phòng</th>
                <th className="text-left font-medium px-3 py-2.5 hidden lg:table-cell">Phụ trách</th>
                <th className="text-left font-medium px-3 py-2.5">Ưu tiên</th>
                <th className="text-left font-medium px-3 py-2.5">Hạn</th>
                <th className="text-left font-medium px-3 py-2.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => {
                const tThai = CONG_VIEC_TRANG_THAI[r.trangThai] ?? { label: r.trangThai, cls: 'bg-slate-100 text-slate-700' }
                const uu = CONG_VIEC_UU_TIEN[r.uuTien] ?? { label: r.uuTien, cls: 'bg-slate-100 text-slate-600' }
                const quaHan = isQuaHan(r)
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/dashboard/cong-viec/${r.id}`} className="font-medium text-slate-900 hover:text-blue-700">{r.tieuDe}</Link>
                      <div className="text-xs text-slate-400">{r.maCongViec}{r.loai ? ` · ${r.loai.ten}` : ''} · {r.tienDo}%</div>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-slate-600">{r.toChuc?.tenVietTat || r.toChuc?.ten || '—'}</td>
                    <td className="px-3 py-2.5 hidden lg:table-cell text-slate-600">{r.nguoiPhuTrach?.name || '—'}</td>
                    <td className="px-3 py-2.5"><span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${uu.cls}`}>{uu.label}</span></td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs ${quaHan ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                        {quaHan && <AlertTriangle className="w-3.5 h-3.5" />}{fmtDate(r.ngayHetHan)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5"><span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${tThai.cls}`}>{tThai.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
