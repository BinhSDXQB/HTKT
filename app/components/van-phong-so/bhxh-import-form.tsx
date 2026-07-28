'use client'

import { useActionState } from 'react'
import { Loader2, Upload, CheckCircle2, AlertTriangle } from 'lucide-react'
import { importBhxhAction } from '@/app/actions/office-bhxh-import'

export function BhxhImportForm() {
  const [state, formAction, isPending] = useActionState(importBhxhAction, null)

  return (
    <div className="space-y-4">
      <form action={formAction} className="bg-white rounded-xl border p-5 space-y-3">
        <p className="text-sm text-slate-600">
          Chọn tệp Excel (.xlsx) có các cột tiêu đề ở dòng 1: <b>CCCD</b> (bắt buộc), Mã số BHXH, Ngày tham gia BHXH, Mã số thuế.
          Hệ thống đối chiếu theo CCCD và cập nhật hồ sơ.
        </p>
        <div className="flex items-center gap-3">
          <input type="file" name="file" accept=".xlsx" required
            className="text-sm file:mr-2 file:rounded file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-sm" />
          <button type="submit" disabled={isPending}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-2 disabled:opacity-60">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}Import
          </button>
        </div>
      </form>

      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}

      {state?.ok && (
        <div className="rounded-xl border bg-white p-4 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-700 font-medium">
            <CheckCircle2 className="w-5 h-5" />
            Đã xử lý {state.tongDong} dòng — cập nhật {state.capNhat} hồ sơ.
          </div>
          {!!state.khongTimThay?.length && (
            <div>
              <p className="font-medium text-slate-700">Không tìm thấy CCCD ({state.khongTimThay.length}):</p>
              <p className="text-xs text-slate-500 break-words">{state.khongTimThay.join(', ')}</p>
            </div>
          )}
          {!!state.canhBao?.length && (
            <div>
              <p className="flex items-center gap-1 font-medium text-amber-700">
                <AlertTriangle className="w-4 h-4" />Cảnh báo lệch dữ liệu ({state.canhBao.length}):
              </p>
              <ul className="text-xs text-amber-700 list-disc pl-5 space-y-0.5">
                {state.canhBao.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
