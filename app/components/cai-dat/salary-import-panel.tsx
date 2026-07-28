'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Result = {
  ok: boolean
  updated: number
  created: number
  skippedNoCccd: number
  withNgay: number
  total: number
  notFoundCreated: string[]
}

export function SalaryImportPanel() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [err, setErr] = useState('')

  function pick(f: File | undefined) {
    if (f && /\.(xlsm|xlsx|xls)$/i.test(f.name)) { setFile(f); setResult(null); setErr('') }
  }

  async function handleImport() {
    if (!file) return
    setLoading(true); setErr(''); setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/import/luong', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Lỗi không xác định'); return }
      setResult(data)
    } catch (e) {
      setErr(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 bg-slate-50 hover:border-green-400 hover:bg-green-50'}`}>
        <input ref={fileRef} type="file" accept=".xlsm,.xlsx,.xls" className="hidden"
          onChange={e => pick(e.target.files?.[0])} />
        {file ? (
          <div className="space-y-1">
            <FileSpreadsheet className="w-10 h-10 text-green-600 mx-auto" />
            <p className="font-semibold text-green-800">{file.name}</p>
            <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB · Click để đổi file</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="font-medium text-slate-700">Kéo thả hoặc click chọn file “Theo dõi lên lương”</p>
            <p className="text-xs text-slate-500">Đọc sheet <strong>Theodoi</strong> · chấp nhận .xlsm, .xlsx</p>
          </div>
        )}
      </div>

      {err && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{err}</div>}

      <Button onClick={handleImport} disabled={!file || loading}
        className="bg-green-700 hover:bg-green-800 text-white gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Đang import...</> : <><Upload className="w-4 h-4" />Import vào hệ thống</>}
      </Button>

      {result && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-5 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-green-800 font-semibold">
            <CheckCircle2 className="w-5 h-5" />Import thành công — {result.total} cán bộ
          </div>
          <ul className="text-green-700 space-y-1 ml-1">
            <li>• Cập nhật: <strong>{result.updated}</strong> người đã có trong hệ thống</li>
            <li>• Tạo mới: <strong>{result.created}</strong> người chưa có hồ sơ</li>
            <li>• Có ngày nâng lương kế tiếp: <strong>{result.withNgay}</strong> người</li>
            {result.skippedNoCccd > 0 && (
              <li className="text-amber-700">• Bỏ qua (thiếu CCCD): {result.skippedNoCccd} dòng</li>
            )}
          </ul>
          {result.created > 0 && (
            <p className="text-xs text-green-600">
              Mới tạo: {result.notFoundCreated.slice(0, 20).join(', ')}{result.notFoundCreated.length > 20 ? '…' : ''}
            </p>
          )}
          <p className="text-xs text-slate-500 pt-1">
            Chatbot đã có thể trả lời ngày nâng lương / thống kê dựa trên dữ liệu vừa cập nhật.
          </p>
        </div>
      )}
    </div>
  )
}
