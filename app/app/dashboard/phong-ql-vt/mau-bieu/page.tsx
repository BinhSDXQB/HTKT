import { MauBieuView } from '@/components/phong/mau-bieu-view'

export const dynamic = 'force-dynamic'

export default function MauBieuPage() {
  return (
    <MauBieuView
      tenPhong="Phòng Quản lý vận tải"
      baseHref="/dashboard/phong-ql-vt"
      color="emerald"
    />
  )
}
