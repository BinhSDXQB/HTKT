import { ThamMuuView } from '@/components/phong/tham-muu-view'

export const dynamic = 'force-dynamic'

export default function ThamMuuPage() {
  return (
    <ThamMuuView
      phongKey="phong-ptdt"
      tenPhong="Phòng Phát triển đô thị"
      baseHref="/dashboard/phong-ptdt"
      color="indigo"
    />
  )
}
