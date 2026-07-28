'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setThanhVienAction, removeThanhVienAction, type CongViecFormState } from '@/app/actions/cong-viec'
import { VAI_TRO_LABEL, VAI_TRO_OPTIONS } from '@/lib/cong-viec-labels'

type Member = { id: string; userId: string; vaiTro: string; user: { name: string | null } }
type Option = { id: string; name: string | null }

/** Bảng thành viên tham gia công việc: thêm (chọn người + vai trò), đổi vai trò, gỡ.
 *  Chỉ render cho người có quyền quản lý việc — trang cha đã kiểm tra canManage. */
export function MembersPanel({ id, thanhViens, members }: { id: string; thanhViens: Member[]; members: Option[] }) {
  const router = useRouter()
  const addRef = useRef<HTMLFormElement>(null)
  const [addState, addAction, adding] = useActionState<CongViecFormState, FormData>(setThanhVienAction, null)
  const [removeState, removeAction, removing] = useActionState<CongViecFormState, FormData>(removeThanhVienAction, null)

  useEffect(() => { if (addState?.ok) { addRef.current?.reset(); router.refresh() } }, [addState, router])
  useEffect(() => { if (removeState?.ok) router.refresh() }, [removeState, router])

  // Không gợi ý lại người đã tham gia
  const assigned = new Set(thanhViens.map((t) => t.userId))
  const candidates = members.filter((m) => !assigned.has(m.id))
  const error = addState?.error || removeState?.error

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3">
      <p className="font-semibold text-slate-800 text-sm">Thành viên tham gia</p>
      {error && <div className="rounded-lg bg-red-100 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}

      <ul className="space-y-1.5">
        {thanhViens.map((tv) => (
          <li key={tv.id} className="flex items-center gap-2 text-sm">
            <span className="flex-1 text-slate-700 truncate">{tv.user.name}</span>
            <span className="text-xs text-slate-500">{VAI_TRO_LABEL[tv.vaiTro] || tv.vaiTro}</span>
            <form action={removeAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="userId" value={tv.userId} />
              <button type="submit" disabled={removing} title="Gỡ thành viên" className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50">
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          </li>
        ))}
        {thanhViens.length === 0 && <li className="text-sm text-slate-400">Chưa có thành viên.</li>}
      </ul>

      {candidates.length > 0 && (
        <form ref={addRef} action={addAction} className="flex items-center gap-1.5 pt-1 border-t">
          <input type="hidden" name="id" value={id} />
          <select name="userId" required defaultValue="" className="flex-1 min-w-0 h-8 px-2 text-xs border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
            <option value="" disabled>Chọn cán bộ...</option>
            {candidates.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select name="vaiTro" defaultValue="PHOI_HOP" className="h-8 px-2 text-xs border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
            {VAI_TRO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Button type="submit" size="sm" className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white" disabled={adding} title="Thêm thành viên">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          </Button>
        </form>
      )}
    </div>
  )
}
