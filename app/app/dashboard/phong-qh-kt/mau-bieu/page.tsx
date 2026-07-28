import { MauBieuView } from '@/components/phong/mau-bieu-view'

export const dynamic = 'force-dynamic'

export default function MauBieuPage() {
  return (
    <MauBieuView
      tenPhong="Phòng Quy hoạch - Kiến trúc"
      baseHref="/dashboard/phong-qh-kt"
      color="indigo"
    />
  )
}
