import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { NextRequest } from 'next/server'

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

    // Không cho xoá tài khoản admin cuối cùng
    const adminCount = await db.user.count({
      where: { role: { name: 'admin' }, isActive: true },
    })
    if (user.role.name === 'admin' && adminCount <= 1) {
      return Response.json({ error: 'Không thể xoá admin cuối cùng' }, { status: 400 })
    }

    const userEmail = user.email
    // Xoá kèm nhật ký hoạt động của chính tài khoản (log cá nhân, FK RESTRICT) rồi xoá tài khoản.
    // Các quan hệ SET NULL (đơn nghỉ phép đã ký, hồ sơ tạo bởi...) tự gỡ liên kết.
    // Nếu còn dữ liệu nghiệp vụ chặn (công việc, kiểm tra, báo cáo, hồ sơ cán bộ...) → báo rõ.
    try {
      await db.$transaction([
        db.chatbotLog.deleteMany({ where: { userId: id } }),
        db.auditLog.deleteMany({ where: { userId: id } }),
        db.user.delete({ where: { id } }),
      ])
    } catch (e) {
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
