import { ThamDinhView } from '@/components/phong/tham-dinh-view'

export const dynamic = 'force-dynamic'

export default function ThamDinhPage() {
  return (
    <ThamDinhView
      phongKey="phong-qlhd-xd"
      tenPhong="Phòng Quản lý hoạt động xây dựng"
      baseHref="/dashboard/phong-qlhd-xd"
      color="indigo"
    />
  )
}
