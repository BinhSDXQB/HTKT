import { ThamDinhView } from '@/components/phong/tham-dinh-view'

export const dynamic = 'force-dynamic'

export default function ThamDinhPage() {
  return (
    <ThamDinhView
      phongKey="phong-ql-nha"
      tenPhong="Phòng Quản lý nhà và thị trường BĐS"
      baseHref="/dashboard/phong-ql-nha"
      color="emerald"
    />
  )
}
