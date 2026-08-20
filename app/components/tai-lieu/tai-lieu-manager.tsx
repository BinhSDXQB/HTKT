'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, FileText, Trash2, Loader2, ClipboardPaste, Globe, Lock } from 'lucide-react'

type Item = {
  id: string
  tieuDe: string
  loai: string
  nguon: string | null
  moTa: string | null
  phamVi: string
  soChunk: number
  soKyTu: number
  trangThai: string
  ghiChuLoi: string | null
  createdAt: string
}

const LOAI_LABEL: Record<string, string> = {
  VB_PHAP_LUAT: 'Văn bản pháp luật',
  QUY_TRINH: 'Quy trình',
  HUONG_DAN: 'Hướng dẫn',
  BAO_CAO: 'Báo cáo',
  BIEU_MAU: 'Biểu mẫu',
  KHAC: 'Khác',
}
const TRANG_THAI: Record<string, { label: string; cls: string }> = {
  san_sang: { label: 'Sẵn sàng', cls: 'bg-emerald-100 text-emerald-700' },
  dang_xu_ly: { label: 'Đang xử lý', cls: 'bg-amber-100 text-amber-700' },
  loi: { label: 'Lỗi', cls: 'bg-rose-100 text-rose-700' },
}

export function TaiLieuManager({ initialItems }: { initialItems: Item[] }) {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>(initialItems)
  const [mode, setMode] = useState<'file' | 'text'>('file')
  const [busy, setBusy] = useState(false)
  const [tieuDe, setTieuDe] = useState('')
  const [loai, setLoai] = useState('VB_PHAP_LUAT')
  const [phamVi, setPhamVi] = useState('NOI_BO_SO')
  const [moTa, setMoTa] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)

  async function refresh() {
    const res = await fetch('/api/tai-lieu')
    if (res.ok) setItems((await res.json()).items)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!tieuDe.trim()) return toast.error('Nhập tiêu đề tài liệu')
    if (mode === 'file' && !file) return toast.error('Chọn tệp PDF/Word')
    if (mode === 'text' && !text.trim()) return toast.error('Dán nội dung văn bản')

    const fd = new FormData()
    fd.set('tieuDe', tieuDe)
    fd.set('loai', loai)
    fd.set('phamVi', phamVi)
    fd.set('moTa', moTa)
    if (mode === 'file' && file) fd.set('file', file)
    if (mode === 'text') fd.set('text', text)

    setBusy(true)
    try {
      const res = await fetch('/api/tai-lieu', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Nạp thất bại')
      toast.success(`Đã nạp "${tieuDe}" — ${data.soChunk} đoạn`)
      setTieuDe(''); setMoTa(''); setText(''); setFile(null)
      await refresh()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setBusy(false)
    }
  }

  async function remove(it: Item) {
    if (!confirm(`Xoá tài liệu "${it.tieuDe}" khỏi kho? Không thể hoàn tác.`)) return
    const res = await fetch(`/api/tai-lieu/${it.id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((xs) => xs.filter((x) => x.id !== it.id))
      toast.success('Đã xoá')
    } else {
      toast.error('Xoá thất bại')
    }
  }

  return (
    <div className="space-y-6">
      {/* Form nạp tài liệu */}
      <form onSubmit={submit} className="rounded-xl border bg-white p-4 space-y-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => setMode('file')}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border ${mode === 'file' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-slate-50'}`}>
            <Upload className="w-4 h-4" /> Tải tệp (PDF/Word)
          </button>
          <button type="button" onClick={() => setMode('text')}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border ${mode === 'text' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-slate-50'}`}>
            <ClipboardPaste className="w-4 h-4" /> Dán văn bản
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Tiêu đề tài liệu *</label>
            <input value={tieuDe} onChange={(e) => setTieuDe(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="VD: Nghị định 217/2026/NĐ-CP về quản lý hoạt động xây dựng" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Loại</label>
              <select value={loai} onChange={(e) => setLoai(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                {Object.entries(LOAI_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Phạm vi</label>
              <select value={phamVi} onChange={(e) => setPhamVi(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                <option value="NOI_BO_SO">Nội bộ Sở</option>
                <option value="CONG_KHAI">Công khai (cả phường/xã)</option>
              </select>
            </div>
          </div>
        </div>

        {mode === 'file' ? (
          <div>
            <label className="text-xs font-medium text-slate-600">Tệp (.pdf, .docx — tối đa 20MB)</label>
            <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm" />
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium text-slate-600">Nội dung văn bản</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Dán nội dung tài liệu vào đây…" />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-slate-600">Mô tả (tuỳ chọn)</label>
          <input value={moTa} onChange={(e) => setMoTa(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Ghi chú ngắn về tài liệu" />
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang nạp & nhúng…</> : <><Upload className="w-4 h-4" /> Nạp vào kho</>}
          </button>
          <span className="text-xs text-slate-400">Quá trình nhúng vector có thể mất vài giây tuỳ độ dài tài liệu.</span>
        </div>
      </form>

      {/* Danh sách tài liệu */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-2 border-b bg-slate-50 text-sm font-semibold text-slate-900">
          Tài liệu trong kho ({items.length})
        </div>
        {items.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 text-center">Chưa có tài liệu nào. Hãy nạp tài liệu đầu tiên ở trên.</div>
        ) : (
          <ul className="divide-y">
            {items.map((it) => {
              const st = TRANG_THAI[it.trangThai] ?? { label: it.trangThai, cls: 'bg-slate-100 text-slate-600' }
              return (
                <li key={it.id} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 text-sm">{it.tieuDe}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded ${st.cls}`}>{st.label}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{LOAI_LABEL[it.loai] ?? it.loai}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {it.phamVi === 'CONG_KHAI' ? <><Globe className="w-3 h-3" /> Công khai</> : <><Lock className="w-3 h-3" /> Nội bộ Sở</>}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {it.nguon ? `${it.nguon} · ` : ''}{it.soChunk} đoạn · {it.soKyTu.toLocaleString('vi-VN')} ký tự
                      {it.trangThai === 'loi' && it.ghiChuLoi ? <span className="text-rose-600"> · {it.ghiChuLoi}</span> : null}
                    </div>
                  </div>
                  <button onClick={() => remove(it)} className="text-slate-400 hover:text-rose-600 shrink-0" title="Xoá">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
