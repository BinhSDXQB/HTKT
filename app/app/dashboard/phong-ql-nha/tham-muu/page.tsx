import { ThamMuuView } from '@/components/phong/tham-muu-view'

export const dynamic = 'force-dynamic'

export default function ThamMuuPage() {
  return (
    <ThamMuuView
      phongKey="phong-ql-nha"
      tenPhong="Phòng Quản lý nhà và thị trường BĐS"
      baseHref="/dashboard/phong-ql-nha"
      color="emerald"
    />
  )
}
