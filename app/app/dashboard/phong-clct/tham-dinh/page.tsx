import { ThamDinhView } from '@/components/phong/tham-dinh-view'

export const dynamic = 'force-dynamic'

export default function ThamDinhPage() {
  return (
    <ThamDinhView
      phongKey="phong-clct"
      tenPhong="Phòng Quản lý chất lượng CT giao thông"
      baseHref="/dashboard/phong-clct"
      color="indigo"
    />
  )
}
