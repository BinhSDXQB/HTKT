import { notFound } from 'next/navigation'
import { yeuCauAiWorkspace } from '@/lib/ai-content/trang'
import { AiSoanBai } from '@/components/ai-content/soan-bai'

export const dynamic = 'force-dynamic'

export default async function AiBaiVietPage({ params }: { params: Promise<{ id: string }> }) {
  await yeuCauAiWorkspace()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  return <div className="mx-auto max-w-6xl p-4 sm:p-6"><AiSoanBai id={id} /></div>
}
