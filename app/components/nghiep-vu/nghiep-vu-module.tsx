'use client'

import { useEffect, useRef, useState, useTransition, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Plus, Pencil, Trash2, Construction, X, Loader2, Inbox } from 'lucide-react'
import { getNghiepVuSchema, NV_TRANG_THAI, trangThaiInfo, type NvField } from '@/lib/nghiep-vu/schema'
import {
  listNghiepVu, saveNghiepVu, deleteNghiepVu,
  type NvRecord, type NvSaveInput,
} from '@/app/actions/nghiep-vu'

// Module nhập liệu hồ sơ nghiệp vụ — tự nhận lĩnh vực theo đường dẫn (path sau
// /dashboard/). Nếu lĩnh vực chưa cấu hình schema → hiện hộp "đang phát triển".

const inputCls =
  'w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'

function deriveLinhVuc(pathname: string): string {
  return pathname.replace(/^\/dashboard\//, '').replace(/\/$/, '')
}

function fmtVal(f: NvField, v: unknown): string {
  if (v === undefined || v === null || v === '') return '—'
  if (f.type === 'number' && typeof v === 'number') return v.toLocaleString('vi-VN')
  return String(v)
}

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

type FormState = {
  id?: string
  tieuDe: string
  trangThai: string
  diaBan: string
  ngayGhiNhan: string
  ghiChu: string
  customFields: Record<string, string>
}

function emptyForm(): FormState {
  return { tieuDe: '', trangThai: 'MOI', diaBan: '', ngayGhiNhan: '', ghiChu: '', customFields: {} }
}

export function NghiepVuModule({
  linhVuc: linhVucProp,
  initialRecords,
}: { linhVuc?: string; initialRecords?: NvRecord[] } = {}) {
  const pathname = usePathname()
  const linhVuc = linhVucProp ?? deriveLinhVuc(pathname)
  const schema = getNghiepVuSchema(linhVuc)

  // Dữ liệu nạp sẵn từ server (SSR) → hiện ngay, không cần gọi lại + không spinner.
  const hasInitial = initialRecords !== undefined
  const [records, setRecords] = useState<NvRecord[]>(initialRecords ?? [])
  const [loading, setLoading] = useState(!hasInitial)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const reload = useCallback(() => {
    setLoading(true)
    listNghiepVu(linhVuc).then((rows) => {
      setRecords(rows)
      setLoading(false)
    })
  }, [linhVuc])

  // Bỏ qua fetch lần đầu khi đã có dữ liệu SSR; vẫn nạp lại sau khi lưu/xoá.
  const skipFirstFetch = useRef(hasInitial)
  useEffect(() => {
    if (skipFirstFetch.current) { skipFirstFetch.current = false; return }
    if (schema) reload()
    else setLoading(false)
  }, [schema, reload])

  if (!schema) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
        <Construction className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800">Đang phát triển</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Chức năng nhập liệu của mục này sẽ được bổ sung. Cấu trúc menu và phân quyền đã sẵn sàng.
          </p>
        </div>
      </div>
    )
  }

  const openCreate = () => { setForm(emptyForm()); setErr(null); setOpen(true) }
  const openEdit = (r: NvRecord) => {
    const cf: Record<string, string> = {}
    for (const f of schema.fields) {
      const v = r.customFields[f.key]
      cf[f.key] = v === undefined || v === null ? '' : String(v)
    }
    setForm({
      id: r.id, tieuDe: r.tieuDe, trangThai: r.trangThai,
      diaBan: r.diaBan ?? '', ngayGhiNhan: toDateInput(r.ngayGhiNhan),
      ghiChu: r.ghiChu ?? '', customFields: cf,
    })
    setErr(null); setOpen(true)
  }

  const submit = () => {
    setErr(null)
    const input: NvSaveInput = {
      id: form.id,
      linhVuc,
      tieuDe: form.tieuDe,
      trangThai: form.trangThai,
      diaBan: form.diaBan,
      ngayGhiNhan: form.ngayGhiNhan,
      ghiChu: form.ghiChu,
      customFields: form.customFields,
    }
    startTransition(async () => {
      const res = await saveNghiepVu(input)
      if (!res.ok) { setErr(res.error ?? 'Lưu thất bại.'); return }
      setOpen(false)
      reload()
    })
  }

  const remove = (r: NvRecord) => {
    if (!confirm(`Xoá bản ghi "${r.tieuDe}" (${r.maBanGhi})?`)) return
    startTransition(async () => {
      const res = await deleteNghiepVu(r.id)
      if (!res.ok) { alert(res.error ?? 'Xoá thất bại.'); return }
      reload()
    })
  }

  // Hiển thị các trường cấu hình ngoài bảng, mặc định lấy 2 trường đầu
  const colFields = schema.tableFields
    ? schema.fields.filter((f) => schema.tableFields!.includes(f.key))
    : schema.fields.slice(0, 2)

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
        <div>
          <p className="font-semibold text-slate-800">Dữ liệu nghiệp vụ</p>
          <p className="text-xs text-slate-500">{loading ? 'Đang tải…' : `${records.length} bản ghi`}</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-3 py-2 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Thêm bản ghi
        </button>
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="p-10 flex flex-col items-center text-slate-400">
          <Inbox className="w-8 h-8 mb-2" />
          <p className="text-sm">Chưa có bản ghi. Bấm “Thêm bản ghi” để bắt đầu nhập liệu.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b bg-slate-50">
                <th className="px-3 py-2 font-medium">Mã</th>
                <th className="px-3 py-2 font-medium">{schema.tieuDeLabel}</th>
                {colFields.map((f) => (
                  <th key={f.key} className="px-3 py-2 font-medium">{f.label}</th>
                ))}
                <th className="px-3 py-2 font-medium">Trạng thái</th>
                <th className="px-3 py-2 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const tt = trangThaiInfo(r.trangThai)
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{r.maBanGhi}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">{r.tieuDe}</td>
                    {colFields.map((f) => (
                      <td key={f.key} className="px-3 py-2 text-slate-600">{fmtVal(f, r.customFields[f.key])}</td>
                    ))}
                    <td className="px-3 py-2">
                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded ${tt.color}`}>{tt.label}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500" title="Sửa">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(r)} className="p-1.5 rounded hover:bg-rose-100 text-rose-500" title="Xoá">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
              <p className="font-semibold text-slate-800">{form.id ? 'Sửa bản ghi' : 'Thêm bản ghi'} — {schema.label}</p>
              <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {err && <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">{err}</div>}

              <Field label={schema.tieuDeLabel} required>
                <input
                  value={form.tieuDe}
                  onChange={(e) => setForm({ ...form, tieuDe: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {schema.fields.map((f) => (
                <Field key={f.key} label={f.label}>
                  {f.type === 'textarea' ? (
                    <textarea
                      value={form.customFields[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, customFields: { ...form.customFields, [f.key]: e.target.value } })}
                      rows={2} className={inputCls}
                    />
                  ) : f.type === 'select' ? (
                    <select
                      value={form.customFields[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, customFields: { ...form.customFields, [f.key]: e.target.value } })}
                      className={inputCls}
                    >
                      <option value="">— Chọn —</option>
                      {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      value={form.customFields[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, customFields: { ...form.customFields, [f.key]: e.target.value } })}
                      className={inputCls}
                    />
                  )}
                </Field>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Địa bàn (xã/phường)">
                  <input value={form.diaBan} onChange={(e) => setForm({ ...form, diaBan: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Ngày ghi nhận">
                  <input type="date" value={form.ngayGhiNhan} onChange={(e) => setForm({ ...form, ngayGhiNhan: e.target.value })} className={inputCls} />
                </Field>
              </div>

              <Field label="Trạng thái">
                <select value={form.trangThai} onChange={(e) => setForm({ ...form, trangThai: e.target.value })} className={inputCls}>
                  {NV_TRANG_THAI.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>

              <Field label="Ghi chú">
                <textarea value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} rows={2} className={inputCls} />
              </Field>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
              <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Huỷ</button>
              <button
                onClick={submit}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 disabled:opacity-60"
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />} Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  )
}
