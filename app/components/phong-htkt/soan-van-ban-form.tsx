'use client'
import { useState } from 'react'
import { PenLine, X, Loader2 } from 'lucide-react'

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'

type FieldKey =
  | 'soVanBan' | 'ngay' | 'trichYeu' | 'kinhGui' | 'canCu' | 'noiDung'
  | 'kienNghi' | 'thoiGian' | 'diaDiem' | 'nguoiKyChucDanh' | 'nguoiKyHoTen' | 'noiNhan'

// Trường hiển thị theo loại văn bản
const FIELDS: Record<string, FieldKey[]> = {
  'to-trinh': ['soVanBan', 'ngay', 'trichYeu', 'kinhGui', 'canCu', 'noiDung', 'kienNghi', 'nguoiKyChucDanh', 'nguoiKyHoTen', 'noiNhan'],
  'cong-van': ['soVanBan', 'ngay', 'trichYeu', 'kinhGui', 'noiDung', 'nguoiKyChucDanh', 'nguoiKyHoTen', 'noiNhan'],
  'quyet-dinh': ['soVanBan', 'ngay', 'trichYeu', 'canCu', 'noiDung', 'nguoiKyChucDanh', 'nguoiKyHoTen', 'noiNhan'],
}

const LABELS: Record<FieldKey, string> = {
  soVanBan: 'Số văn bản (vd 12/TTr-SXD)',
  ngay: 'Ngày văn bản',
  trichYeu: 'Trích yếu / Về việc',
  kinhGui: 'Kính gửi',
  canCu: 'Căn cứ pháp lý (mỗi dòng 1 căn cứ)',
  noiDung: 'Nội dung (mỗi dòng 1 đoạn)',
  kienNghi: 'Kiến nghị / đề xuất',
  thoiGian: 'Thời gian',
  diaDiem: 'Địa điểm',
  nguoiKyChucDanh: 'Chức danh người ký (vd GIÁM ĐỐC)',
  nguoiKyHoTen: 'Họ tên người ký',
  noiNhan: 'Nơi nhận (mỗi dòng 1 mục)',
}

const TEXTAREA: FieldKey[] = ['canCu', 'noiDung', 'kienNghi', 'noiNhan']

export function SoanVanBanButton({ loai, ten }: { loai: string; ten: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [data, setData] = useState<Record<string, string>>({})

  const fields = FIELDS[loai] ?? FIELDS['cong-van']
  const set = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }))

  async function submit() {
    setLoading(true); setErr('')
    try {
      const res = await fetch('/api/htkt/van-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loai, ...data }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Sinh văn bản thất bại')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${ten.replace(/\s+/g, '_')}.docx`
      a.click()
      URL.revokeObjectURL(url)
      setOpen(false)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded transition"
      >
        <PenLine className="w-3.5 h-3.5" /> Soạn nhanh
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl w-full max-w-2xl my-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <p className="font-semibold text-slate-900">Soạn nhanh: {ten}</p>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
              {fields.map((f) => (
                <div key={f} className={TEXTAREA.includes(f) ? 'sm:col-span-2' : ''}>
                  <label className={labelCls}>{LABELS[f]}</label>
                  {TEXTAREA.includes(f) ? (
                    <textarea rows={f === 'noiDung' ? 5 : 3} className={inputCls} value={data[f] || ''} onChange={(e) => set(f, e.target.value)} />
                  ) : (
                    <input type={f === 'ngay' ? 'date' : 'text'} className={inputCls} value={data[f] || ''} onChange={(e) => set(f, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
            {err && <p className="px-5 text-sm text-rose-600">{err}</p>}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
              <button onClick={() => setOpen(false)} className="text-sm px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50">Đóng</button>
              <button onClick={submit} disabled={loading} className="text-sm px-4 py-1.5 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-700 disabled:opacity-60 inline-flex items-center gap-1.5">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Tải file .docx
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
