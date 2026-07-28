import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/setup-trung-tam-bao-tri
 * Setup Trung tâm Bảo trì: maSoThue + admin user
 *
 * Body: { maSoThue: "3200593560", adminEmail: "admin-ttbt@htkt.vn", adminName: "Admin Trung tâm" }
 */
export async function POST(req: Request) {
  try {
    const { maSoThue = '3200593560', adminEmail = 'admin-ttbt@htkt.vn', adminName = 'Admin Trung tâm Bảo trì' } = await req.json()

    console.log('=== SETUP TRUNG TÂM BẢO TRÌ ===')

    // 1. Tìm ToChuc TC_BAN_BAO_TRI_GT
    const toChuc = await db.toChuc.findFirst({
      where: { ma: 'TC_BAN_BAO_TRI_GT' },
    })

    if (!toChuc) {
      return NextResponse.json(
        { error: 'Không tìm thấy TC_BAN_BAO_TRI_GT' },
        { status: 404 }
      )
    }

    console.log(`Found: ${toChuc.ten} (id: ${toChuc.id})`)

    // 2. Update maSoThue (nếu schema không có cột, sẽ lỗi)
    let updatedToChuc = toChuc
    try {
      updatedToChuc = await db.toChuc.update({
        where: { id: toChuc.id },
        data: { maSoThue },
      })
      console.log(`Updated MST: ${updatedToChuc.maSoThue}`)
    } catch (err) {
      console.log(`(Schema chưa có maSoThue, skip update)`)
    }

    // 3. Tạo/update user admin
    let user = await db.user.findUnique({
      where: { email: adminEmail },
    })

    if (!user) {
      // Tạo role manager nếu chưa có
      let managerRole = await db.role.findFirst({
        where: { name: 'manager' },
      })

      if (!managerRole) {
        managerRole = await db.role.create({
          data: {
            name: 'manager',
            displayName: 'Quản lý đơn vị',
            description: 'Quản lý cấp đơn vị',
            isSystem: false,
          },
        })
      }

      user = await db.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          phone: null,
          password: 'temp_2026_change_password', // temp, user phải đổi lần đầu
          isActive: true,
          roleId: managerRole.id,
          toChucId: toChuc.id,
          isDepartmentLeader: true,
        },
      })
      console.log(`Created user: ${user.email}`)
    } else {
      // Update user
      user = await db.user.update({
        where: { id: user.id },
        data: {
          toChucId: toChuc.id,
          isDepartmentLeader: true,
        },
      })
      console.log(`Updated user: ${user.email}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Setup hoàn tất',
      data: {
        toChuc: {
          id: toChuc.id,
          ten: toChuc.ten,
          ma: toChuc.ma,
          maSoThue: updatedToChuc.maSoThue || 'Chưa update (schema cần migration)',
        },
        admin: {
          email: user.email,
          name: user.name,
          isDepartmentLeader: user.isDepartmentLeader,
          note: 'Tài khoản tạm, cần đổi mật khẩu lần đầu đăng nhập',
        },
      },
    })
  } catch (err) {
    console.error('Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
