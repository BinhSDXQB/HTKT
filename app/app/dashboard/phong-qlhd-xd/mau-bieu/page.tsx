import { MauBieuView } from '@/components/phong/mau-bieu-view'

export const dynamic = 'force-dynamic'

export default function MauBieuPage() {
  return (
    <MauBieuView
      tenPhong="Phòng Quản lý hoạt động xây dựng"
      baseHref="/dashboard/phong-qlhd-xd"
      color="indigo"
    />
  )
}
