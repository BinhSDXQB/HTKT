'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2, AlertTriangle, Info, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

type Ward = { id: string; name: string }

type ImportResult = { sheet: string; category: string; rows: number; id: string; bieuMau: string }
type SheetError  = { sheet: string; type: 'REJECTED' | 'WARNING'; message: string }

const SHEET_NAMES_CHUAN = [
  'DUONG GT (T)', 'ĐIện chiếu sáng', 'Thoát nước mưa và thải',
  'cây xanh', 'Công viên', 'Cấp nước', 'Bãi đổ xe',
]

export function WardReportImportPanel({ wards }: { wards: Ward[] }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile]       = useState<File | null>(null)
  const [wardId, setWardId]   = useState('')
  const [year, setYear]       = useState(new Date().getFullYear().toString())
  const [month, setMonth]     = useState('')
  const [loading, setLoading] = useState(false)

  const [results,  setResults]  = useState<ImportResult[] | null>(null)
  const [errors,   setErrors]   = useState<SheetError[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [rejected, setRejected] = useState<{ reason: string; hint: string } | null>(null)
  const [serverErr, setServerErr] = useState('')

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && /\.(xlsx|xls)$/i.test(f.name)) { setFile(f); reset() }
  }

  function reset() {
    setResults(null); setErrors([]); setWarnings([]); setRejected(null); setServerErr('')
  }

  async function handleImport() {
    if (!file || !year) return
    setLoading(true); reset()

    const fd = new FormData()
    fd.append('file', file)
    fd.append('year', year)
    if (wardId) fd.append('wardId', wardId)
    if (month)  fd.append('month', month)

    try {
      const res  = await fetch('/api/ward-reports/import', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) { setServerErr(data.error ?? 'Lỗi không xác định'); return }

      // Bị từ chối hoàn toàn (tên file sai)
      if (data.rejected) {
        setRejected({ reason: data.reason, hint: data.hint ?? '' })
        return
      }

      setResults(data.results ?? [])
      setErrors(data.errors ?? [])
      setWarnings(data.warnings ?? [])
      router.refresh()
    } catch (e) {
      setServerErr(String(e))
    } finally {
      setLoading(false)
    }
  }

  const rejectedSheets = errors.filter(e => e.type === 'REJECTED')
  const warnSheets     = errors.filter(e => e.type === 'WARNING')

  return (
    <div className="space-y-5">
      {/* Thông tin báo cáo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Phường / Xã / Đặc khu *</label>
          <select value={wardId} onChange={e => setWardId(e.target.value)}
            className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-green-500">
            <option value="">-- Chọn đơn vị --</option>
            {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Năm báo cáo *</label>
          <select value={year} onChange={e => setYear(e.target.value)}
            className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-green-500">
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Tháng (để trống = cả năm)</label>
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Cả năm</option>
            {Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>Tháng {m}</option>)}
          </select>
        </div>
      </div>

      {/* Upload zone */}
      <div onDragOver={e=>e.preventDefault()} onDrop={handleFileDrop}
        onClick={()=>fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 bg-slate-50 hover:border-green-400 hover:bg-green-50'}`}>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
          onChange={e=>{const f=e.target.files?.[0];if(f){setFile(f);reset()}}} />
        {file ? (
          <div className="space-y-1">
            <FileSpreadsheet className="w-10 h-10 text-green-600 mx-auto" />
            <p className="font-semibold text-green-800">{file.name}</p>
            <p className="text-xs text-green-600">{(file.size/1024).toFixed(1)} KB · Click để đổi file</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="font-medium text-slate-700">Kéo thả file hoặc click để chọn</p>
            <p className="text-xs text-slate-500">Chỉ chấp nhận file .xlsx, .xls đúng định dạng PHỤ LỤC 1</p>
          </div>
        )}
      </div>

      {/* Hướng dẫn chuẩn */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-2">
        <p className="font-bold">📋 Yêu cầu chuẩn hoá dữ liệu:</p>
        <div className="space-y-1">
          <p><span className="font-semibold">Tên file:</span> <code className="bg-blue-100 px-1 rounded">PHỤ LỤC 1_[Loại] [Tên đơn vị].xlsx</code></p>
          <p className="text-blue-600 ml-4">Ví dụ: PHỤ LỤC 1_Phường Ba Đồn.xlsx · PHỤ LỤC 1_Xã Cam Lộ.xlsx</p>
        </div>
        <div className="space-y-1">
          <p><span className="font-semibold">Tên sheet bắt buộc đúng chính xác:</span></p>
          <div className="grid grid-cols-2 gap-1 ml-4">
            {SHEET_NAMES_CHUAN.map(s => (
              <span key={s} className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-[11px]">{s}</span>
            ))}
          </div>
        </div>
        <p><span className="font-semibold">Dữ liệu:</span> Không để bảng rỗng — phải có ít nhất 1 hàng dữ liệu thực (không tính ví dụ)</p>
      </div>

      {serverErr && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{serverErr}</div>
      )}

      <Button onClick={handleImport} disabled={!file || !year || loading}
        className="bg-green-700 hover:bg-green-800 text-white gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Đang kiểm tra và import...</> : <><Upload className="w-4 h-4"/>Import và kiểm tra chuẩn hoá</>}
      </Button>

      {/* ── Kết quả ── */}

      {/* Từ chối toàn bộ file */}
      {rejected && (
        <div className="rounded-xl bg-red-50 border-2 border-red-400 p-5 space-y-3">
          <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
            <Ban className="w-5 h-5 shrink-0" />
            FILE BỊ TỪ CHỐI — Không thể import
          </div>
          <p className="text-sm text-red-700">{rejected.reason}</p>
          {rejected.hint && (
            <div className="bg-white border border-red-200 rounded-lg p-3 text-xs text-slate-600 font-mono whitespace-pre-line">
              {rejected.hint}
            </div>
          )}
        </div>
      )}

      {/* Cảnh báo toàn file */}
      {warnings.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />Cảnh báo
          </div>
          {warnings.map((w, i) => <p key={i} className="text-xs text-amber-700">• {w}</p>)}
        </div>
      )}

      {/* Kết quả import */}
      {results !== null && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-700">Kết quả kiểm tra &amp; import</h3>
            {results.length > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                ✅ {results.length} sheet hợp lệ
              </span>
            )}
            {rejectedSheets.length > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                ❌ {rejectedSheets.length} từ chối
              </span>
            )}
          </div>

          {/* Sheet thành công */}
          {results.map(r => (
            <div key={r.id} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-green-800 text-sm">{r.sheet}</span>
                <span className="text-xs text-green-600 ml-2">{r.bieuMau}</span>
              </div>
              <span className="text-xs text-green-700 shrink-0 font-semibold">{r.rows} hàng dữ liệu</span>
              <a href={`/dashboard/bao-cao/du-lieu-phuong-xa/${r.id}`}
                className="text-xs font-semibold text-green-700 hover:underline shrink-0">Xem →</a>
            </div>
          ))}

          {/* Sheet bị từ chối */}
          {rejectedSheets.map((e, i) => (
            <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-red-800 text-sm">{e.sheet}</span>
                  <span className="text-[10px] bg-red-200 text-red-700 px-1.5 rounded font-bold">TỪ CHỐI</span>
                </div>
                <p className="text-xs text-red-600 mt-1">{e.message}</p>
              </div>
            </div>
          ))}

          {/* Sheet cảnh báo */}
          {warnSheets.map((e, i) => (
            <div key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-amber-800 text-sm">{e.sheet}</span>
                <p className="text-xs text-amber-600 mt-1">{e.message}</p>
              </div>
            </div>
          ))}

          {results.length === 0 && rejectedSheets.length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center">
              Không tìm thấy sheet dữ liệu nào trong file.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
