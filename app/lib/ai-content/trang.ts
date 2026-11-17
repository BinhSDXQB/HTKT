import 'server-only'

import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { aiContentBat, duocSoan } from './nghiep-vu'
import { vaiTroAi } from './may-chu'

/** Cổng cho mọi trang /dashboard/ai-workspace/*: cờ tắt → 404; không quyền → /forbidden. */
export async function yeuCauAiWorkspace() {
  const user = await requireAuth()
  if (!aiContentBat()) notFound()
  const nd = vaiTroAi(user)
  if (!duocSoan(nd)) redirect('/forbidden')
  return { user, nd }
}
