import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  Route, Lightbulb, Trees, Droplets,
  ClipboardList, Users, TrendingUp, Clock,
  MapPin, Database,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Nguồn thống kê: lớp VIEW v_htkt_* (mig 035) — chỉ dữ liệu phường/xã ĐÃ DUYỆT,
// cùng nguồn với trang báo cáo & chatbot. Không đếm các bảng legacy trống.

type TongHopRow = {
  nam: number | null
  soXa: number
  duongTuyen: number
  duongKm: number
  csKm: number
  cotDen: number
  tnKm: number
  cayXanh: number
  congVienSo: number
  capNuocHo: number
  baiDoXeSo: number
}

type TopXaRow = { tenXa: string; duongKm: number; cotDen: number }

async function getDashboardStats() {
  const now = new Date()

  // 6 tháng gần nhất
  const months6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { label: `T${d.getMonth() + 1}`, from: d, to: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59) }
  })

  const [
    tongHopRows, topXaRows,
    cvTheoTrangThai, cvQuaHan,
    soCanBo, soTaiLieu, soNghiepVu, soGpmb,
    ...monthCounts
  ] = await Promise.all([
    db.$queryRaw<TongHopRow[]>`
      SELECT max(year)::int                        AS nam,
             count(*)::int                         AS "soXa",
             coalesce(sum(duong_so_tuyen), 0)::int AS "duongTuyen",
             coalesce(sum(duong_km), 0)::float8    AS "duongKm",
             coalesce(sum(chieu_sang_km), 0)::float8 AS "csKm",
             coalesce(sum(cot_den), 0)::int        AS "cotDen",
             coalesce(sum(thoat_nuoc_km), 0)::float8 AS "tnKm",
             coalesce(sum(cay_xanh_cay), 0)::int   AS "cayXanh",
             coalesce(sum(cong_vien_so), 0)::int   AS "congVienSo",
             coalesce(sum(cap_nuoc_ho_dan), 0)::int AS "capNuocHo",
             coalesce(sum(bai_do_xe_so), 0)::int   AS "baiDoXeSo"
        FROM v_htkt_tong_hop_xa
       WHERE year = (SELECT max(year) FROM v_htkt_tong_hop_xa)`,
    db.$queryRaw<TopXaRow[]>`
      SELECT ten_xa                        AS "tenXa",
             coalesce(duong_km, 0)::float8 AS "duongKm",
             coalesce(cot_den, 0)::int     AS "cotDen"
        FROM v_htkt_tong_hop_xa
       WHERE year = (SELECT max(year) FROM v_htkt_tong_hop_xa)
       ORDER BY duong_km DESC NULLS LAST
       LIMIT 5`,
    db.congViec.groupBy({
      by: ['trangThai'], _count: true,
      where: { deletedAt: null },
      orderBy: { _count: { trangThai: 'desc' } },
    }),
    db.congViec.count({
      where: { deletedAt: null, trangThai: { in: ['MOI', 'DANG_LAM'] }, ngayHetHan: { lt: now } },
    }),
    db.canBo.count({ where: { trangThai: { in: ['DANG_CONG_TAC', 'HOP_DONG'] } } }),
    db.taiLieu.count({ where: { deletedAt: null, trangThai: 'san_sang' } }),
    db.nghiepVuBanGhi.count({ where: { deletedAt: null } }),
    db.dsDuAnGpmb.count(),
    // Công việc tạo mới từng tháng trong 6 tháng
    ...months6.map(m => db.congViec.count({ where: { deletedAt: null, createdAt: { gte: m.from, lte: m.to } } })),
  ])

  const th: TongHopRow = tongHopRows[0] ?? {
    nam: null, soXa: 0, duongTuyen: 0, duongKm: 0, csKm: 0, cotDen: 0,
    tnKm: 0, cayXanh: 0, congVienSo: 0, capNuocHo: 0, baiDoXeSo: 0,
  }
  const cvDangLam = cvTheoTrangThai
    .filter(x => x.trangThai === 'MOI' || x.trangThai === 'DANG_LAM')
    .reduce((s, x) => s + x._count, 0)

  return {
    th, topXa: topXaRows, cvTheoTrangThai, cvDangLam, cvQuaHan,
    soCanBo, soTaiLieu, soNghiepVu, soGpmb,
    monthTrend: months6.map((m, i) => ({ label: m.label, count: monthCounts[i] as number })),
  }
}

const nf = (n: number) => n.toLocaleString('vi-VN')

export default async function DashboardPage() {
  const user = await requireAuth()
  const stats = await getDashboardStats()
  const { th } = stats

  const statCards = [
    {
      title: 'Đường giao thông',
      value: `${nf(Math.round(th.duongKm))} km`,
      desc: `${nf(th.duongTuyen)} tuyến · ${th.soXa} xã/phường có dữ liệu`,
      icon: Route,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Điện chiếu sáng',
      value: nf(th.cotDen),
      desc: `cột đèn · ${nf(Math.round(th.csKm))} km chiếu sáng`,
      icon: Lightbulb,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      title: 'Cây xanh đô thị',
      value: nf(th.cayXanh),
      desc: `cây · ${nf(th.congVienSo)} công viên/quảng trường`,
      icon: Trees,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Thoát nước',
      value: `${nf(Math.round(th.tnKm))} km`,
      desc: `tuyến cống · ${nf(th.baiDoXeSo)} bãi đỗ xe`,
      icon: Droplets,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
    },
    {
      title: 'Công việc đang thực hiện',
      value: nf(stats.cvDangLam),
      desc: stats.cvQuaHan > 0 ? `${stats.cvQuaHan} việc quá hạn` : 'Không có việc quá hạn',
      icon: ClipboardList,
      color: stats.cvQuaHan > 0 ? 'text-red-600' : 'text-indigo-600',
      bg: stats.cvQuaHan > 0 ? 'bg-red-50' : 'bg-indigo-50',
    },
    {
      title: 'Cán bộ đang công tác',
      value: nf(stats.soCanBo),
      desc: `${nf(stats.soTaiLieu)} tài liệu · ${nf(stats.soNghiepVu)} hồ sơ nghiệp vụ`,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Xin chào, {user.name}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Tổng quan hệ thống hạ tầng kỹ thuật
          {th.nam ? ` — số liệu chính thức năm ${th.nam}` : ''}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <div className="text-3xl font-bold text-slate-800">{card.value}</div>
                <p className="text-xs text-slate-500 mt-1">{card.desc}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              Hạ tầng theo lĩnh vực{th.nam ? ` (năm ${th.nam})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: 'Đường giao thông', value: `${nf(Math.round(th.duongKm))} km / ${nf(th.duongTuyen)} tuyến` },
                { label: 'Điện chiếu sáng', value: `${nf(Math.round(th.csKm))} km / ${nf(th.cotDen)} cột` },
                { label: 'Thoát nước', value: `${nf(Math.round(th.tnKm))} km` },
                { label: 'Cây xanh', value: `${nf(th.cayXanh)} cây` },
                { label: 'Công viên / quảng trường', value: nf(th.congVienSo) },
                { label: 'Cấp nước (hộ dân khảo sát)', value: nf(th.capNuocHo) },
                { label: 'Bãi đỗ xe', value: nf(th.baiDoXeSo) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Công việc phòng/ban theo trạng thái
            </CardTitle>
          </CardHeader>
          <CardContent><CongViecByStatus data={stats.cvTheoTrangThai} /></CardContent>
        </Card>
      </div>

      {/* Xu hướng + địa bàn + dữ liệu hệ thống */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Công việc tạo mới 6 tháng */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              Công việc mới 6 tháng gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.monthTrend.map((m) => {
                const max = Math.max(...stats.monthTrend.map(x => x.count), 1)
                const pct = Math.round((m.count / max) * 100)
                return (
                  <div key={m.label} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-6 shrink-0">{m.label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 w-6 text-right">{m.count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top xã/phường theo km đường */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              Top địa bàn theo km đường
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topXa.length === 0
              ? <p className="text-xs text-slate-400 py-2">Chưa có dữ liệu</p>
              : <div className="space-y-2">
                {stats.topXa.map((w) => {
                  const max = Math.max(...stats.topXa.map(x => x.duongKm), 1)
                  const pct = Math.round((w.duongKm / max) * 100)
                  return (
                    <div key={w.tenXa} className="flex items-center gap-2">
                      <div className="text-xs text-slate-600 w-28 shrink-0 min-w-0">
                        <span className="truncate block" title={w.tenXa}>{w.tenXa}</span>
                      </div>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 w-12 text-right">{Math.round(w.duongKm)} km</span>
                    </div>
                  )
                })}
              </div>
            }
          </CardContent>
        </Card>

        {/* Dữ liệu hệ thống */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <Database className="w-4 h-4 text-green-600" />
              Dữ liệu hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Xã/phường có số liệu chính thức</p>
              <p className="text-xl font-bold text-slate-800">{th.soXa} / 78</p>
              <div className="bg-slate-100 rounded-full h-2 mt-1">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.round((th.soXa / 78) * 100)}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t space-y-1.5">
              {[
                { label: 'Hồ sơ nghiệp vụ các phòng', value: nf(stats.soNghiepVu) },
                { label: 'Dự án GPMB đường sắt', value: nf(stats.soGpmb) },
                { label: 'Tài liệu tra cứu (RAG)', value: nf(stats.soTaiLieu) },
                { label: 'Hồ sơ cán bộ', value: nf(stats.soCanBo) },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center text-xs py-0.5">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CongViecByStatus({ data }: {
  data: Array<{ trangThai: string; _count: number }>
}) {
  const statusLabels: Record<string, { label: string; color: string }> = {
    MOI: { label: 'Mới', color: 'bg-slate-100 text-slate-700' },
    DANG_LAM: { label: 'Đang thực hiện', color: 'bg-yellow-100 text-yellow-700' },
    TAM_DUNG: { label: 'Tạm dừng', color: 'bg-orange-100 text-orange-700' },
    CHO_DUYET: { label: 'Chờ duyệt', color: 'bg-blue-100 text-blue-700' },
    HOAN_THANH: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
    HUY: { label: 'Huỷ', color: 'bg-red-100 text-red-700' },
  }

  if (data.length === 0) {
    return <p className="text-sm text-slate-400 py-4 text-center">Chưa có công việc</p>
  }

  return (
    <div className="space-y-2">
      {data.map((item) => {
        const meta = statusLabels[item.trangThai] ?? { label: item.trangThai, color: 'bg-slate-100 text-slate-700' }
        return (
          <div key={item.trangThai} className="flex items-center justify-between py-1.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
              {meta.label}
            </span>
            <span className="text-sm font-semibold text-slate-800">{item._count}</span>
          </div>
        )
      })}
    </div>
  )
}
