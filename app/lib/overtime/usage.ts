import 'server-only'
import { db } from '@/lib/db'
import { sumDayHours, r2, type GioNgay } from './policy'

export type Usage = {
  hours: number   // tổng giờ làm thêm trong năm
  months: number  // số tháng đã có giờ làm thêm (>0) — để tính TB/tháng
}

/**
 * Lũy kế giờ làm thêm trong NĂM theo từng canBoId (gồm mọi bảng của năm) + số
 * tháng đã chấm để tính trung bình/tháng. Dùng cảnh báo trần 200 giờ/người/năm
 * và nhịp trung bình (200 ÷ 12 ≈ 16,7 giờ/tháng).
 */
export async function annualUsageByCanBo(nam: number): Promise<Map<string, Usage>> {
  const rows = await db.overtimeEntry.findMany({
    where: { canBoId: { not: null }, timesheet: { nam } },
    select: { canBoId: true, gioNgay: true, timesheet: { select: { thang: true } } },
  })
  const acc = new Map<string, { hours: number; months: Set<number> }>()
  for (const row of rows) {
    if (!row.canBoId) continue
    const gio = sumDayHours(row.gioNgay as GioNgay)
    const cur = acc.get(row.canBoId) ?? { hours: 0, months: new Set<number>() }
    cur.hours += gio
    if (gio > 0) cur.months.add(row.timesheet.thang)
    acc.set(row.canBoId, cur)
  }
  const out = new Map<string, Usage>()
  for (const [id, v] of acc) out.set(id, { hours: r2(v.hours), months: v.months.size })
  return out
}
