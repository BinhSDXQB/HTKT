'use client'

import { useEffect, useRef, useState, useTransition, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Construction, X, Loader2, Inbox, Search, ArrowUpDown, ArrowUp, ArrowDown, ClipboardPlus, Copy } from 'lucide-react'
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

// Giá trị dùng để so sánh khi sắp xếp theo cột. Số giữ nguyên kiểu số; còn lại về chuỗi thường.
function sortVal(r: NvRecord, key: string, colFields: NvField[]): string | number {
  if (key === 'ma') return r.maBanGhi
  if (key === 'tieuDe') return r.tieuDe.toLowerCase()
  if (key === 'trangThai') return r.trangThai
  if (key === 'ngayGhiNhan') return r.ngayGhiNhan ?? ''
  const f = colFields.find((x) => x.key === key)
  const v = r.customFields[key]
  if (f?.type === 'number' && typeof v === 'number') return v
  return v === undefined || v === null ? '' : String(v).toLowerCase()
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

  // Bộ lọc thao tác nhanh: tìm kiếm, lọc trạng thái, sắp xếp cột.
  const [q, setQ] = useState('')
  const [filterTT, setFilterTT] = useState('')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  // Cột hiển thị ngoài bảng (mặc định 2 trường đầu). Tính trước early-return để dùng trong memo.
  const colFields = useMemo<NvField[]>(() => {
    if (!schema) return []
    return schema.tableFields
      ? schema.fields.filter((f) => schema.tableFields!.includes(f.key))
      : schema.fields.slice(0, 2)
  }, [schema])

  // Danh sách sau khi lọc trạng thái + tìm kiếm + sắp xếp (client-side).
  const view = useMemo(() => {
    let rows = records
    if (filterTT) rows = rows.filter((r) => r.trangThai === filterTT)
    const kw = q.trim().toLowerCase()
    if (kw) {
      rows = rows.filter((r) => {
        const hay = [r.maBanGhi, r.tieuDe, r.diaBan ?? '', r.ghiChu ?? '',
          ...colFields.map((f) => fmtVal(f, r.customFields[f.key]))].join(' ').toLowerCase()
        return hay.includes(kw)
      })
    }
    if (sort) {
      const { key, dir } = sort
      rows = [...rows].sort((a, b) => {
        const av = sortVal(a, key, colFields), bv = sortVal(b, key, colFields)
        if (av < bv) return dir === 'asc' ? -1 : 1
        if (av > bv) return dir === 'asc' ? 1 : -1
        return 0
      })
    }
    return rows
  }, [records, q, filterTT, sort, colFields])

  // Đếm bản ghi theo trạng thái để hiện số trên tab lọc.
  const countByTT = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of records) m[r.trangThai] = (m[r.trangThai] ?? 0) + 1
    return m
  }, [records])

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }))

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
    // Chủ đích: đồng bộ dữ liệu với lĩnh vực hiện tại (nguồn ngoài = server) khi
    // đổi lĩnh vực/schema — không phải cascading render vô ý.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Dựng FormState từ một bản ghi. withId=false → dùng cho "Nhân bản" (tạo mới).
  const formFromRecord = (r: NvRecord, withId: boolean): FormState => {
    const cf: Record<string, string> = {}
    for (const f of schema.fields) {
      const v = r.customFields[f.key]
      cf[f.key] = v === undefined || v === null ? '' : String(v)
    }
    return {
      id: withId ? r.id : undefined,
      tieuDe: r.tieuDe, trangThai: r.trangThai,
      diaBan: r.diaBan ?? '', ngayGhiNhan: toDateInput(r.ngayGhiNhan),
      ghiChu: r.ghiChu ?? '', customFields: cf,
    }
  }

  const openCreate = () => { setForm(emptyForm()); setErr(null); setOpen(true) }
  const openEdit = (r: NvRecord) => { setForm(formFromRecord(r, true)); setErr(null); setOpen(true) }
  // Nhân bản: mở modal THÊM với dữ liệu bản ghi nguồn (bỏ id → tạo bản ghi mới).
  const openDuplicate = (r: NvRecord) => { setForm(formFromRecord(r, false)); setErr(null); setOpen(true) }

  const submit = (keepOpen = false) => {
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
      // "Lưu & thêm tiếp" (chỉ khi tạo mới): giữ modal, reset form nhập bản ghi kế.
      if (keepOpen && !form.id) setForm(emptyForm())
      else setOpen(false)
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

  const hasFilter = q.trim() !== '' || filterTT !== ''

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
        <div>
          <p className="font-semibold text-slate-800">Dữ liệu nghiệp vụ</p>
          <p className="text-xs text-slate-500">
            {loading ? 'Đang tải…' : hasFilter ? `${view.length}/${records.length} bản ghi` : `${records.length} bản ghi`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-3 py-2 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Thêm bản ghi
        </button>
      </div>

      {/* Thanh công cụ: tìm kiếm + lọc trạng thái (thao tác nhanh) */}
      {(records.length > 0 || hasFilter) && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b bg-slate-50/60">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tiêu đề, mã, địa bàn…"
              className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setFilterTT('')}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${filterTT === '' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
            >
              Tất cả ({records.length})
            </button>
            {NV_TRANG_THAI.map((t) => {
              const n = countByTT[t.value] ?? 0
              return (
                <button
                  key={t.value}
                  onClick={() => setFilterTT((v) => (v === t.value ? '' : t.value))}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${filterTT === t.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                >
                  {t.label} ({n})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 flex items-center justify-center text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="p-10 flex flex-col items-center text-slate-400">
          <Inbox className="w-8 h-8 mb-2" />
          <p className="text-sm">Chưa có bản ghi. Bấm “Thêm bản ghi” để bắt đầu nhập liệu.</p>
        </div>
      ) : view.length === 0 ? (
        <div className="p-10 flex flex-col items-center text-slate-400">
          <Search className="w-8 h-8 mb-2" />
          <p className="text-sm">Không có bản ghi khớp bộ lọc.</p>
          <button onClick={() => { setQ(''); setFilterTT('') }} className="mt-2 text-xs text-indigo-600 hover:underline">
            Xoá bộ lọc
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b bg-slate-50">
                <SortTh label="Mã" col="ma" sort={sort} onSort={toggleSort} />
                <SortTh label={schema.tieuDeLabel} col="tieuDe" sort={sort} onSort={toggleSort} />
                {colFields.map((f) => (
                  <SortTh key={f.key} label={f.label} col={f.key} sort={sort} onSort={toggleSort} />
                ))}
                <SortTh label="Trạng thái" col="trangThai" sort={sort} onSort={toggleSort} />
                <th className="px-3 py-2 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {view.map((r) => {
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
                        <Link
                          href={`/dashboard/cong-viec/moi?tieuDe=${encodeURIComponent(`[${schema.label}] ${r.tieuDe}`)}&moTa=${encodeURIComponent(`Nguồn: ${schema.label} — mã ${r.maBanGhi}${r.diaBan ? ', địa bàn: ' + r.diaBan : ''}`)}`}
                          className="p-1.5 rounded hover:bg-blue-100 text-blue-500"
                          title="Tạo công việc từ bản ghi này"
                        >
                          <ClipboardPlus className="w-4 h-4" />
                        </Link>
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500" title="Sửa">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => openDuplicate(r)} className="p-1.5 rounded hover:bg-indigo-100 text-indigo-500" title="Nhân bản bản ghi này">
                          <Copy className="w-4 h-4" />
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
              {!form.id && (
                <button
                  onClick={() => submit(true)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 text-indigo-700 bg-white text-sm font-medium px-3 py-2 hover:bg-indigo-50 disabled:opacity-60"
                  title="Lưu bản ghi này và tiếp tục nhập bản ghi mới"
                >
                  <Plus className="w-4 h-4" /> Lưu &amp; thêm tiếp
                </button>
              )}
              <button
                onClick={() => submit(false)}
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

// Ô tiêu đề cột có thể bấm để sắp xếp (asc → desc → bỏ sắp xếp).
function SortTh({ label, col, sort, onSort }: {
  label: string; col: string; sort: { key: string; dir: 'asc' | 'desc' } | null; onSort: (col: string) => void
}) {
  const active = sort?.key === col
  return (
    <th className="px-3 py-2 font-medium">
      <button onClick={() => onSort(col)} className="inline-flex items-center gap-1 hover:text-slate-700 group">
        <span>{label}</span>
        {active ? (
          sort!.dir === 'asc'
            ? <ArrowUp className="w-3 h-3 text-indigo-600" />
            : <ArrowDown className="w-3 h-3 text-indigo-600" />
        ) : (
          <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
        )}
      </button>
    </th>
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
