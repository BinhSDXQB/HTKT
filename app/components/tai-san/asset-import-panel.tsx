'use client'

import { useState, useRef } from 'react'
import { Download, Upload, CheckCircle2, XCircle, Loader2, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DOMAIN_LABEL, DOMAIN_COLOR } from '@/lib/constants/tai-san'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

type AssetTypeRow = { id: string; name: string; code: string; domain: string; hasSpec: boolean }
type BatchRow = {
  id: string; batchCode: string; fileName: string; importedAt: Date
  status: string; totalRows: number; successRows: number; errorRows: number
  assetType: { name: string }; importedBy: { name: string }
}

type ImportResult = { success: boolean; batchCode?: string; totalRows?: number; successRows?: number; errorRows?: number; errors?: { row: number; field: string; message: string }[] }

const STATUS_LABEL: Record<string, string> = { THANH_CONG: 'Thành công', CO_LOI: 'Có lỗi', THAT_BAI: 'Thất bại', DANG_XU_LY: 'Đang xử lý' }
const STATUS_COLOR: Record<string, string> = { THANH_CONG: 'bg-green-100 text-green-700', CO_LOI: 'bg-amber-100 text-amber-700', THAT_BAI: 'bg-red-100 text-red-700', DANG_XU_LY: 'bg-blue-100 text-blue-700' }

export function AssetImportPanel({ assetTypes, recentBatches }: { assetTypes: AssetTypeRow[]; recentBatches: BatchRow[] }) {
  const [selectedType, setSelectedType] = useState<AssetTypeRow | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleDownloadTemplate(type: AssetTypeRow) {
    window.location.href = `/api/templates/assets/${type.code}`
  }

  async function handleImport(type: AssetTypeRow) {
    const file = fileRef.current?.files?.[0]
    if (!file) return alert('Vui lòng chọn file Excel')

    setImporting(true)
    setResult(null)
    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch(`/api/import/assets/${type.code}`, { method: 'POST', body: fd })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ success: false, errors: [{ row: 0, field: 'general', message: 'Lỗi kết nối server' }] })
    } finally {
      setImporting(false)
    }
  }

  // Nhóm theo domain
  const grouped = assetTypes.reduce<Record<string, AssetTypeRow[]>>((acc, t) => {
    if (!acc[t.domain]) acc[t.domain] = []
    acc[t.domain].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {/* Chọn loại tài sản */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-slate-700 text-sm mb-4">1. Chọn loại tài sản cần import</h3>
        <div className="space-y-4">
          {Object.entries(grouped).map(([domain, types]) => (
            <div key={domain}>
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">{DOMAIN_LABEL[domain]}</p>
              <div className="flex flex-wrap gap-2">
                {types.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedType(t); setResult(null); if (fileRef.current) fileRef.current.value = '' }}
                    className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-all ${selectedType?.id === t.id ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                  >
                    <span className={`w-2 h-2 rounded-full`} style={{ background: DOMAIN_COLOR[t.domain].includes('blue') ? '#3b82f6' : DOMAIN_COLOR[t.domain].includes('green') ? '#22c55e' : DOMAIN_COLOR[t.domain].includes('yellow') ? '#eab308' : DOMAIN_COLOR[t.domain].includes('indigo') ? '#6366f1' : DOMAIN_COLOR[t.domain].includes('cyan') ? '#06b6d4' : '#a855f7' }} />
                    {t.name}
                    {t.hasSpec && <span className="text-xs bg-green-100 text-green-700 px-1 rounded">Có mẫu</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Download + Upload */}
      {selectedType && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm">
            2. Tải mẫu Excel — <Badge className={`text-xs ${DOMAIN_COLOR[selectedType.domain]}`}>{selectedType.name}</Badge>
          </h3>

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <FileSpreadsheet className="w-8 h-8 text-blue-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">mau_nhap_{selectedType.code.toLowerCase()}.xlsx</p>
              <p className="text-xs text-blue-600 mt-0.5">
                {selectedType.hasSpec ? 'Mẫu chuyên biệt với đầy đủ cột kỹ thuật cho loại này' : 'Mẫu chung (chưa có cột kỹ thuật chuyên biệt)'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={() => handleDownloadTemplate(selectedType)}
            >
              <Download className="w-4 h-4" />Tải mẫu
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">3. Upload file đã điền dữ liệu</p>
            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="flex-1 text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-300 file:text-sm file:bg-white file:text-slate-700 hover:file:bg-slate-50 cursor-pointer"
              />
              <Button
                className="bg-blue-700 hover:bg-blue-800 text-white gap-2 min-w-[120px]"
                onClick={() => handleImport(selectedType)}
                disabled={importing}
              >
                {importing ? <><Loader2 className="w-4 h-4 animate-spin" />Đang xử lý...</> : <><Upload className="w-4 h-4" />Import</>}
              </Button>
            </div>
          </div>

          {/* Kết quả */}
          {result && (
            <div className={`rounded-lg border p-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                <span className={`font-semibold text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'Import hoàn tất' : 'Import thất bại'}
                </span>
              </div>
              {result.totalRows != null && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center"><p className="text-2xl font-bold text-slate-800">{result.totalRows}</p><p className="text-xs text-slate-500">Tổng dòng</p></div>
                  <div className="text-center"><p className="text-2xl font-bold text-green-700">{result.successRows}</p><p className="text-xs text-slate-500">Thành công</p></div>
                  <div className="text-center"><p className="text-2xl font-bold text-red-600">{result.errorRows}</p><p className="text-xs text-slate-500">Lỗi</p></div>
                </div>
              )}
              {result.errors && result.errors.length > 0 && (
                <div>
                  <button onClick={() => setShowErrors(!showErrors)} className="flex items-center gap-1 text-xs text-red-700 font-medium hover:underline">
                    {showErrors ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {result.errors.length} lỗi {showErrors ? '(ẩn)' : '(xem chi tiết)'}
                  </button>
                  {showErrors && (
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                      {result.errors.map((e, i) => (
                        <p key={i} className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">{e.message}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lịch sử import */}
      {recentBatches.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-slate-700 text-sm mb-4">Lịch sử import</h3>
          <div className="space-y-2">
            {recentBatches.map((b) => (
              <div key={b.id} className="flex items-center gap-3 py-2 border-b last:border-0 text-sm">
                <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 truncate">{b.fileName}</p>
                  <p className="text-xs text-slate-400">{b.assetType.name} · {b.importedBy.name} · {format(new Date(b.importedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge className={`text-xs ${STATUS_COLOR[b.status]}`}>{STATUS_LABEL[b.status]}</Badge>
                  <p className="text-xs text-slate-500 mt-0.5">{b.successRows}/{b.totalRows} dòng</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
