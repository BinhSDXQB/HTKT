'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle2, XCircle, AlertTriangle, Eye, Save, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Ward   = { id: string; name: string }
type Street = { id: string; name: string; wardName: string }

type PreviewFeature = {
  geometry: { type: string; coordinates: unknown }
  label: string | null
  layer: string | null
  assetType: string | null
  properties: Record<string, unknown>
}

type ParseResponse = {
  format: string
  totalFeatures: number
  errors: string[]
  warnings: string[]
  crs?: string
  layers?: string[]
  preview: PreviewFeature[]
}

const TY_LE_OPTIONS = [
  { value: '', label: '-- Chọn tỷ lệ --' },
  { value: '1:500', label: '1:500 — Chi tiết mặt bằng' },
  { value: '1:1000', label: '1:1000 — Quy hoạch chi tiết' },
  { value: '1:2000', label: '1:2000 — Quy hoạch phân khu' },
  { value: '1:5000', label: '1:5000 — Quy hoạch chung đô thị' },
  { value: '1:10000', label: '1:10000 — Quy hoạch vùng' },
  { value: '1:25000', label: '1:25000 — Bản đồ địa hình' },
]

const HE_TOA_DO_OPTIONS = [
  { value: '', label: '-- Chọn hệ tọa độ --' },
  { value: 'VN2000_QT', label: 'VN-2000, KTT 106°15\' (Quảng Trị)' },
  { value: 'VN2000_TW', label: 'VN-2000, KTT trung ương' },
  { value: 'WGS84', label: 'WGS84 (GPS quốc tế)' },
  { value: 'HN72', label: 'Hà Nội 72 (cũ — cần chuyển đổi)' },
]

const HUONG_BAN_VE_OPTIONS = [
  { value: '', label: '-- Chọn hướng --' },
  { value: 'BAC', label: 'Hướng Bắc (chuẩn)' },
  { value: 'BAC_TU', label: 'Bắc từ (hoa tiêu la bàn)' },
  { value: 'XOAY', label: 'Xoay theo trục đường / công trình' },
]

const FORMAT_LABEL: Record<string, string> = {
  POINT: '📍 Điểm', LineString: '📏 Đường', Polygon: '🔲 Vùng'
}

const ASSET_TYPE_LABEL: Record<string, string> = {
  DenChieuSang:   '💡 Đèn chiếu sáng',
  CayXanhDuong:   '🌳 Cây xanh',
  HoGa:           '🔵 Hố ga',
  CongThoatNuoc:  '💧 Cống thoát nước',
  OngCapNuoc:     '🚰 Ống cấp nước',
  VanCapNuoc:     '🔧 Van cấp nước',
  CapVienThong:   '📡 Cáp viễn thông',
  TuyenMangLuoi:  '🛣️ Tuyến đường',
}

export function ImportGISPanel({ wards, streets }: { wards: Ward[]; streets: Street[] }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile]         = useState<File | null>(null)
  const [tenDuAn, setTenDuAn]   = useState('')
  const [wardId, setWardId]     = useState('')
  const [streetId, setStreetId] = useState('')
  const [tyLe, setTyLe]         = useState('')
  const [heToaDo, setHeToaDo]   = useState('')
  const [huongBanVe, setHuongBanVe] = useState('')
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [result, setResult]     = useState<ParseResponse | null>(null)
  const [error, setError]       = useState('')
  const [saveResult, setSaveResult] = useState<{ saved: number; errors: string[] } | null>(null)

  const missingMeta = !tenDuAn.trim() || !heToaDo || !tyLe

  async function handleParse() {
    if (!file) return
    setLoading(true); setError(''); setResult(null); setSaveResult(null)
    const fd = new FormData()
    fd.append('file', file)
    if (wardId)   fd.append('wardId', wardId)
    if (streetId) fd.append('streetId', streetId)
    if (tenDuAn.trim()) fd.append('tenDuAn', tenDuAn.trim())
    if (tyLe)     fd.append('tyLe', tyLe)
    if (heToaDo)  fd.append('heToaDo', heToaDo)
    if (huongBanVe) fd.append('huongBanVe', huongBanVe)

    try {
      const res = await fetch('/api/import-gis', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Lỗi parse'); return }
      setResult(data)
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }

  async function handleSave() {
    if (!file || !result) return
    setSaving(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('save', 'true')
    if (wardId)   fd.append('wardId', wardId)
    if (streetId) fd.append('streetId', streetId)
    if (tenDuAn.trim()) fd.append('tenDuAn', tenDuAn.trim())
    if (tyLe)     fd.append('tyLe', tyLe)
    if (heToaDo)  fd.append('heToaDo', heToaDo)
    if (huongBanVe) fd.append('huongBanVe', huongBanVe)

    try {
      const res = await fetch('/api/import-gis', { method: 'POST', body: fd })
      const data = await res.json()
      setSaveResult({ saved: data.saved, errors: data.errors ?? [] })
    } catch (e) { setError(String(e)) }
    finally { setSaving(false) }
  }

  const filteredStreets = wardId ? streets.filter(s => wards.find(w => w.id === wardId)?.name === s.wardName) : streets

  return (
    <div className="space-y-5">
      {/* Hướng dẫn đặt tên dự án */}
      <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 space-y-2">
        <h3 className="font-semibold text-amber-800 flex items-center gap-2 text-sm">
          <Info className="w-4 h-4 shrink-0" />Lưu ý quan trọng khi import bản vẽ GIS
        </h3>
        <ul className="text-xs text-amber-700 space-y-1 ml-6 list-disc">
          <li><strong>Tên dự án</strong> phải đặt ĐÚNG tên công trình/dự án đầu tư, thuận lợi cho tìm kiếm, tra cứu, thẩm định, phê duyệt, đấu thầu, thanh quyết toán.</li>
          <li><strong>Hệ tọa độ</strong> phải chọn chính xác (VN-2000 múi chiếu Quảng Trị: KTT 106°15&apos;) — tránh lệch tọa độ, lấn phạm vi đất cấp khác.</li>
          <li><strong>Tỷ lệ bản vẽ</strong> phải đúng tỷ lệ nguồn (1:500, 1:1000...) — sai tỷ lệ dẫn đến kích thước công trình không khớp thực tế.</li>
          <li><strong>Hướng bản vẽ</strong> (hướng Bắc) cần chính xác — sai hướng gây xoay toàn bộ vị trí, sai quy hoạch phê duyệt.</li>
        </ul>
      </div>

      {/* Tên dự án / Tên công trình */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">
          Tên dự án / Tên công trình <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={tenDuAn}
          onChange={e => setTenDuAn(e.target.value)}
          placeholder="VD: Hệ thống thoát nước đường Hùng Vương, TP Đông Hà — Giai đoạn 1"
          className="w-full h-9 px-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-[11px] text-slate-400">
          Ghi đúng tên theo quyết định đầu tư / hồ sơ thiết kế. Tên này dùng xuyên suốt: tìm kiếm → thẩm định → đấu thầu → thanh quyết toán.
        </p>
      </div>

      {/* Hệ tọa độ + Tỷ lệ + Hướng */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Hệ tọa độ <span className="text-red-500">*</span>
          </label>
          <select value={heToaDo} onChange={e => setHeToaDo(e.target.value)}
            className="w-full h-9 px-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
            {HE_TOA_DO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {heToaDo === 'HN72' && (
            <p className="text-[11px] text-amber-600">Hà Nội 72 đã lỗi thời — hệ thống sẽ chuyển đổi sang VN-2000 khi lưu.</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Tỷ lệ bản vẽ <span className="text-red-500">*</span>
          </label>
          <select value={tyLe} onChange={e => setTyLe(e.target.value)}
            className="w-full h-9 px-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
            {TY_LE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Hướng bản vẽ</label>
          <select value={huongBanVe} onChange={e => setHuongBanVe(e.target.value)}
            className="w-full h-9 px-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
            {HUONG_BAN_VE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Chọn đơn vị + tuyến đường */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Phường/Xã</label>
          <select value={wardId} onChange={e => { setWardId(e.target.value); setStreetId('') }}
            className="w-full h-9 px-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- Tất cả phường/xã --</option>
            {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Tuyến đường (gắn assets vào)</label>
          <select value={streetId} onChange={e => setStreetId(e.target.value)}
            className="w-full h-9 px-3 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- Chưa gán tuyến --</option>
            {filteredStreets.map(s => <option key={s.id} value={s.id}>{s.name}{s.wardName ? ` (${s.wardName})` : ''}</option>)}
          </select>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setResult(null) } }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${file ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400'}`}>
        <input ref={fileRef} type="file" accept=".dxf,.kml,.kmz,.geojson,.json,.zip,.shp" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setResult(null) } }} />
        {file ? (
          <div>
            <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-semibold text-blue-800">{file.name}</p>
            <p className="text-xs text-blue-500 mt-1">{(file.size/1024).toFixed(1)} KB — Click để đổi file</p>
          </div>
        ) : (
          <div>
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="font-medium text-slate-700">Kéo thả hoặc click để chọn file</p>
            <p className="text-xs text-slate-400 mt-1">Hỗ trợ: DXF · KML · KMZ · GeoJSON · Shapefile (.zip)</p>
          </div>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Cảnh báo thiếu thông tin bắt buộc */}
      {file && missingMeta && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Chưa đủ thông tin bắt buộc:</strong>
            <span className="ml-1">
              {[
                !tenDuAn.trim() && 'Tên dự án',
                !heToaDo && 'Hệ tọa độ',
                !tyLe && 'Tỷ lệ bản vẽ',
              ].filter(Boolean).join(', ')}
            </span>
            . Vui lòng điền đầy đủ để tránh sai lệch tọa độ, lấn ranh giới đất hoặc sai quy hoạch phê duyệt.
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={handleParse} disabled={!file || loading || missingMeta} className="gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Đang phân tích...</> : <><Eye className="w-4 h-4"/>Phân tích & Preview</>}
        </Button>
        {result && result.totalFeatures > 0 && !saveResult && (
          <Button onClick={handleSave} disabled={saving} variant="outline" className="gap-2 text-green-700 border-green-300 hover:bg-green-50">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>Đang lưu...</> : <><Save className="w-4 h-4"/>Lưu {result.totalFeatures} đối tượng</>}
          </Button>
        )}
      </div>

      {/* Kết quả save */}
      {saveResult && (
        <div className="rounded-xl bg-green-50 border border-green-300 p-4 space-y-2">
          <p className="font-semibold text-green-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/>Đã lưu {saveResult.saved} đối tượng vào DB</p>
          <p className="text-xs text-green-700">Dự án: <strong>{tenDuAn}</strong> — {heToaDo} — Tỷ lệ {tyLe}</p>
          {saveResult.errors.length > 0 && <p className="text-xs text-red-600">{saveResult.errors.length} lỗi: {saveResult.errors.slice(0,2).join(', ')}</p>}
        </div>
      )}

      {/* Preview kết quả */}
      {result && (
        <div className="space-y-4">
          {/* Thông tin dự án */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 space-y-1.5">
            <p className="font-semibold text-blue-800 text-sm">{tenDuAn}</p>
            <div className="flex items-center gap-3 flex-wrap text-xs text-blue-600">
              {heToaDo && <span className="bg-blue-100 px-2 py-0.5 rounded">{HE_TOA_DO_OPTIONS.find(o => o.value === heToaDo)?.label}</span>}
              {tyLe && <span className="bg-blue-100 px-2 py-0.5 rounded">Tỷ lệ {tyLe}</span>}
              {huongBanVe && <span className="bg-blue-100 px-2 py-0.5 rounded">{HUONG_BAN_VE_OPTIONS.find(o => o.value === huongBanVe)?.label}</span>}
            </div>
          </div>

          {/* Cảnh báo tọa độ */}
          {result.crs && heToaDo && result.crs !== heToaDo && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>
              <span>Hệ tọa độ trong file (<strong>{result.crs}</strong>) khác với hệ tọa độ bạn chọn (<strong>{heToaDo}</strong>). Kiểm tra lại để tránh lệch vị trí công trình!</span>
            </div>
          )}

          {/* Tóm tắt */}
          <div className="bg-slate-50 rounded-xl border p-4 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-slate-700">Định dạng: <span className="text-blue-700">{result.format}</span></span>
              <span className="text-sm text-slate-600">Tổng: <strong>{result.totalFeatures}</strong> đối tượng</span>
              {result.crs && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">CRS file: {result.crs}</span>}
            </div>
            {result.layers && result.layers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-slate-500">Layers:</span>
                {result.layers.map(l => <span key={l} className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">{l}</span>)}
              </div>
            )}
          </div>

          {/* Errors / Warnings */}
          {result.errors.map((e, i) => <div key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><XCircle className="w-4 h-4 shrink-0 mt-0.5"/>{e}</div>)}
          {result.warnings.map((w, i) => <div key={i} className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>{w}</div>)}

          {/* Preview features */}
          {result.preview.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Preview {result.preview.length} đối tượng đầu:</h3>
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {result.preview.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white border rounded-lg px-3 py-2 text-xs">
                    <span className="shrink-0 text-slate-400 w-6 text-right">{i+1}</span>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      f.geometry.type === 'Point' ? 'bg-blue-100 text-blue-700' :
                      f.geometry.type === 'LineString' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                      {FORMAT_LABEL[f.geometry.type] ?? f.geometry.type}
                    </span>
                    {f.layer && <span className="font-mono text-slate-500 shrink-0">[{f.layer}]</span>}
                    <span className="flex-1 truncate text-slate-700 font-medium">{f.label ?? '(không có tên)'}</span>
                    {f.assetType && <span className="shrink-0 text-[10px] text-slate-500">{ASSET_TYPE_LABEL[f.assetType] ?? f.assetType}</span>}
                  </div>
                ))}
                {result.totalFeatures > 50 && (
                  <p className="text-xs text-slate-400 text-center py-2">... và {result.totalFeatures - 50} đối tượng nữa</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
