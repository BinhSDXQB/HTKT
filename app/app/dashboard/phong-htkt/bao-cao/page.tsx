import Link from 'next/link'
import { ChevronRight, BarChart3, CheckCircle2, Clock, AlertTriangle, ListTodo } from 'lucide-react'
import { getBaoCao, type KyType, type DongThongKe } from '@/lib/htkt/bao-cao'
import { KyFilter } from './ky-filter'

export const dynamic = 'force-dynamic'

const HTKT_TOCHUC_ID = 'cmpz3u7uf000bf0umpijd8stn'

type SP = { ky?: string; y?: string; q?: string; m?: string }

const TRANG_THAI_LABEL: Record<string, string> = {
  MOI: 'Mới', DANG_LAM: 'Đang làm', TAM_DUNG: 'Tạm dừng', CHO_DUYET: 'Chờ duyệt', HOAN_THANH: 'Hoàn thành', HUY: 'Hủy',
}
const TRANG_THAI_CLS: Record<string, string> = {
  MOI: 'bg-slate-100 text-slate-600', DANG_LAM: 'bg-amber-100 text-amber-700',
  TAM_DUNG: 'bg-orange-100 text-orange-700', CHO_DUYET: 'bg-violet-100 text-violet-700',
  HOAN_THANH: 'bg-emerald-100 text-emerald-700', HUY: 'bg-rose-100 text-rose-700',
}

function fmtDate(d: Date | null) {
  if (!d) return '—'
  const x = new Date(d)
  return `${String(x.getUTCDate()).padStart(2, '0')}/${String(x.getUTCMonth() + 1).padStart(2, '0')}/${x.getUTCFullYear()}`
}

function StatCard({ icon: Icon, label, value, cls }: { icon: typeof BarChart3; label: string; value: number | string; cls: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cls}`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  )
}

function BangThongKe({ tieuDe, cot, rows }: { tieuDe: string; cot: string; rows: DongThongKe[] }) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <p className="text-sm font-semibold text-slate-700 px-4 py-3 border-b bg-slate-50">{tieuDe}</p>
      <table className="w-full text-sm">
        <thead className="text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left font-semibold px-4 py-2">{cot}</th>
            <th className="text-center font-semibold px-2 py-2">Tổng</th>
            <th className="text-center font-semibold px-2 py-2">Hoàn thành</th>
            <th className="text-center font-semibold px-2 py-2">Đang làm</th>
            <th className="text-center font-semibold px-2 py-2">Quá hạn</th>
            <th className="text-center font-semibold px-2 py-2">% HT</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Không có dữ liệu trong kỳ.</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="px-4 py-2 font-medium text-slate-800">{r.ten}</td>
              <td className="px-2 py-2 text-center">{r.tong}</td>
              <td className="px-2 py-2 text-center text-emerald-700 font-semibold">{r.hoanThanh}</td>
              <td className="px-2 py-2 text-center text-amber-700">{r.dangLam}</td>
              <td className="px-2 py-2 text-center text-rose-600 font-semibold">{r.quaHan || ''}</td>
              <td className="px-2 py-2 text-center">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${r.tyLe >= 80 ? 'bg-emerald-100 text-emerald-700' : r.tyLe >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{r.tyLe}%</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function BaoCaoPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const now = new Date()
  const kyType = (['THANG', 'QUY', 'NAM'].includes(sp.ky ?? '') ? sp.ky : 'THANG') as KyType
  const y = parseInt(sp.y ?? '', 10) || now.getFullYear()
  const m = parseInt(sp.m ?? '', 10) || now.getMonth() + 1
  const q = parseInt(sp.q ?? '', 10) || Math.ceil((now.getMonth() + 1) / 3)

  const data = await getBaoCao(HTKT_TOCHUC_ID, kyType, y, q, m)
  const th = data.tongHop

  const years = [y - 1, y, y + 1]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
        <Link href="/dashboard/phong-htkt" className="hover:text-cyan-700">Phòng Hạ tầng kỹ thuật</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/phong-htkt/phan-cong" className="hover:text-cyan-700">Phân công</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Báo cáo định kỳ</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Báo cáo công việc — {data.kyLabel}</h1>
          <p className="text-sm text-slate-500">Thống kê theo người phụ trách &amp; lĩnh vực · Phòng Hạ tầng kỹ thuật</p>
        </div>
      </div>

      {/* Bộ lọc kỳ — Quý ↔ Tháng liên kết (chọn Quý chỉ hiện các tháng trong quý) */}
      <KyFilter kyType={kyType} y={y} q={q} m={m} years={years} />

      {/* Tổng hợp */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={ListTodo} label="Tổng công việc trong kỳ" value={th.tong} cls="bg-cyan-50 text-cyan-700" />
        <StatCard icon={CheckCircle2} label={`Hoàn thành (${th.tyLe}%)`} value={th.hoanThanh} cls="bg-emerald-50 text-emerald-700" />
        <StatCard icon={Clock} label="Đang thực hiện" value={th.dangLam + th.moi} cls="bg-amber-50 text-amber-700" />
        <StatCard icon={AlertTriangle} label="Quá hạn" value={th.quaHan} cls="bg-rose-50 text-rose-700" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <BangThongKe tieuDe="Theo cán bộ phụ trách" cot="Cán bộ" rows={data.theoNguoi} />
        <BangThongKe tieuDe="Theo lĩnh vực" cot="Lĩnh vực" rows={data.theoLinhVuc} />
      </div>

      {/* Danh sách giao ban */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <p className="text-sm font-semibold text-slate-700 px-4 py-3 border-b bg-slate-50">
          Danh sách công việc trong kỳ ({data.danhSach.length})
        </p>
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-semibold px-4 py-2">Mã</th>
              <th className="text-left font-semibold px-4 py-2">Công việc</th>
              <th className="text-left font-semibold px-4 py-2">Phụ trách</th>
              <th className="text-left font-semibold px-4 py-2">Hạn</th>
              <th className="text-center font-semibold px-4 py-2">Tiến độ</th>
              <th className="text-left font-semibold px-4 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.danhSach.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Chưa có công việc nào đến hạn trong kỳ này. Vào Phân công → “Tự sinh việc” để tạo báo cáo định kỳ.</td></tr>
            )}
            {data.danhSach.map((cv) => {
              const quaHan = cv.ngayHetHan && new Date(cv.ngayHetHan) < now && cv.trangThai !== 'HOAN_THANH' && cv.trangThai !== 'HUY'
              return (
                <tr key={cv.id}>
                  <td className="px-4 py-2 text-xs text-slate-400 whitespace-nowrap">{cv.maCongViec}</td>
                  <td className="px-4 py-2">
                    <Link href={`/dashboard/cong-viec/${cv.id}`} className="text-slate-800 hover:text-cyan-700">{cv.tieuDe}</Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{cv.nguoiPhuTrach ?? '—'}</td>
                  <td className={`px-4 py-2 whitespace-nowrap ${quaHan ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>{fmtDate(cv.ngayHetHan)}</td>
                  <td className="px-4 py-2 text-center text-slate-600">{cv.tienDo}%</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${TRANG_THAI_CLS[cv.trangThai] ?? 'bg-slate-100 text-slate-600'}`}>
                      {TRANG_THAI_LABEL[cv.trangThai] ?? cv.trangThai}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 mt-4">
        Số liệu tính theo công việc có hạn hoàn thành trong kỳ. Việc tự sinh từ Phân công (báo cáo tháng/quý/năm) và việc nhập tay đều được thống kê.
      </p>
    </div>
  )
}
