'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Undo2, Trash2, Loader2 } from 'lucide-react'
import type { KieuHinhHoc } from '@/lib/htkt-doi-tuong/danh-muc'

// Bản đồ hồ sơ HTKT của một xã: ranh xã (admin-boundaries.geojson theo mã ĐVHC) + đối tượng từ
// /api/htkt-doi-tuong/geojson (nhãn = số hiệu/tên lấy động từ CSDL). Chế độ "sua": bấm để thêm đỉnh tuyến/vùng
// hoặc đặt điểm; trả GeoJSON qua onChange. Các đối tượng khác của xã hiện mờ để vẽ cho khớp.

const STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
type Pos = [number, number]
export type HinhHocGeo = { type: string; coordinates: unknown }

type Props = {
  maXa: string
  cheDo: 'xem' | 'sua'
  phienBan?: number                     // tăng để tải lại lớp đối tượng
  chonId?: string | null
  onChon?: (id: string) => void
  // chế độ sửa
  kieu?: KieuHinhHoc
  giaTri?: HinhHocGeo | null
  boQuaId?: string | null               // ẩn chính đối tượng đang sửa khỏi lớp nền
  onChange?: (g: HinhHocGeo | null) => void
  cao?: string
}

export function doDaiM(pts: Pos[]): number {
  let s = 0
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1], [x2, y2] = pts[i]
    const r = (d: number) => (d * Math.PI) / 180
    const a = Math.sin(r(y2 - y1) / 2) ** 2 + Math.cos(r(y1)) * Math.cos(r(y2)) * Math.sin(r(x2 - x1) / 2) ** 2
    s += 2 * 6371008.8 * Math.asin(Math.sqrt(a))
  }
  return s
}

function dinhTu(g: HinhHocGeo | null | undefined): Pos[] {
  if (!g) return []
  const c = g.coordinates as unknown
  if (g.type === 'Point') return [c as Pos]
  if (g.type === 'LineString' || g.type === 'MultiPoint') return c as Pos[]
  if (g.type === 'Polygon') { const r = (c as Pos[][])[0] ?? []; return r.slice(0, Math.max(0, r.length - 1)) }
  if (g.type === 'MultiLineString') return (c as Pos[][]).flat()
  return []
}

export function taoHinhHoc(kieu: KieuHinhHoc, pts: Pos[]): HinhHocGeo | null {
  if (kieu === 'diem') return pts.length ? { type: 'Point', coordinates: pts[pts.length - 1] } : null
  if (kieu === 'tuyen') return pts.length >= 2 ? { type: 'LineString', coordinates: pts } : null
  return pts.length >= 3 ? { type: 'Polygon', coordinates: [[...pts, pts[0]]] } : null
}

export default function BanDoHaTang({ maXa, cheDo, phienBan = 0, chonId, onChon, kieu = 'tuyen', giaTri, boQuaId, onChange, cao = 'h-[420px]' }: Props) {
  const khung = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [san, setSan] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const [pts, setPts] = useState<Pos[]>(() => dinhTu(giaTri))
  const ptsRef = useRef(pts)
  const kieuRef = useRef(kieu)
  const onChangeRef = useRef(onChange)
  const onChonRef = useRef(onChon)
  const daSua = useRef(false)          // chỉ báo onChange sau thao tác thật → không tự đổi hình Multi*/có lỗ khi chỉ mở xem
  useEffect(() => {
    ptsRef.current = pts
    kieuRef.current = kieu
    onChangeRef.current = onChange
    onChonRef.current = onChon
  })

  // Khởi tạo bản đồ + ranh xã
  useEffect(() => {
    if (!khung.current) return
    const m = new maplibregl.Map({ container: khung.current, style: STYLE_URL, center: [106.8, 17.1], zoom: 9 })
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.current = m
    m.on('load', async () => {
      try {
        const res = await fetch('/data/admin-boundaries.geojson')
        const fc = await res.json() as { features: { properties: { code: string; bbox?: [number, number, number, number] } }[] }
        const f = fc.features.find((x) => String(x.properties.code) === maXa)
        if (f) {
          m.addSource('ranh-xa', { type: 'geojson', data: f as unknown as GeoJSON.Feature })
          m.addLayer({ id: 'ranh-xa-fill', type: 'fill', source: 'ranh-xa', paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.04 } })
          m.addLayer({ id: 'ranh-xa-line', type: 'line', source: 'ranh-xa', paint: { 'line-color': '#1d4ed8', 'line-width': 2, 'line-dasharray': [3, 2] } })
          const b = f.properties.bbox
          if (b) m.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 20, duration: 0 })
        }
      } catch { /* ranh giới không bắt buộc */ }
      m.addSource('doi-tuong', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      const mo = cheDo === 'sua' ? 0.35 : 1
      m.addLayer({ id: 'dt-vung', type: 'fill', source: 'doi-tuong', filter: ['==', ['geometry-type'], 'Polygon'],
        paint: { 'fill-color': ['get', 'mau'], 'fill-opacity': 0.25 * mo } })
      m.addLayer({ id: 'dt-tuyen', type: 'line', source: 'doi-tuong', filter: ['all', ['==', ['geometry-type'], 'LineString'], ['!', ['get', 'soBo']]],
        paint: { 'line-color': ['get', 'mau'], 'line-width': ['case', ['==', ['get', 'id'], chonId ?? ''], 6, 3], 'line-opacity': mo } })
      m.addLayer({ id: 'dt-tuyen-sobo', type: 'line', source: 'doi-tuong', filter: ['all', ['==', ['geometry-type'], 'LineString'], ['get', 'soBo']],
        paint: { 'line-color': ['get', 'mau'], 'line-width': 2, 'line-dasharray': [1, 2], 'line-opacity': 0.8 * mo } })
      m.addLayer({ id: 'dt-diem', type: 'circle', source: 'doi-tuong', filter: ['==', ['geometry-type'], 'Point'],
        paint: { 'circle-color': ['get', 'mau'], 'circle-radius': 5, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5, 'circle-opacity': mo } })
      m.addLayer({ id: 'dt-nhan', type: 'symbol', source: 'doi-tuong', minzoom: 13,
        layout: { 'text-field': ['coalesce', ['get', 'soHieu'], ['get', 'nhan']], 'text-size': 11, 'symbol-placement': 'line-center', 'text-allow-overlap': false },
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: { 'text-color': '#0f172a', 'text-halo-color': '#fff', 'text-halo-width': 1.5, 'text-opacity': mo } })
      // Lớp nét đang vẽ
      m.addSource('dang-ve', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      m.addLayer({ id: 've-vung', type: 'fill', source: 'dang-ve', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#dc2626', 'fill-opacity': 0.2 } })
      m.addLayer({ id: 've-tuyen', type: 'line', source: 'dang-ve', filter: ['!=', ['geometry-type'], 'Point'], paint: { 'line-color': '#dc2626', 'line-width': 3 } })
      m.addLayer({ id: 've-dinh', type: 'circle', source: 'dang-ve', filter: ['==', ['geometry-type'], 'Point'],
        paint: { 'circle-color': '#fff', 'circle-radius': 4, 'circle-stroke-color': '#dc2626', 'circle-stroke-width': 2 } })

      if (cheDo === 'xem') {
        for (const lop of ['dt-tuyen', 'dt-tuyen-sobo', 'dt-diem', 'dt-vung']) {
          m.on('click', lop, (e) => { const id = e.features?.[0]?.properties?.id; if (id) onChonRef.current?.(String(id)) })
          m.on('mouseenter', lop, () => { m.getCanvas().style.cursor = 'pointer' })
          m.on('mouseleave', lop, () => { m.getCanvas().style.cursor = '' })
        }
        const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
        m.on('mousemove', 'dt-tuyen', (e) => {
          const p = e.features?.[0]?.properties
          if (p) popup.setLngLat(e.lngLat).setHTML(`<b>${p.soHieu ?? ''}</b> ${p.nhan ?? ''}<br/><span style="color:#64748b">${p.ma}</span>`).addTo(m)
        })
        m.on('mouseleave', 'dt-tuyen', () => popup.remove())
      } else {
        m.getCanvas().style.cursor = 'crosshair'
        m.on('click', (e) => {
          const p: Pos = [Number(e.lngLat.lng.toFixed(6)), Number(e.lngLat.lat.toFixed(6))]
          daSua.current = true
          setPts((cu) => (kieuRef.current === 'diem' ? [p] : [...cu, p]))
        })
        const cu = dinhTu(giaTri)
        if (cu.length) {
          const xs = cu.map((p) => p[0]), ys = cu.map((p) => p[1])
          m.fitBounds([[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], { padding: 60, maxZoom: 17, duration: 0 })
        }
      }
      setSan(true)
    })
    m.on('error', (e) => { if (String(e.error?.message ?? '').includes('Failed to fetch')) setLoi('Không tải được nền bản đồ (kiểm tra mạng).') })
    return () => { m.remove(); map.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maXa, cheDo])

  // Tải lớp đối tượng
  useEffect(() => {
    if (!san || !map.current) return
    let huy = false
    fetch(`/api/htkt-doi-tuong/geojson?maXa=${encodeURIComponent(maXa)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((fc: { features?: { properties: { id: string } }[] }) => {
        if (huy || !map.current || !fc.features) return
        const data = { ...fc, features: boQuaId ? fc.features.filter((f) => f.properties.id !== boQuaId) : fc.features }
        ;(map.current.getSource('doi-tuong') as maplibregl.GeoJSONSource | undefined)?.setData(data as unknown as GeoJSON.FeatureCollection)
      })
      .catch(() => { /* bỏ qua */ })
    return () => { huy = true }
  }, [san, maXa, phienBan, boQuaId])

  // Làm nổi đối tượng được chọn
  useEffect(() => {
    if (!san || !map.current?.getLayer('dt-tuyen')) return
    map.current.setPaintProperty('dt-tuyen', 'line-width', ['case', ['==', ['get', 'id'], chonId ?? ''], 7, 3])
  }, [san, chonId])

  // Vẽ nét đang sửa + báo ra ngoài
  useEffect(() => {
    if (cheDo !== 'sua') return
    const g = taoHinhHoc(kieu, pts)
    const feats: GeoJSON.Feature[] = pts.map((p) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: p } }))
    if (g && g.type !== 'Point') feats.push({ type: 'Feature', properties: {}, geometry: g as GeoJSON.Geometry })
    else if (kieu !== 'diem' && pts.length === 2) feats.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: pts } })
    ;(map.current?.getSource('dang-ve') as maplibregl.GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: feats })
    if (daSua.current) onChangeRef.current?.(g)
  }, [pts, kieu, cheDo, san])

  // Giá trị từ ngoài (dán toạ độ) → nạp lại đỉnh
  const giaTriKey = JSON.stringify(giaTri ?? null)
  const giaTriCuoi = useRef(giaTriKey)
  useEffect(() => {
    if (cheDo !== 'sua' || giaTriKey === giaTriCuoi.current) return
    giaTriCuoi.current = giaTriKey
    const moi = dinhTu(giaTri)
    if (JSON.stringify(moi) !== JSON.stringify(ptsRef.current)) setPts(moi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giaTriKey, cheDo])

  return (
    <div className={`relative rounded-lg overflow-hidden border ${cao}`}>
      <div ref={khung} className="absolute inset-0" />
      {!san && <div className="absolute inset-0 flex items-center justify-center bg-white/60"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>}
      {loi && <div className="absolute bottom-2 left-2 right-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded px-2 py-1">{loi}</div>}
      {cheDo === 'sua' && (
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 items-center">
          <span className="text-xs bg-white/95 border rounded px-2 py-1 text-slate-700 shadow-sm">
            {kieu === 'diem' ? 'Bấm để đặt điểm' : kieu === 'tuyen' ? 'Bấm lần lượt các điểm dọc tuyến' : 'Bấm các đỉnh vùng'}
            {' · '}{pts.length} điểm{kieu === 'tuyen' && pts.length > 1 ? ` · ${Math.round(doDaiM(pts)).toLocaleString('vi-VN')} m` : ''}
          </span>
          <button type="button" onClick={() => { daSua.current = true; setPts((p) => p.slice(0, -1)) }} disabled={!pts.length}
            className="text-xs bg-white border rounded px-2 py-1 shadow-sm hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"><Undo2 className="w-3.5 h-3.5" />Hoàn tác</button>
          <button type="button" onClick={() => { daSua.current = true; setPts([]) }} disabled={!pts.length}
            className="text-xs bg-white border rounded px-2 py-1 shadow-sm hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" />Xoá nét</button>
        </div>
      )}
    </div>
  )
}
