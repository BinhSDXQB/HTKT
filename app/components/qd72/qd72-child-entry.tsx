'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, Inbox } from 'lucide-react'
import { saveChildRecord, deleteChildRecord, type ChildRow } from '@/app/actions/qd72-child'
import { QD72_ENTRY, type EntryField } from '@/lib/qd72/phieu-entry'

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
type TabData = { ma: string; ten: string; rows: ChildRow[] }

function fmt(f: EntryField, v: unknown): string {
  if (f.type === 'boolean') return v === true ? 'Có' : v === false ? 'Không' : '—'
  if (v === null || v === undefined || v === '') return '—'
  if ((f.type === 'number' || f.type === 'integer') && typeof v === 'number') return v.toLocaleString('vi-VN')
  return String(v)
}

export function Qd72ChildEntry({ caseId, canEdit, initial }: { caseId: string; canEdit: boolean; initial: TabData[] }) {
  const [tabs, setTabs] = useState<TabData[]>(initial)
  const [active, setActive] = useState(initial[0]?.ma ?? 'PHIEU_02')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [err, setErr] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pending, startT] = useTransition()

  const phieu = QD72_ENTRY[active]
  const cols = phieu.fields.slice(0, 4)
  const cur = tabs.find((t) => t.ma === active)!
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500) }

  const openAdd = () => { setEditId(undefined); setForm({}); setErr(null); setOpen(true) }
  const openEdit = (r: ChildRow) => { setEditId(r.id); setForm({ ...r.fields }); setErr(null); setOpen(true) }

  const save = () => {
    setErr(null)
    startT(async () => {
      const res = await saveChildRecord(caseId, active, editId, form)
      if (!res.ok) { setErr(res.error ?? 'Lưu thất bại.'); return }
      setOpen(false); showToast('Đã lưu.')
      const label = String(form[phieu.nameField] ?? '(chưa đặt tên)')
      const fields: Record<string, unknown> = {}
      for (const f of phieu.fields) fields[f.key] = form[f.key] ?? null
      const row: ChildRow = { id: res.id ?? editId!, label, fields }
      setTabs((ts) => ts.map((t) => t.ma !== active ? t : { ...t, rows: editId ? t.rows.map((x) => x.id === editId ? row : x) : [...t.rows, row] }))
    })
  }
  const remove = (r: ChildRow) => {
    if (!confirm(`Xoá "${r.label}"?`)) return
    startT(async () => {
      const res = await deleteChildRecord(caseId, active, r.id)
      if (!res.ok) { showToast(res.error ?? 'Xoá thất bại.'); return }
      setTabs((ts) => ts.map((t) => t.ma !== active ? t : { ...t, rows: t.rows.filter((x) => x.id !== r.id) }))
      showToast('Đã xoá.')
    })
  }

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-3 border-b">
        {tabs.map((t) => (
          <button key={t.ma} onClick={() => setActive(t.ma)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${active === t.ma ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.ten} <span className="text-xs text-slate-400">({t.rows.length})</span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm text-slate-500">{cur.rows.length} bản ghi — {phieu.ten}</p>
          {canEdit && <button onClick={openAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-3 py-2 hover:bg-indigo-700"><Plus className="w-4 h-4" /> Thêm</button>}
        </div>

        {cur.rows.length === 0 ? (
          <div className="p-10 flex flex-col items-center text-slate-400"><Inbox className="w-8 h-8 mb-2" /><p className="text-sm">Chưa có bản ghi.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b bg-slate-50">
                  {cols.map((f) => <th key={f.key} className="px-3 py-2 font-medium">{f.label}{f.unit ? ` (${f.unit})` : ''}</th>)}
                  {canEdit && <th className="px-3 py-2 font-medium text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {cur.rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                    {cols.map((f) => <td key={f.key} className="px-3 py-2 text-slate-700">{fmt(f, r.fields[f.key])}</td>)}
                    {canEdit && (
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500" title="Sửa"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => remove(r)} className="p-1.5 rounded hover:bg-rose-100 text-rose-500" title="Xoá"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <p className="font-semibold text-slate-800">{editId ? 'Sửa' : 'Thêm'} — {phieu.ten}</p>
              <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {err && <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">{err}</div>}
              {phieu.fields.map((f) => (
                <label key={f.key} className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">{f.label}{f.unit ? ` (${f.unit})` : ''}{f.required && <span className="text-rose-500"> *</span>}</span>
                  {f.type === 'textarea' ? (
                    <textarea value={(form[f.key] ?? '') as string} onChange={(e) => set(f.key, e.target.value)} rows={2} className={inputCls} />
                  ) : f.type === 'select' ? (
                    <select value={(form[f.key] ?? '') as string} onChange={(e) => set(f.key, e.target.value)} className={inputCls}>
                      <option value="">— Chọn —</option>
                      {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === 'boolean' ? (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[f.key] === true} onChange={(e) => set(f.key, e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                      <span className="text-sm text-slate-600">Có</span>
                    </label>
                  ) : (
                    <input type="number" step={f.type === 'integer' ? '1' : '0.01'} value={(form[f.key] ?? '') as string | number}
                      onChange={(e) => set(f.key, e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
                  )}
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
              <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Huỷ</button>
              <button onClick={save} disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 disabled:opacity-60">
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
