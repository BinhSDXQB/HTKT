import { MauBieuView } from '@/components/phong/mau-bieu-view'

export const dynamic = 'force-dynamic'

export default function MauBieuPage() {
  return (
    <MauBieuView
      tenPhong="Phòng Quản lý chất lượng CT giao thông"
      baseHref="/dashboard/phong-clct"
      color="indigo"
    />
  )
}
