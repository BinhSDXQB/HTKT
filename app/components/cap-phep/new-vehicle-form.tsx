'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createVehicleAction } from '@/app/actions/cap-phep'

export function NewVehicleForm() {
  const [state, formAction, isPending] = useActionState(createVehicleAction, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>}

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Biển số *</Label>
            <Input name="plateNumber" placeholder="VD: 74C-12345" className="h-9" />
            {state?.fieldErrors?.plateNumber && <p className="text-xs text-red-600">{state.fieldErrors.plateNumber[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Chủ xe *</Label>
            <Input name="ownerName" placeholder="Tên chủ phương tiện" className="h-9" />
            {state?.fieldErrors?.ownerName && <p className="text-xs text-red-600">{state.fieldErrors.ownerName[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Nhãn hiệu</Label>
            <Input name="brand" placeholder="Nhãn hiệu xe" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Loại xe</Label>
            <Input name="vehicleType" placeholder="Loại xe" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Số trục</Label>
            <Input name="axleCount" type="number" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Tải trọng thiết kế (tấn)</Label>
            <Input name="designLoadTon" type="number" step="0.01" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Tải trọng đăng kiểm (tấn)</Label>
            <Input name="registeredLoadTon" type="number" step="0.01" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Kích thước D × R × C (m)</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input name="lengthM" type="number" step="0.01" placeholder="Dài" className="h-9" />
              <Input name="widthM" type="number" step="0.01" placeholder="Rộng" className="h-9" />
              <Input name="heightM" type="number" step="0.01" placeholder="Cao" className="h-9" />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Thông số kỹ thuật khác</Label>
          <textarea name="techSpecs" rows={2} className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Ghi chú</Label>
          <textarea name="note" rows={2} className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()}>Huỷ</Button>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[130px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : 'Thêm phương tiện'}
        </Button>
      </div>
    </form>
  )
}
