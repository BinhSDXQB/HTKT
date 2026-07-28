'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createUserAction } from '@/app/actions/users'

type Role = { id: string; name: string; displayName: string }

export function NewUserForm({ roles }: { roles: Role[] }) {
  const [state, formAction, isPending] = useActionState(createUserAction, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>}

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Họ và tên *</Label>
            <Input name="name" placeholder="Nguyễn Văn A" className="h-9" />
            {state?.fieldErrors?.name && <p className="text-xs text-red-600">{state.fieldErrors.name[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Email *</Label>
            <Input name="email" type="email" placeholder="email@example.com" className="h-9" />
            {state?.fieldErrors?.email && <p className="text-xs text-red-600">{state.fieldErrors.email[0]}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Vai trò *</Label>
            <select name="roleId" defaultValue="" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Chọn vai trò --</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.displayName}</option>)}
            </select>
            {state?.fieldErrors?.roleId && <p className="text-xs text-red-600">{state.fieldErrors.roleId[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Số điện thoại</Label>
            <Input name="phone" placeholder="0xxx" className="h-9" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Mật khẩu *</Label>
          <Input name="password" type="password" placeholder="Tối thiểu 8 ký tự" className="h-9" />
          {state?.fieldErrors?.password && <p className="text-xs text-red-600">{state.fieldErrors.password[0]}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()}>Huỷ</Button>
        <Button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white min-w-[130px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : 'Tạo tài khoản'}
        </Button>
      </div>
    </form>
  )
}
