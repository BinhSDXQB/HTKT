'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { QD72_GIS_LAYERS, type Qd72Layer, type Qd72LayerNhom } from '@/lib/qd72/gis-layers'
import { Layers, Loader2, MapPin } from 'lucide-react'

const NHOM_TEN: Record<Qd72LayerNhom, string> = {
  RANH_GIOI: 'Ranh giới', GIAO_THONG: 'Giao thông',
  DUONG_DAY: 'Đường dây / cáp / chiếu sáng', NGUON_NUOC: 'Nguồn nước', CHINH_TRANG: 'Chỉnh trang',
}
const PROVINCE_BOUNDS: [[number, number], [number, number]] = [[105.606055, 16.300464], [107.385952, 18.090919]]

export function Qd72Map({ caseId, ward }: { caseId?: string; ward?: string }) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const popup = useRef<maplibregl.Popup | null>(null)
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [panel, setPanel] = useState(true)

  useEffect(() => {
    if (!container.current || map.current) return
    const m = new maplibregl.Map({
      container: container.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [106.85, 17.1], zoom: 8, maxZoom: 20,
    })
    m.addControl(new maplibregl.NavigationControl(), 'top-right')
    m.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left')
    m.addControl(new maplibregl.FullscreenControl(), 'top-right')
    m.on('load', () => {
      setReady(true)
      m.fitBounds(PROVINCE_BOUNDS, { padding: { top: 40, bottom: 40, left: 300, right: 40 }, duration: 800 })
    })
    map.current = m
    return () => { m.remove(); map.current = null }
  }, [])

  const removeLayer = useCallback((key: string) => {
    const m = map.current; if (!m) return
    for (const suffix of ['circle', 'line', 'fill', 'outline']) {
      const id = `qd72-${key}-${suffix}`
      if (m.getLayer(id)) m.removeLayer(id)
    }
    if (m.getSource(`qd72-${key}`)) m.removeSource(`qd72-${key}`)
  }, [])

  const addLayer = useCallback(async (layer: Qd72Layer) => {
    const m = map.current; if (!m) return
    setLoading((s) => ({ ...s, [layer.key]: true }))
    try {
      const params = new URLSearchParams({ layer: layer.key })
      if (caseId) params.set('caseId', caseId)
      if (ward) params.set('ward', ward)
      const res = await fetch(`/api/qd72/gis?${params}`)
      const fc = await res.json()
      const srcId = `qd72-${layer.key}`
      if (m.getSource(srcId)) removeLayer(layer.key)
      m.addSource(srcId, { type: 'geojson', data: fc })
      const color = layer.mau
      // Polygon: fill + outline
      m.addLayer({ id: `qd72-${layer.key}-fill`, type: 'fill', source: srcId,
        filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': color, 'fill-opacity': 0.18 } })
      m.addLayer({ id: `qd72-${layer.key}-outline`, type: 'line', source: srcId,
        filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'line-color': color, 'line-width': 1.5 } })
      // LineString
      m.addLayer({ id: `qd72-${layer.key}-line`, type: 'line', source: srcId,
        filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': color, 'line-width': 3 } })
      // Point
      m.addLayer({ id: `qd72-${layer.key}-circle`, type: 'circle', source: srcId,
        filter: ['==', ['geometry-type'], 'Point'],
        paint: { 'circle-radius': 6, 'circle-color': color, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 } })

      // Popup thuộc tính
      for (const suffix of ['circle', 'line', 'fill']) {
        const id = `qd72-${layer.key}-${suffix}`
        m.on('click', id, (e) => {
          const f = e.features?.[0]; if (!f) return
          const p = f.properties ?? {}
          const rows = Object.entries(p).filter(([k]) => k !== 'id' && k !== 'layer')
            .map(([k, v]) => `<div><span style="color:#64748b">${k}:</span> <b>${v ?? '—'}</b></div>`).join('')
          popup.current?.remove()
          popup.current = new maplibregl.Popup({ maxWidth: '300px' })
            .setLngLat(e.lngLat)
            .setHTML(`<div style="font-size:12px"><div style="font-weight:600;margin-bottom:4px;color:${color}">${layer.ten}</div>${rows}<div style="margin-top:4px;color:#94a3b8;font-style:italic">Đánh giá sơ bộ — cần đơn vị chuyên môn xác minh.</div></div>`)
            .addTo(m)
        })
        m.on('mouseenter', id, () => { m.getCanvas().style.cursor = 'pointer' })
        m.on('mouseleave', id, () => { m.getCanvas().style.cursor = '' })
      }
    } catch (err) {
      console.error('[qd72-map addLayer]', err)
    } finally {
      setLoading((s) => ({ ...s, [layer.key]: false }))
    }
  }, [caseId, ward, removeLayer])

  const toggle = useCallback((layer: Qd72Layer) => {
    if (layer.bang === 'derived') return
    setActive((s) => {
      const on = !s[layer.key]
      if (on) addLayer(layer); else removeLayer(layer.key)
      return { ...s, [layer.key]: on }
    })
  }, [addLayer, removeLayer])

  const byNhom = (nhom: Qd72LayerNhom) => QD72_GIS_LAYERS.filter((l) => l.nhom === nhom)

  return (
    <div className="relative w-full h-[calc(100vh-13rem)] min-h-[480px] rounded-xl overflow-hidden border">
      <div ref={container} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/70 z-10">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      )}

      <button onClick={() => setPanel((p) => !p)}
        className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-lg bg-white shadow px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        <Layers className="w-4 h-4" /> Lớp bản đồ
      </button>

      {panel && (
        <div className="absolute top-14 left-3 z-20 w-72 max-h-[calc(100%-5rem)] overflow-y-auto rounded-xl bg-white shadow-lg border p-3">
          <p className="text-xs text-slate-500 mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> Bật/tắt lớp khảo sát QĐ72</p>
          {(Object.keys(NHOM_TEN) as Qd72LayerNhom[]).map((nhom) => (
            <div key={nhom} className="mb-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">{NHOM_TEN[nhom]}</p>
              {byNhom(nhom).map((l) => (
                <label key={l.key} className={`flex items-center gap-2 py-1 px-1 rounded text-sm ${l.bang === 'derived' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`}
                  title={l.bang === 'derived' ? 'Lớp phái sinh — bổ sung sau' : (l.moTa ?? '')}>
                  <input type="checkbox" checked={!!active[l.key]} disabled={l.bang === 'derived'}
                    onChange={() => toggle(l)} className="w-4 h-4 rounded border-slate-300" />
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: l.mau }} />
                  <span className="text-slate-700 flex-1">{l.ten}</span>
                  {loading[l.key] && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
