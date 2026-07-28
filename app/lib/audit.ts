import 'server-only'
import { db } from '@/lib/db'

type AuditParams = {
  userId: string
  action: string
  module: string
  targetId?: string
  targetType?: string
  detail?: string
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    await db.auditLog.create({ data: params })
  } catch {
    // audit log không chặn nghiệp vụ chính
  }
}

export { createAuditLog as logAction }
