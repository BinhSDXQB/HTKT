import { MauBieuView } from '@/components/phong/mau-bieu-view'

export const dynamic = 'force-dynamic'

export default function MauBieuPage() {
  return (
    <MauBieuView
      tenPhong="Phòng Quản lý nhà và thị trường BĐS"
      baseHref="/dashboard/phong-ql-nha"
      color="emerald"
    />
  )
}
