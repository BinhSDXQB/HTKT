'use client'

import { useState } from 'react'
import { Download, CheckCircle2, Search } from 'lucide-react'

type Ward = { code: string; name: string }

export function TemplateDownload({ wards }: { wards: Ward[] }) {
  const [code, setCode] = useState('')

  const trimmed = code.trim()
  const matched = trimmed ? wards.find(w => w.code === trimmed) : undefined
  const fileName = matched
    ? `PHỤ LỤC 1_${matched.name}.xlsx`
    : 'PHỤ LỤC 1_Mẫu báo cáo hạ tầng phường xã.xlsx'

  const href = `/api/templates/phu-luc-1${trimmed ? `?code=${encodeURIComponent(trimmed)}` : ''}`

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-green-800">Mã đơn vị hành chính của phường/xã</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              placeholder="VD: 19009"
              className="h-10 w-48 pl-8 pr-3 text-sm border border-green-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white"
            />
          </div>
        </div>

        <a
          href={href}
          className="flex items-center gap-2 h-10 px-5 text-sm font-medium rounded-lg bg-green-700 text-white hover:bg-green-800 shrink-0 transition-colors"
        >
          <Download className="w-4 h-4" />Tải file mẫu
        </a>
      </div>

      {/* Xem trước tên file sẽ tải về */}
      {trimmed && (
        matched ? (
          <p className="text-sm text-green-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>{matched.name}</span>
            <span className="text-green-600">— tên file:</span>
            <strong className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-green-300">{fileName}</strong>
          </p>
        ) : (
          <p className="text-sm text-amber-700">
            Không tìm thấy đơn vị với mã <strong>{trimmed}</strong>. Kiểm tra lại mã ĐVHC (vẫn tải được file mẫu chung).
          </p>
        )
      )}
      {!trimmed && (
        <p className="text-xs text-green-600">
          Nhập mã ĐVHC để file tải về tự đặt tên đúng chuẩn, ví dụ: 19009 → <strong>PHỤ LỤC 1_Phường Ba Đồn.xlsx</strong>
        </p>
      )}
    </div>
  )
}
