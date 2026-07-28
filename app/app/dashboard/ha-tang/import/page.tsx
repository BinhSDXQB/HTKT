import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { ChevronRight, Upload, FileCode2, Globe, Map, FileJson, Webhook, Cable, Info } from 'lucide-react'
import { ImportGISPanel } from '@/components/ha-tang/import-gis-panel'
import { db } from '@/lib/db'

export default async function ImportGISPage() {
  await requireAuth()

  const [wards, streets] = await Promise.all([
    db.administrativeUnit.findMany({ where: { type: 'PHUONG_XA', isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.street.findMany({ where: { isActive: true }, select: { id: true, name: true, ward: { select: { name: true } } }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="space-y-6 max-w-4xl">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard/tai-san" className="hover:text-blue-700">Tài sản hạ tầng</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Import GIS đa định dạng</span>
      </nav>

      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Import hạ tầng từ nhiều nguồn
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Hỗ trợ: AutoCAD DXF · KML/KMZ Google Earth · GeoJSON · Shapefile · Webhook SCADA
        </p>
      </div>

      {/* Các định dạng hỗ trợ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: FileCode2, label: 'AutoCAD DXF', ext: '.dxf', desc: 'Bản vẽ kỹ thuật CAD — trích xuất layer, đường, điểm', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { icon: Globe,     label: 'KML / KMZ',  ext: '.kml/.kmz', desc: 'Google Earth — điểm, đường, vùng có tên và mô tả', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
          { icon: FileJson,  label: 'GeoJSON',    ext: '.geojson/.json', desc: 'Chuẩn GIS quốc tế — kết xuất từ QGIS, ArcGIS', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { icon: Map,       label: 'Shapefile',  ext: '.zip (.shp)', desc: 'ESRI Shapefile đóng gói ZIP — chuẩn GIS phổ biến', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
          { icon: Cable,     label: 'PDF (bảng)', ext: '.pdf', desc: 'Trích xuất dữ liệu bảng từ báo cáo PDF kỹ thuật', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
          { icon: Webhook,   label: 'Webhook API', ext: 'REST', desc: 'Liên thông SCADA/phần mềm nhà máy — nhận real-time', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
        ].map(f => (
          <div key={f.label} className={`rounded-xl border ${f.border} ${f.bg} p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <f.icon className={`w-4 h-4 ${f.color} shrink-0`} />
              <span className={`font-semibold text-sm ${f.color}`}>{f.label}</span>
            </div>
            <p className="text-xs text-slate-500">{f.desc}</p>
            <p className={`text-[10px] font-mono mt-1 ${f.color} opacity-70`}>{f.ext}</p>
          </div>
        ))}
      </div>

      {/* Webhook info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-indigo-800 flex items-center gap-2">
          <Webhook className="w-4 h-4" />Tích hợp Webhook / API với phần mềm nhà máy
        </h3>
        <p className="text-sm text-indigo-700">Phần mềm SCADA / quản lý nhà máy có thể gửi dữ liệu tự động về hệ thống:</p>
        <div className="bg-white rounded-lg border border-indigo-200 p-4 text-xs font-mono space-y-1">
          <p className="text-slate-500"># Endpoint nhận webhook</p>
          <p><span className="text-green-600">POST</span> <span className="text-blue-700">https://qlhtkt.htkt.com.vn/api/webhook/infrastructure</span></p>
          <p className="text-slate-500 mt-2"># Header xác thực</p>
          <p>Authorization: Bearer <span className="text-orange-600">htkt-webhook-2025</span></p>
          <p className="text-slate-500 mt-2"># Body mẫu (trạm bơm)</p>
          <p>{`{ "source":"TB-001", "type":"TRAM_BOM", "data":{ "luuLuong":450.5, "trangThaiMay":"HOAT_DONG" } }`}</p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link href="/api/webhook/infrastructure" target="_blank"
            className="flex items-center gap-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg transition-colors">
            <Info className="w-3.5 h-3.5" />Xem tài liệu API đầy đủ
          </Link>
        </div>
      </div>

      {/* Upload panel */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4" />Upload file & Preview trước khi lưu
        </h2>
        <ImportGISPanel wards={wards} streets={streets.map(s => ({ id: s.id, name: s.name, wardName: s.ward?.name ?? '' }))} />
      </div>
    </div>
  )
}
