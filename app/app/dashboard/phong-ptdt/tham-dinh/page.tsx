import { ThamDinhView } from '@/components/phong/tham-dinh-view'

export const dynamic = 'force-dynamic'

export default function ThamDinhPage() {
  return (
    <ThamDinhView
      phongKey="phong-ptdt"
      tenPhong="Phòng Phát triển đô thị"
      baseHref="/dashboard/phong-ptdt"
      color="indigo"
    />
  )
}
