'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Send, Undo2, X, Loader2, Inbox, ClipboardList, Gauge } from 'lucide-react'
import {
  createSurveyCase, updateSurveyCase, submitSurveyCase, returnSurveyCase, evaluateCase,
  type Qd72CaseRow,
} from '@/app/actions/qd72'

type EvalItem = { doiTuong: string; tenTieuChi: string; giaTriDo: number | null; ketQua: string; thongDiep: string }
type EvalRes = { ten: string; nhomDeXuat: string; tomTat: Record<string, number>; items: EvalItem[] }
const KQ_COLOR: Record<string, string> = {
  DAT: 'text-emerald-600', KHONG_DAT: 'text-rose-600', CHUA_DU_DU_LIEU: 'text-amber-600', KHONG_AP_DUNG: 'text-slate-400',
}

const TRANG_THAI: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Nháp', color: 'bg-slate-100 text-slate-700' },
  SUBMITTED: { label: 'Đã gửi', color: 'bg-blue-100 text-blue-700' },
  RETURNED: { label: 'Bị trả lại', color: 'bg-amber-100 text-amber-700' },
  TECHNICAL_VERIFICATION: { label: 'Đang xác minh', color: 'bg-indigo-100 text-indigo-700' },
  VERIFIED: { label: 'Đã xác minh', color: 'bg-cyan-100 text-cyan-700' },
  APPROVED: { label: 'Đã phê duyệt', color: 'bg-emerald-100 text-emerald-700' },
  ARCHIVED: { label: 'Lưu trữ', color: 'bg-slate-200 text-slate-600' },
}
const NHOM_DG: Record<string, string> = {
  DAT: 'Đạt', KHONG_DAT_CO_THE_CAI_TAO: 'Không đạt - có thể cải tạo',
  KHONG_DAT_CHUA_THE_CAI_TAO_DAY_DU: 'Không đạt - chưa thể cải tạo đầy đủ', CHUA_DU_DU_LIEU: 'Chưa đủ dữ liệu',
}
const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'

type Form = { id?: string; ten: string; ngayKhaoSat: string; thanhPhanKhaoSat: string; moTa: string }
const empty = (): Form => ({ ten: '', ngayKhaoSat: '', thanhPhanKhaoSat: '', moTa: '' })

export function Qd72CaseList({ initial, canCreate, canReturn }: { initial: Qd72CaseRow[]; canCreate: boolean; canReturn: boolean }) {
  const [rows, setRows] = useState<Qd72CaseRow[]>(initial)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Form>(empty())
  const [err, setErr] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [evalRes, setEvalRes] = useState<EvalRes | null>(null)
  const [pending, startT] = useTransition()

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500) }

  const doEvaluate = (r: Qd72CaseRow) => {
    startT(async () => {
      const res = await evaluateCase(r.id)
      if (!res.ok) { showToast(res.error ?? 'Đánh giá thất bại.'); return }
      setRows((s) => s.map((x) => (x.id === r.id ? { ...x, nhomDanhGia: res.nhomDeXuat ?? x.nhomDanhGia } : x)))
      setEvalRes({ ten: r.ten, nhomDeXuat: res.nhomDeXuat!, tomTat: res.tomTat!, items: (res.items as EvalItem[]) ?? [] })
    })
  }

  const openCreate = () => { setForm(empty()); setErr(null); setOpen(true) }
  const openEdit = (r: Qd72CaseRow) => {
    setForm({ id: r.id, ten: r.ten, ngayKhaoSat: r.ngayKhaoSat?.slice(0, 10) ?? '', thanhPhanKhaoSat: '', moTa: '' })
    setErr(null); setOpen(true)
  }

  const submitForm = () => {
    setErr(null)
    startT(async () => {
      const input = { ten: form.ten, ngayKhaoSat: form.ngayKhaoSat, thanhPhanKhaoSat: form.thanhPhanKhaoSat, moTa: form.moTa }
      const res = form.id ? await updateSurveyCase(form.id, input) : await createSurveyCase(input)
      if (!res.ok) { setErr(res.error ?? 'Lưu thất bại.'); return }
      setOpen(false); showToast(form.id ? 'Đã cập nhật hồ sơ.' : 'Đã tạo hồ sơ.')
      // Cập nhật lạc quan: RSC sẽ revalidate; ở đây phản hồi nhanh cho người dùng.
      if (!form.id && res.id) setRows((s) => [{ id: res.id!, ma: null, ten: form.ten, trangThai: 'DRAFT', nhomDanhGia: null, donViHanhChinhId: null, ngayKhaoSat: form.ngayKhaoSat || null, createdAt: new Date().toISOString() }, ...s])
      else setRows((s) => s.map((r) => (r.id === form.id ? { ...r, ten: form.ten, ngayKhaoSat: form.ngayKhaoSat || null } : r)))
    })
  }

  const doSubmit = (r: Qd72CaseRow) => {
    if (!confirm(`Gửi hồ sơ "${r.ten}" lên Sở Xây dựng?`)) return
    startT(async () => {
      const res = await submitSurveyCase(r.id)
      if (!res.ok) { showToast(res.error ?? 'Gửi thất bại.'); return }
      setRows((s) => s.map((x) => (x.id === r.id ? { ...x, trangThai: 'SUBMITTED' } : x))); showToast('Đã gửi hồ sơ.')
    })
  }
  const doReturn = (r: Qd72CaseRow) => {
    const y = prompt(`Lý do trả lại hồ sơ "${r.ten}":`)
    if (y == null) return
    startT(async () => {
      const res = await returnSurveyCase(r.id, y)
      if (!res.ok) { showToast(res.error ?? 'Trả lại thất bại.'); return }
      setRows((s) => s.map((x) => (x.id === r.id ? { ...x, trangThai: 'RETURNED' } : x))); showToast('Đã trả lại hồ sơ.')
    })
  }

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
        <p className="text-sm text-slate-500">{rows.length} hồ sơ khảo sát</p>
        {canCreate && (
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-3 py-2 hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Tạo hồ sơ
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="p-10 flex flex-col items-center text-slate-400">
          <Inbox className="w-8 h-8 mb-2" />
          <p className="text-sm">Chưa có hồ sơ khảo sát.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b bg-slate-50">
                <th className="px-3 py-2 font-medium">Mã</th>
                <th className="px-3 py-2 font-medium">Tên khu vực</th>
                <th className="px-3 py-2 font-medium">Đánh giá sơ bộ</th>
                <th className="px-3 py-2 font-medium">Ngày KS</th>
                <th className="px-3 py-2 font-medium">Trạng thái</th>
                <th className="px-3 py-2 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const tt = TRANG_THAI[r.trangThai] ?? TRANG_THAI.DRAFT
                const suaDuoc = r.trangThai === 'DRAFT' || r.trangThai === 'RETURNED'
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{r.ma ?? '—'}</td>
                    <td className="px-3 py-2 font-medium">
                      <Link href={`/dashboard/qd72/${r.id}`} className="text-indigo-700 hover:underline">{r.ten}</Link>
                    </td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{r.nhomDanhGia ? (NHOM_DG[r.nhomDanhGia] ?? r.nhomDanhGia) : '—'}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.ngayKhaoSat?.slice(0, 10) ?? '—'}</td>
                    <td className="px-3 py-2"><span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded ${tt.color}`}>{tt.label}</span></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => doEvaluate(r)} disabled={pending} className="p-1.5 rounded hover:bg-violet-100 text-violet-500" title="Đánh giá sơ bộ"><Gauge className="w-4 h-4" /></button>
                        {suaDuoc && (
                          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500" title="Sửa"><Pencil className="w-4 h-4" /></button>
                        )}
                        {suaDuoc && (
                          <button onClick={() => doSubmit(r)} disabled={pending} className="p-1.5 rounded hover:bg-blue-100 text-blue-500" title="Gửi lên Sở"><Send className="w-4 h-4" /></button>
                        )}
                        {canReturn && (r.trangThai === 'SUBMITTED' || r.trangThai === 'TECHNICAL_VERIFICATION') && (
                          <button onClick={() => doReturn(r)} disabled={pending} className="p-1.5 rounded hover:bg-amber-100 text-amber-600" title="Trả lại"><Undo2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <p className="font-semibold text-slate-800 flex items-center gap-2"><ClipboardList className="w-4 h-4" /> {form.id ? 'Sửa hồ sơ' : 'Tạo hồ sơ khảo sát'}</p>
              <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              {err && <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">{err}</div>}
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Tên khu vực đô thị <span className="text-rose-500">*</span></span>
                <input value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} className={inputCls} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Ngày khảo sát</span>
                  <input type="date" value={form.ngayKhaoSat} onChange={(e) => setForm({ ...form, ngayKhaoSat: e.target.value })} className={inputCls} />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Thành phần khảo sát</span>
                  <input value={form.thanhPhanKhaoSat} onChange={(e) => setForm({ ...form, thanhPhanKhaoSat: e.target.value })} className={inputCls} />
                </label>
              </div>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Mô tả hiện trạng</span>
                <textarea value={form.moTa} onChange={(e) => setForm({ ...form, moTa: e.target.value })} rows={3} className={inputCls} />
              </label>
              <p className="text-xs text-slate-400">Ranh giới GIS, giao thông, dây–cáp, nguồn nước… nhập ở các bước tiếp theo của hồ sơ.</p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
              <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Huỷ</button>
              <button onClick={submitForm} disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 disabled:opacity-60">
                {pending && <Loader2 className="w-4 h-4 animate-spin" />} Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {evalRes && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setEvalRes(null) }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <p className="font-semibold text-slate-800 flex items-center gap-2"><Gauge className="w-4 h-4 text-violet-500" /> Đánh giá sơ bộ — {evalRes.ten}</p>
              <button onClick={() => setEvalRes(null)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span>Nhóm đề xuất: <b className={KQ_COLOR[evalRes.nhomDeXuat.startsWith('KHONG_DAT') ? 'KHONG_DAT' : evalRes.nhomDeXuat === 'DAT' ? 'DAT' : 'CHUA_DU_DU_LIEU']}>{NHOM_DG[evalRes.nhomDeXuat] ?? evalRes.nhomDeXuat}</b></span>
                <span className="text-xs text-slate-500">Đạt {evalRes.tomTat.DAT ?? 0} · Không đạt {evalRes.tomTat.KHONG_DAT ?? 0} · Chưa đủ dữ liệu {evalRes.tomTat.CHUA_DU_DU_LIEU ?? 0}</span>
              </div>
              <div className="rounded-lg border bg-amber-50 border-amber-200 text-amber-800 text-xs px-3 py-2">
                Đây chỉ là ĐÁNH GIÁ SƠ BỘ (đọc tiêu chí từ bảng cấu hình). Kết luận chính thức do người có thẩm quyền xác minh (Phiếu 05).
              </div>
              <div className="max-h-[50vh] overflow-y-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-slate-500 border-b bg-slate-50"><th className="px-2 py-1.5">Đối tượng</th><th className="px-2 py-1.5">Tiêu chí</th><th className="px-2 py-1.5">Đo</th><th className="px-2 py-1.5">Kết quả</th></tr></thead>
                  <tbody>
                    {evalRes.items.map((it, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-2 py-1.5 text-slate-700">{it.doiTuong}</td>
                        <td className="px-2 py-1.5 text-slate-600">{it.tenTieuChi}</td>
                        <td className="px-2 py-1.5 text-slate-600">{it.giaTriDo ?? '—'}</td>
                        <td className={`px-2 py-1.5 font-medium ${KQ_COLOR[it.ketQua] ?? ''}`}>{it.ketQua === 'DAT' ? 'Đạt' : it.ketQua === 'KHONG_DAT' ? 'Không đạt' : it.ketQua === 'CHUA_DU_DU_LIEU' ? 'Chưa đủ dữ liệu' : 'Không áp dụng'}</td>
                      </tr>
                    ))}
                    {evalRes.items.length === 0 && <tr><td colSpan={4} className="px-2 py-4 text-center text-slate-400">Chưa có số liệu đối tượng để đánh giá.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium bg-slate-800 text-white">{toast}</div>}
    </div>
  )
}
