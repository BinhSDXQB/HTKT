import { MauBieuView } from '@/components/phong/mau-bieu-view'

export const dynamic = 'force-dynamic'

export default function MauBieuPage() {
  return (
    <MauBieuView
      tenPhong="Phòng Phát triển đô thị"
      baseHref="/dashboard/phong-ptdt"
      color="indigo"
    />
  )
}
