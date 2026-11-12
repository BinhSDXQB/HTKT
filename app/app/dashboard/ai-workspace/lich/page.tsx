import { yeuCauAiWorkspace } from '@/lib/ai-content/trang'
import { AiLich } from '@/components/ai-content/lich'

export const dynamic = 'force-dynamic'

export default async function AiLichPage() {
  await yeuCauAiWorkspace()
  return <div className="mx-auto max-w-6xl p-4 sm:p-6"><AiLich /></div>
}
