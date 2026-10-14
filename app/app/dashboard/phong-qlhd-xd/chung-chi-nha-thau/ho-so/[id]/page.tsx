import { notFound } from 'next/navigation'
import { getHoSo } from '@/app/actions/cchn'
import { CchnForm } from '@/components/cchn/cchn-form'

// Xem/sửa một hồ sơ đề nghị cấp chứng chỉ hành nghề.
export default async function ChiTietHoSoCchnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const hs = await getHoSo(id)
  if (!hs) notFound()
  return <CchnForm key={hs.id} initial={hs} />
}
