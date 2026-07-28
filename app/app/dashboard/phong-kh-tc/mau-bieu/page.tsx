import { MauBieuView } from '@/components/phong/mau-bieu-view'

export const dynamic = 'force-dynamic'

export default function MauBieuPage() {
  return (
    <MauBieuView
      tenPhong="Phòng Kế hoạch - Tài chính"
      baseHref="/dashboard/phong-kh-tc"
      color="emerald"
    />
  )
}
