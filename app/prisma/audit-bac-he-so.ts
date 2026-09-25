// Audit (chỉ ĐỌC) đối chiếu bậc ↔ hệ số lương của cán bộ đang công tác theo bảng lương chuẩn
// (checkSalaryConsistency ở lib/bang-luong.ts). Không ghi gì vào CSDL.
//
// Chạy: node_modules\.bin\jiti.cmd prisma\audit-bac-he-so.ts [--json]

import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { checkSalaryConsistency } from '../lib/bang-luong'

const DB_URL = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DB_URL }) } as never)

async function main() {
  const ds = await db.canBo.findMany({
    where: { trangThai: 'DANG_CONG_TAC' },
    select: { id: true, hoTen: true, doiTuong: true, loaiHinh: true, maNgach: true, ngachHienHuong: true, bacLuong: true, heSoLuong: true, vuotKhung: true, toChucId: true },
    orderBy: { hoTen: 'asc' },
  })
  const rows = ds.map((cb) => {
    const r = checkSalaryConsistency({ ...cb, heSoLuong: cb.heSoLuong == null ? null : Number(cb.heSoLuong) })
    return { ...cb, heSoLuong: cb.heSoLuong == null ? null : Number(cb.heSoLuong), status: r.status, message: 'message' in r ? r.message : '' }
  })
  if (process.argv.includes('--json')) { console.log(JSON.stringify(rows, null, 1)); return }
  const dem: Record<string, number> = {}
  for (const r of rows) dem[r.status] = (dem[r.status] ?? 0) + 1
  console.log(`Tổng ${rows.length} cán bộ đang công tác:`, dem)
  for (const r of rows.filter((x) => x.status !== 'OK')) {
    console.log(`[${r.status}] ${r.hoTen} | ${r.doiTuong}/${r.loaiHinh} | mã "${r.maNgach ?? ''}" | ngạch "${r.ngachHienHuong ?? ''}" | bậc ${r.bacLuong ?? '—'} | hệ số ${r.heSoLuong ?? '—'} | ${r.message}`)
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
