import 'server-only'
import { db } from '@/lib/db'

/**
 * Định mức nghỉ phép năm — Điều 113, 114 Bộ luật Lao động 2019.
 *
 *  - Làm đủ 12 tháng: 12 ngày phép/năm (điều kiện bình thường).
 *  - Cứ đủ 5 năm làm việc cho một cơ quan: +1 ngày  → 12 + ⌊số_năm/5⌋.
 *  - Chưa đủ 12 tháng: theo tỷ lệ tháng làm việc (12 ngày / 12 tháng = 1 ngày/tháng).
 *
 * Mốc tính thâm niên (ưu tiên theo thứ tự):
 * 1. ngayVaoCongChucCoQuanNN (Ngày vào công chức, cơ quan NN) - dữ liệu chính thức từ QLNS
 * 2. Ngày SỚM NHẤT trong Quá trình công tác (office_work_history)
 * 3. ngayVaoBienChe (fallback cuối cùng)
 */

export const PHEP_NAM_CO_BAN = 12

/** Định mức ngày phép theo số tháng làm việc. */
export function annualQuota(months: number): number {
  if (months <= 0) return 0
  if (months < 12) return Math.round((PHEP_NAM_CO_BAN * months) / 12) // theo tỷ lệ tháng
  const fullYears = Math.floor(months / 12)
  const thamNienBonus = Math.floor(fullYears / 5) // +1 ngày mỗi đủ 5 năm
  return PHEP_NAM_CO_BAN + thamNienBonus
}

/** Các trạng thái coi như đơn phép năm ĐÃ ĐƯỢC chấp thuận (trừ vào định mức). */
const TRANG_THAI_DA_NGHI = ['CHO_VAN_PHONG', 'CHO_TAI_CHINH', 'HOAN_TAT', 'DA_DUYET'] as const

export type LeaveBalance = {
  mocVaoLam: Date | null
  soThang: number
  dinhMuc: number
  daNghi: number
  conLai: number
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

/** Tính định mức + đã nghỉ + còn lại của phép năm cho 1 cán bộ trong 1 năm. */
export async function getLeaveBalance(canBoId: string, year: number): Promise<LeaveBalance> {
  const [firstWork, canBo, daNghiAgg] = await Promise.all([
    db.officeWorkHistory.findFirst({
      where: { canBoId },
      orderBy: { tuNgay: 'asc' },
      select: { tuNgay: true },
    }),
    db.canBo.findUnique({
      where: { id: canBoId },
      select: { ngayVaoCongChucCoQuanNN: true, ngayVaoBienChe: true },
    }),
    db.officeLeaveRequest.aggregate({
      where: {
        canBoId,
        loaiNghi: 'PHEP_NAM',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        trangThai: { in: TRANG_THAI_DA_NGHI as any },
        tuNgay: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59) },
      },
      _sum: { soNgay: true },
    }),
  ])

  // Ưu tiên: ngayVaoCongChucCoQuanNN > firstWork.tuNgay > ngayVaoBienChe
  const mocVaoLam =
    canBo?.ngayVaoCongChucCoQuanNN ?? firstWork?.tuNgay ?? canBo?.ngayVaoBienChe ?? null
  // Thâm niên tính đến hết năm xét (hoặc hôm nay nếu là năm hiện tại)
  const refDate = year < new Date().getFullYear() ? new Date(year, 11, 31) : new Date()
  const soThang = mocVaoLam ? Math.max(0, monthsBetween(mocVaoLam, refDate)) : 0
  const dinhMuc = mocVaoLam ? annualQuota(soThang) : 0
  const daNghi = daNghiAgg._sum.soNgay ?? 0
  const conLai = Math.max(0, dinhMuc - daNghi)

  return { mocVaoLam, soThang, dinhMuc, daNghi, conLai }
}
