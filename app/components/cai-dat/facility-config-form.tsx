'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveFacilityConfigAction } from '@/app/actions/cai-dat'

type Config = { id: string; coQuanCapTren: string; tenCoQuan: string; tenDonVi: string; diaChi: string; dienThoai: string; email: string; website: string } | null

export function FacilityConfigForm({ config }: { config: Config }) {
  const [state, formAction, isPending] = useActionState(saveFacilityConfigAction, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>}
      {state?.success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{state.success}</div>}

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Thông tin cơ quan / đơn vị</h3>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Cơ quan cấp trên</Label>
          <Input name="coQuanCapTren" defaultValue={config?.coQuanCapTren ?? ''} placeholder="VD: ỦY BAN NHÂN DÂN TỈNH QUẢNG TRỊ" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Tên cơ quan</Label>
          <Input name="tenCoQuan" defaultValue={config?.tenCoQuan ?? ''} placeholder="VD: SỞ XÂY DỰNG QUẢNG TRỊ" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Tên đơn vị trực thuộc</Label>
          <Input name="tenDonVi" defaultValue={config?.tenDonVi ?? ''} placeholder="VD: SỞ XÂY DỰNG QUẢNG TRỊ" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Địa chỉ</Label>
          <Input name="diaChi" defaultValue={config?.diaChi ?? ''} placeholder="Số nhà, tên đường, phường, quận..." className="h-9" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Điện thoại</Label>
            <Input name="dienThoai" defaultValue={config?.dienThoai ?? ''} placeholder="0xxxx" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Email</Label>
            <Input name="email" type="email" defaultValue={config?.email ?? ''} placeholder="email@example.com" className="h-9" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Website</Label>
          <Input name="website" defaultValue={config?.website ?? ''} placeholder="https://..." className="h-9" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white min-w-[120px]" disabled={isPending}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : 'Lưu thông tin'}
        </Button>
      </div>
    </form>
  )
}
