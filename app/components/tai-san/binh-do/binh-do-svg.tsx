'use client'

import { useState, useEffect, useRef } from 'react'
import { DOMAIN_LABEL } from '@/lib/constants/tai-san'

type AssetOnRoad = {
  id: string
  assetCode: string
  name: string
  condition: string
  status: string
  domain: string
  lyTrinh: number
  viTriDuong: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  assetType: { name: string; code: string }
}

type Street = {
  id: string
  name: string
  code: string
  length: number | null
  ward?: { name: string } | null
}

// Màu tình trạng (đường viền ký hiệu)
const CONDITION_COLOR: Record<string, string> = {
  TOT: '#16a34a', KHA: '#2563eb', TRUNG_BINH: '#ca8a04', XAU: '#ea580c', HONG: '#dc2626',
}

// Màu nền theo lĩnh vực
const DOMAIN_FILL: Record<string, string> = {
  GIAO_THONG: '#dbeafe', CAP_NUOC: '#cffafe', THOAT_NUOC: '#e0e7ff',
  CHIEU_SANG: '#fef9c3', CAY_XANH: '#dcfce7', MOI_TRUONG: '#ccfbf1', CHINH_TRANG: '#f3e8ff',
}
const DOMAIN_STROKE: Record<string, string> = {
  GIAO_THONG: '#1d4ed8', CAP_NUOC: '#0891b2', THOAT_NUOC: '#4338ca',
  CHIEU_SANG: '#a16207', CAY_XANH: '#15803d', MOI_TRUONG: '#0d9488', CHINH_TRANG: '#7e22ce',
}

// Ký hiệu kỹ thuật theo mã loại tài sản (dùng trong bình đồ)
const TYPE_SYMBOL: Record<string, { label: string; shape: 'rect' | 'circle' | 'triangle_up' | 'triangle_down' | 'diamond' | 'cross' | 'pole' }> = {
  // Giao thông
  GT_DUONG:    { label: 'ĐG',   shape: 'rect' },
  GT_VIA_HE:  { label: 'VH',   shape: 'rect' },
  GT_CAU:     { label: 'CẦU',  shape: 'rect' },
  GT_CONG:    { label: 'CHG',  shape: 'rect' },
  GT_DEN_TH:  { label: 'TH',   shape: 'cross' },   // đèn tín hiệu → chữ thập
  GT_BIEN:    { label: 'BB',   shape: 'diamond' },  // biển báo → hình thoi (trung tính)
  // Chiếu sáng
  CS_DEN_DUONG: { label: 'ĐĐ', shape: 'pole' },    // đèn đường → ký hiệu cột
  CS_TRU_DIEN: { label: 'TĐ',  shape: 'pole' },
  CS_TU_DIEN: { label: 'TĐK', shape: 'rect' },
  CS_DAY_CAP: { label: 'CÁP', shape: 'rect' },
  // Thoát nước
  TN_CONG:    { label: 'CN',  shape: 'rect' },
  TN_HO_GA:  { label: 'HG',  shape: 'rect' },
  TN_MUONG:  { label: 'MG',  shape: 'rect' },
  TN_TRAM_BOM: { label: 'TB', shape: 'rect' },
  // Cấp nước
  CN_ONG_CAI: { label: 'ÔC',  shape: 'rect' },
  CN_ONG_PHAN: { label: 'ÔP', shape: 'rect' },
  CN_VAN:     { label: 'VN',  shape: 'diamond' },
  CN_TRAM_BOM: { label: 'TB', shape: 'rect' },
  // Cây xanh
  CX_CAY_DUONG: { label: 'CX', shape: 'circle' },  // cây → hình tròn (tán cây)
  CX_CONG_VIEN: { label: 'CV', shape: 'circle' },
  CX_THAO_VIEN: { label: 'TV', shape: 'rect' },
  // Môi trường
  MT_THUNG_RAC: { label: 'RC', shape: 'rect' },
  MT_NHA_CHO:  { label: 'NC', shape: 'rect' },
  // Chỉnh trang
  CT_TUONG_RAO: { label: 'TR', shape: 'rect' },
  CT_VIA_DAP:  { label: 'VĐ', shape: 'rect' },
  CT_BIEN_HIEU: { label: 'BH', shape: 'rect' },
}

function getSymbol(code: string) {
  return TYPE_SYMBOL[code] ?? { label: code.split('_').pop() ?? '??', shape: 'rect' as const }
}

function formatLyTrinh(m: number): string {
  const km = Math.floor(m / 1000)
  const rest = Math.round(m % 1000)
  return `Km ${km}+${String(rest).padStart(3, '0')}`
}

// Vẽ ký hiệu kỹ thuật tại gốc toạ độ (0,0)
function AssetSymbol({ code, domain, condition, size = 18 }: {
  code: string; domain: string; condition: string; size?: number
}) {
  const sym = getSymbol(code)
  const fill = DOMAIN_FILL[domain] ?? '#f1f5f9'
  const stroke = DOMAIN_STROKE[domain] ?? '#64748b'
  const condColor = CONDITION_COLOR[condition] ?? '#64748b'
  const h = size / 2

  switch (sym.shape) {
    case 'circle':
      return (
        <g>
          <circle r={h} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <circle r={h - 3} fill="none" stroke={condColor} strokeWidth={1} />
          <text fontSize={7} textAnchor="middle" dy={2.5} fill={stroke} fontWeight="700">{sym.label}</text>
        </g>
      )
    case 'diamond':
      return (
        <g>
          <polygon points={`0,${-h} ${h},0 0,${h} ${-h},0`} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <text fontSize={6} textAnchor="middle" dy={2} fill={stroke} fontWeight="700">{sym.label}</text>
        </g>
      )
    case 'cross':
      return (
        <g>
          <rect x={-h} y={-h} width={size} height={size} rx={2} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <line x1={0} y1={-h + 3} x2={0} y2={h - 3} stroke={stroke} strokeWidth={1.5} />
          <line x1={-h + 3} y1={0} x2={h - 3} y2={0} stroke={stroke} strokeWidth={1.5} />
          <text fontSize={5} textAnchor="middle" dy={8} fill={stroke} fontWeight="700">{sym.label}</text>
        </g>
      )
    case 'pole':
      return (
        <g>
          {/* Cột đứng */}
          <line x1={0} y1={h} x2={0} y2={-h + 4} stroke={stroke} strokeWidth={2} />
          {/* Chao đèn */}
          <ellipse cx={0} cy={-h + 4} rx={h - 2} ry={4} fill={fill} stroke={stroke} strokeWidth={1.2} />
          {/* Ánh sáng */}
          <circle cx={0} cy={-h + 4} r={2} fill={condColor} />
        </g>
      )
    default: // rect
      return (
        <g>
          <rect x={-h} y={-h} width={size} height={size} rx={2} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <rect x={-h + 2} y={-h + 2} width={size - 4} height={size - 4} rx={1} fill="none" stroke={condColor} strokeWidth={0.8} />
          <text fontSize={6} textAnchor="middle" dy={2.5} fill={stroke} fontWeight="700">{sym.label}</text>
        </g>
      )
  }
}

export function BinhDoSvg({ streetId }: { streetId: string }) {
  const [data, setData] = useState<{ street: Street; assets: AssetOnRoad[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AssetOnRoad | null>(null)
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset trạng thái tải khi đổi tuyến đường (set-state khi render — React khuyến nghị)
  const [prevStreetId, setPrevStreetId] = useState(streetId)
  if (streetId !== prevStreetId) {
    setPrevStreetId(streetId)
    setLoading(true)
  }

  useEffect(() => {
    let active = true
    fetch(`/api/binh-do?streetId=${streetId}`)
      .then(r => r.json())
      .then(d => { if (active) { setData(d); setLoading(false) } })
      .catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [streetId])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
      <span className="animate-pulse">Đang tải bình đồ...</span>
    </div>
  )
  if (!data?.street) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Không có dữ liệu</div>
  )

  const { street, assets } = data
  const maxLy = assets.length > 0
    ? Math.max(...assets.map(a => a.lyTrinh), street.length ?? 0, 100)
    : (street.length ?? 500)

  // Layout
  const PAD_L = 90
  const PAD_R = 50
  const PAD_TOP = 20
  const ROAD_HALF = 20   // nửa chiều rộng dải đường trên bình đồ
  const STALK_H = 50     // chiều cao cây đứng từ mép đường đến ký hiệu
  const ROW_GAP = 20     // khoảng cách thêm phía trên/dưới
  const SYM_SIZE = 20    // kích thước ký hiệu

  const ROAD_CENTER_Y = PAD_TOP + STALK_H + SYM_SIZE + ROW_GAP + ROAD_HALF
  const SVG_H = ROAD_CENTER_Y + ROAD_HALF + STALK_H + SYM_SIZE + ROW_GAP + 40

  const rawW = Math.max(800, (maxLy / 8) * zoom)
  const SVG_W = rawW + PAD_L + PAD_R

  const xScale = (m: number) => PAD_L + ((m / maxLy) * rawW)

  // Km marks
  const interval = maxLy > 10000 ? 1000 : maxLy > 3000 ? 500 : maxLy > 1000 ? 200 : 100
  const marks: number[] = []
  for (let m = 0; m <= maxLy; m += interval) marks.push(m)

  // Group by position
  const TRAI  = assets.filter(a => a.viTriDuong === 'TRAI')
  const PHAI  = assets.filter(a => a.viTriDuong === 'PHAI')
  const GIUA  = assets.filter(a => a.viTriDuong === 'GIUA' || a.viTriDuong === 'TREN')
  const OTHER = assets.filter(a => !['TRAI','PHAI','GIUA','TREN'].includes(a.viTriDuong ?? ''))

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold text-slate-700">{street.name}</span>
        {street.length && <span className="text-slate-400 text-xs">Dài: {(street.length / 1000).toFixed(3)} km</span>}
        <span className="text-slate-400 text-xs">{assets.length} tài sản có lý trình</span>
        {OTHER.length > 0 && <span className="text-orange-500 text-xs">⚠ {OTHER.length} chưa xác định vị trí</span>}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Thu phóng:</span>
          <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.3).toFixed(1)))}
            className="w-6 h-6 border rounded text-xs hover:bg-slate-100 flex items-center justify-center">−</button>
          <span className="text-xs w-8 text-center font-mono">{zoom}×</span>
          <button onClick={() => setZoom(z => Math.min(8, +(z + 0.3).toFixed(1)))}
            className="w-6 h-6 border rounded text-xs hover:bg-slate-100 flex items-center justify-center">+</button>
        </div>
      </div>

      {/* Chú giải */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 rounded-lg p-3">
        <div className="font-semibold text-slate-600 sm:col-span-4 mb-1">Ký hiệu lĩnh vực:</div>
        {Object.entries(DOMAIN_LABEL).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border inline-block shrink-0"
              style={{ background: DOMAIN_FILL[k] ?? '#f1f5f9', borderColor: DOMAIN_STROKE[k] ?? '#94a3b8' }} />
            <span className="text-slate-600">{v}</span>
          </span>
        ))}
        <div className="font-semibold text-slate-600 sm:col-span-4 mt-2 mb-1">Tình trạng (viền trong):</div>
        {[['TOT','Tốt','#16a34a'],['KHA','Khá','#2563eb'],['TRUNG_BINH','Trung bình','#ca8a04'],['XAU','Xấu','#ea580c'],['HONG','Hỏng','#dc2626']].map(([,l,c]) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full border-2 inline-block shrink-0" style={{ borderColor: c, background: '#fff' }} />
            <span className="text-slate-600">{l}</span>
          </span>
        ))}
        <div className="font-semibold text-slate-600 sm:col-span-4 mt-2 mb-0.5">Hình dạng ký hiệu:</div>
        <span className="text-slate-500">○ Cây xanh (tán cây)</span>
        <span className="text-slate-500">◇ Van / Biển (liên thông)</span>
        <span className="text-slate-500">✛ Đèn tín hiệu</span>
        <span className="text-slate-500">⊥ Đèn đường (cột)</span>
        <span className="text-slate-500">□ Các loại còn lại</span>
      </div>

      {/* SVG bình đồ duỗi thẳng */}
      <div ref={containerRef} className="overflow-x-auto border-2 border-slate-300 rounded-xl bg-white">
        <svg width={SVG_W} height={SVG_H} className="block">

          {/* Nhãn hàng */}
          <text x={6} y={PAD_TOP + SYM_SIZE / 2 + ROAD_HALF} fontSize={10} fill="#475569" fontWeight="700" dominantBaseline="middle">◀ TRÁI</text>
          <text x={6} y={ROAD_CENTER_Y} fontSize={10} fill="#1e293b" fontWeight="700" dominantBaseline="middle">TIM ĐG</text>
          <text x={6} y={ROAD_CENTER_Y + ROAD_HALF + STALK_H + SYM_SIZE / 2} fontSize={10} fill="#475569" fontWeight="700" dominantBaseline="middle">▶ PHẢI</text>

          {/* Vùng nền trái/phải */}
          <rect x={PAD_L} y={PAD_TOP} width={rawW} height={STALK_H + SYM_SIZE + ROW_GAP} fill="#f0f9ff" />
          <rect x={PAD_L} y={ROAD_CENTER_Y + ROAD_HALF} width={rawW} height={STALK_H + SYM_SIZE + ROW_GAP} fill="#fff7ed" />

          {/* Mép đường (nét liền đậm) */}
          <rect x={PAD_L} y={ROAD_CENTER_Y - ROAD_HALF} width={rawW} height={ROAD_HALF * 2}
            fill="#e2e8f0" stroke="#475569" strokeWidth={2} />

          {/* Tim đường — nét đứt đôi vàng */}
          <line x1={PAD_L} y1={ROAD_CENTER_Y - 3} x2={PAD_L + rawW} y2={ROAD_CENTER_Y - 3}
            stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="12,6" />
          <line x1={PAD_L} y1={ROAD_CENTER_Y + 3} x2={PAD_L + rawW} y2={ROAD_CENTER_Y + 3}
            stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="12,6" />

          {/* Vạch mép đường */}
          <line x1={PAD_L} y1={ROAD_CENTER_Y - ROAD_HALF} x2={PAD_L + rawW} y2={ROAD_CENTER_Y - ROAD_HALF}
            stroke="#1e293b" strokeWidth={2.5} />
          <line x1={PAD_L} y1={ROAD_CENTER_Y + ROAD_HALF} x2={PAD_L + rawW} y2={ROAD_CENTER_Y + ROAD_HALF}
            stroke="#1e293b" strokeWidth={2.5} />

          {/* Km marks */}
          {marks.map(m => {
            const x = xScale(m)
            return (
              <g key={m}>
                <line x1={x} y1={PAD_TOP} x2={x} y2={SVG_H - 30} stroke="#cbd5e1" strokeWidth={0.5} strokeDasharray="3,5" />
                {/* Cọc km trên đường */}
                <rect x={x - 2} y={ROAD_CENTER_Y - 6} width={4} height={12} fill="#ef4444" />
                <text x={x} y={SVG_H - 8} fontSize={9} fill="#475569" textAnchor="middle" fontWeight="500">
                  {formatLyTrinh(m)}
                </text>
                <line x1={x} y1={SVG_H - 20} x2={x} y2={SVG_H - 14} stroke="#94a3b8" strokeWidth={1} />
              </g>
            )
          })}

          {/* ── Assets TRÁI (trên đường, stalk xuống) ── */}
          {TRAI.map((a) => {
            const x = xScale(a.lyTrinh)
            const symY = ROAD_CENTER_Y - ROAD_HALF - STALK_H
            const isSelected = selected?.id === a.id
            return (
              <g key={a.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(isSelected ? null : a)}>
                {/* Cây đứng (stalk) */}
                <line x1={x} y1={ROAD_CENTER_Y - ROAD_HALF} x2={x} y2={symY + SYM_SIZE / 2}
                  stroke={DOMAIN_STROKE[a.domain] ?? '#64748b'} strokeWidth={1} strokeDasharray="3,2" />
                {/* Chân cọc */}
                <circle cx={x} cy={ROAD_CENTER_Y - ROAD_HALF} r={2} fill={DOMAIN_STROKE[a.domain] ?? '#64748b'} />
                {/* Ký hiệu */}
                <g transform={`translate(${x},${symY})`}>
                  <AssetSymbol code={a.assetType.code} domain={a.domain} condition={a.condition} size={SYM_SIZE} />
                  {isSelected && <circle r={SYM_SIZE / 2 + 4} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3,2" />}
                </g>
                {/* Mã tài sản nhỏ */}
                <text x={x} y={symY - SYM_SIZE / 2 - 3} fontSize={7} textAnchor="middle" fill="#64748b">{a.assetCode}</text>
              </g>
            )
          })}

          {/* ── Assets GIỮA (trên tim đường) ── */}
          {GIUA.map((a, idx) => {
            const x = xScale(a.lyTrinh)
            const isSelected = selected?.id === a.id
            const offset = (idx % 2) * 6 - 3
            return (
              <g key={a.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(isSelected ? null : a)}>
                <g transform={`translate(${x},${ROAD_CENTER_Y + offset})`}>
                  <AssetSymbol code={a.assetType.code} domain={a.domain} condition={a.condition} size={14} />
                  {isSelected && <circle r={10} fill="none" stroke="#f59e0b" strokeWidth={2} />}
                </g>
              </g>
            )
          })}

          {/* ── Assets PHẢI (dưới đường, stalk lên) ── */}
          {PHAI.map((a) => {
            const x = xScale(a.lyTrinh)
            const symY = ROAD_CENTER_Y + ROAD_HALF + STALK_H
            const isSelected = selected?.id === a.id
            return (
              <g key={a.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(isSelected ? null : a)}>
                <line x1={x} y1={ROAD_CENTER_Y + ROAD_HALF} x2={x} y2={symY - SYM_SIZE / 2}
                  stroke={DOMAIN_STROKE[a.domain] ?? '#64748b'} strokeWidth={1} strokeDasharray="3,2" />
                <circle cx={x} cy={ROAD_CENTER_Y + ROAD_HALF} r={2} fill={DOMAIN_STROKE[a.domain] ?? '#64748b'} />
                <g transform={`translate(${x},${symY})`}>
                  <AssetSymbol code={a.assetType.code} domain={a.domain} condition={a.condition} size={SYM_SIZE} />
                  {isSelected && <circle r={SYM_SIZE / 2 + 4} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3,2" />}
                </g>
                <text x={x} y={symY + SYM_SIZE / 2 + 9} fontSize={7} textAnchor="middle" fill="#64748b">{a.assetCode}</text>
              </g>
            )
          })}

          {/* ── OTHER — chưa có vị trí: hiện dưới bình đồ ── */}
          {OTHER.length > 0 && (
            <>
              <text x={PAD_L} y={SVG_H - 35} fontSize={8} fill="#f59e0b">
                ⚠ Chưa xác định vị trí: {OTHER.map(a => a.assetCode).join(', ')}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Popup chi tiết */}
      {selected && (
        <div className="border-2 rounded-xl bg-white p-4 shadow-lg space-y-3"
          style={{ borderColor: DOMAIN_STROKE[selected.domain] ?? '#94a3b8' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-slate-800 text-base">{selected.name}</p>
              <p className="text-xs text-slate-500">{selected.assetCode} · {selected.assetType.name}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 text-xl leading-none font-light">×</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs text-slate-400">Lý trình</p>
              <p className="font-bold text-slate-800">{formatLyTrinh(selected.lyTrinh)}</p>
              <p className="text-xs text-slate-400">{selected.lyTrinh} m từ đầu tuyến</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-slate-400">Vị trí ngang</p>
              <p className="font-semibold">
                {selected.viTriDuong === 'TRAI' ? '◀ Bên trái' :
                 selected.viTriDuong === 'PHAI' ? '▶ Bên phải' :
                 selected.viTriDuong === 'GIUA' ? '— Dải giữa' :
                 selected.viTriDuong === 'TREN' ? '↑ Trên đường' : '—'}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-slate-400">Lĩnh vực</p>
              <p className="font-semibold" style={{ color: DOMAIN_STROKE[selected.domain] }}>
                {DOMAIN_LABEL[selected.domain] ?? selected.domain}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-slate-400">Tình trạng</p>
              <p className="font-semibold" style={{ color: CONDITION_COLOR[selected.condition] }}>
                {({ TOT:'Tốt',KHA:'Khá',TRUNG_BINH:'Trung bình',XAU:'Xấu',HONG:'Hỏng' } as Record<string,string>)[selected.condition] ?? selected.condition}
              </p>
            </div>
            {(selected.latitude && selected.longitude) && (
              <div className="space-y-0.5">
                <p className="text-xs text-slate-400">Toạ độ GPS</p>
                <p className="font-mono text-xs text-slate-700">{selected.latitude.toFixed(5)}</p>
                <p className="font-mono text-xs text-slate-700">{selected.longitude.toFixed(5)}</p>
              </div>
            )}
          </div>
          {selected.address && <p className="text-xs text-slate-500">📍 {selected.address}</p>}
          <a href={`/dashboard/tai-san/${selected.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
            style={{ color: DOMAIN_STROKE[selected.domain] }}>
            Xem chi tiết tài sản →
          </a>
        </div>
      )}

      {assets.length === 0 && (
        <div className="text-center py-8 space-y-1 text-slate-400 text-sm">
          <p>Chưa có tài sản nào có lý trình trên tuyến này.</p>
          <p className="text-xs">Khi nhập tài sản → chọn tuyến đường → điền lý trình + vị trí ngang.</p>
        </div>
      )}
    </div>
  )
}
