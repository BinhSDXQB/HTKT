import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { BarChart3, ChevronRight, Zap, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'

// ── Chuẩn hóa tên loại đèn ────────────────────────────────────────────────────
function normalizeLoaiDen(raw: string | null): string {
  if (!raw) return 'Chưa xác định'
  const s = raw.trim().toLowerCase()
  if (s.includes('led')) {
    if (s.includes('sợi') || s.includes('soi')) return 'LED + Sợi đốt'
    if (s.includes('sodium') || s.includes('sondium') || s.includes('son')) return 'LED + Sodium'
    return 'LED'
  }
  if (s === 'son' || s === 'sondium' || s === 'sodium' || s === 'sudium' || s.includes('sodium') || s.includes('sondium')) return 'Sodium (cao áp)'
  if (s.includes('halogen')) return 'Halogen'
  if (s.includes('thuỷ ngân') || s.includes('thuy ngan') || s.includes('thủy ngân')) return 'Thủy ngân'
  if (s.includes('sợi đốt') || s.includes('soi dot') || s.includes('pha')) return 'Sợi đốt'
  if (s.includes('cao áp') || s.includes('cao ap')) return 'Cao áp'
  if (s.includes('năng lượng') || s.includes('nang luong') || s.includes('nlmt')) return 'Năng lượng MT'
  if (s === '-' || s === '' || s === 'chưa xác định') return 'Chưa xác định'
  return raw.trim()
}

// LED → đã phù hợp chiếu sáng thông minh; còn lại → cần thay thế
function isLED(loai: string): boolean {
  return loai === 'LED' || loai === 'LED + Sợi đốt' || loai === 'LED + Sodium'
}

const LOAI_COLOR: Record<string, string> = {
  'LED':              'bg-green-100 text-green-800 border-green-300',
  'LED + Sợi đốt':   'bg-teal-100 text-teal-800 border-teal-300',
  'LED + Sodium':     'bg-cyan-100 text-cyan-800 border-cyan-300',
  'Sodium (cao áp)':  'bg-orange-100 text-orange-800 border-orange-300',
  'Halogen':          'bg-red-100 text-red-800 border-red-300',
  'Thủy ngân':        'bg-purple-100 text-purple-800 border-purple-300',
  'Sợi đốt':         'bg-rose-100 text-rose-800 border-rose-300',
  'Cao áp':           'bg-amber-100 text-amber-800 border-amber-300',
  'Năng lượng MT':    'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Chưa xác định':    'bg-slate-100 text-slate-600 border-slate-300',
}

type RoadRow = {
  tuyen: string
  soCol: number | null
  loaiDen: string
  congSuat: number | null
  chieuSang: string | null
  namDauTu: string | null
}

type WardData = {
  wardName: string
  wardCode: string
  roads: RoadRow[]
  summary: Record<string, { count: number; poles: number }>
  totalPoles: number
  ledPoles: number
  oldPoles: number
}

async function getDCSData(): Promise<WardData[]> {
  // ── SQL thuần từ bảng ReportDienCS — không parse JSON ────────────────────
  const records = await db.reportDienCS.findMany({
    select: {
      tuyenDuong: true, soColDen: true, loaiDen: true, loaiDenChuan: true,
      congSuatW: true, chieuSangPhia: true, namDauTu: true,
      ward: { select: { name: true, code: true } },
    },
    orderBy: [{ ward: { name: 'asc' } }, { tuyenDuong: 'asc' }],
  })

  const wardMap: Record<string, WardData> = {}

  for (const rec of records) {
    if (!rec.ward) continue
    const key = rec.ward.code
    if (!wardMap[key]) {
      wardMap[key] = { wardName: rec.ward.name, wardCode: key, roads: [], summary: {}, totalPoles: 0, ledPoles: 0, oldPoles: 0 }
    }

    const tuyen   = rec.tuyenDuong
    const soCol   = rec.soColDen ?? null
    const loaiDen = normalizeLoaiDen(rec.loaiDenChuan ?? rec.loaiDen)
    const cs      = rec.congSuatW ?? null
    const csang   = rec.chieuSangPhia ?? null
    const nam     = rec.namDauTu ? String(rec.namDauTu) : null

    wardMap[key].roads.push({ tuyen, soCol, loaiDen, congSuat: cs, chieuSang: csang, namDauTu: nam })

    if (!wardMap[key].summary[loaiDen]) wardMap[key].summary[loaiDen] = { count: 0, poles: 0 }
    wardMap[key].summary[loaiDen].count++
    wardMap[key].summary[loaiDen].poles += soCol ?? 0
    wardMap[key].totalPoles += soCol ?? 0
    if (isLED(loaiDen)) wardMap[key].ledPoles += soCol ?? 0
    else if (loaiDen !== 'Chưa xác định') wardMap[key].oldPoles += soCol ?? 0
  }

  return Object.values(wardMap).sort((a, b) => a.wardName.localeCompare(b.wardName, 'vi'))
}

// ── Tổng hợp toàn tỉnh ───────────────────────────────────────────────────────
function calcProvince(wards: WardData[]) {
  const loaiTotal: Record<string, { poles: number; roads: number; wards: number }> = {}
  let totalPoles = 0, ledPoles = 0, oldPoles = 0, totalRoads = 0

  for (const w of wards) {
    totalPoles += w.totalPoles
    ledPoles   += w.ledPoles
    oldPoles   += w.oldPoles
    totalRoads += w.roads.length
    for (const [loai, v] of Object.entries(w.summary)) {
      if (!loaiTotal[loai]) loaiTotal[loai] = { poles: 0, roads: 0, wards: 0 }
      loaiTotal[loai].poles += v.poles
      loaiTotal[loai].roads += v.count
      loaiTotal[loai].wards++
    }
  }
  return { loaiTotal, totalPoles, ledPoles, oldPoles, totalRoads }
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function DenChieuSangPage({
  searchParams,
}: {
  searchParams: Promise<{ ward?: string; loai?: string }>
}) {
  await requireAuth()
  const sp   = await searchParams

  // Thống kê toàn tỉnh: mọi tài khoản đều xem được tất cả phường/xã (chỉ xem)
  const allWards = await getDCSData()

  // Filter theo URL param TRƯỚC khi tính province (để KPI thay đổi theo filter)
  const filteredWards = sp.ward
    ? allWards.filter(w => w.wardCode === sp.ward)
    : allWards

  // Province stats tính từ filteredWards (cập nhật theo filter)
  const province = calcProvince(filteredWards)
  const pctLED = province.totalPoles > 0 ? Math.round((province.ledPoles / province.totalPoles) * 100) : 0
  const pctOld = province.totalPoles > 0 ? Math.round((province.oldPoles / province.totalPoles) * 100) : 0

  const allLoaiDen = Object.keys(province.loaiTotal).sort((a, b) =>
    (province.loaiTotal[b].poles - province.loaiTotal[a].poles)
  )

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/bao-cao" className="hover:text-blue-700 flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5" />Báo cáo
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Thống kê Điện chiếu sáng</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Thống kê Điện chiếu sáng — Kế hoạch Chiếu sáng thông minh
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Phân loại bóng đèn theo từng tuyến đường / phường xã
            {sp.ward ? ` · Đang lọc: ${filteredWards[0]?.wardName ?? sp.ward}` : ` · ${filteredWards.length} đơn vị`}
            {' · '}{province.totalRoads} tuyến đường
          </p>
        </div>
      </div>

      {/* KPI toàn tỉnh */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border p-4 space-y-1">
          <p className="text-xs text-slate-500">Tổng cột đèn (có số liệu)</p>
          <p className="text-3xl font-bold text-slate-800">{province.totalPoles.toLocaleString('vi-VN')}</p>
          <p className="text-xs text-slate-400">{province.totalRoads} tuyến đường</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-xs font-medium text-green-700">Đã dùng LED</p>
          </div>
          <p className="text-3xl font-bold text-green-700">{province.ledPoles.toLocaleString('vi-VN')}</p>
          <div className="bg-green-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: `${pctLED}%` }} />
          </div>
          <p className="text-xs text-green-600">{pctLED}% số cột</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <p className="text-xs font-medium text-orange-700">Cần thay thế</p>
          </div>
          <p className="text-3xl font-bold text-orange-600">{province.oldPoles.toLocaleString('vi-VN')}</p>
          <div className="bg-orange-200 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${pctOld}%` }} />
          </div>
          <p className="text-xs text-orange-600">{pctOld}% chưa LED</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-medium text-blue-700">Mục tiêu LED 100%</p>
          </div>
          <p className="text-3xl font-bold text-blue-700">{(province.totalPoles - province.ledPoles).toLocaleString('vi-VN')}</p>
          <p className="text-xs text-blue-600">cột cần chuyển đổi</p>
        </div>
      </div>

      {/* Biểu đồ loại đèn toàn tỉnh */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold text-slate-700 text-sm mb-4">Phân bổ loại bóng đèn — toàn tỉnh</h2>
        <div className="space-y-2.5">
          {allLoaiDen.map(loai => {
            const v = province.loaiTotal[loai]
            const pct = province.totalPoles > 0 ? Math.round((v.poles / province.totalPoles) * 100) : 0
            const cls = LOAI_COLOR[loai] ?? 'bg-slate-100 text-slate-600 border-slate-300'
            const color = isLED(loai) ? '#16a34a' : loai === 'Chưa xác định' ? '#94a3b8' : '#ea580c'
            return (
              <div key={loai} className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded border font-medium w-36 shrink-0 truncate ${cls}`}>{loai}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-5 relative">
                  <div className="h-5 rounded-full flex items-center justify-end pr-2 min-w-[32px] transition-all"
                    style={{ width: `${Math.max(pct, 3)}%`, background: color }}>
                    <span className="text-[10px] font-bold text-white">{pct}%</span>
                  </div>
                </div>
                <div className="text-right w-28 shrink-0">
                  <span className="text-xs font-semibold text-slate-700">{v.poles.toLocaleString('vi-VN')} cột</span>
                  <p className="text-[10px] text-slate-400">{v.roads} tuyến · {v.wards} P/X</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lọc phường/xã */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-600 shrink-0">Xem theo đơn vị:</span>
        <Link href="/dashboard/bao-cao/den-chieu-sang"
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${!sp.ward ? 'bg-yellow-500 text-white border-yellow-500' : 'text-slate-600 hover:bg-slate-50'}`}>
          Tất cả ({allWards.length})
        </Link>
        {allWards.map(w => (
          <Link key={w.wardCode} href={`?ward=${w.wardCode}`}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${sp.ward === w.wardCode ? 'bg-yellow-500 text-white border-yellow-500' : 'text-slate-600 hover:bg-slate-50'}`}>
            {w.wardName}
          </Link>
        ))}
      </div>

      {/* Bảng chi tiết theo phường/xã */}
      <div className="space-y-4">
        {filteredWards.map(ward => {
          const wPctLED = ward.totalPoles > 0 ? Math.round((ward.ledPoles / ward.totalPoles) * 100) : 0
          const needsAction = ward.oldPoles > 0

          return (
            <div key={ward.wardCode} className="bg-white rounded-xl border overflow-hidden shadow-sm">
              {/* Header phường */}
              <div className={`px-5 py-3 flex items-center justify-between flex-wrap gap-2 ${needsAction ? 'bg-slate-800' : 'bg-green-800'}`}>
                <div>
                  <h3 className="font-bold text-white text-sm">{ward.wardName}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">{ward.roads.length} tuyến đường</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  {ward.totalPoles > 0 && (
                    <>
                      <span className="text-slate-300">Tổng: <span className="font-bold text-white">{ward.totalPoles.toLocaleString('vi-VN')} cột</span></span>
                      <span className={`font-bold ${wPctLED >= 80 ? 'text-green-300' : wPctLED >= 50 ? 'text-yellow-300' : 'text-red-300'}`}>
                        {wPctLED}% LED
                      </span>
                    </>
                  )}
                  {ward.oldPoles > 0 && (
                    <span className="text-orange-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />{ward.oldPoles} cột cần thay
                    </span>
                  )}
                </div>
              </div>

              {/* Tóm tắt loại đèn của ward */}
              <div className="px-5 py-3 flex flex-wrap gap-2 border-b bg-slate-50">
                {Object.entries(ward.summary)
                  .sort((a, b) => b[1].poles - a[1].poles)
                  .map(([loai, v]) => (
                    <span key={loai}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1.5 ${LOAI_COLOR[loai] ?? 'bg-slate-100 text-slate-600 border-slate-300'}`}>
                      {loai}
                      {v.poles > 0 && <span className="font-bold">{v.poles.toLocaleString('vi-VN')} cột</span>}
                      <span className="opacity-60">({v.count} tuyến)</span>
                    </span>
                  ))}
              </div>

              {/* Bảng đường */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b text-slate-500 font-medium">
                      <th className="px-4 py-2 text-left w-8">#</th>
                      <th className="px-4 py-2 text-left min-w-[200px]">Tuyến đường</th>
                      <th className="px-3 py-2 text-center w-20">Số cột</th>
                      <th className="px-3 py-2 text-center min-w-[130px]">Loại bóng</th>
                      <th className="px-3 py-2 text-center w-20">Công suất</th>
                      <th className="px-3 py-2 text-center w-24">Chiếu sáng</th>
                      <th className="px-3 py-2 text-center w-20">Năm ĐT</th>
                      <th className="px-3 py-2 text-center w-24">Ưu tiên</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ward.roads
                      .sort((a, b) => {
                        // Sắp xếp: chưa LED lên trước
                        const aLed = isLED(a.loaiDen) ? 1 : 0
                        const bLed = isLED(b.loaiDen) ? 1 : 0
                        return aLed - bLed
                      })
                      .map((road, idx) => {
                        const led = isLED(road.loaiDen)
                        const unknown = road.loaiDen === 'Chưa xác định'
                        return (
                          <tr key={idx} className={`transition-colors ${!led && !unknown ? 'bg-orange-50/40 hover:bg-orange-50' : 'hover:bg-slate-50'}`}>
                            <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-2 font-medium text-slate-800">{road.tuyen}</td>
                            <td className="px-3 py-2 text-center">
                              {road.soCol != null ? <span className="font-semibold">{road.soCol}</span> : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${LOAI_COLOR[road.loaiDen] ?? 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                                {road.loaiDen}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center text-slate-600">
                              {road.congSuat != null ? `${road.congSuat}W` : '—'}
                            </td>
                            <td className="px-3 py-2 text-center text-slate-600">{road.chieuSang ?? '—'}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{road.namDauTu ?? '—'}</td>
                            <td className="px-3 py-2 text-center">
                              {led ? (
                                <span className="text-[10px] text-green-600 font-medium">✓ Đạt</span>
                              ) : unknown ? (
                                <span className="text-[10px] text-slate-400">Chưa rõ</span>
                              ) : (
                                <span className="text-[10px] text-orange-600 font-bold">⚑ Thay thế</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
