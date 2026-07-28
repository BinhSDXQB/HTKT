import { ThamDinhView } from '@/components/phong/tham-dinh-view'

export const dynamic = 'force-dynamic'

export default function ThamDinhPage() {
  return (
    <ThamDinhView
      phongKey="phong-qlkcht"
      tenPhong="Phòng Quản lý KCHT giao thông"
      baseHref="/dashboard/phong-qlkcht"
      color="emerald"
    />
  )
}
