'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createOversizedPermitAction } from '@/app/actions/cap-phep'
import { OVERSIZED_PERMIT_TYPE_OPTIONS, APPLICANT_TYPE_OPTIONS } from '@/lib/constants/cap-phep'

type Vehicle = { id: string; plateNumber: string; ownerName: string }

const inputCls = 'w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-teal-500'

export function NewOversizedForm({ vehicles }: { vehicles: Vehicle[] }) {
  const [state, formAction, isPending] = useActionState(createOversizedPermitAction, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>}

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Đối tượng & loại giấy phép</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Loại giấy phép *</Label>
            <select name="permitType" defaultValue="QUA_TAI" className={inputCls}>
              {OVERSIZED_PERMIT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Đối tượng đề nghị</Label>
            <select name="applicantType" defaultValue="TO_CHUC" className={inputCls}>
              {APPLICANT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Tên tổ chức / cá nhân *</Label>
          <Input name="applicantName" placeholder="Tên đơn vị hoặc cá nhân đề nghị" className="h-9" />
          {state?.fieldErrors?.applicantName && <p className="text-xs text-red-600">{state.fieldErrors.applicantName[0]}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Điện thoại</Label>
            <Input name="applicantPhone" placeholder="Số điện thoại" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Địa chỉ</Label>
            <Input name="applicantAddress" placeholder="Địa chỉ" className="h-9" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Phương tiện & hàng hoá</h3>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Phương tiện</Label>
          <select name="vehicleId" defaultValue="" className={inputCls}>
            <option value="">-- Chọn phương tiện đã đăng ký --</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plateNumber} — {v.ownerName}</option>)}
          </select>
          <p className="text-xs text-slate-400">Chưa có? Thêm tại mục Quản lý phương tiện.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Loại hàng</Label>
            <Input name="cargoType" placeholder="Loại hàng vận chuyển" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Tổng trọng lượng (tấn)</Label>
            <Input name="totalWeightTon" type="number" step="0.01" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Tải trọng trục (tấn)</Label>
            <Input name="axleLoadTon" type="number" step="0.01" className="h-9" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Dài (m)</Label>
            <Input name="overallLengthM" type="number" step="0.01" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Rộng (m)</Label>
            <Input name="overallWidthM" type="number" step="0.01" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Cao (m)</Label>
            <Input name="overallHeightM" type="number" step="0.01" className="h-9" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Tuyến & thời gian lưu hành</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Điểm đầu</Label>
            <Input name="travelFrom" placeholder="Điểm đầu tuyến lưu hành" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Điểm cuối</Label>
            <Input name="travelTo" placeholder="Điểm cuối tuyến lưu hành" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Lưu hành từ</Label>
            <Input name="validFrom" type="date" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Đến</Label>
            <Input name="validTo" type="date" className="h-9" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="needEscort" className="rounded border-slate-300" />
          Cần xe dẫn đường / hộ tống
        </label>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Ý kiến thẩm định ban đầu</Label>
          <textarea name="appraisalNote" rows={3} placeholder="Ghi chú / ý kiến..." className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()}>Huỷ</Button>
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white min-w-[130px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : 'Tạo hồ sơ'}
        </Button>
      </div>
    </form>
  )
}
