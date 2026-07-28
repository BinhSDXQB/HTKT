'use server'

import { requireOfficeAccess, isOfficeLeader } from '@/lib/auth'
import { hasPermission, MODULES } from '@/lib/permissions'
import { db } from '@/lib/db'
import { getSoToChucIds } from '@/lib/office-scope'
import { missingRequiredChoCanhBao } from '@/lib/ho-so-alert'
import { isTelegramConfigured, sendTelegramMessage, tgEscape } from '@/lib/telegram'
import { logAction } from '@/lib/audit'

export type TelegramAlertState = {
  ok?: boolean
  error?: string
  message?: string
} | null

// Cán bộ phụ trách hồ sơ để liên hệ bổ sung (theo phân công Văn phòng Sở).
const NGUOI_PHU_TRACH = [
  'Đ/c Trần Thị Thu Liễu — Chánh Văn phòng',
  'Đ/c Lê Thị Xuân Quý — Phó Chánh Văn phòng',
  'Đ/c Lê Cẩm Nhung — Văn phòng Sở',
]

/**
 * Gửi 1 tin cảnh báo TỔNG HỢP danh sách cán bộ còn thiếu hồ sơ bắt buộc
 * vào nhóm Telegram của Văn phòng Sở. Kèm hướng dẫn liên hệ người phụ trách.
 */
export async function sendHoSoThieuTelegramAction(
  _prev: TelegramAlertState,
  _formData: FormData,
): Promise<TelegramAlertState> {
  const user = await requireOfficeAccess()
  const canSend =
    isOfficeLeader(user) ||
    hasPermission(user.permissions, MODULES.OFFICE, 'salary_manage') ||
    hasPermission(user.permissions, MODULES.OFFICE, 'personnel_edit')
  if (!canSend) {
    return { error: 'Bạn không có quyền gửi cảnh báo hồ sơ.' }
  }

  if (!isTelegramConfigured()) {
    return {
      error:
        'Chưa cấu hình Telegram. Cần điền TELEGRAM_BOT_TOKEN và TELEGRAM_ALERT_CHAT_ID trong .env rồi khởi động lại.',
    }
  }

  const soIds = await getSoToChucIds()
  const list = await db.canBo.findMany({
    where: { toChucId: { in: soIds }, trangThai: { in: ['DANG_CONG_TAC', 'HOP_DONG'] } },
    include: { toChuc: { select: { ten: true } } },
    orderBy: [{ toChuc: { thuTu: 'asc' } }, { hoTen: 'asc' }],
  })

  const thieu = list
    .map((cb) => ({ cb, missing: missingRequiredChoCanhBao(cb) }))
    .filter((x) => x.missing.length > 0)

  if (thieu.length === 0) {
    return { ok: true, message: 'Tất cả hồ sơ đã đủ mục bắt buộc — không có gì để gửi.' }
  }

  const today = new Date().toLocaleDateString('vi-VN')
  const lines: string[] = []
  lines.push('🔔 <b>CẢNH BÁO HỒ SƠ CÁN BỘ CHƯA ĐẦY ĐỦ</b>')
  lines.push(`Văn phòng Sở Xây dựng Quảng Trị · ${today}`)
  lines.push('')
  lines.push(`Hiện có <b>${thieu.length}</b> đồng chí còn thiếu thành phần hồ sơ bắt buộc (biểu QLNS 53 cột).`)
  lines.push('Đề nghị từng đồng chí dưới đây bổ sung các mục còn thiếu:')
  lines.push('')

  thieu.forEach(({ cb, missing }, i) => {
    const phong = cb.toChuc?.ten ?? '—'
    lines.push(`<b>${i + 1}. ${tgEscape(cb.hoTen)}</b> — ${tgEscape(phong)} (thiếu ${missing.length} mục):`)
    for (const m of missing) {
      lines.push(`   • ${tgEscape(m.label)}`)
    }
    lines.push('')
  })

  lines.push('➡️ Đề nghị các đồng chí có tên <b>liên hệ để bổ sung hồ sơ</b>:')
  for (const p of NGUOI_PHU_TRACH) lines.push(`• ${tgEscape(p)}`)

  const text = lines.join('\n')

  try {
    const parts = await sendTelegramMessage(text)
    await logAction({
      userId: user.id,
      action: 'SEND_TELEGRAM_ALERT',
      module: MODULES.OFFICE,
      targetType: 'ho_so_thieu',
      detail: `Gửi cảnh báo ${thieu.length} hồ sơ thiếu qua Telegram (${parts} phần)`,
    })
    return {
      ok: true,
      message: `Đã gửi cảnh báo ${thieu.length} cán bộ thiếu hồ sơ vào nhóm Telegram${parts > 1 ? ` (${parts} tin)` : ''}.`,
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Gửi Telegram thất bại.' }
  }
}
