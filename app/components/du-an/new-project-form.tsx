'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createProjectAction } from '@/app/actions/du-an'
import { DOMAIN_OPTIONS } from '@/lib/constants/tai-san'

type Ward = { id: string; name: string }
type EU = { id: string; name: string }

export function NewProjectForm({ wards, executingUnits }: { wards: Ward[]; executingUnits: EU[] }) {
  const [state, formAction, isPending] = useActionState(createProjectAction, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>}

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Thông tin dự án</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Tên dự án *</Label>
            <Input name="name" placeholder="Tên đầy đủ của dự án" className="h-9" />
            {state?.fieldErrors?.name && <p className="text-xs text-red-600">{state.fieldErrors.name[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Mã định danh quốc gia (QĐ2597)</Label>
            <Input name="nationalCode" placeholder="Mã Bộ XD cấp (để trống nếu chưa có)" className="h-9" />
            {state?.fieldErrors?.name && <p className="text-xs text-red-600">{state.fieldErrors.name[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Lĩnh vực *</Label>
            <select name="domain" defaultValue="" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">-- Chọn lĩnh vực --</option>
              {DOMAIN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {state?.fieldErrors?.domain && <p className="text-xs text-red-600">{state.fieldErrors.domain[0]}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Loại dự án</Label>
            <select name="type" defaultValue="XAY_MOI" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500">
              {[['XAY_MOI','Xây mới'],['CAI_TAO','Cải tạo'],['BAO_TRI_LON','Bảo trì lớn'],['KHAC','Khác']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Phường / Xã</Label>
            <select name="wardId" defaultValue="" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">-- Chọn --</option>
              {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Chủ đầu tư</Label>
            <Input name="investor" placeholder="Tên chủ đầu tư" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Đơn vị thi công</Label>
            <select name="executingUnitId" defaultValue="" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">-- Chưa có --</option>
              {executingUnits.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Tổng mức đầu tư (đ)</Label>
            <Input name="totalBudget" type="number" min="0" placeholder="0" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Nguồn vốn</Label>
            <Input name="fundingSource" placeholder="Ngân sách nhà nước..." className="h-9" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Ngày khởi công</Label>
            <Input name="startDate" type="date" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Ngày hoàn thành KH</Label>
            <Input name="endDate" type="date" className="h-9" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Số quyết định phê duyệt</Label>
          <Input name="decisionNumber" placeholder="VD: 123/QĐ-UBND" className="h-9" />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()}>Huỷ</Button>
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white min-w-[120px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : 'Thêm dự án'}
        </Button>
      </div>
    </form>
  )
}
