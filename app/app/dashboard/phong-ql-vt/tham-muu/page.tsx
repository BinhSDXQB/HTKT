import { ThamMuuView } from '@/components/phong/tham-muu-view'

export const dynamic = 'force-dynamic'

export default function ThamMuuPage() {
  return (
    <ThamMuuView
      phongKey="phong-ql-vt"
      tenPhong="Phòng Quản lý vận tải"
      baseHref="/dashboard/phong-ql-vt"
      color="emerald"
    />
  )
}
