'use client'
import { useActionState, useState } from 'react'
import { Pencil, X, Loader2, Check, CalendarPlus, Users } from 'lucide-react'
import { reassignLinhVucAction, sinhCongViecDinhKyAction, type PhanCongState } from '@/app/actions/phan-cong-htkt'

type UserLite = { id: string; name: string }
export type PhanCongRow = {
  id: string
  linhVucTen: string
  nguoiPhuTrachId: string | null
  nguoiPhoiHopIds: string[]
  ghiChu: string | null
}

const inputCls = 'rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200'

function tenUser(users: UserLite[], id: string | null) {
  return users.find((u) => u.id === id)?.name ?? '—'
}

function RowEditor({ row, users, onDone }: { row: PhanCongRow; users: UserLite[]; onDone: () => void }) {
  const [state, action, pending] = useActionState<PhanCongState, FormData>(reassignLinhVucAction, null)
  if (state?.ok) { onDone(); }
  return (
    <form action={action} className="space-y-2 bg-cyan-50/50 rounded-lg p-3">
      <input type="hidden" name="id" value={row.id} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-600">Phụ trách chính:</span>
        <select name="nguoiPhuTrachId" defaultValue={row.nguoiPhuTrachId ?? ''} className={inputCls}>
          <option value="">— Chưa giao —</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-1">Người phối hợp / làm thay:</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {users.map((u) => (
            <label key={u.id} className="inline-flex items-center gap-1.5 text-sm text-slate-700">
              <input type="checkbox" name="nguoiPhoiHopIds" value={u.id} defaultChecked={row.nguoiPhoiHopIds.includes(u.id)} />
              {u.name}
            </label>
          ))}
        </div>
      </div>
      <input name="ghiChu" defaultValue={row.ghiChu ?? ''} placeholder="Ghi chú (tùy chọn)" className={`${inputCls} w-full`} />
      {state?.error && <p className="text-xs text-rose-600">{state.error}</p>}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 px-3 py-1.5 rounded disabled:opacity-60">
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Lưu
        </button>
        <button type="button" onClick={onDone} className="inline-flex items-center gap-1 text-xs text-slate-600 border px-3 py-1.5 rounded hover:bg-slate-50">
          <X className="w-3.5 h-3.5" /> Hủy
        </button>
      </div>
    </form>
  )
}

export function PhanCongEditor({ rows, users, canManage }: { rows: PhanCongRow[]; users: UserLite[]; canManage: boolean }) {
  const [editing, setEditing] = useState<string | null>(null)
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left font-semibold px-4 py-2.5">Lĩnh vực</th>
            <th className="text-left font-semibold px-4 py-2.5">Phụ trách chính</th>
            <th className="text-left font-semibold px-4 py-2.5">Phối hợp / làm thay</th>
            {canManage && <th className="px-4 py-2.5 w-20"></th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.id} className="align-top">
              {editing === r.id ? (
                <td colSpan={canManage ? 4 : 3} className="px-4 py-3">
                  <div className="font-semibold text-cyan-800 mb-2">{r.linhVucTen}</div>
                  <RowEditor row={r} users={users} onDone={() => setEditing(null)} />
                </td>
              ) : (
                <>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.linhVucTen}</td>
                  <td className="px-4 py-3 text-cyan-800 font-semibold">{tenUser(users, r.nguoiPhuTrachId)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.nguoiPhoiHopIds.length
                      ? r.nguoiPhoiHopIds.map((id) => tenUser(users, id)).join(', ')
                      : <span className="text-slate-300">—</span>}
                    {r.ghiChu && <div className="text-xs text-slate-400 mt-0.5">{r.ghiChu}</div>}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <button onClick={() => setEditing(r.id)} className="inline-flex items-center gap-1 text-xs text-cyan-700 hover:text-cyan-900">
                        <Pencil className="w-3.5 h-3.5" /> Sửa
                      </button>
                    </td>
                  )}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SinhViecForm({ toChucId }: { toChucId: string }) {
  const now = new Date()
  const defaultThang = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [state, action, pending] = useActionState<PhanCongState, FormData>(sinhCongViecDinhKyAction, null)
  return (
    <form action={action} className="rounded-xl border bg-emerald-50/40 p-4 flex flex-wrap items-end gap-3">
      <input type="hidden" name="toChucId" value={toChucId} />
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Sinh công việc định kỳ cho tháng</label>
        <input type="month" name="thang" defaultValue={defaultThang} className={inputCls} />
      </div>
      <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg disabled:opacity-60">
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />} Tự sinh việc
      </button>
      <p className="text-xs text-slate-500 flex items-center gap-1">
        <Users className="w-3.5 h-3.5" /> Tạo báo cáo tháng cho mỗi lĩnh vực; tháng cuối quý/năm sinh thêm báo cáo quý/năm. Chạy lại không trùng.
      </p>
      {state?.ok && <p className="w-full text-sm text-emerald-700">Đã sinh {state.created} công việc (bỏ qua việc đã có).</p>}
      {state?.error && <p className="w-full text-sm text-rose-600">{state.error}</p>}
    </form>
  )
}
