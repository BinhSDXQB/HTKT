#!/usr/bin/env node

/**
 * Setup Trung tâm Bảo trì: MST + Admin user
 * Usage: node scripts/setup-trung-tam-bao-tri.mjs
 */

import { PrismaClient } from '../lib/generated/prisma/index.js'

const db = new PrismaClient()

async function main() {
  console.log('=== SETUP TRUNG TÂM BẢO TRÌ GIA O THÔNG VÀ HẠ TẦNG KỸ THUẬT ===\n')

  try {
    // 1. Find TC_BAN_BAO_TRI_GT
    console.log('1️⃣ Tìm Trung tâm...')
    const ttbt = await db.toChuc.findFirst({
      where: { ma: 'TC_BAN_BAO_TRI_GT' },
    })

    if (!ttbt) {
      console.error('❌ Không tìm thấy TC_BAN_BAO_TRI_GT')
      process.exit(1)
    }

    console.log(`✓ Tìm thấy: ${ttbt.ten} (ID: ${ttbt.id})`)

    // 2. Update MST
    console.log('\n2️⃣ Cập nhật MST...')
    const MST = '3200593560'
    const updatedTtbt = await db.toChuc.update({
      where: { id: ttbt.id },
      data: { maSoThue: MST },
    })
    console.log(`✓ MST cập nhật: ${updatedTtbt.maSoThue}`)

    // 3. Create/update admin user
    console.log('\n3️⃣ Cài đặt admin user...')
    const adminEmail = 'admin-ttbt@htkt.vn'
    const adminName = 'Admin Trung tâm Bảo trì'

    let user = await db.user.findUnique({
      where: { email: adminEmail },
    })

    if (!user) {
      // Tìm hoặc tạo role manager
      let managerRole = await db.role.findFirst({
        where: { name: 'manager' },
      })

      if (!managerRole) {
        managerRole = await db.role.create({
          data: {
            name: 'manager',
            displayName: 'Quản lý đơn vị',
            description: 'Quản lý toàn bộ hoạt động của đơn vị',
            isSystem: false,
          },
        })
        console.log(`✓ Role 'manager' tạo mới`)
      }

      user = await db.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: 'Admin@2026!Truongam',
          isActive: true,
          roleId: managerRole.id,
          toChucId: ttbt.id,
          isDepartmentLeader: true,
        },
      })
      console.log(`✓ Admin user tạo mới: ${user.email}`)
    } else {
      // Update existing
      user = await db.user.update({
        where: { id: user.id },
        data: {
          toChucId: ttbt.id,
          isDepartmentLeader: true,
          isActive: true,
        },
      })
      console.log(`✓ Admin user cập nhật: ${user.email}`)
    }

    // 4. Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ SETUP HOÀN TẤT\n')
    console.log(`Đơn vị: ${updatedTtbt.ten}`)
    console.log(`MST: ${updatedTtbt.maSoThue}`)
    console.log(`Admin email: ${user.email}`)
    console.log(`Admin name: ${user.name}`)
    console.log(`Department Leader: ${user.isDepartmentLeader ? 'Có ✓' : 'Không'}`)
    console.log(`\n⚠️  Mật khẩu tạm: Admin@2026!Truongam`)
    console.log('💡 Admin cần đổi mật khẩu lần đầu đăng nhập')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Lỗi:', error.message)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
