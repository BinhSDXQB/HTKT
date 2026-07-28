// Xoá hồ sơ cán bộ có trong CSDL từ trước nhưng KHÔNG có trong file QLNS 14.5.2026
// (đối chiếu CCCD cột BA; người trong file chưa có CCCD thì đối chiếu theo họ tên).
// Sao lưu JSON vào backups/ trước khi xoá. Tài khoản đăng nhập gắn kèm bị vô hiệu hoá.
// Chạy: node_modules\.bin\jiti.cmd prisma\xoa-can-bo-ngoai-file.ts

import * as fs from 'fs'
import * as xlsx from 'xlsx'
import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const FILE = 'C:/QLNS - SXD QUANG TRI (mới gửi 14.5.26)s.xlsx'
const DB_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:Postgres%402025@localhost:5432/ql_htkt'
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DB_URL }) } as never)

function normName(s: string): string {
  return s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()
}
function normCccd(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.length === 11 && !digits.startsWith('0') ? '0' + digits : digits
}

async function main() {
  // 1) Đọc cột BA + tên từ file
  const ws = xlsx.readFile(FILE).Sheets['DS SXD']
  const range = xlsx.utils.decode_range(ws['!ref'] as string)
  const fileCccds = new Set<string>()
  const fileNames = new Set<string>()
  for (let r = 2; r <= range.e.r; r++) {
    const c = ws[`C${r + 1}`]?.v != null ? String(ws[`C${r + 1}`].v).trim() : ''
    const b = ws[`B${r + 1}`]?.v != null ? String(ws[`B${r + 1}`].v).trim() : ''
    if (!c || normName(c) === 'hết') continue
    if (/^[ivxlcdm]+$/i.test(b) && !/^\d+$/.test(b)) continue // dòng tiêu mục
    fileNames.add(normName(c))
    const ba = ws[`BA${r + 1}`]?.v != null ? normCccd(String(ws[`BA${r + 1}`].v)) : ''
    if (ba) fileCccds.add(ba)
  }
  console.log(`File: ${fileCccds.size} CCCD (cột BA), ${fileNames.size} họ tên`)

  // 2) Tìm người trong CSDL không có trong file
  const all = await db.canBo.findMany({ include: { user: { select: { id: true, email: true, isActive: true } } } })
  const xoa = all.filter((cb) => !fileCccds.has(cb.cccd) && !fileNames.has(normName(cb.hoTen)))

  if (xoa.length === 0) {
    console.log('Không có hồ sơ nào ngoài file — không xoá gì.')
    return
  }
  console.log(`\nSẽ xoá ${xoa.length} hồ sơ không có trong cột BA của file:`)
  for (const cb of xoa) console.log(`  • ${cb.hoTen} (${cb.cccd}) — ${cb.phongBan ?? ''}${cb.user ? ` [tài khoản ${cb.user.email} → vô hiệu hoá]` : ''}`)

  // 3) Sao lưu
  const backupPath = `c:/Troly/HTKT/backups/can_bo_xoa_${new Date().toISOString().slice(0, 10)}.json`
  fs.writeFileSync(backupPath, JSON.stringify(xoa, null, 1), 'utf8')
  console.log(`\nĐã sao lưu: ${backupPath}`)

  // 4) Xoá (quan hệ con cascade) + vô hiệu hoá tài khoản
  let ok = 0
  for (const cb of xoa) {
    try {
      await db.canBo.delete({ where: { id: cb.id } })
      if (cb.user) await db.user.update({ where: { id: cb.user.id }, data: { isActive: false } })
      ok++
    } catch (e) {
      console.error(`  ✖ Không xoá được ${cb.hoTen}: ${(e as Error).message.split('\n')[0]}`)
    }
  }
  console.log(`\nĐã xoá ${ok}/${xoa.length}. Còn lại trong CSDL: ${await db.canBo.count()} cán bộ.`)
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
