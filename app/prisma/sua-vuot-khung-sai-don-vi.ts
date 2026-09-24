// Vá dữ liệu vuotKhung bị ghi nhầm ĐƠN VỊ — cả bảng can_bo (trạng thái hiện hành) LẪN
// office_salary_history (lịch sử từng mốc lương): một số hồ sơ bị ghi PHÂN SỐ kiểu Excel (0.09)
// thay vì SỐ NGUYÊN % (9) mà công thức tính lương (lib/luong.ts tinhLuongThucLinh) dùng — khiến
// tiền phụ cấp thâm niên vượt khung tính sai ~100 lần cho những người này. Phát hiện 24/9/26 từ
// ảnh chụp "% Vượt khung: 0.09" trong hồ sơ cán bộ; kiểm office_salary_history phát hiện thêm 3
// dòng lịch sử cùng lỗi (không phải chỉ do 2 script import Excel — 3/5 người có cả dòng lịch sử
// trùng giá trị sai, có thể do copy tay từ file Excel gốc vào form "Thêm mốc lương" chứ không chỉ
// qua import). Đã vá gốc rễ ở lib/luong.ts (hàm chuanHoaPhanTramVuotKhung), gọi ở MỌI nơi ghi
// vuotKhung (2 action thủ công + 2 import Excel) — script này CHỈ sửa dữ liệu CŨ đã lỡ ghi sai.
//
// QUY TẮC SỬA: theo TT 04/2005/TT-BNV hướng dẫn NĐ 204/2004/NĐ-CP Điều 6, % thâm niên vượt khung
// hợp lệ LUÔN LÀ SỐ NGUYÊN ≥ 5 (5% ở mốc đủ 3 năm/2 năm xếp bậc cuối, +1%/năm sau đó) — KHÔNG BAO
// GIỜ nằm trong khoảng (0, 1). Vì vậy mọi bản ghi có 0 < vuotKhung < 1 chắc chắn là ghi nhầm đơn vị,
// nhân 100 để sửa (0.09 → 9) là đúng và an toàn — không thể vô tình sửa nhầm một giá trị ĐANG ĐÚNG.
//
// Idempotent — chạy lại an toàn (sau lần sửa đầu, không còn bản ghi nào < 1 nữa nên không đổi gì).
// Chạy: node_modules\.bin\jiti.cmd prisma\sua-vuot-khung-sai-don-vi.ts
// Chạy thử trước (không ghi): node_modules\.bin\jiti.cmd prisma\sua-vuot-khung-sai-don-vi.ts --dry-run

import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const DB_URL = process.env.DATABASE_URL
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DB_URL }) } as never)

const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  const canBoSai = await db.canBo.findMany({
    where: { vuotKhung: { gt: 0, lt: 1 } },
    select: { id: true, hoTen: true, cccd: true, vuotKhung: true },
  })
  const lichSuSai = await db.officeSalaryHistory.findMany({
    where: { vuotKhung: { gt: 0, lt: 1 } },
    select: { id: true, vuotKhung: true, ngayHuong: true, canBo: { select: { hoTen: true, cccd: true } } },
  })

  if (canBoSai.length === 0 && lichSuSai.length === 0) {
    console.log('✔ Không còn bản ghi nào có vuotKhung nằm trong khoảng (0, 1) — không có gì để sửa.')
    return
  }

  console.log(`can_bo: ${canBoSai.length} hồ sơ ghi nhầm đơn vị:`)
  for (const cb of canBoSai) console.log(`  - ${cb.hoTen} (CCCD ${cb.cccd}): vuotKhung=${cb.vuotKhung} → ${(cb.vuotKhung as number) * 100}`)
  console.log(`office_salary_history: ${lichSuSai.length} dòng lịch sử ghi nhầm đơn vị:`)
  for (const h of lichSuSai) console.log(`  - ${h.canBo.hoTen} (CCCD ${h.canBo.cccd}), mốc ${h.ngayHuong.toISOString().slice(0, 10)}: vuotKhung=${h.vuotKhung} → ${(h.vuotKhung as number) * 100}`)

  if (DRY_RUN) {
    console.log('\n(--dry-run: CHƯA ghi gì vào CSDL. Bỏ cờ này để sửa thật.)')
    return
  }

  // updateMany với điều kiện "vuotKhung vẫn còn < 1" (không update theo id trần) — nếu ai đó đã
  // sửa/ghi đè bản ghi này giữa lúc SELECT ở trên và lúc chạy transaction, count trả về 0 và ta
  // biết ngay để không đè lên giá trị mới hơn (Codex phản biện chỉ ra rủi ro race này 24/9/26).
  let soDaSuaCanBo = 0, soDaSuaLichSu = 0
  await db.$transaction(async (tx) => {
    for (const cb of canBoSai) {
      const kq = await tx.canBo.updateMany({
        where: { id: cb.id, vuotKhung: { gt: 0, lt: 1 } },
        data: { vuotKhung: (cb.vuotKhung as number) * 100 },
      })
      if (kq.count === 1) soDaSuaCanBo++
      else console.log(`  ⚠ ${cb.hoTen}: giá trị đã đổi từ lúc kiểm tra — BỎ QUA, không ghi đè.`)
    }
    for (const h of lichSuSai) {
      const kq = await tx.officeSalaryHistory.updateMany({
        where: { id: h.id, vuotKhung: { gt: 0, lt: 1 } },
        data: { vuotKhung: (h.vuotKhung as number) * 100 },
      })
      if (kq.count === 1) soDaSuaLichSu++
      else console.log(`  ⚠ dòng lịch sử ${h.id}: giá trị đã đổi từ lúc kiểm tra — BỎ QUA, không ghi đè.`)
    }
  })
  console.log(`\n✔ Đã sửa ${soDaSuaCanBo}/${canBoSai.length} hồ sơ can_bo + ${soDaSuaLichSu}/${lichSuSai.length} dòng office_salary_history.`)

  // Đối chiếu lại ngay — phải ra 0 bản ghi còn sai ở cả 2 bảng
  const [conLaiCanBo, conLaiLichSu] = await Promise.all([
    db.canBo.count({ where: { vuotKhung: { gt: 0, lt: 1 } } }),
    db.officeSalaryHistory.count({ where: { vuotKhung: { gt: 0, lt: 1 } } }),
  ])
  console.log(conLaiCanBo === 0 && conLaiLichSu === 0
    ? '✔ Đối chiếu lại: không còn bản ghi nào sai đơn vị ở cả 2 bảng.'
    : `✖ CẢNH BÁO: còn ${conLaiCanBo} can_bo + ${conLaiLichSu} office_salary_history — kiểm tra tay.`)
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
