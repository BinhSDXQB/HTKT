'use client'

import { useRef, useState } from 'react'
import { FolderUp, Files, Loader2, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react'

/**
 * Cán bộ TỰ CHỌN thư mục hồ sơ của TỪNG dự án trên máy mình (hoặc ổ Google Drive đã đồng bộ về máy).
 * Trình duyệt đọc cả cây thư mục (webkitdirectory / kéo-thả) rồi tải lần lượt từng tệp theo mảnh
 * ≤ 8MB lên phiên tạm của người dùng (API /api/htkt/tham-dinh-ho-so/tai-len).
 */

export type PhienHoSo = { phienId: string; tenThuMuc: string; soTep: number; tongByte: number; boQua: string[] }

type TepChon = { file: File; duongDan: string } // duongDan tương đối, KHÔNG gồm tên thư mục gốc

const DUOI_NHAN = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'xlsm', 'dwg', 'dxf', 'txt', 'csv', 'md', 'zip', 'rar', '7z', 'jpg', 'jpeg', 'png', 'tif', 'tiff'])
const TEN_RAC = /^(thumbs\.db|desktop\.ini|\.ds_store)$/i
const TEN_THIET_BI = /^(con|prn|aux|nul|com\d|lpt\d)$/i
const MANH = 8 * 1024 * 1024
const TEP_TOI_DA = 200 * 1024 * 1024
const TONG_TOI_DA = 600 * 1024 * 1024
const SO_TEP_TOI_DA = 400

function coChu(b: number) {
  if (b < 1048576) return `${Math.max(1, Math.round(b / 1024))} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

/** Lọc tệp hợp lệ + chuẩn hoá đường dẫn; trả về danh sách bị bỏ qua kèm lý do để hiện cho cán bộ. */
function locTep(ds: TepChon[]): { nhan: TepChon[]; boQua: string[] } {
  const nhan: TepChon[] = []
  const boQua: string[] = []
  const daCo = new Set<string>()
  let tong = 0
  for (const t0 of ds) {
    // Tên từ macOS thường ở dạng NFD — chuẩn hoá NFC để khớp cách Windows/máy chủ lưu.
    const t = { ...t0, duongDan: t0.duongDan.normalize('NFC') }
    const ten = t.duongDan.split('/').pop() ?? ''
    const duoi = (ten.split('.').pop() ?? '').toLowerCase()
    if (t.duongDan.split('/').some((d) => d.startsWith('.') || d.startsWith('~$')) || TEN_RAC.test(ten)) continue
    if (!DUOI_NHAN.has(duoi)) { boQua.push(`${t.duongDan} (định dạng .${duoi} không cần cho hồ sơ)`); continue }
    if (/[:*?"<>|]/.test(t.duongDan) || t.duongDan.split('/').some((d) => /[. ]$/.test(d) || TEN_THIET_BI.test(d.split('.')[0]))) {
      boQua.push(`${t.duongDan} (tên tệp/thư mục không hợp lệ trên Windows)`); continue
    }
    // Windows không phân biệt hoa/thường: "ToTrinh.pdf" và "totrinh.pdf" sẽ đè lên nhau.
    const khoa = t.duongDan.toLowerCase()
    if (daCo.has(khoa)) { boQua.push(`${t.duongDan} (trùng tên với tệp khác, chỉ khác chữ hoa/thường)`); continue }
    if (t.file.size === 0) { boQua.push(`${t.duongDan} (tệp rỗng 0 byte)`); continue }
    if (t.file.size > TEP_TOI_DA) { boQua.push(`${t.duongDan} (${coChu(t.file.size)} > 200 MB)`); continue }
    if (nhan.length >= SO_TEP_TOI_DA) { boQua.push(`${t.duongDan} (vượt ${SO_TEP_TOI_DA} tệp)`); continue }
    if (tong + t.file.size > TONG_TOI_DA) { boQua.push(`${t.duongDan} (vượt tổng 600 MB)`); continue }
    tong += t.file.size
    daCo.add(khoa)
    nhan.push(t)
  }
  return { nhan, boQua }
}

/**
 * Đọc cây thư mục khi kéo-thả (DataTransferItem.webkitGetAsEntry). tienTo là đường dẫn tương đối
 * TÍNH TỪ thư mục dự án (thư mục gốc được thả vào gọi với tienTo = '').
 */
async function docThuMuc(dir: FileSystemDirectoryEntry, tienTo: string, out: TepChon[]): Promise<void> {
  const reader = dir.createReader()
  // readEntries trả từng lô (Chrome ~100 mục/lô) — phải gọi đến khi rỗng.
  for (;;) {
    const lo = await new Promise<FileSystemEntry[]>((ok, loi) => reader.readEntries(ok, loi))
    if (!lo.length) break
    for (const e of lo) {
      if (e.isFile) {
        const file = await new Promise<File>((ok, loi) => (e as FileSystemFileEntry).file(ok, loi))
        out.push({ file, duongDan: tienTo + e.name })
      } else if (e.isDirectory) {
        await docThuMuc(e as FileSystemDirectoryEntry, `${tienTo}${e.name}/`, out)
      }
    }
  }
}

export function ChonThuMucMayTinh({ phien, onXong }: {
  phien: PhienHoSo | null
  onXong: (p: PhienHoSo) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputTepRef = useRef<HTMLInputElement>(null)
  const [dangTai, setDangTai] = useState(false)
  const [tienDo, setTienDo] = useState({ daTai: 0, tong: 0, tep: '' })
  const [loi, setLoi] = useState('')
  const [keoVao, setKeoVao] = useState(false)

  async function taiLen(tenThuMuc: string, ds: TepChon[]) {
    setLoi('')
    const { nhan, boQua } = locTep(ds)
    if (!nhan.length) { setLoi('Thư mục không có tệp hồ sơ nào hợp lệ (PDF, Word, Excel, bản vẽ…).'); return }
    const tong = nhan.reduce((s, t) => s + t.file.size, 0)
    setDangTai(true); setTienDo({ daTai: 0, tong, tep: '' })
    let phienId = ''
    try {
      // Bỏ phiên cũ (nếu đang có) để giải phóng ổ đĩa máy chủ.
      if (phien) void fetch(`/api/htkt/tham-dinh-ho-so/tai-len?phienId=${phien.phienId}`, { method: 'DELETE' })
      const r = await fetch('/api/htkt/tham-dinh-ho-so/tai-len', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenThuMuc }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Không tạo được phiên tải lên')
      phienId = d.phienId

      let daTai = 0
      // TUẦN TỰ từng tệp, từng mảnh — máy chủ 6GB RAM và IIS giới hạn 50MB/request.
      for (const t of nhan) {
        setTienDo({ daTai, tong, tep: t.duongDan })
        const n = t.file.size
        for (let off = 0; off < Math.max(n, 1); off += MANH) {
          const manh = t.file.slice(off, Math.min(off + MANH, n))
          const q = new URLSearchParams({ phienId, duongDan: t.duongDan, offset: String(off), tong: String(n) })
          const rr = await fetch(`/api/htkt/tham-dinh-ho-so/tai-len?${q}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: manh,
          })
          if (!rr.ok) {
            const dd = await rr.json().catch(() => ({}))
            throw new Error(`${t.duongDan}: ${dd.error ?? `lỗi ${rr.status}`}`)
          }
          daTai += manh.size
          setTienDo({ daTai, tong, tep: t.duongDan })
          if (n === 0) break
        }
      }
      onXong({ phienId, tenThuMuc, soTep: nhan.length, tongByte: tong, boQua })
    } catch (e) {
      setLoi(`Tải lên thất bại — ${e instanceof Error ? e.message : String(e)}`)
      if (phienId) void fetch(`/api/htkt/tham-dinh-ho-so/tai-len?phienId=${phienId}`, { method: 'DELETE' })
    } finally {
      setDangTai(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function chonQuaHopThoai(files: FileList | null) {
    if (!files?.length) return
    const ds: TepChon[] = []
    let tenGoc = ''
    for (const f of Array.from(files)) {
      const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name
      const phan = rel.split('/')
      tenGoc ||= phan.length > 1 ? phan[0] : 'Hồ sơ dự án'
      ds.push({ file: f, duongDan: phan.length > 1 ? phan.slice(1).join('/') : rel })
    }
    void taiLen(tenGoc, ds)
  }

  async function thaVao(e: React.DragEvent) {
    e.preventDefault(); setKeoVao(false)
    if (dangTai) return
    const items = Array.from(e.dataTransfer.items ?? [])
    const entries = items.map((i) => i.webkitGetAsEntry?.()).filter(Boolean) as FileSystemEntry[]
    if (entries.length === 1 && entries[0].isDirectory) {
      const ds: TepChon[] = []
      try { await docThuMuc(entries[0] as FileSystemDirectoryEntry, '', ds) } catch { setLoi('Không đọc được thư mục vừa thả vào'); return }
      void taiLen(entries[0].name, ds)
    } else {
      setLoi('Hãy kéo-thả MỘT thư mục dự án (không phải từng tệp lẻ), hoặc bấm nút chọn thư mục.')
    }
  }

  if (phien && !dangTai) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Đã nạp thư mục <strong>{phien.tenThuMuc}</strong> — {phien.soTep} tệp, {coChu(phien.tongByte)}</span>
          </p>
          {/* KHÔNG gọi onBo() trước: nó làm khối này unmount → input ẩn biến mất khi hộp thoại còn mở,
              sự kiện chọn thư mục bị mất. Phiên cũ được xoá trong taiLen() khi đã chọn xong. */}

          <button onClick={() => inputRef.current?.click()}
            className="h-8 px-3 rounded-lg border border-emerald-300 bg-white text-emerald-800 text-xs font-medium inline-flex items-center gap-1.5 hover:bg-emerald-100">
            <RotateCcw className="w-3.5 h-3.5" />Chọn thư mục dự án khác
          </button>
        </div>
        {phien.boQua.length > 0 && (
          <details className="text-xs text-amber-800">
            <summary className="cursor-pointer">Bỏ qua {phien.boQua.length} tệp (xem chi tiết)</summary>
            <ul className="mt-1 ml-4 list-disc space-y-0.5 max-h-40 overflow-y-auto">{phien.boQua.map((b) => <li key={b} className="break-all">{b}</li>)}</ul>
          </details>
        )}
        <p className="text-[11px] text-emerald-700">Bản tải lên chỉ bạn xem được và tự xoá sau 24 giờ.</p>
        <HiddenInput refEl={inputRef} onChange={chonQuaHopThoai} thuMuc />
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setKeoVao(true) }}
      onDragLeave={() => setKeoVao(false)}
      onDrop={thaVao}
      className={`rounded-lg border-2 border-dashed p-5 text-center transition ${keoVao ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 bg-slate-50'}`}
    >
      {dangTai ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-700 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />Đang tải hồ sơ lên… {tienDo.tong ? Math.floor((tienDo.daTai / tienDo.tong) * 100) : 0}%
          </p>
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-cyan-600 transition-all" style={{ width: `${tienDo.tong ? (tienDo.daTai / tienDo.tong) * 100 : 0}%` }} />
          </div>
          <p className="text-xs text-slate-500 truncate">{tienDo.tep} · {coChu(tienDo.daTai)} / {coChu(tienDo.tong)}</p>
        </div>
      ) : (
        <>
          <FolderUp className="w-8 h-8 text-cyan-600 mx-auto" />
          <p className="text-sm text-slate-700 mt-2">Kéo-thả <strong>thư mục hồ sơ của dự án</strong> vào đây, hoặc</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button onClick={() => inputRef.current?.click()}
              className="h-9 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium inline-flex items-center gap-2">
              <FolderUp className="w-4 h-4" />Chọn thư mục trên máy tính…
            </button>
            {/* Điện thoại/máy tính bảng không chọn được cả thư mục → cho chọn nhiều tệp lẻ. */}
            <button onClick={() => inputTepRef.current?.click()}
              className="h-9 px-4 rounded-lg border border-cyan-300 bg-white hover:bg-cyan-50 text-cyan-800 text-sm font-medium inline-flex items-center gap-2">
              <Files className="w-4 h-4" />Hoặc chọn nhiều tệp
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Mỗi dự án chọn đúng thư mục của dự án đó (gồm cả thư mục con). Nhận PDF, Word, Excel, bản vẽ DWG/DXF, ảnh scan;
            tối đa {SO_TEP_TOI_DA} tệp, 600 MB. Trình duyệt sẽ hỏi xác nhận “Tải lên” — đó là thao tác bình thường.
            Trên điện thoại hãy dùng “Chọn nhiều tệp”.
          </p>
        </>
      )}
      {loi && <p className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 flex items-start gap-2 text-left"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{loi}</p>}
      <HiddenInput refEl={inputRef} onChange={chonQuaHopThoai} thuMuc />
      <HiddenInput refEl={inputTepRef} onChange={chonQuaHopThoai} />
    </div>
  )
}

function HiddenInput({ refEl, onChange, thuMuc = false }: {
  refEl: React.RefObject<HTMLInputElement | null>; onChange: (f: FileList | null) => void; thuMuc?: boolean
}) {
  return (
    <input
      ref={refEl} type="file" multiple className="hidden"
      // webkitdirectory: hộp thoại chọn THƯ MỤC (Chrome/Edge/Firefox trên máy tính đều hỗ trợ).
      {...(thuMuc ? ({ webkitdirectory: '', directory: '' } as Record<string, string>) : {})}
      onChange={(e) => { onChange(e.target.files); e.target.value = '' }}
    />
  )
}
