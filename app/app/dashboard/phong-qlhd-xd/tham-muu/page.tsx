import { ThamMuuView } from '@/components/phong/tham-muu-view'

export const dynamic = 'force-dynamic'

export default function ThamMuuPage() {
  return (
    <ThamMuuView
      phongKey="phong-qlhd-xd"
      tenPhong="Phòng Quản lý hoạt động xây dựng"
      baseHref="/dashboard/phong-qlhd-xd"
      color="indigo"
    />
  )
}
