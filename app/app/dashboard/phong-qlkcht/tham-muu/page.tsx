import { ThamMuuView } from '@/components/phong/tham-muu-view'

export const dynamic = 'force-dynamic'

export default function ThamMuuPage() {
  return (
    <ThamMuuView
      phongKey="phong-qlkcht"
      tenPhong="Phòng Quản lý KCHT giao thông"
      baseHref="/dashboard/phong-qlkcht"
      color="emerald"
    />
  )
}
