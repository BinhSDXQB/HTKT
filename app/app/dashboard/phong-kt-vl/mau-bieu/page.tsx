import { MauBieuView } from '@/components/phong/mau-bieu-view'

export const dynamic = 'force-dynamic'

export default function MauBieuPage() {
  return (
    <MauBieuView
      tenPhong="Phòng Kinh tế và Vật liệu xây dựng"
      baseHref="/dashboard/phong-kt-vl"
      color="emerald"
    />
  )
}
