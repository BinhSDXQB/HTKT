'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageSquareText, Send, Loader2, Square, Trash2, FileText, Bot, User } from 'lucide-react'

/**
 * Khung hỏi đáp nội dung hồ sơ dự án kiểu ChatGPT. Mọi câu trả lời CHỈ dựa trên thư mục dự án
 * đang chọn (phiên tải lên hoặc thư mục trong kho máy chủ) và có nguồn [n] → tệp · trang.
 */

export type NguonHoiDap = { phienId?: string; rootId?: string; duongDanCon?: string; nhan: string }

type Nguon = { so: number; tep: string; viTri: string }
type Tin = { role: 'user' | 'assistant'; content: string; nguon?: Nguon[]; trangThai?: string; loi?: boolean }

const GOI_Y = [
  'Tóm tắt thông tin chính của dự án: tên, chủ đầu tư, địa điểm, quy mô, tổng mức đầu tư.',
  'Liệt kê các văn bản pháp lý có trong hồ sơ (số hiệu, ngày, cơ quan ban hành).',
  'Tổng giá trị dự toán / tổng mức đầu tư ghi trong hồ sơ là bao nhiêu? Các tệp có ghi khớp nhau không?',
  'Hồ sơ còn thiếu hoặc có điểm mâu thuẫn nào cần yêu cầu chủ đầu tư làm rõ?',
]

/** Thay [n] bằng nhãn có tooltip tên tệp để cán bộ biết mở tệp nào. */
function HienThiNoiDung({ text, nguon }: { text: string; nguon?: Nguon[] }) {
  const phan = text.split(/(\[\d+(?:\s*,\s*\d+)*\])/g)
  return (
    <div className="whitespace-pre-wrap break-words leading-relaxed">
      {phan.map((p, i) => {
        const m = p.match(/^\[(\d+(?:\s*,\s*\d+)*)\]$/)
        if (!m || !nguon?.length) return <span key={i}>{p}</span>
        return m[1].split(/\s*,\s*/).map((s, j) => {
          const n = nguon.find((x) => x.so === Number(s))
          return (
            <sup key={`${i}-${j}`} title={n ? `${n.tep}${n.viTri ? ` · ${n.viTri}` : ''}` : ''}
              className="mx-0.5 px-1 rounded bg-cyan-100 text-cyan-800 text-[10px] font-semibold cursor-help">{s}</sup>
          )
        })
      })}
    </div>
  )
}

export function HoiDapHoSo({ nguon }: { nguon: NguonHoiDap }) {
  const [tin, setTin] = useState<Tin[]>([])
  const [nhap, setNhap] = useState('')
  const [dangTraLoi, setDangTraLoi] = useState(false)
  const huyRef = useRef<AbortController | null>(null)
  const cuoiRef = useRef<HTMLDivElement>(null)

  useEffect(() => { cuoiRef.current?.scrollIntoView({ block: 'nearest' }) }, [tin])
  useEffect(() => () => huyRef.current?.abort(), [])

  function capNhatCuoi(f: (t: Tin) => Tin) {
    setTin((ds) => ds.length ? [...ds.slice(0, -1), f(ds[ds.length - 1])] : ds)
  }

  async function gui(cauHoi: string) {
    const q = cauHoi.trim()
    if (!q || dangTraLoi) return
    const lichSu: Tin[] = [...tin.filter((t) => !t.loi), { role: 'user', content: q }]
    setTin([...tin, { role: 'user', content: q }, { role: 'assistant', content: '', trangThai: 'Đang tìm trong hồ sơ…' }])
    setNhap(''); setDangTraLoi(true)
    const ac = new AbortController(); huyRef.current = ac
    try {
      const r = await fetch('/api/htkt/tham-dinh-ho-so/hoi-dap', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ac.signal,
        body: JSON.stringify({
          phienId: nguon.phienId, rootId: nguon.rootId, duongDanCon: nguon.duongDanCon,
          messages: lichSu.map((t) => ({ role: t.role, content: t.content })),
        }),
      })
      if (!r.ok || !r.body) {
        const d = await r.json().catch(() => ({}))
        capNhatCuoi((t) => ({ ...t, content: d.error ?? `Lỗi ${r.status}`, loi: true, trangThai: undefined }))
        return
      }
      const reader = r.body.getReader()
      const dec = new TextDecoder()
      let du = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        du += dec.decode(value, { stream: true })
        const dong = du.split('\n'); du = dong.pop() ?? ''
        for (const l of dong) {
          if (!l.trim()) continue
          let ev: { loai: string; text?: string; nguon?: Nguon[] }
          try { ev = JSON.parse(l) } catch { continue }
          if (ev.loai === 'trang-thai') capNhatCuoi((t) => ({ ...t, trangThai: ev.text }))
          else if (ev.loai === 'nguon') capNhatCuoi((t) => ({ ...t, nguon: ev.nguon, trangThai: 'Đang soạn câu trả lời…' }))
          else if (ev.loai === 'chu') capNhatCuoi((t) => ({ ...t, content: t.content + (ev.text ?? ''), trangThai: undefined }))
          else if (ev.loai === 'loi') capNhatCuoi((t) => ({ ...t, content: (t.content ? t.content + '\n\n' : '') + (ev.text ?? 'Lỗi'), loi: true, trangThai: undefined }))
        }
      }
    } catch (e) {
      const huy = (e as Error)?.name === 'AbortError'
      capNhatCuoi((t) => ({ ...t, content: t.content + (huy ? '\n\n(Đã dừng)' : '\n\nLỗi kết nối máy chủ'), loi: !huy && !t.content, trangThai: undefined }))
    } finally {
      setDangTraLoi(false); huyRef.current = null
    }
  }

  return (
    <div className="rounded-xl border bg-white p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <MessageSquareText className="w-4 h-4 text-cyan-600" />Hỏi đáp nội dung hồ sơ
          <span className="font-normal text-slate-500">— {nguon.nhan}</span>
        </p>
        {tin.length > 0 && !dangTraLoi && (
          <button onClick={() => setTin([])} className="text-xs text-slate-500 hover:text-rose-600 inline-flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" />Cuộc hỏi đáp mới
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Trả lời chỉ dựa trên tệp trong thư mục dự án đang chọn, có đánh số nguồn — di chuột lên số để xem tệp/trang.
        Bản scan chưa có lớp chữ thì AI không đọc được; kết quả là <strong>gợi ý rà soát</strong>, cán bộ tự kết luận.
      </p>

      <div className="rounded-lg border bg-slate-50 max-h-[520px] min-h-[160px] overflow-y-auto p-3 space-y-3">
        {tin.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Gợi ý câu hỏi:</p>
            {GOI_Y.map((g) => (
              <button key={g} onClick={() => gui(g)}
                className="block w-full text-left text-sm px-3 py-2 rounded-lg bg-white border hover:border-cyan-400 text-slate-700">{g}</button>
            ))}
          </div>
        ) : tin.map((t, i) => (
          <div key={i} className={`flex gap-2 ${t.role === 'user' ? 'justify-end' : ''}`}>
            {t.role === 'assistant' && <Bot className="w-5 h-5 text-cyan-600 shrink-0 mt-1" />}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              t.role === 'user' ? 'bg-cyan-600 text-white' : t.loi ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-white border text-slate-800'}`}>
              {t.trangThai && !t.content && (
                <p className="text-slate-500 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />{t.trangThai}</p>
              )}
              {t.content && (t.role === 'user' ? <div className="whitespace-pre-wrap">{t.content}</div> : <HienThiNoiDung text={t.content} nguon={t.nguon} />)}
              {t.role === 'assistant' && t.nguon && t.nguon.length > 0 && t.content && (
                <details className="mt-2 text-xs text-slate-500">
                  <summary className="cursor-pointer">Nguồn ({t.nguon.length})</summary>
                  <ol className="mt-1 space-y-0.5">
                    {t.nguon.map((n) => (
                      <li key={n.so} className="flex gap-1.5"><span className="font-semibold text-cyan-700">[{n.so}]</span>
                        <FileText className="w-3 h-3 mt-0.5 shrink-0" /><span className="font-mono break-all">{n.tep}{n.viTri ? ` · ${n.viTri}` : ''}</span></li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
            {t.role === 'user' && <User className="w-5 h-5 text-slate-400 shrink-0 mt-1" />}
          </div>
        ))}
        <div ref={cuoiRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void gui(nhap) }} className="flex items-end gap-2">
        <textarea
          value={nhap} onChange={(e) => setNhap(e.target.value)} rows={2} maxLength={2000}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void gui(nhap) } }}
          placeholder="Nhập câu hỏi về hồ sơ dự án… (Enter để gửi, Shift+Enter xuống dòng)"
          className="flex-1 resize-none px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-cyan-500"
        />
        {dangTraLoi ? (
          <button type="button" onClick={() => huyRef.current?.abort()}
            className="h-10 px-3 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-sm inline-flex items-center gap-1.5">
            <Square className="w-4 h-4" />Dừng
          </button>
        ) : (
          <button type="submit" disabled={!nhap.trim()}
            className="h-10 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-medium inline-flex items-center gap-1.5">
            <Send className="w-4 h-4" />Gửi
          </button>
        )}
      </form>
    </div>
  )
}
