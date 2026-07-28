'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createIncidentAction } from '@/app/actions/su-co'
import { DOMAIN_OPTIONS } from '@/lib/constants/tai-san'
import { INCIDENT_PRIORITY_OPTIONS, INCIDENT_SOURCE_OPTIONS } from '@/lib/constants/su-co'

type Asset = { id: string; name: string; assetCode: string; domain: string }
type Ward = { id: string; name: string }

export function NewIncidentForm({ assets, wards, reportedById }: { assets: Asset[]; wards: Ward[]; reportedById: string }) {
  const [state, formAction, isPending] = useActionState(createIncidentAction, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>}
      <input type="hidden" name="reportedById" value={reportedById} />

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Thông tin sự cố</h3>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Tiêu đề sự cố *</Label>
          <Input name="title" placeholder="Mô tả ngắn gọn sự cố..." className="h-9" />
          {state?.fieldErrors?.title && <p className="text-xs text-red-600">{state.fieldErrors.title[0]}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Lĩnh vực *</Label>
            <select name="domain" defaultValue="" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">-- Chọn lĩnh vực --</option>
              {DOMAIN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {state?.fieldErrors?.domain && <p className="text-xs text-red-600">{state.fieldErrors.domain[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Nguồn tiếp nhận</Label>
            <select name="source" defaultValue="BAO_CAO_NV" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500">
              {INCIDENT_SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Mức ưu tiên</Label>
            <select name="priority" defaultValue="TRUNG" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500">
              {INCIDENT_PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Tài sản liên quan</Label>
            <select name="assetId" defaultValue="" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">-- Không xác định --</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.assetCode})</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Địa chỉ / Vị trí</Label>
            <Input name="address" placeholder="Địa chỉ cụ thể xảy ra sự cố" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Phường / Xã</Label>
            <select name="wardId" defaultValue="" className="w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">-- Chọn phường/xã --</option>
              {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Tên người báo cáo</Label>
            <Input name="reporterName" placeholder="Họ tên người phản ánh" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">SĐT người báo cáo</Label>
            <Input name="reporterPhone" placeholder="Số điện thoại" className="h-9" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Hạn xử lý</Label>
          <Input name="deadlineAt" type="date" className="h-9 w-48" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Mô tả chi tiết</Label>
          <textarea name="description" rows={3} placeholder="Mô tả chi tiết tình trạng sự cố..." className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()}>Huỷ</Button>
        <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white min-w-[130px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : 'Ghi nhận sự cố'}
        </Button>
      </div>
    </form>
  )
}
