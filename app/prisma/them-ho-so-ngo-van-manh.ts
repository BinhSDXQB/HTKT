// Ngo Van Manh (tai khoan CCCD 044084004455, thuoc Trung tam Quan ly bao tri giao thong va
// ha tang ky thuat) dang nhap duoc nhung CHUA co ho so can_bo - phat hien khi ra soat trang
// Nguoi dung 24/9/2026. Nguoi dung xac nhan truc tiep anh thuoc Trung tam bao tri.
// Tao ho so toi thieu (cccd + ho ten + don vi), lien ket voi tai khoan dang co san qua userId.
// Cac truong con lai (chuc vu, ngay sinh, he so luong...) de trong, bo sung sau qua
// "Van phong So -> Ho so -> Sua". Idempotent - chay lai an toan (khong tao trung).
// Chay: node_modules\.bin\jiti.cmd prisma\them-ho-so-ngo-van-manh.ts

import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const DB_URL = process.env.DATABASE_URL
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DB_URL }) } as never)

const CCCD = '044084004455'
const USER_ID = 'cmt18bzbj000cooumum5wl9vl'
const TO_CHUC_ID = 'tc_ban_bao_tri_gt'

async function main() {
  const daCo = await db.canBo.findUnique({ where: { cccd: CCCD } })
  if (daCo) {
    console.log(`✔ Đã có hồ sơ can_bo cho CCCD ${CCCD} (${daCo.hoTen}) — không tạo trùng.`)
    return
  }

  const user = await db.user.findUnique({ where: { id: USER_ID } })
  if (!user) {
    console.log(`✖ Không tìm thấy user id ${USER_ID} — dừng.`)
    return
  }

  const cb = await db.canBo.create({
    data: {
      cccd: CCCD,
      hoTen: user.name,
      toChucId: TO_CHUC_ID,
      userId: USER_ID,
    },
  })
  console.log(`✔ Đã tạo hồ sơ can_bo: ${cb.hoTen} (CCCD ${cb.cccd}), đơn vị Trung tâm bảo trì, liên kết user ${USER_ID}.`)
  console.log('  Còn thiếu: chức vụ, ngày sinh, hệ số lương... — bổ sung qua Văn phòng Sở → Hồ sơ → Sửa.')
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
