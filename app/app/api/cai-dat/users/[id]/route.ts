import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { NextRequest } from 'next/server'

// Khoá/mở khoá đăng nhập (isActive) — hành động CHÍNH khi cần loại 1 tài khoản khỏi hệ
// thống (đơn vị chuyển đi, nghỉ việc...): giữ nguyên toàn bộ dữ liệu, chỉ chặn đăng nhập.
// Ưu tiên dùng cách này thay vì DELETE (xoá cứng) bên dưới — xem lib/ten-dang-nhap.ts.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const admin = await requireAuth()
    if (admin.role?.name !== 'admin') {
      return Response.json({ error: 'Chỉ admin mới có quyền khoá/mở khoá tài khoản' }, { status: 403 })
    }

    const user = await db.user.findUnique({ where: { id }, include: { role: { select: { name: true } } } })
    if (!user) return Response.json({ error: 'Người dùng không tồn tại' }, { status: 404 })

    const muonKhoa = user.isActive // đang bật -> hành động là khoá; đang khoá -> hành động là mở

    // Kiểm tra "admin cuối cùng" + cập nhật trong CÙNG 1 transaction — tránh race condition
    // khi 2 yêu cầu khoá/xoá admin chạy gần như đồng thời (mỗi yêu cầu đọc count() riêng
    // rồi mới ghi, có thể cùng thấy adminCount=2 và cùng được phép, còn lại 0 admin active).
    let updated
    try {
      updated = await db.$transaction(async (tx) => {
        if (muonKhoa && user.role.name === 'admin') {
          const adminCount = await tx.user.count({ where: { role: { name: 'admin' }, isActive: true } })
          if (adminCount <= 1) throw new Error('LAST_ADMIN')
        }
        return tx.user.update({ where: { id }, data: { isActive: !muonKhoa } })
      })
    } catch (e) {
      if ((e as Error)?.message === 'LAST_ADMIN') {
        return Response.json({ error: 'Không thể khoá admin cuối cùng' }, { status: 400 })
      }
      throw e
    }
    await logAction({
      userId: admin.id,
      action: 'UPDATE',
      module: 'admin',
      targetId: user.id,
      targetType: 'User',
      detail: `${muonKhoa ? 'Khoá' : 'Mở khoá'} tài khoản: ${user.email}`,
    })

    return Response.json({ ok: true, isActive: updated.isActive })
  } catch (err) {
    console.error('[PATCH /api/cai-dat/users/[id]]', err)
    return Response.json({ error: 'Lỗi khoá/mở khoá người dùng' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const admin = await requireAuth()

    // Kiểm tra quyền - chỉ admin
    if (admin.role?.name !== 'admin') {
      return Response.json({ error: 'Chỉ admin mới có quyền xoá tài khoản' }, { status: 403 })
    }

    const user = await db.user.findUnique({ where: { id }, include: { role: { select: { name: true } } } })
    if (!user) {
      return Response.json({ error: 'Người dùng không tồn tại' }, { status: 404 })
    }

    const userEmail = user.email
    // Kiểm tra "admin cuối cùng" NẰM TRONG transaction xoá (không tách round-trip riêng)
    // để tránh race condition với các yêu cầu khoá/xoá admin khác chạy gần như đồng thời.
    // Xoá kèm nhật ký hoạt động của chính tài khoản (log cá nhân, FK RESTRICT) rồi xoá tài khoản.
    // Các quan hệ SET NULL (đơn nghỉ phép đã ký, hồ sơ tạo bởi...) tự gỡ liên kết.
    // Nếu còn dữ liệu nghiệp vụ chặn (công việc, kiểm tra, báo cáo, hồ sơ cán bộ...) → báo rõ.
    try {
      await db.$transaction(async (tx) => {
        if (user.role.name === 'admin') {
          const adminCount = await tx.user.count({ where: { role: { name: 'admin' }, isActive: true } })
          if (adminCount <= 1) throw new Error('LAST_ADMIN')
        }
        await tx.chatbotLog.deleteMany({ where: { userId: id } })
        await tx.auditLog.deleteMany({ where: { userId: id } })
        await tx.user.delete({ where: { id } })
      })
    } catch (e) {
      if ((e as Error)?.message === 'LAST_ADMIN') {
        return Response.json({ error: 'Không thể xoá admin cuối cùng' }, { status: 400 })
      }
      if ((e as { code?: string })?.code === 'P2003') {
        return Response.json({
          error: 'Không thể xoá: tài khoản còn gắn dữ liệu nghiệp vụ (công việc, phiếu kiểm tra, báo cáo, hồ sơ cán bộ…). Hãy chuyển/gỡ các dữ liệu này trước, hoặc khoá (vô hiệu hoá) tài khoản thay vì xoá.',
        }, { status: 409 })
      }
      throw e
    }

    await logAction({
      userId: admin.id,
      action: 'DELETE',
      module: 'admin',
      targetId: user.id,
      targetType: 'User',
      detail: `Xoá tài khoản: ${userEmail}`,
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/cai-dat/users/[id]]', err)
    return Response.json({ error: 'Lỗi xoá người dùng' }, { status: 500 })
  }
}
