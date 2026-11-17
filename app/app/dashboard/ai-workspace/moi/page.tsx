import { yeuCauAiWorkspace } from '@/lib/ai-content/trang'
import { AiSoanBai } from '@/components/ai-content/soan-bai'

export const dynamic = 'force-dynamic'

export default async function AiSoanBaiMoiPage() {
  await yeuCauAiWorkspace()
  return <div className="mx-auto max-w-6xl p-4 sm:p-6"><AiSoanBai /></div>
}
