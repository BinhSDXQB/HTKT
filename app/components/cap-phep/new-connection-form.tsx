'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createConnectionAction } from '@/app/actions/cap-phep'
import { CONNECTION_TYPE_OPTIONS, CONNECTION_STAGE_OPTIONS, APPLICANT_TYPE_OPTIONS, ROAD_CLASS_OPTIONS } from '@/lib/constants/cap-phep'

const inputCls = 'w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500'

export function NewConnectionForm() {
  const [state, formAction, isPending] = useActionState(createConnectionAction, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>}

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Loại hồ sơ & đối tượng</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Loại đấu nối</Label>
            <select name="connectionType" defaultValue="CHINH_THUC" className={inputCls}>
              {CONNECTION_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Giai đoạn</Label>
            <select name="stage" defaultValue="CHAP_THUAN_VI_TRI" className={inputCls}>
              {CONNECTION_STAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Đối tượng đề nghị</Label>
            <select name="applicantType" defaultValue="TO_CHUC" className={inputCls}>
              {APPLICANT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Điện thoại</Label>
            <Input name="applicantPhone" placeholder="Số điện thoại" className="h-9" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Chủ đầu tư / cá nhân *</Label>
          <Input name="applicantName" placeholder="Tên chủ đầu tư hoặc cá nhân" className="h-9" />
          {state?.fieldErrors?.applicantName && <p className="text-xs text-red-600">{state.fieldErrors.applicantName[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Dự án / công trình</Label>
          <Input name="projectName" placeholder="Tên dự án, công trình" className="h-9" />
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Vị trí đấu nối</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Tuyến đường</Label>
            <Input name="roadName" placeholder="Tên tuyến đường" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Cấp / loại đường</Label>
            <select name="roadClass" defaultValue="" className={inputCls}>
              <option value="">-- Chọn --</option>
              {ROAD_CLASS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Lý trình (Km)</Label>
            <Input name="km" type="number" step="0.001" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Vĩ độ (lat)</Label>
            <Input name="latitude" type="number" step="0.000001" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Kinh độ (lng)</Label>
            <Input name="longitude" type="number" step="0.000001" className="h-9" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Nội dung đề nghị</h3>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Mục đích đấu nối</Label>
          <textarea name="purpose" rows={2} className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Thiết kế</Label>
          <textarea name="designNote" rows={2} className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Phương án tổ chức giao thông</Label>
          <textarea name="trafficPlan" rows={2} className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()}>Huỷ</Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[130px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : 'Tạo hồ sơ'}
        </Button>
      </div>
    </form>
  )
}
