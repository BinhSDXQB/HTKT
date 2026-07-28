'use client'

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Plus, Trash2, FileSpreadsheet, FileText, AlertTriangle, GripVertical, Upload, Download, PenLine, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  updateOvertimeMetaAction,
  saveOvertimeEntriesAction,
  addOvertimeEntryAction,
  removeOvertimeEntryAction,
  reorderOvertimeEntriesAction,
  deleteOvertimeTimesheetAction,
} from '@/app/actions/overtime'
import { uploadSignedFileAction, removeSignedFileAction } from '@/app/actions/overtime-sign'
import { OT_LIMIT_NAM, OT_AVG_THANG, rangeDays, parseYMD } from '@/lib/overtime/policy'

const inputCls = 'h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-500'
const dayCls = 'w-9 h-7 px-0 text-xs text-center border rounded bg-white outline-none focus:ring-2 focus:ring-amber-500'

type Day = { day: number; dow: number; thu: string; weekend: boolean }

type Row = {
  id: string
  hoTen: string
  chucVu: string
  gioNgay: Record<string, number>
  ghiChu: string
  luyKeNam: number
  tbThang: number
  duKienNam: number
}

type Data = {
  id: string
  tenPhong: string
  thang: number
  nam: number
  tuNgay: string
  denNgay: string
  ngayKy: string
  diaDiem: string
  lyDo: string
  nguoiChamCong: string
  truongPhong: string
  lanhDaoSo: string
  chucDanhLanhDao: string
  ghiChu: string
  trangThai: string
  banKy: { fileName: string; at: string } | null
  days: Day[]
  entries: Row[]
}

function rowTotal(r: Row): number {
  let s = 0
  for (const k of Object.keys(r.gioNgay)) s += Number(r.gioNgay[k]) || 0
  return Math.round(s * 100) / 100
}

export function OvertimeEditor({ data }: { data: Data }) {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>(data.entries)
  const [savingHours, startSaving] = useTransition()
  const [adding, startAdding] = useTransition()
  const [, startReorder] = useTransition()
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')

  // Kỳ làm thêm — lưới ngày tự sinh theo "từ ngày → đến ngày"
  const [tuNgay, setTuNgay] = useState(data.tuNgay)
  const [denNgay, setDenNgay] = useState(data.denNgay)
  const days = useMemo(() => {
    const a = parseYMD(tuNgay), b = parseYMD(denNgay)
    const r = a && b ? rangeDays(a, b) : []
    return r.length ? r : data.days
  }, [tuNgay, denNgay, data.days])

  // Kéo-thả (gắp) để sắp xếp thứ tự người
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const dragIdxRef = useRef<number | null>(null)
  const rowsRef = useRef<Row[]>(rows)
  rowsRef.current = rows

  function startDrag(i: number) { dragIdxRef.current = i; setDragIdx(i) }
  function onDragEnter(i: number) {
    const from = dragIdxRef.current
    if (from === null || from === i) return
    setRows((prev) => { const next = [...prev]; const [m] = next.splice(from, 1); next.splice(i, 0, m); return next })
    dragIdxRef.current = i; setDragIdx(i)
  }
  function onDragEnd() {
    dragIdxRef.current = null; setDragIdx(null)
    const orderedIds = rowsRef.current.map((r) => r.id)
    startReorder(async () => {
      const res = await reorderOvertimeEntriesAction(data.id, orderedIds)
      if (res?.ok) toast.success('Đã cập nhật thứ tự')
      else toast.error(res?.error ?? 'Cập nhật thứ tự thất bại')
    })
  }

  const [metaState, metaAction, metaPending] = useActionState(updateOvertimeMetaAction, null)
  useEffect(() => {
    if (metaState?.ok) toast.success('Đã lưu thông tin bảng chấm công')
    else if (metaState?.error) toast.error(metaState.error)
    else if (metaState?.fieldErrors) toast.error(Object.values(metaState.fieldErrors).flat().join('; '))
  }, [metaState])

  const dayTotals = useMemo(() => {
    const m: Record<number, number> = {}
    for (const d of days) {
      let s = 0
      for (const r of rows) s += Number(r.gioNgay[String(d.day)]) || 0
      m[d.day] = Math.round(s * 100) / 100
    }
    return m
  }, [rows, days])
  const grandTotal = useMemo(() => rows.reduce((a, r) => a + rowTotal(r), 0), [rows])

  function setName(idx: number, field: 'hoTen' | 'chucVu' | 'ghiChu', value: string) {
    setRows((prev) => { const next = [...prev]; next[idx] = { ...next[idx], [field]: value }; return next })
  }
  function setDay(idx: number, day: number, value: string) {
    const n = parseFloat(value.replace(',', '.'))
    const v = isNaN(n) || n < 0 ? 0 : Math.min(n, 24)
    setRows((prev) => {
      const next = [...prev]
      const g = { ...next[idx].gioNgay }
      if (v > 0) g[String(day)] = v
      else delete g[String(day)]
      next[idx] = { ...next[idx], gioNgay: g }
      return next
    })
  }

  function saveHours() {
    startSaving(async () => {
      const payload = rows.map((r) => ({ id: r.id, hoTen: r.hoTen, chucVu: r.chucVu, gioNgay: r.gioNgay, ghiChu: r.ghiChu }))
      const res = await saveOvertimeEntriesAction(data.id, JSON.stringify(payload))
      if (res?.ok) { toast.success('Đã lưu giờ làm thêm'); router.refresh() }
      else toast.error(res?.error ?? 'Lưu thất bại')
    })
  }
  function addMember() {
    if (!newName.trim()) { toast.error('Nhập họ tên'); return }
    startAdding(async () => {
      const res = await addOvertimeEntryAction(data.id, newName, newRole)
      if (res?.ok) { setNewName(''); setNewRole(''); toast.success('Đã thêm người'); router.refresh() }
      else toast.error(res?.error ?? 'Thêm thất bại')
    })
  }
  function removeMember(id: string) {
    startAdding(async () => {
      const res = await removeOvertimeEntryAction(id)
      if (res?.ok) { setRows((p) => p.filter((r) => r.id !== id)); toast.success('Đã xoá') }
      else toast.error(res?.error ?? 'Xoá thất bại')
    })
  }
  function deleteSheet() {
    if (!confirm('Xoá toàn bộ bảng chấm công này? Hành động không thể hoàn tác.')) return
    startAdding(async () => { await deleteOvertimeTimesheetAction(data.id) })
  }

  // ── Bản đã ký tay (scan/ảnh/PDF) ──
  const daKy = data.trangThai === 'DA_KY'
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, startUpload] = useTransition()
  function uploadSigned() {
    const file = fileRef.current?.files?.[0]
    if (!file) { toast.error('Chọn tệp bản đã ký (PDF hoặc ảnh).'); return }
    const fd = new FormData()
    fd.set('id', data.id)
    fd.set('file', file)
    startUpload(async () => {
      const res = await uploadSignedFileAction(null, fd)
      if (res?.ok) { toast.success('Đã lưu bản ký tay'); router.refresh() }
      else toast.error(res?.error ?? 'Tải lên thất bại')
    })
  }
  function removeSigned() {
    if (!confirm('Gỡ bản đã ký và mở lại để chỉnh sửa?')) return
    startUpload(async () => {
      const res = await removeSignedFileAction(data.id)
      if (res?.ok) { toast.success('Đã gỡ bản ký'); router.refresh() }
      else toast.error(res?.error ?? 'Gỡ thất bại')
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{data.tenPhong}</h1>
          <p className="text-sm text-slate-500">Bảng chấm công làm thêm giờ · Tháng {data.thang}/{data.nam}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/cham-cong-lam-them/${data.id}/excel`} className="inline-flex items-center gap-1 h-9 px-3 text-sm rounded-lg border bg-white hover:bg-slate-50 text-emerald-700">
            <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
          </a>
          <a href={`/api/cham-cong-lam-them/${data.id}/word`} className="inline-flex items-center gap-1 h-9 px-3 text-sm rounded-lg border bg-white hover:bg-slate-50 text-blue-700">
            <FileText className="w-4 h-4" /> Văn bản thỏa thuận (Word)
          </a>
        </div>
      </div>

      {/* ── Bản đã ký tay (không ký số) ── */}
      <div className={`rounded-xl border p-4 ${daKy ? 'border-emerald-300 bg-emerald-50' : 'bg-white'}`}>
        <div className="flex items-center gap-2 mb-2">
          <PenLine className="w-4 h-4 text-slate-600" />
          <p className="font-semibold text-slate-900 text-sm">Bản đã ký tay (đóng dấu) — scan/ảnh/PDF</p>
        </div>
        {daKy && data.banKy ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href={`/api/cham-cong-lam-them/${data.id}/ban-ky`} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 text-emerald-700 font-medium hover:underline">
              <Download className="w-4 h-4" /> {data.banKy.fileName}
            </a>
            <span className="text-xs text-slate-500">Đã lưu lúc {new Date(data.banKy.at).toLocaleString('vi-VN')}</span>
            <button onClick={removeSigned} disabled={uploading} className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Gỡ bản ký để chỉnh sửa
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-slate-500 w-full mb-1">
              Sau khi nhập đủ giờ: xuất Excel/Word → in → ký tay, đóng dấu → scan rồi tải lên tại đây để lưu.
            </p>
            <input ref={fileRef} type="file" accept="application/pdf,image/*"
              className="text-xs file:mr-2 file:rounded file:border-0 file:bg-slate-200 file:px-2 file:py-1 file:text-xs" />
            <Button onClick={uploadSigned} disabled={uploading} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />} Tải lên bản đã ký
            </Button>
          </div>
        )}
      </div>

      {daKy && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 flex items-center gap-2">
          <Lock className="w-4 h-4" /> Bảng đã có bản ký — các nút lưu đang khoá. Bấm “Gỡ bản ký để chỉnh sửa” nếu cần sửa lại.
        </div>
      )}

      {/* ── Thông tin chung ── */}
      <form action={metaAction} className="rounded-xl border bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="hidden" name="id" value={data.id} />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Thời gian làm thêm — từ ngày</label>
          <input type="date" name="tuNgay" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">đến ngày</label>
          <input type="date" name="denNgay" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Ngày ký (tự né Thứ Bảy/Chủ nhật)</label>
          <input type="date" name="ngayKy" defaultValue={data.ngayKy} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Địa điểm làm thêm</label>
          <input name="diaDiem" defaultValue={data.diaDiem} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-slate-500">Lý do làm thêm (dòng đầu là mở đầu, các dòng sau hiển thị “+ …”)</label>
          <textarea name="lyDo" defaultValue={data.lyDo} rows={5} className={`${inputCls} h-auto py-2 resize-y`} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Người chấm công</label>
          <input name="nguoiChamCong" defaultValue={data.nguoiChamCong} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Trưởng phòng / Chánh Văn phòng (ký)</label>
          <input name="truongPhong" defaultValue={data.truongPhong} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Lãnh đạo Sở phê duyệt (họ tên)</label>
          <input name="lanhDaoSo" defaultValue={data.lanhDaoSo} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Chức danh lãnh đạo Sở</label>
          <input name="chucDanhLanhDao" defaultValue={data.chucDanhLanhDao} className={inputCls} placeholder="VD: Phó Giám đốc" />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={metaPending || daKy} className="bg-slate-800 hover:bg-slate-900">
            {metaPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            <Save className="w-4 h-4 mr-1" /> Lưu thông tin
          </Button>
        </div>
      </form>

      {/* ── Lưới chấm công theo ngày ── */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
          <p className="font-semibold text-slate-900 text-sm">Chấm công chi tiết theo ngày (nhập số giờ làm thêm từng ngày)</p>
          <Button onClick={saveHours} disabled={savingHours || daKy} size="sm" className="bg-amber-600 hover:bg-amber-700">
            {savingHours && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            <Save className="w-4 h-4 mr-1" /> Lưu giờ
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-[11px]">
                <th rowSpan={2} className="px-1 py-1 border w-8"></th>
                <th rowSpan={2} className="px-1 py-1 border w-8">STT</th>
                <th rowSpan={2} className="px-2 py-1 border text-left min-w-[160px]">Họ và tên</th>
                <th rowSpan={2} className="px-2 py-1 border text-left min-w-[120px]">Chức vụ</th>
                {days.map((d) => (
                  <th key={d.day} className={`px-0 py-1 border w-9 ${d.weekend ? 'bg-emerald-100' : ''}`}>{String(d.day).padStart(2, '0')}</th>
                ))}
                <th rowSpan={2} className="px-1 py-1 border bg-amber-50 w-12">Tổng giờ</th>
                <th rowSpan={2} className="px-1 py-1 border w-12" title="Trung bình giờ làm thêm mỗi tháng của người này">TB/tháng</th>
                <th rowSpan={2} className="px-1 py-1 border w-14" title="Dự kiến cả năm = TB/tháng × 12">Dự kiến năm</th>
                <th rowSpan={2} className="px-1 py-1 border w-12">Lũy kế năm</th>
                <th rowSpan={2} className="px-2 py-1 border text-left min-w-[120px]">Ghi chú</th>
                <th rowSpan={2} className="px-1 py-1 border w-8"></th>
              </tr>
              <tr className="bg-slate-100 text-[10px]">
                {days.map((d) => (
                  <th key={d.day} className={`px-0 py-0.5 border ${d.weekend ? 'bg-emerald-100 text-red-600' : 'text-slate-500'}`}>{d.thu}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const tong = rowTotal(r)
                const overYear = r.luyKeNam > OT_LIMIT_NAM
                const overPace = !overYear && r.duKienNam > OT_LIMIT_NAM
                return (
                  <tr key={r.id} onDragOver={(e) => e.preventDefault()} onDragEnter={() => onDragEnter(idx)} className={`border-t ${dragIdx === idx ? 'bg-amber-50' : ''}`}>
                    <td className="px-1 py-0.5 border text-center">
                      <span draggable onDragStart={() => startDrag(idx)} onDragEnd={onDragEnd} title="Kéo để sắp xếp" className="inline-flex cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700">
                        <GripVertical className="w-4 h-4" />
                      </span>
                    </td>
                    <td className="px-1 py-0.5 border text-center text-slate-500">{idx + 1}</td>
                    <td className="px-1 py-0.5 border"><input value={r.hoTen} onChange={(e) => setName(idx, 'hoTen', e.target.value)} className={`${inputCls} w-full h-7`} /></td>
                    <td className="px-1 py-0.5 border"><input value={r.chucVu} onChange={(e) => setName(idx, 'chucVu', e.target.value)} className={`${inputCls} w-full h-7`} /></td>
                    {days.map((d) => (
                      <td key={d.day} className={`px-0.5 py-0.5 border text-center ${d.weekend ? 'bg-emerald-50' : ''}`}>
                        <input value={r.gioNgay[String(d.day)] || ''} onChange={(e) => setDay(idx, d.day, e.target.value)} className={dayCls} inputMode="decimal" />
                      </td>
                    ))}
                    <td className="px-1 py-0.5 border text-center font-semibold bg-amber-50">{tong || ''}</td>
                    <td className={`px-1 py-0.5 border text-center ${overPace ? 'text-amber-700 font-semibold' : 'text-slate-500'}`}>{r.tbThang || 0}</td>
                    <td className={`px-1 py-0.5 border text-center ${overYear ? 'text-red-600 font-semibold' : overPace ? 'text-amber-700 font-semibold' : 'text-slate-500'}`}>
                      {(overYear || overPace) && <AlertTriangle className="inline w-3 h-3 mr-0.5 -mt-0.5" />}{r.duKienNam || 0}
                    </td>
                    <td className={`px-1 py-0.5 border text-center ${overYear ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>{r.luyKeNam || 0}</td>
                    <td className="px-1 py-0.5 border"><input value={r.ghiChu} onChange={(e) => setName(idx, 'ghiChu', e.target.value)} className={`${inputCls} w-full h-7`} /></td>
                    <td className="px-1 py-0.5 border text-center">
                      <button onClick={() => removeMember(r.id)} disabled={adding} className="text-slate-400 hover:text-red-600" title="Xoá người"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                )
              })}
              <tr className="border-t bg-slate-50 font-semibold text-xs">
                <td colSpan={4} className="px-2 py-1 border text-right">Cộng</td>
                {days.map((d) => (
                  <td key={d.day} className={`px-0 py-1 border text-center ${d.weekend ? 'bg-emerald-50' : ''}`}>{dayTotals[d.day] || ''}</td>
                ))}
                <td className="px-1 py-1 border text-center bg-amber-100">{Math.round(grandTotal * 100) / 100 || 0}</td>
                <td colSpan={4} className="border"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Thêm người */}
        <div className="px-4 py-3 border-t bg-slate-50 flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Họ và tên</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className={`${inputCls} min-w-[200px]`} placeholder="Thêm người ngoài danh sách" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Chức vụ</label>
            <input value={newRole} onChange={(e) => setNewRole(e.target.value)} className={`${inputCls} min-w-[160px]`} />
          </div>
          <Button onClick={addMember} disabled={adding || daKy} variant="outline" size="sm">
            {adding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Thêm người
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Trần làm thêm theo Bộ luật Lao động 2019 là <b>{OT_LIMIT_NAM} giờ/người/năm</b> — tính cho cả 12 tháng,
        tức trung bình ≤ <b>{OT_AVG_THANG} giờ/tháng/người</b>. Cột “Dự kiến năm” = TB/tháng × 12: tô <span className="text-amber-700 font-semibold">vàng</span> khi
        vượt trần theo nhịp, “Lũy kế năm” tô <span className="text-red-600 font-semibold">đỏ</span> khi tổng đã vượt {OT_LIMIT_NAM} giờ.
        Cuối tuần (Thứ Bảy/Chủ nhật) được tô màu xanh. Ngày không chấm có thể ghi vào cột “Ghi chú”.
      </div>

      <div className="flex justify-end">
        <Button onClick={deleteSheet} disabled={adding} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
          <Trash2 className="w-4 h-4 mr-1" /> Xoá bảng chấm công
        </Button>
      </div>
    </div>
  )
}
