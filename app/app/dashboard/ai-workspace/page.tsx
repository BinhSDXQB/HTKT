import { yeuCauAiWorkspace } from '@/lib/ai-content/trang'
import { AiTongQuan } from '@/components/ai-content/tong-quan'

export const dynamic = 'force-dynamic'

export default async function AiWorkspacePage() {
  await yeuCauAiWorkspace()
  return <div className="mx-auto max-w-6xl p-4 sm:p-6"><AiTongQuan /></div>
}
