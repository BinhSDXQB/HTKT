import { ThamMuuView } from '@/components/phong/tham-muu-view'

export const dynamic = 'force-dynamic'

export default function ThamMuuPage() {
  return (
    <ThamMuuView
      phongKey="phong-kt-vl"
      tenPhong="Phòng Kinh tế và Vật liệu xây dựng"
      baseHref="/dashboard/phong-kt-vl"
      color="emerald"
    />
  )
}
