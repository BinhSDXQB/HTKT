import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  BarChart3, ChevronRight, TrendingUp, CheckCircle2, AlertTriangle,
  XCircle, Upload, Map, Zap, TreePine, Droplets, Waves, ParkingSquare,
  Building2, Filter,
} from 'lucide-react'

// ── Chỉ số tổng hợp thực tế theo lĩnh vực (column index + đơn vị) ────────────
const CAT_METRIC: Record<string, { idx: number; unit: string }> = {
  DUONG:           { idx: 4, unit: 'km'   }, // Chiều dài tuyến
  DIEN_CHIEU_SANG: { idx: 3, unit: 'cột'  }, // Số cột đèn
  THOAT_NUOC_BC:   { idx: 5, unit: 'm'    }, // Tổng chiều dài tuyến
  CAY_XANH:        { idx: 4, unit: 'cây'  }, // Số lượng cây
  CONG_VIEN:       { idx: 3, unit: 'm²'   }, // Diện tích
  CAP_NUOC_BC:     { idx: 3, unit: 'hộ'   }, // Số hộ gia đình
  KHAC:            { idx: 3, unit: 'm²'   }, // Diện tích bãi đỗ xe
}

// ── 5 danh mục bắt buộc theo dõi ─────────────────────────────────────────────
const REQUIRED_CATS = [
  { key: 'DUONG',           short: 'Đường GT', icon: Map,           color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-300'    },
  { key: 'DIEN_CHIEU_SANG', short: 'Điện CS',  icon: Zap,           color: 'text-yellow-600',  bg: 'bg-yellow-50',  border: 'border-yellow-300'  },
  { key: 'THOAT_NUOC_BC',   short: 'Thoát nước',icon: Droplets,     color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-300'  },
  { key: 'CAY_XANH',        short: 'Cây xanh', icon: TreePine,      color: 'text-green-600',   bg: 'bg-green-50',   border: 'border-green-300'   },
  { key: 'CAP_NUOC_BC',     short: 'Cấp nước', icon: Waves,         color: 'text-cyan-600',    bg: 'bg-cyan-50',    border: 'border-cyan-300'    },
]
const OPTIONAL_CATS = [
  { key: 'CONG_VIEN',       short: 'Công viên',icon: Building2,     color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-300' },
  { key: 'KHAC',            short: 'Bãi đỗ xe',icon: ParkingSquare, color: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-300'   },
]
const ALL_CATS = [...REQUIRED_CATS, ...OPTIONAL_CATS]

type WardStatus = 'DAY_DU' | 'THIEU' | 'CHUA_NOP'
const STATUS_META = {
  DAY_DU:   { label: 'Đầy đủ',        badge: 'bg-green-100 text-green-700',  icon: CheckCircle2,  dot: 'bg-green-500'  },
  THIEU:    { label: 'Thiếu danh mục', badge: 'bg-orange-100 text-orange-700',icon: AlertTriangle, dot: 'bg-orange-400' },
  CHUA_NOP: { label: 'Chưa nộp',       badge: 'bg-red-100 text-red-600',      icon: XCircle,       dot: 'bg-red-500'   },
}

type SP = { filter?: string; q?: string }

export default async function TheoDoiPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAuth()
  const sp = await searchParams
  const filter = sp.filter ?? 'all'
  const q = (sp.q ?? '').trim().toLowerCase()

  // Tất cả phường/xã
  const allWards = await db.administrativeUnit.findMany({
    where: { type: 'PHUONG_XA', isActive: true },
    select: { id: true, name: true, code: true, trungTamHc: true, truocSapNhap: true, danSo: true, dienTichKm2: true },
    orderBy: { name: 'asc' },
  })

  // ── SQL thuần qua 7 bảng chuẩn hoá — GROUP BY wardId, SUM() trực tiếp ──────
  const [duong, dienCS, thoatNuoc, cayXanh, congVien, capNuoc, baiDoXe] = await Promise.all([
    db.reportDuong.groupBy({ by: ['wardId'], _sum: { chieuDaiKm: true }, _count: { id: true }, _max: { updatedAt: true } }),
    db.reportDienCS.groupBy({ by: ['wardId'], _sum: { soColDen: true, chieuDaiCSKm: true }, _count: { id: true }, _max: { updatedAt: true } }),
    db.reportThoatNuoc.groupBy({ by: ['wardId'], _sum: { chieuDaiM: true }, _count: { id: true }, _max: { updatedAt: true } }),
    db.reportCayXanh.groupBy({ by: ['wardId'], _sum: { soLuongCay: true }, _count: { id: true }, _max: { updatedAt: true } }),
    db.reportCongVien.groupBy({ by: ['wardId'], _sum: { dienTichM2: true }, _count: { id: true }, _max: { updatedAt: true } }),
    db.reportCapNuoc.groupBy({ by: ['wardId'], _sum: { soHoGiaDinh: true }, _count: { id: true }, _max: { updatedAt: true } }),
    db.reportBaiDoXe.groupBy({ by: ['wardId'], _sum: { dienTichM2: true }, _count: { id: true }, _max: { updatedAt: true } }),
  ])

  // Gom thành Map wardId → category → { value, rows, lastUpdate }
  type CatData = { value: number; rows: number; lastUpdate: Date }
  function toMap<T extends { wardId: string; _count: { id: number }; _max: { updatedAt: Date | null } }>(
    arr: T[],
    sumKey: string,
  ): Record<string, CatData> {
    return Object.fromEntries(arr.map((r) => [r.wardId, {
      value: (r as unknown as { _sum: Record<string, number | null> })._sum[sumKey] ?? 0,
      rows:  r._count.id,
      lastUpdate: r._max.updatedAt ?? new Date(0),
    }]))
  }

  const maps: Record<string, Record<string, CatData>> = {
    DUONG:           toMap(duong,      'chieuDaiKm'),
    DIEN_CHIEU_SANG: toMap(dienCS,     'soColDen'),
    THOAT_NUOC_BC:   toMap(thoatNuoc, 'chieuDaiM'),
    CAY_XANH:        toMap(cayXanh,   'soLuongCay'),
    CONG_VIEN:       toMap(congVien,  'dienTichM2'),
    CAP_NUOC_BC:     toMap(capNuoc,   'soHoGiaDinh'),
    KHAC:            toMap(baiDoXe,   'dienTichM2'),
  }

  const wardList = allWards.map(w => {
    // Gom cats từ các bảng SQL
    const cats: Record<string, CatData> = {}
    for (const [catKey, catMap] of Object.entries(maps)) {
      if (catMap[w.id]) cats[catKey] = catMap[w.id]
    }

    const filled = REQUIRED_CATS.filter(c => !!cats[c.key]).length
    const status: WardStatus = filled === REQUIRED_CATS.length ? 'DAY_DU' : filled > 0 ? 'THIEU' : 'CHUA_NOP'
    const lastUpdate = Object.values(cats).reduce<Date | null>((m, v) => (!m || v.lastUpdate > m ? v.lastUpdate : m), null)
    const totalRows  = Object.values(cats).reduce((s, v) => s + v.rows, 0)
    
    // Phân loại Vùng lõi: Các phường hiện tại hoặc xã có thị trấn/thị xã cũ trước sáp nhập
    const isCore = w.name.startsWith('Phường') ||
      !!(w.trungTamHc && (w.trungTamHc.toLowerCase().includes('thị trấn') || w.trungTamHc.toLowerCase().includes('thị xã'))) ||
      !!(w.truocSapNhap && (w.truocSapNhap.toLowerCase().includes('thị trấn') || w.truocSapNhap.toLowerCase().includes('thị xã')))

    const type = isCore ? 'Vùng lõi (Phường & Xã trung tâm)' : 'Vùng khác (Xã nông thôn & hải đảo)'
    return { ...w, cats, filled, status, lastUpdate, totalRows, type, isCore }
  })

  // Tính toán tỷ lệ đô thị vùng lõi phục vụ thống kê cuối trang
  const coreWardsForCalc = wardList.filter(w => w.isCore)
  const coreWardsIds = new Set(coreWardsForCalc.map(w => w.id))

  const corePopVal = coreWardsForCalc.reduce((s, w) => s + (w.danSo ?? 0), 0)
  
  const coreRoadKm = duong
    .filter(r => coreWardsIds.has(r.wardId))
    .reduce((s, r) => s + (r._sum.chieuDaiKm ?? 0), 0)

  // Tính "Tỷ lệ đất giao thông" theo yêu cầu: Sheet DUONG GT (T), Cột E (chieuDaiKm, km) * 1000 * Cột F (nenM, m = NỀN ĐƯỜNG)
  // = diện tích nền đường (m2). Tính cho CẢ vùng lõi đô thị lẫn TOÀN TỈNH để so sánh.
  const allRoads = await db.reportDuong.findMany({
    select: {
      wardId: true,
      chieuDaiKm: true,
      nenM: true,
    },
  })

  let coreRoadAreaM2 = 0
  let provinceRoadAreaM2 = 0
  for (const r of allRoads) {
    const areaM2 = (r.chieuDaiKm ?? 0) * 1000 * (r.nenM ?? 0)
    provinceRoadAreaM2 += areaM2
    if (coreWardsIds.has(r.wardId)) coreRoadAreaM2 += areaM2
  }
  const coreRoadAreaKm2 = coreRoadAreaM2 / 1000000
  const provinceRoadAreaKm2 = provinceRoadAreaM2 / 1000000

  const coreNaturalAreaKm2 = coreWardsForCalc.reduce((s, w) => s + Number(w.dienTichKm2 ?? 0), 0)
  const provinceNaturalAreaKm2 = wardList.reduce((s, w) => s + Number(w.dienTichKm2 ?? 0), 0)

  const trafficLandRatioPct = coreNaturalAreaKm2 > 0
    ? (coreRoadAreaKm2 / coreNaturalAreaKm2) * 100
    : 0
  const provinceTrafficLandRatioPct = provinceNaturalAreaKm2 > 0
    ? (provinceRoadAreaKm2 / provinceNaturalAreaKm2) * 100
    : 0

  const coreDienCSKm = dienCS
    .filter(r => coreWardsIds.has(r.wardId))
    .reduce((s, r) => s + (r._sum.chieuDaiCSKm ?? 0), 0)

  // Nếu chieuDaiCSKm được lưu bằng đơn vị mét (như 1.483.382,12), chia cho 1000 để quy về km
  const coreDienCSKmNormalized = coreDienCSKm > 10000 ? coreDienCSKm / 1000 : coreDienCSKm
  
  const coreIlluminationPct = coreRoadKm > 0
    ? (coreDienCSKmNormalized / coreRoadKm) * 100
    : 0

  const coreCongVienM2 = congVien
    .filter(r => coreWardsIds.has(r.wardId))
    .reduce((s, r) => s + (r._sum.dienTichM2 ?? 0), 0)

  const coreGreenPerCapitaVal = corePopVal > 0
    ? coreCongVienM2 / corePopVal
    : 0

  // Áp filter + tìm kiếm
  const filtered = wardList
    .filter(w => filter === 'all' || (filter === 'day_du' && w.status === 'DAY_DU') || (filter === 'thieu' && w.status === 'THIEU') || (filter === 'chua_nop' && w.status === 'CHUA_NOP'))
    .filter(w => !q || w.name.toLowerCase().includes(q))

  // KPI
  const total      = wardList.length
  const cntDayDu   = wardList.filter(w => w.status === 'DAY_DU').length
  const cntThieu   = wardList.filter(w => w.status === 'THIEU').length
  const cntChuaNop = wardList.filter(w => w.status === 'CHUA_NOP').length
  const pct        = Math.round((cntDayDu / total) * 100)

  // Group theo phân loại vùng: Vùng lõi → Vùng khác
  const TYPE_ORDER = ['Vùng lõi (Phường & Xã trung tâm)', 'Vùng khác (Xã nông thôn & hải đảo)']
  const groups: Record<string, typeof filtered> = {}
  for (const w of filtered) {
    if (!groups[w.type]) groups[w.type] = []
    groups[w.type].push(w)
  }

  const fmt = (d: Date | null) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/bao-cao" className="hover:text-blue-700 flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5" />Báo cáo
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Theo dõi báo cáo phường/xã</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Theo dõi nộp báo cáo — {total} phường/xã toàn tỉnh
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            5 danh mục bắt buộc: Đường · Điện chiếu sáng · Thoát nước · Cây xanh · Cấp nước
          </p>
        </div>
        <Link href="/dashboard/bao-cao/du-lieu-phuong-xa/import"
          className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-lg bg-green-700 text-white hover:bg-green-800">
          <Upload className="w-4 h-4" />Import báo cáo
        </Link>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border p-4 space-y-2">
          <p className="text-xs text-slate-500">Tiến độ hoàn thành</p>
          <p className="text-3xl font-bold text-blue-700">{pct}%</p>
          <div className="bg-slate-100 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-slate-400">{cntDayDu}/{total} đầy đủ</p>
        </div>
        <Link href="?filter=day_du" className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1 hover:bg-green-100 transition-colors block">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-xs font-medium text-green-700">Đầy đủ (5/5)</p>
          </div>
          <p className="text-3xl font-bold text-green-700">{cntDayDu}</p>
          <p className="text-xs text-green-600">phường/xã</p>
        </Link>
        <Link href="?filter=thieu" className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-1 hover:bg-orange-100 transition-colors block">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <p className="text-xs font-medium text-orange-700">Thiếu danh mục</p>
          </div>
          <p className="text-3xl font-bold text-orange-600">{cntThieu}</p>
          <p className="text-xs text-orange-600">phường/xã</p>
        </Link>
        <Link href="?filter=chua_nop" className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1 hover:bg-red-100 transition-colors block">
          <div className="flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-red-500" />
            <p className="text-xs font-medium text-red-700">Chưa nộp</p>
          </div>
          <p className="text-3xl font-bold text-red-600">{cntChuaNop}</p>
          <p className="text-xs text-red-600">phường/xã</p>
        </Link>
      </div>

      {/* Filter + tìm kiếm */}
      <div className="bg-white rounded-xl border p-3 flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        {[
          { key: 'all',      label: `Tất cả (${total})` },
          { key: 'day_du',   label: `Đầy đủ (${cntDayDu})` },
          { key: 'thieu',    label: `Thiếu (${cntThieu})` },
          { key: 'chua_nop', label: `Chưa nộp (${cntChuaNop})` },
        ].map(f => (
          <Link key={f.key}
            href={`?filter=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            className={`h-8 px-4 text-sm rounded-full transition-colors ${filter === f.key ? 'bg-blue-700 text-white font-medium' : 'border text-slate-600 hover:bg-slate-50'}`}>
            {f.label}
          </Link>
        ))}
        <form method="GET" className="flex items-center gap-2 ml-auto">
          <input type="hidden" name="filter" value={filter} />
          <input name="q" defaultValue={q}
            placeholder="Tìm tên phường/xã..."
            className="h-8 px-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-48" />
        </form>
        {filtered.length !== total && (
          <span className="text-xs text-slate-400">Hiển thị {filtered.length}/{total}</span>
        )}
      </div>

      {/* Bảng theo loại đơn vị */}
      {TYPE_ORDER.filter(t => groups[t]?.length).map(typeName => {
        const wards = groups[typeName]
        const tDayDu   = wards.filter(w => w.status === 'DAY_DU').length
        const tThieu   = wards.filter(w => w.status === 'THIEU').length
        const tChuaNop = wards.filter(w => w.status === 'CHUA_NOP').length

        return (
          <div key={typeName} className="bg-white rounded-xl border overflow-hidden shadow-sm">
            {/* Group header */}
            <div className="px-5 py-3 bg-slate-800 flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-white text-sm">
                {typeName} <span className="font-normal text-slate-400 text-xs">— {wards.length} đơn vị</span>
              </h3>
              <div className="flex items-center gap-4 text-xs">
                {tDayDu   > 0 && <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="w-3.5 h-3.5" />{tDayDu} đầy đủ</span>}
                {tThieu   > 0 && <span className="flex items-center gap-1 text-orange-400"><AlertTriangle className="w-3.5 h-3.5" />{tThieu} thiếu</span>}
                {tChuaNop > 0 && <span className="flex items-center gap-1 text-red-400"><XCircle className="w-3.5 h-3.5" />{tChuaNop} chưa nộp</span>}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-600 w-8">#</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-600 min-w-[150px]">Tên đơn vị</th>
                    {ALL_CATS.map(c => {
                      const Icon = c.icon
                      const req = REQUIRED_CATS.some(r => r.key === c.key)
                      return (
                        <th key={c.key} className="px-2 py-2.5 text-center min-w-[72px]">
                          <div className="flex flex-col items-center gap-0.5">
                            <Icon className={`w-3.5 h-3.5 ${c.color}`} />
                            <span className="font-medium">{c.short}</span>
                            {req && <span className="text-[9px] text-red-400">bắt buộc</span>}
                          </div>
                        </th>
                      )
                    })}
                    <th className="px-3 py-2.5 text-center font-semibold text-slate-600 min-w-[100px]">Trạng thái</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-slate-600 min-w-[85px]">Cập nhật</th>
                    <th className="px-3 py-2.5 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wards
                    .sort((a, b) => {
                      const ord: Record<WardStatus, number> = { DAY_DU: 0, THIEU: 1, CHUA_NOP: 2 }
                      return ord[a.status] - ord[b.status] || a.name.localeCompare(b.name, 'vi')
                    })
                    .map((ward, idx) => {
                      const meta = STATUS_META[ward.status]
                      const StatusIcon = meta.icon
                      return (
                        <tr key={ward.id}
                          className={ward.status === 'CHUA_NOP' ? 'bg-red-50/20 hover:bg-red-50/40'
                            : ward.status === 'THIEU' ? 'hover:bg-orange-50/30'
                            : 'hover:bg-green-50/20'}>
                          <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                              <span className="font-medium text-slate-800">{ward.name}</span>
                              {ward.isCore && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-semibold border border-amber-300">
                                  Vùng lõi
                                </span>
                              )}
                            </div>
                          </td>
                          {ALL_CATS.map(cat => {
                            const data = ward.cats[cat.key]
                            const isReq = REQUIRED_CATS.some(r => r.key === cat.key)
                            const metric = CAT_METRIC[cat.key]
                            if (!data) return (
                              <td key={cat.key} className="px-2 py-2.5 text-center">
                                {isReq
                                  ? <XCircle className="w-4 h-4 text-red-300 mx-auto" />
                                  : <span className="text-slate-200">—</span>}
                              </td>
                            )
                            const displayVal = data.value > 0
                              ? data.value % 1 === 0
                                ? data.value.toLocaleString('vi-VN')
                                : data.value.toFixed(2)
                              : '—'
                            return (
                              <td key={cat.key} className="px-2 py-2.5 text-center">
                                <div className={`inline-flex flex-col items-center rounded-lg px-2 py-0.5 ${cat.bg} border ${cat.border}`}>
                                  <CheckCircle2 className={`w-3 h-3 ${cat.color}`} />
                                  <span className={`font-bold text-[10px] ${cat.color}`}>{displayVal}</span>
                                  {metric && data.value > 0 && (
                                    <span className={`text-[9px] opacity-70 ${cat.color}`}>{metric.unit}</span>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.badge}`}>
                              <StatusIcon className="w-3 h-3" />
                              {ward.status === 'THIEU'
                                ? `Thiếu ${REQUIRED_CATS.length - ward.filled} mục`
                                : meta.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-400">{fmt(ward.lastUpdate)}</td>
                          <td className="px-3 py-2.5 text-center">
                            {ward.status === 'CHUA_NOP'
                              ? <Link href="/dashboard/bao-cao/du-lieu-phuong-xa/import"
                                  className="text-[10px] font-semibold text-red-600 hover:underline">Nộp →</Link>
                              : <Link href={`/dashboard/bao-cao/du-lieu-phuong-xa?wardId=${ward.id}`}
                                  className="text-[10px] font-semibold text-blue-600 hover:underline">Xem →</Link>}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
                {/* Tổng nhóm */}
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td colSpan={2} className="px-4 py-2 font-bold text-slate-700">Tổng {typeName}</td>
                    {ALL_CATS.map(cat => {
                      const total = wards.reduce((s, w) => s + (w.cats[cat.key]?.value ?? 0), 0)
                      const cnt   = wards.filter(w => !!w.cats[cat.key]).length
                      const metric = CAT_METRIC[cat.key]
                      const catMeta = ALL_CATS.find(c => c.key === cat.key)
                      const displayTotal = total > 0
                        ? total % 1 === 0 ? total.toLocaleString('vi-VN') : total.toFixed(2)
                        : '—'
                      return (
                        <td key={cat.key} className="px-2 py-2 text-center">
                          {cnt > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className={`font-bold text-[10px] ${catMeta?.color}`}>
                                {displayTotal}{metric && total > 0 ? ` ${metric.unit}` : ''}
                              </span>
                              <span className="text-[9px] text-slate-400">{cnt}/{wards.length} đơn vị</span>
                            </div>
                          ) : <span className="text-slate-300 text-[10px]">—</span>}
                        </td>
                      )
                    })}
                    <td colSpan={3} className="px-3 py-2 text-center text-[10px] text-slate-500">
                      {tDayDu}/{wards.length} đầy đủ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-slate-400">
          Không tìm thấy phường/xã nào phù hợp.
        </div>
      )}

      {/* ── DÒNG TỔNG HỢP TOÀN TỈNH ─────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-blue-700 overflow-hidden shadow-lg">
          <div className="px-5 py-3 bg-blue-700 flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              TỔNG HỢP — Phường, Xã, Đặc khu toàn tỉnh
              <span className="font-normal text-blue-200 text-xs">— {filtered.length} đơn vị</span>
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-green-300">
                <CheckCircle2 className="w-3.5 h-3.5" />{filtered.filter(w => w.status === 'DAY_DU').length} đầy đủ
              </span>
              <span className="flex items-center gap-1 text-orange-300">
                <AlertTriangle className="w-3.5 h-3.5" />{filtered.filter(w => w.status === 'THIEU').length} thiếu
              </span>
              <span className="flex items-center gap-1 text-red-300">
                <XCircle className="w-3.5 h-3.5" />{filtered.filter(w => w.status === 'CHUA_NOP').length} chưa nộp
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-blue-50 border-b border-blue-200">
                  <th className="px-4 py-2.5 text-left font-semibold text-blue-800 min-w-[160px]">Loại đơn vị</th>
                  {ALL_CATS.map(c => {
                    const Icon = c.icon
                    return (
                      <th key={c.key} className="px-2 py-2.5 text-center min-w-[80px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <Icon className={`w-3.5 h-3.5 ${c.color}`} />
                          <span className="font-medium text-slate-600">{c.short}</span>
                        </div>
                      </th>
                    )
                  })}
                  <th className="px-3 py-2.5 text-center font-semibold text-slate-600 min-w-[90px]">Số đơn vị</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-slate-600 min-w-[90px]">Tổng bản ghi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Dòng từng nhóm loại */}
                {TYPE_ORDER.filter(t => groups[t]?.length).map(typeName => {
                  const wards = groups[typeName]
                  return (
                    <tr key={typeName} className="hover:bg-blue-50/30">
                      <td className="px-4 py-2.5 font-semibold text-slate-700">
                        {typeName}
                        <span className="ml-2 text-[10px] text-slate-400 font-normal">({wards.length} đơn vị)</span>
                      </td>
                      {ALL_CATS.map(cat => {
                        const catVal   = wards.reduce((s, w) => s + (w.cats[cat.key]?.value ?? 0), 0)
                        const catCount = wards.filter(w => !!w.cats[cat.key]).length
                        const metric   = CAT_METRIC[cat.key]
                        const catMeta  = ALL_CATS.find(c => c.key === cat.key)
                        const disp     = catVal > 0 ? (catVal % 1 === 0 ? catVal.toLocaleString('vi-VN') : catVal.toFixed(2)) : '—'
                        return (
                          <td key={cat.key} className="px-2 py-2.5 text-center">
                            {catCount > 0 ? (
                              <div className="flex flex-col items-center">
                                <span className={`font-bold text-[11px] ${catMeta?.color}`}>
                                  {disp}{metric && catVal > 0 ? ` ${metric.unit}` : ''}
                                </span>
                                <span className="text-[9px] text-slate-400">{catCount} đơn vị</span>
                              </div>
                            ) : <span className="text-slate-200">—</span>}
                          </td>
                        )
                      })}
                      <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{wards.length}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-blue-700">{wards.reduce((s,w)=>s+w.totalRows,0).toLocaleString('vi-VN')} hàng</td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Dòng tổng cộng tất cả */}
              <tfoot>
                <tr className="bg-blue-700 border-t-2 border-blue-800">
                  <td className="px-4 py-3 font-black text-white text-sm">TỔNG CỘNG</td>
                  {ALL_CATS.map(cat => {
                    const grandVal   = filtered.reduce((s, w) => s + (w.cats[cat.key]?.value ?? 0), 0)
                    const grandCount = filtered.filter(w => !!w.cats[cat.key]).length
                    const metric     = CAT_METRIC[cat.key]
                    const disp       = grandVal > 0 ? (grandVal % 1 === 0 ? grandVal.toLocaleString('vi-VN') : grandVal.toFixed(2)) : '—'
                    return (
                      <td key={cat.key} className="px-2 py-3 text-center">
                        {grandCount > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="font-black text-white text-[12px]">{disp}</span>
                            {metric && grandVal > 0 && <span className="text-[9px] text-blue-200">{metric.unit}</span>}
                            <span className="text-[9px] text-blue-300">{grandCount}/{filtered.length} đv</span>
                          </div>
                        ) : <span className="text-blue-400 text-[10px]">—</span>}
                      </td>
                    )
                  })}
                  <td className="px-3 py-3 text-center font-black text-white text-sm">{filtered.length}</td>
                  <td className="px-3 py-3 text-center font-black text-white text-sm">
                    {filtered.reduce((s, w) => s + w.totalRows, 0).toLocaleString('vi-VN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Báo cáo Chỉ tiêu/Tỷ lệ Hạ tầng Kỹ thuật Đô thị (Vùng lõi tỉnh Quảng Trị) ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-2xl p-6 border border-slate-700 text-white shadow-xl space-y-6 mt-6">
        <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold tracking-wide text-slate-100 uppercase flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
              Chỉ tiêu phát triển hạ tầng kỹ thuật đô thị (Vùng lõi toàn tỉnh)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Thống kê tổng hợp dựa trên dữ liệu báo cáo hiện trạng từ 27 đơn vị hành chính thuộc Vùng lõi đô thị
            </p>
          </div>
          <span className="bg-slate-700/50 border border-slate-600 text-slate-300 text-xs px-3 py-1 rounded-full font-medium">
            Quảng Trị 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Giao thông */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700 hover:border-blue-500/50 transition-all hover:bg-slate-800/60 group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-all">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Tỷ lệ đất giao thông <span className="text-slate-500">(vùng lõi đô thị)</span></p>
                <p className="text-2xl font-extrabold text-blue-400 mt-0.5">{trafficLandRatioPct.toFixed(2)}%</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Tỷ lệ diện tích đất giao thông (theo nền đường) trên diện tích đất tự nhiên tại vùng lõi đô thị tỉnh Quảng Trị đạt khoảng <strong className="text-white">{trafficLandRatioPct.toFixed(2)}%</strong>; tính trên <strong className="text-white">toàn tỉnh</strong> khoảng <strong className="text-white">{provinceTrafficLandRatioPct.toFixed(2)}%</strong>.
            </p>
            <div className="mt-3 text-[10px] text-slate-500 flex flex-col gap-0.5">
              <span className="text-slate-400 font-medium">Vùng lõi đô thị:</span>
              <span>• Diện tích nền đường: {coreRoadAreaKm2.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} km²</span>
              <span>• Diện tích tự nhiên: {coreNaturalAreaKm2.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} km²</span>
              <span className="text-slate-400 font-medium mt-1">Toàn tỉnh (78 ĐVHC):</span>
              <span>• Diện tích nền đường: {provinceRoadAreaKm2.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} km²</span>
              <span>• Diện tích tự nhiên: {provinceNaturalAreaKm2.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} km²</span>
            </div>
          </div>

          {/* Card 2: Chiếu sáng */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700 hover:border-yellow-500/50 transition-all hover:bg-slate-800/60 group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/20 transition-all">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Chiếu sáng đường phố</p>
                <p className="text-2xl font-extrabold text-yellow-400 mt-0.5">
                  {coreIlluminationPct.toFixed(2)}%
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Tỷ lệ chiều dài đường phố từ cấp đường khu vực trở lên được chiếu sáng tại tỉnh Quảng Trị: khoảng <strong className="text-white">{coreIlluminationPct.toFixed(2)}%</strong>.
            </p>
            <div className="mt-3 text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span>• Tổng chiếu sáng: {coreDienCSKmNormalized.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} km</span>
              <span>/ Đường: {coreRoadKm.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} km</span>
            </div>
          </div>

          {/* Card 3: Cây xanh */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700 hover:border-emerald-500/50 transition-all hover:bg-slate-800/60 group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                <TreePine className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Đất cây xanh bình quân</p>
                <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">
                  {coreGreenPerCapitaVal.toFixed(2)} m²
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Tỷ lệ cây xanh trong đô thị đạt bình quân: Đất cây xanh đô thị trên địa bàn khoảng <strong className="text-white">{coreGreenPerCapitaVal.toFixed(2)} m²/người</strong>.
            </p>
            <div className="mt-3 text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span>• Tổng công viên: {coreCongVienM2.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} m²</span>
              <span>/ Dân số lõi: {corePopVal.toLocaleString('vi-VN')} người</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
