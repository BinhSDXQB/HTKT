// Vá 8 hồ sơ NGƯỜI LAO ĐỘNG (loaiHinh HĐ111) bị ghi LƯƠNG KHOÁN THÁNG theo đơn vị "triệu đồng"
// (vd "10" = 10 triệu) thay vì ĐỒNG NGUYÊN như quy ước hệ thống thực sự dùng — xác nhận qua đối
// chiếu: can_bo.heSoLuong của 2 người khác cùng nhóm NGUOI_LAO_DONG (Hoàng Ngọc Linh 8.500.000,
// Phan Thị Tâm 3.500.000) đã lưu ĐÚNG bằng đồng nguyên, và lib/luong.ts hàm fmtVND()
// (`Math.round(n).toLocaleString('vi-VN') + 'đ'`) — dùng ở trang van-phong-so/luong — LUÔN coi
// heSoLuong của NLĐ là đồng nguyên, không nhân gì thêm. Vì vậy 8 người dưới đây trước khi sửa bị
// hiển thị lương tháng vô lý kiểu "10đ" thay vì "10.000.000đ".
//
// Phát hiện 24/9/26 khi rà soát toàn bộ số liệu heSoLuong sau vụ vá % vượt khung; GIÁ TRỊ ĐÚNG do
// người dùng trực tiếp xác nhận qua đối chiếu hồ sơ/hợp đồng gốc (không suy đoán) — KHÁC vụ vượt
// khung (quy tắc số học suy được từ văn bản pháp luật), nên KHÔNG viết quy tắc chung tự động áp
// dụng cho bản ghi khác — chỉ sửa ĐÚNG 8 id đã xác nhận, có đối chiếu giá trị CŨ trước khi ghi để
// không vô tình đè lên dữ liệu đã đổi khác từ lúc xác nhận.
//
// Idempotent — chạy lại an toàn (giá trị đã đúng thì oldValue không khớp nữa, tự bỏ qua).
// Chạy: node_modules\.bin\jiti.cmd prisma\sua-luong-khoan-hd111.ts
// Chạy thử trước (không ghi): node_modules\.bin\jiti.cmd prisma\sua-luong-khoan-hd111.ts --dry-run

import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

// Ưu tiên kết nối trực tiếp (không qua pooler) — script chỉ chạy vài lần, ghi rất ít bản ghi.
const DB_URL = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DB_URL }) } as never)

const DRY_RUN = process.argv.includes('--dry-run')

// id lấy từ truy vấn CSDL trực tiếp 24/9/26 — oldValue là giá trị đã xác nhận SAI (triệu đồng),
// newValue là giá trị ĐÚNG (đồng nguyên) do người dùng xác nhận.
const SUA: { id: string; hoTen: string; cccd: string; oldValue: number; newValue: number }[] = [
  { id: 'cmprqtoyu002ccgumvtpi66p8', hoTen: 'Nguyễn Giang Trường',    cccd: '044073003748', oldValue: 10,    newValue: 10_000_000 },
  { id: 'cmprqtond000ycgumlmuruh8g', hoTen: 'Lê Đức Thọ',             cccd: '044073002344', oldValue: 10,    newValue: 10_000_000 },
  { id: 'cmprqtov6001tcgumbntn1bxn', hoTen: 'Phạm Trường An',         cccd: '044089002032', oldValue: 7.5,   newValue: 7_500_000 },
  { id: 'cmprqtotd001rcgumqiuxfafw', hoTen: 'Đặng Thị Phương Thảo',   cccd: '044191000736', oldValue: 7,     newValue: 7_000_000 },
  { id: 'cmprqtoy30026cgumiq7xlsb0', hoTen: 'Nguyễn Thị Kiều Trang',  cccd: '044190008233', oldValue: 6.5,   newValue: 6_500_000 },
  { id: 'cmprqtoer000bcgum1hs961kg', hoTen: 'Trương Thị Bảo',         cccd: '044187011334', oldValue: 8.503, newValue: 8_503_000 },
  { id: 'cmprqtohl000dcgumuhzdeegb', hoTen: 'Trần Văn Hùng',          cccd: '045075005424', oldValue: 9.009, newValue: 9_009_000 },
  { id: 'cmprqtp6j003acgumd89f9gj4', hoTen: 'Dương Ngọc Lan Anh',     cccd: '046188000142', oldValue: 6.942, newValue: 6_942_000 },
]

async function main() {
  const canSua: typeof SUA = []
  for (const s of SUA) {
    const cb = await db.canBo.findUnique({
      where: { id: s.id },
      select: { hoTen: true, cccd: true, heSoLuong: true, doiTuong: true, loaiHinh: true },
    })
    if (!cb) { console.log(`  ⚠ ${s.hoTen}: không tìm thấy id ${s.id} — BỎ QUA`); continue }
    if (cb.cccd !== s.cccd || cb.hoTen !== s.hoTen) {
      console.log(`  ⚠ ${s.hoTen}: id ${s.id} nay là "${cb.hoTen}" (CCCD ${cb.cccd}) — LỆCH so với lúc xác nhận, BỎ QUA để an toàn`)
      continue
    }
    if (cb.doiTuong !== 'NGUOI_LAO_DONG' || cb.loaiHinh !== 'HĐ111') {
      console.log(`  ⚠ ${s.hoTen}: doiTuong/loaiHinh nay là "${cb.doiTuong}"/"${cb.loaiHinh}" — LỆCH so với lúc xác nhận (NGUOI_LAO_DONG/HĐ111), BỎ QUA để an toàn`)
      continue
    }
    if (cb.heSoLuong !== s.oldValue) {
      console.log(`  ⚠ ${s.hoTen}: heSoLuong hiện tại = ${cb.heSoLuong}, khác giá trị đã xác nhận sai (${s.oldValue}) — có thể đã được sửa/đổi rồi, BỎ QUA`)
      continue
    }
    canSua.push(s)
  }

  if (canSua.length === 0) {
    console.log('✔ Không còn hồ sơ nào khớp giá trị cũ đã xác nhận sai — không có gì để sửa.')
    return
  }

  console.log(`Sẽ sửa ${canSua.length}/${SUA.length} hồ sơ:`)
  for (const s of canSua) console.log(`  - ${s.hoTen} (CCCD ${s.cccd}): heSoLuong=${s.oldValue} → ${s.newValue.toLocaleString('vi-VN')}`)

  if (DRY_RUN) {
    console.log('\n(--dry-run: CHƯA ghi gì vào CSDL. Bỏ cờ này để sửa thật.)')
    return
  }

  let soDaSua = 0
  await db.$transaction(async (tx) => {
    for (const s of canSua) {
      const kq = await tx.canBo.updateMany({
        // Khoá đủ danh tính (không chỉ id) — chống ghi nhầm nếu id bị tái dùng hoặc hồ sơ đã đổi
        // doiTuong/loaiHinh/tên/CCCD từ lúc kiểm tra ở trên tới lúc ghi (Codex rà chốt 24/9/26).
        where: { id: s.id, cccd: s.cccd, hoTen: s.hoTen, doiTuong: 'NGUOI_LAO_DONG', loaiHinh: 'HĐ111', heSoLuong: s.oldValue },
        data: { heSoLuong: s.newValue },
      })
      if (kq.count === 1) soDaSua++
      else console.log(`  ⚠ ${s.hoTen}: giá trị đã đổi từ lúc kiểm tra — BỎ QUA, không ghi đè.`)
    }
  })
  console.log(`\n✔ Đã sửa ${soDaSua}/${canSua.length} hồ sơ.`)

  const kiemLai = await db.canBo.findMany({
    where: { id: { in: canSua.map((s) => s.id) } },
    select: { hoTen: true, heSoLuong: true },
  })
  console.log('\nĐối chiếu lại sau khi sửa:')
  for (const cb of kiemLai) console.log(`  - ${cb.hoTen}: heSoLuong = ${cb.heSoLuong?.toLocaleString('vi-VN')}`)
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
