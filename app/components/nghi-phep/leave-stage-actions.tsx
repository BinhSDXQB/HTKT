'use client'

import { useRef, useState, useTransition } from 'react'
import { Loader2, Download, Upload, PenLine, X, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { signLeaveStageAction, rejectLeaveStageAction } from '@/app/actions/office-leave'
import { isVgcaConfigured, vgcaSignPdf } from '@/lib/vgca-sign'

type Props = {
  id: string
  capCode: string
  soChuKyHienCo: number
}

export function LeaveStageActions({ id, capCode, soChuKyHienCo }: Props) {
  const [isPending, startTransition] = useTransition()
  const [signing, setSigning] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const yKienRef = useRef<HTMLTextAreaElement>(null)
  const soTienRef = useRef<HTMLInputElement>(null)

  function submitSigned(file: File) {
    const fd = new FormData()
    fd.set('id', id)
    fd.set('file', file)
    fd.set('yKien', yKienRef.current?.value ?? '')
    if (capCode === 'TAI_CHINH') fd.set('soTienUng', soTienRef.current?.value ?? '')
    startTransition(async () => {
      const res = await signLeaveStageAction(null, fd)
      if (res?.error) toast.error(res.error)
      else if (res?.warning) toast.warning(res.warning, { duration: 7000 })
      else toast.success('Đã ký số và chuyển bước tiếp theo')
    })
  }

  function onUpload() {
    const f = fileRef.current?.files?.[0]
    if (!f) { toast.error('Chọn tệp PDF đã ký.'); return }
    submitSigned(f)
  }

  // Ký trực tiếp qua VGCA Sign Service (nếu đã cấu hình agent)
  async function onSignVgca() {
    try {
      setSigning(true)
      const r = await fetch(`/api/nghi-phep/${id}/tai-lieu`)
      if (!r.ok) throw new Error('Không tải được tài liệu để ký.')
      const pdf = new Uint8Array(await r.arrayBuffer())
      const signed = await vgcaSignPdf(pdf, `don-nghi-phep-${id}.pdf`)
      submitSigned(new File([new Uint8Array(signed)], `don-nghi-phep-${id}-da-ky.pdf`, { type: 'application/pdf' }))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi ký số VGCA.')
    } finally {
      setSigning(false)
    }
  }

  function onReject() {
    const ghiChu = window.prompt('Lý do từ chối:')
    if (ghiChu === null) return
    const fd = new FormData()
    fd.set('id', id)
    fd.set('ghiChu', ghiChu)
    startTransition(async () => {
      const res = await rejectLeaveStageAction(null, fd)
      if (res?.error) toast.error(res.error)
      else toast.success('Đã từ chối đơn')
    })
  }

  return (
    <div className="rounded-lg bg-slate-50 border p-3 space-y-3">
      <a href={`/api/nghi-phep/${id}/tai-lieu`} target="_blank" rel="noopener"
        className="inline-flex items-center gap-1.5 text-sm text-indigo-700 hover:underline">
        <Download className="w-4 h-4" />
        Tải PDF để ký {soChuKyHienCo > 0 && <span className="text-xs text-slate-500">(đã có {soChuKyHienCo} chữ ký)</span>}
      </a>

      {capCode === 'TAI_CHINH' && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Số tiền ứng:</label>
          <input ref={soTienRef} type="number" className="h-8 px-2 text-sm border rounded w-40" placeholder="VNĐ" />
        </div>
      )}

      <textarea ref={yKienRef} rows={2} placeholder="Ý kiến (tuỳ chọn)"
        className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />

      <div className="flex flex-wrap items-center gap-2">
        {isVgcaConfigured() && (
          <button onClick={onSignVgca} disabled={isPending || signing}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-3 py-1.5 disabled:opacity-60">
            {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Ký số trực tiếp (VGCA)
          </button>
        )}

        <input ref={fileRef} type="file" accept="application/pdf"
          className="text-xs file:mr-2 file:rounded file:border-0 file:bg-slate-200 file:px-2 file:py-1 file:text-xs" />
        <button onClick={onUpload} disabled={isPending || signing}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 disabled:opacity-60">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Nộp bản đã ký
        </button>

        <button onClick={onReject} disabled={isPending || signing}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1.5">
          <X className="w-4 h-4" />Từ chối
        </button>
      </div>

      <p className="text-[11px] text-slate-500 flex items-center gap-1">
        <PenLine className="w-3 h-3" />
        Ký bằng USB Token + phần mềm VGCA, sau đó nộp bản PDF đã ký (mỗi cấp ký chồng thêm một chữ ký).
      </p>
    </div>
  )
}
