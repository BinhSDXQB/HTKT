import { ThamMuuView } from '@/components/phong/tham-muu-view'

export const dynamic = 'force-dynamic'

export default function ThamMuuPage() {
  return (
    <ThamMuuView
      phongKey="phong-clct"
      tenPhong="Phòng Quản lý chất lượng CT giao thông"
      baseHref="/dashboard/phong-clct"
      color="indigo"
    />
  )
}
