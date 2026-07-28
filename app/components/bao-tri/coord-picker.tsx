'use client'

import { useState, useRef, useEffect } from 'react'
import { Map, MapPin, X, Loader2 } from 'lucide-react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

type Props = {
  label: string
  lat?: number | null
  lng?: number | null
  onConfirm: (lat: number, lng: number) => void
}

export function CoordPicker({ label, lat, lng, onConfirm }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [localLat, setLocalLat] = useState(lat?.toString() ?? '')
  const [localLng, setLocalLng] = useState(lng?.toString() ?? '')
  const [mapReady, setMapReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const marker = useRef<maplibregl.Marker | null>(null)

  useEffect(() => {
    if (!showModal || !mapContainer.current) return
    setIsLoading(true)

    const initMap = async () => {
      try {
        map.current = new maplibregl.Map({
          container: mapContainer.current!,
          style: STYLE_URL,
          center: [lng ?? 106.8, lat ?? 17.1],
          zoom: 11,
        })

        map.current.on('load', () => {
          setMapReady(true)
          setIsLoading(false)
          addMarker(lat ?? 17.1, lng ?? 106.8)
          map.current?.on('click', handleMapClick)
        })
      } catch (e) {
        console.error('Map init error:', e)
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick)
        map.current.remove()
      }
    }
  }, [showModal])

  const addMarker = (markerLat: number, markerLng: number) => {
    if (marker.current) marker.current.remove()
    if (!map.current) return
    marker.current = new maplibregl.Marker({ color: '#22c55e' })
      .setLngLat([markerLng, markerLat])
      .addTo(map.current)
  }

  const handleMapClick = (e: maplibregl.MapMouseEvent) => {
    if (!map.current) return
    const { lng: clickLng, lat: clickLat } = e.lngLat
    setLocalLat(clickLat.toFixed(6))
    setLocalLng(clickLng.toFixed(6))
    addMarker(clickLat, clickLng)
  }

  const handlePasteCoords = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const match = text.match(/([\d.]+)\s*,\s*([\d.]+)/)
      if (!match) {
        alert('Định dạng không hợp lệ. Sử dụng: 16.461, 107.591')
        return
      }
      const [, latStr, lngStr] = match
      const newLat = parseFloat(latStr)
      const newLng = parseFloat(lngStr)
      if (isNaN(newLat) || isNaN(newLng)) {
        alert('Giá trị không hợp lệ.')
        return
      }
      setLocalLat(newLat.toFixed(6))
      setLocalLng(newLng.toFixed(6))
      if (map.current) {
        map.current.flyTo({ center: [newLng, newLat], zoom: 14 })
        addMarker(newLat, newLng)
      }
    } catch (e) {
      alert('Không thể đọc clipboard.')
    }
  }

  const handleConfirm = () => {
    const parsedLat = parseFloat(localLat)
    const parsedLng = parseFloat(localLng)
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      alert('Vui lòng nhập tọa độ hợp lệ.')
      return
    }
    onConfirm(parsedLat, parsedLng)
    setShowModal(false)
  }

  const hasCoord = lat != null && lng != null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="block text-sm font-semibold text-slate-700">
          {label}
        </label>
        {hasCoord && (
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
            📍 {lat!.toFixed(4)}, {lng!.toFixed(4)}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Vĩ độ (lat)"
          value={localLat}
          onChange={(e) => setLocalLat(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <input
          type="text"
          placeholder="Kinh độ (lng)"
          value={localLng}
          onChange={(e) => setLocalLng(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handlePasteCoords}
          className="flex-1 text-sm px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          📋 Dán từ Google Maps
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="flex-1 flex items-center justify-center gap-2 text-sm px-3 py-1.5 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          <Map className="w-4 h-4" />
          Chọn trên bản đồ
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[70vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-slate-900">Chọn {label.toLowerCase()}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : (
              <>
                <div ref={mapContainer} className="flex-1 w-full" />
                <div className="px-6 py-4 border-t bg-slate-50 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Vĩ độ (lat)"
                      value={localLat}
                      onChange={(e) => setLocalLat(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Kinh độ (lng)"
                      value={localLng}
                      onChange={(e) => setLocalLng(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Click trên bản đồ để chọn vị trí hoặc nhập tọa độ trực tiếp
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Huỷ
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      Xác nhận
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
