'use client'

import { useState, useTransition } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { setDepartmentLeaderAction } from '@/app/actions/office'

// Công tắc gắn/bỏ cờ "Lãnh đạo phòng" (thủ công) — chỉ render cho admin + lãnh đạo Sở.
export function DeptLeaderToggle({
  canBoId,
  initial,
  hasUser,
}: {
  canBoId: string
  initial: boolean
  hasUser: boolean
}) {
  const [on, setOn] = useState(initial)
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    setErr(null)
    const next = !on
    startTransition(async () => {
      const res = await setDepartmentLeaderAction(canBoId, next)
      if (!res.ok) { setErr(res.error ?? 'Không lưu được.'); return }
      setOn(next)
    })
  }

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 mt-1">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Lãnh đạo phòng</p>
            <p className="text-xs text-slate-500">
              Được duyệt nâng lương, nghỉ phép &amp; xem dữ liệu nhạy cảm của phòng. Chỉ lãnh đạo Sở / quản trị viên chỉnh được.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={pending || !hasUser}
          role="switch"
          aria-checked={on}
          title={hasUser ? '' : 'Cán bộ chưa có tài khoản đăng nhập'}
          className={[
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
            on ? 'bg-indigo-600' : 'bg-slate-300',
            (pending || !hasUser) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          ].join(' ')}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {pending && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
        <span className={on ? 'text-indigo-700 font-medium' : 'text-slate-500'}>
          {on ? 'Đang là lãnh đạo phòng' : 'Không phải lãnh đạo phòng'}
        </span>
        {!hasUser && <span className="text-amber-600">· Cán bộ chưa có tài khoản đăng nhập</span>}
        {err && <span className="text-rose-600">· {err}</span>}
      </div>
    </div>
  )
}
