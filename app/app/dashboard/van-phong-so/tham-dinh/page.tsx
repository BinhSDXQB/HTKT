import { ThamDinhView } from '@/components/phong/tham-dinh-view'

export const dynamic = 'force-dynamic'

export default function ThamDinhPage() {
  return (
    <ThamDinhView
      phongKey="van-phong-so"
      tenPhong="Văn phòng Sở"
      baseHref="/dashboard/van-phong-so"
      color="indigo"
    />
  )
}
