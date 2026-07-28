import pkg from '@prisma/client'
const { PrismaClient } = pkg

const db = new PrismaClient()

async function setupTrungTamBaoTriAdmin() {
  try {
    console.log('=== SETUP TRUNG TÂM BẢO TRÌ ADMIN ===\n')

    // 1. Tìm/update to_chuc TC_BAN_BAO_TRI_GT
    console.log('1. Cập nhật mã số thuế TC_BAN_BAO_TRI_GT...')
    const toChuc = await db.to_chuc.findUnique({
      where: { code: 'TC_BAN_BAO_TRI_GT' },
    })

    if (!toChuc) {
      throw new Error('Không tìm thấy TC_BAN_BAO_TRI_GT trong database')
    }

    console.log(`   Found: ${toChuc.ten} (id: ${toChuc.id})`)

    const updatedToChuc = await db.to_chuc.update({
      where: { id: toChuc.id },
      data: { maSoThue: '3200593560' },
    })
    console.log(`   ✓ Cập nhật MST: ${updatedToChuc.maSoThue}\n`)

    // 2. Tìm hoặc tạo user admin của đơn vị
    console.log('2. Thiết lập user admin Trung tâm Bảo trì...')

    // Tìm kiếm email admin mặc định
    const adminEmail = 'admin-ttbt@htkt.vn'
    let user = await db.user.findUnique({
      where: { email: adminEmail },
    })

    if (!user) {
      console.log(`   Tạo user mới: ${adminEmail}`)

      // Tìm role 'manager' hoặc tạo
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
          name: 'Admin Trung tâm Bảo trì',
          phone: null,
          password: 'default_temp_password_2026', // Cần đổi mật khẩu sau
          isActive: true,
          roleId: managerRole.id,
          toChucId: toChuc.id,
          isDepartmentLeader: true, // Là lãnh đạo đơn vị
        },
      })
      console.log(`   ✓ Tạo user: ${user.email}`)
    } else {
      console.log(`   Found user: ${user.email}`)

      // Update quyền
      user = await db.user.update({
        where: { id: user.id },
        data: {
          toChucId: toChuc.id,
          isDepartmentLeader: true,
        },
      })
      console.log(`   ✓ Cập nhật quyền: isDepartmentLeader = true\n`)
    }

    // 3. Thiết lập quyền quản lý CCCD/thành viên
    console.log('3. Gán quyền quản lý CCCD/thành viên...')

    // Tìm/tạo permissions cho module htkt
    let permHtktMenuAccess = await db.permission.findFirst({
      where: {
        module: 'htkt',
        action: 'menu_access',
      },
    })

    if (!permHtktMenuAccess) {
      permHtktMenuAccess = await db.permission.create({
        data: {
          module: 'htkt',
          action: 'menu_access',
          description: 'Truy cập menu Hạ tầng kỹ thuật',
        },
      })
    }

    // Kiểm tra user role
    const userRole = await db.role.findUnique({
      where: { id: user.roleId },
      include: { permissions: true },
    })

    if (!userRole.permissions.some((p) => p.permissionId === permHtktMenuAccess.id)) {
      await db.role_Permission.create({
        data: {
          roleId: userRole.id,
          permissionId: permHtktMenuAccess.id,
        },
      })
      console.log(`   ✓ Gán quyền: htkt:menu_access`)
    }

    console.log('\n=== KẾT QUẢ ===')
    console.log(`✅ Đơn vị: ${updatedToChuc.ten}`)
    console.log(`✅ Mã số thuế: ${updatedToChuc.maSoThue}`)
    console.log(`✅ Admin: ${user.email}`)
    console.log(`✅ Quyền: Lãnh đạo đơn vị + Menu HTKT`)
    console.log(`\n⚠️  LƯU Ý:`)
    console.log(`   - Mật khẩu tạm: "default_temp_password_2026"`)
    console.log(`   - Cần đổi mật khẩu lần đầu đăng nhập`)
    console.log(`   - Quyền quản lý CCCD thành viên sẽ được set qua UI`)

  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    await db.$disconnect()
  }
}

setupTrungTamBaoTriAdmin()
