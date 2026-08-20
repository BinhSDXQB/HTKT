'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, Inbox, Link2 } from 'lucide-react'
import { saveNangLucCaNhan, deleteNangLucCaNhan, type NangLucCaNhanRow } from '@/app/actions/nang-luc-hdxd'
import { LINH_VUC_HANH_NGHE, HANG_CHUNG_CHI, LOAI_CAP_CCHN } from '@/lib/xd-lien-thong/dinh-danh'

const TT: Record<string, { label: string; color: string }> = {
  HIEU_LUC: { label: 'Hiệu lực', color: 'bg-emerald-100 text-emerald-700' },
  HET_HAN: { label: 'Hết hạn', color: 'bg-amber-100 text-amber-700' },
  THU_HOI: { label: 'Thu hồi', color: 'bg-rose-100 text-rose-700' },
}
const LOAI_MA: Record<string, string> = { SO_DINH_DANH_CN: 'CCCD', HO_CHIEU: 'Hộ chiếu' }
const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'

type Form = {
  id?: string; hoTen: string; maDinhDanh: string; laCongDanVN: boolean
  linhVucHanhNghe: string; hangChungChi: string; thoiHanChungChi: string
  soChungChi: string; loaiCap: string; coQuanCap: string; ngayCap: string
}
const empty = (): Form => ({ hoTen: '', maDinhDanh: '', laCongDanVN: true, linhVucHanhNghe: '', hangChungChi: '', thoiHanChungChi: '', soChungChi: '', loaiCap: '', coQuanCap: '', ngayCap: '' })

export function NangLucList({ initial, canManage }: { initial: NangLucCaNhanRow[]; canManage: boolean }) {
  const [rows, setRows] = useState<NangLucCaNhanRow[]>(initial)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Form>(empty())
  const [err, setErr] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pending, startT] = useTransition()
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500) }

  const openCreate = () => { setForm(empty()); setErr(null); setOpen(true) }
  const openEdit = (r: NangLucCaNhanRow) => {
    setForm({
      id: r.id, hoTen: r.hoTen, maDinhDanh: r.maDinhDanh ?? '', laCongDanVN: r.loaiMa !== 'HO_CHIEU',
      linhVucHanhNghe: r.linhVucHanhNghe ?? '', hangChungChi: r.hangChungChi ?? '',
      thoiHanChungChi: r.thoiHan?.slice(0, 10) ?? '', soChungChi: r.soChungChi ?? '', loaiCap: '', coQuanCap: '', ngayCap: '',
    })
    setErr(null); setOpen(true)
  }

  const save = () => {
    setErr(null)
    startT(async () => {
      const res = await saveNangLucCaNhan(form)
      if (!res.ok) { setErr(res.error ?? 'Lưu thất bại.'); return }
      setOpen(false); showToast(form.id ? 'Đã cập nhật.' : 'Đã lưu + khởi tạo mã định danh.')
      const row: NangLucCaNhanRow = {
        id: res.id ?? form.id!, hoTen: form.hoTen, maDinhDanh: form.maDinhDanh || null,
        loaiMa: form.laCongDanVN ? 'SO_DINH_DANH_CN' : 'HO_CHIEU', linhVucHanhNghe: form.linhVucHanhNghe || null,
        hangChungChi: form.hangChungChi || null, soChungChi: form.soChungChi || null, trangThai: 'HIEU_LUC',
        thoiHan: form.thoiHanChungChi || null, dinhDanhId: form.maDinhDanh ? 'linked' : null,
      }
      setRows((s) => (form.id ? s.map((x) => (x.id === form.id ? row : x)) : [row, ...s]))
    })
  }
  const remove = (r: NangLucCaNhanRow) => {
    if (!confirm(`Xoá năng lực của "${r.hoTen}"?`)) return
    startT(async () => {
      const res = await deleteNangLucCaNhan(r.id)
      if (!res.ok) { showToast(res.error ?? 'Xoá thất bại.'); return }
      setRows((s) => s.filter((x) => x.id !== r.id)); showToast('Đã xoá.')
    })
  }

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
        <p className="text-sm text-slate-500">{rows.length} cá nhân</p>
        {canManage && (
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium px-3 py-2 hover:bg-emerald-700">
            <Plus className="w-4 h-4" /> Thêm cá nhân
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="p-10 flex flex-col items-center text-slate-400"><Inbox className="w-8 h-8 mb-2" /><p className="text-sm">Chưa có dữ liệu năng lực.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b bg-slate-50">
                <th className="px-3 py-2 font-medium">Họ tên</th>
                <th className="px-3 py-2 font-medium">Mã định danh</th>
                <th className="px-3 py-2 font-medium">Lĩnh vực</th>
                <th className="px-3 py-2 font-medium">Hạng</th>
                <th className="px-3 py-2 font-medium">Số CC</th>
                <th className="px-3 py-2 font-medium">Trạng thái</th>
                {canManage && <th className="px-3 py-2 font-medium text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const tt = TT[r.trangThai] ?? TT.HIEU_LUC
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{r.hoTen}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {r.maDinhDanh ? (
                        <span className="inline-flex items-center gap-1">
                          {r.dinhDanhId && (
                            <span title="Đã gắn sổ mã định danh" className="inline-flex">
                              <Link2 className="w-3 h-3 text-emerald-500" />
                            </span>
                          )}
                          <span className="text-xs">{LOAI_MA[r.loaiMa] ?? r.loaiMa}: {r.maDinhDanh}</span>
                        </span>
                      ) : <span className="text-xs text-amber-600">Chưa có mã</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{r.linhVucHanhNghe ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600 text-center">{r.hangChungChi ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{r.soChungChi ?? '—'}</td>
                    <td className="px-3 py-2"><span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded ${tt.color}`}>{tt.label}</span></td>
                    {canManage && (
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500" title="Sửa"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => remove(r)} className="p-1.5 rounded hover:bg-rose-100 text-rose-500" title="Xoá"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    )}
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
              <p className="font-semibold text-slate-800">{form.id ? 'Sửa' : 'Thêm'} năng lực cá nhân</p>
              <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {err && <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">{err}</div>}
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Họ tên <span className="text-rose-500">*</span></span>
                <input value={form.hoTen} onChange={(e) => setForm({ ...form, hoTen: e.target.value })} className={inputCls} />
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="block col-span-1">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Loại mã</span>
                  <select value={form.laCongDanVN ? 'VN' : 'KHAC'} onChange={(e) => setForm({ ...form, laCongDanVN: e.target.value === 'VN' })} className={inputCls}>
                    <option value="VN">CCCD (VN)</option>
                    <option value="KHAC">Hộ chiếu</option>
                  </select>
                </label>
                <label className="block col-span-2">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Mã định danh {form.laCongDanVN ? '(số CCCD)' : '(số hộ chiếu)'}</span>
                  <input value={form.maDinhDanh} onChange={(e) => setForm({ ...form, maDinhDanh: e.target.value })} className={inputCls} placeholder="Để trống nếu chưa có" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Lĩnh vực hành nghề</span>
                  <select value={form.linhVucHanhNghe} onChange={(e) => setForm({ ...form, linhVucHanhNghe: e.target.value })} className={inputCls}>
                    <option value="">— Chọn —</option>
                    {LINH_VUC_HANH_NGHE.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Hạng chứng chỉ</span>
                  <select value={form.hangChungChi} onChange={(e) => setForm({ ...form, hangChungChi: e.target.value })} className={inputCls}>
                    <option value="">— Chọn —</option>
                    {HANG_CHUNG_CHI.map((h) => <option key={h} value={h}>Hạng {h}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Số chứng chỉ</span>
                  <input value={form.soChungChi} onChange={(e) => setForm({ ...form, soChungChi: e.target.value })} className={inputCls} />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Loại cấp</span>
                  <select value={form.loaiCap} onChange={(e) => setForm({ ...form, loaiCap: e.target.value })} className={inputCls}>
                    <option value="">— Chọn —</option>
                    {LOAI_CAP_CCHN.map((c) => <option key={c} value={c}>{c === 'CAP_MOI' ? 'Cấp mới' : c === 'CAP_LAI' ? 'Cấp lại' : 'Chuyển đổi'}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Cơ quan cấp</span>
                  <input value={form.coQuanCap} onChange={(e) => setForm({ ...form, coQuanCap: e.target.value })} className={inputCls} />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Thời hạn chứng chỉ</span>
                  <input type="date" value={form.thoiHanChungChi} onChange={(e) => setForm({ ...form, thoiHanChungChi: e.target.value })} className={inputCls} />
                </label>
              </div>
              <p className="text-xs text-slate-400">Lưu xong hệ thống tự khởi tạo/liên kết mã định danh vào sổ liên thông CSDL quốc gia (NĐ 212 Đ19/21).</p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
              <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Huỷ</button>
              <button onClick={save} disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700 disabled:opacity-60">
                {pending && <Loader2 className="w-4 h-4 animate-spin" />} Lưu
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium bg-slate-800 text-white">{toast}</div>}
    </div>
  )
}
