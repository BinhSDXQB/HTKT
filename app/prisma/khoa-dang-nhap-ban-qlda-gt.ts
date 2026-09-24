// Ban QLDA Đầu tư xây dựng công trình giao thông (Ban QLDA GT, id tc_ban_qlda_gt) đã chuyển
// thành ban trực thuộc UBND tỉnh — không còn thuộc Sở Xây dựng. Khoá đăng nhập tài khoản
// gắn với đơn vị này (users.isActive=false) và đánh dấu đơn vị ngừng hoạt động trong hệ thống
// (to_chuc.isActive=false) — GIỮ NGUYÊN toàn bộ hồ sơ can_bo để còn theo dõi/tra cứu lịch sử.
// Không xoá bất kỳ bản ghi nào (can_bo, users, phan_cong đều giữ nguyên, chỉ đổi isActive).
// Idempotent — chạy lại an toàn.
// Chạy: node_modules\.bin\jiti.cmd prisma\khoa-dang-nhap-ban-qlda-gt.ts

import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const DB_URL = process.env.DATABASE_URL
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DB_URL }) } as never)

const TO_CHUC_ID = 'tc_ban_qlda_gt'
const SO_NGUOI_DU_KIEN = 4 // đối chiếu khảo sát 24/9/2026 — lệch số này thì dừng, kiểm tra tay

async function main() {
  const toChuc = await db.toChuc.findUnique({ where: { id: TO_CHUC_ID } })
  if (!toChuc) {
    console.log(`✖ Không tìm thấy to_chuc id "${TO_CHUC_ID}" — dừng, không đổi gì.`)
    return
  }
  console.log(`Đơn vị: ${toChuc.ten} (${toChuc.ma}), isActive hiện tại: ${toChuc.isActive}`)

  const canBos = await db.canBo.findMany({
    where: { toChucId: TO_CHUC_ID },
    select: { id: true, hoTen: true, cccd: true, userId: true },
  })
  console.log(`Có ${canBos.length} cán bộ thuộc đơn vị:`)
  for (const cb of canBos) console.log(`  - ${cb.hoTen} (CCCD ${cb.cccd})`)

  const users = await db.user.findMany({
    where: { toChucId: TO_CHUC_ID },
    select: { id: true, email: true, name: true, isActive: true },
  })
  console.log(`\nCó ${users.length} tài khoản gắn với đơn vị:`)
  for (const u of users) console.log(`  - ${u.name} (${u.email}), isActive hiện tại: ${u.isActive}`)

  if (users.length !== SO_NGUOI_DU_KIEN) {
    console.log(`\n✖ Số tài khoản (${users.length}) khác dự kiến (${SO_NGUOI_DU_KIEN}) — DỪNG, kiểm tra tay trước khi chạy lại.`)
    process.exitCode = 1
    return
  }

  // Chặn khoá nhầm người đang KIÊM NHIỆM ở đơn vị khác còn hoạt động (PhanCong.denNgay=null
  // + toChuc.isActive=true) — khoá tài khoản của họ sẽ chặn cả công việc họ vẫn đang làm.
  const canBoIds = canBos.map((cb) => cb.id)
  const kiemNhiemConHoatDong = await db.phanCong.findMany({
    where: {
      canBoId: { in: canBoIds },
      denNgay: null,
      toChucId: { not: TO_CHUC_ID },
      toChuc: { isActive: true },
    },
    select: { canBoId: true, toChuc: { select: { ten: true } } },
  })
  if (kiemNhiemConHoatDong.length > 0) {
    console.log(`\n✖ Phát hiện ${kiemNhiemConHoatDong.length} phân công kiêm nhiệm còn hoạt động ở đơn vị khác — DỪNG:`)
    for (const k of kiemNhiemConHoatDong) console.log(`  - canBoId ${k.canBoId} vẫn kiêm nhiệm tại ${k.toChuc.ten}`)
    process.exitCode = 1
    return
  }
  console.log(`\n✔ Không ai trong ${canBos.length} người kiêm nhiệm ở đơn vị khác còn hoạt động — an toàn để khoá.`)

  const [ketQuaUser] = await db.$transaction([
    db.user.updateMany({ where: { toChucId: TO_CHUC_ID, isActive: true }, data: { isActive: false } }),
    ...(toChuc.isActive ? [db.toChuc.update({ where: { id: TO_CHUC_ID }, data: { isActive: false } })] : []),
  ])
  console.log(`\n✔ Đã khoá ${ketQuaUser.count} tài khoản (isActive=false).`)
  console.log(toChuc.isActive
    ? `✔ Đã đánh dấu đơn vị "${toChuc.ten}" ngừng hoạt động (isActive=false).`
    : `(Đơn vị đã isActive=false từ trước — không đổi gì.)`)

  console.log(`\n${canBos.length} hồ sơ can_bo GIỮ NGUYÊN (không xoá, không đổi trường nào) để theo dõi nhân sự lịch sử.`)
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
