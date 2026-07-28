import { ThamDinhView } from '@/components/phong/tham-dinh-view'

export const dynamic = 'force-dynamic'

export default function ThamDinhPage() {
  return (
    <ThamDinhView
      phongKey="phong-ql-vt"
      tenPhong="Phòng Quản lý vận tải"
      baseHref="/dashboard/phong-ql-vt"
      color="emerald"
    />
  )
}
