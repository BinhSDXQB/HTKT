import { ThamDinhView } from '@/components/phong/tham-dinh-view'

export const dynamic = 'force-dynamic'

export default function ThamDinhPage() {
  return (
    <ThamDinhView
      phongKey="phong-kt-vl"
      tenPhong="Phòng Kinh tế và Vật liệu xây dựng"
      baseHref="/dashboard/phong-kt-vl"
      color="emerald"
    />
  )
}
