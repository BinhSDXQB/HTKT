import 'server-only'
import { db } from '@/lib/db'
import { getSoToChucIds } from '@/lib/office-scope'
import { classifySalaryAlert } from '@/lib/salary-alert'
import { huongLuongNgachBac } from '@/lib/luong'

/** Tổng hợp số liệu Văn phòng Sở theo năm. Phạm vi: TOÀN BỘ cán bộ thuộc cây tổ chức của Sở. */
export type OfficeSummary = {
  nam: number
  tongCanBo: number
  theoChucDanh: { ten: string; soLuong: number }[]
  canhBaoLuong: { overdue: number; d30: number; d60: number; d90: number }
  quyTrinhNangLuong: Record<string, number>   // theo TrangThaiRaSoatLuong
  khenThuongCount: number
  xepLoai: Record<string, number>             // theo MucXepLoai
  chienSiThiDua: number
  kyLuat: Record<string, number>              // theo HinhThucKyLuat (trong năm)
  vanBanTongCong: number
  vanBanTrongNam: number
}

export async function getOfficeSummary(nam: number): Promise<OfficeSummary> {
  const soIds = await getSoToChucIds()
  const vps = await db.canBo.findMany({
    where: { toChucId: { in: soIds } },
    include: { chucDanh: { select: { ten: true } } },
  })
  const ids = vps.map((c) => c.id)
  const namStart = new Date(nam, 0, 1)
  const namEnd = new Date(nam, 11, 31, 23, 59, 59)

  // Phân theo chức danh
  const chucDanhMap = new Map<string, number>()
  for (const c of vps) {
    const ten = c.chucDanh?.ten ?? c.chucVu ?? 'Chưa phân loại'
    chucDanhMap.set(ten, (chucDanhMap.get(ten) ?? 0) + 1)
  }
  const theoChucDanh = [...chucDanhMap.entries()]
    .map(([ten, soLuong]) => ({ ten, soLuong }))
    .sort((a, b) => b.soLuong - a.soLuong)

  // Cảnh báo nâng lương
  const canhBaoLuong = { overdue: 0, d30: 0, d60: 0, d90: 0 }
  for (const c of vps) {
    if (!huongLuongNgachBac(c)) continue   // NLĐ hợp đồng: không nâng lương ngạch bậc
    const { bucket } = classifySalaryAlert(c.ngayNangLuongKeTiep)
    if (bucket === 'OVERDUE') canhBaoLuong.overdue++
    else if (bucket === 'D30') canhBaoLuong.d30++
    else if (bucket === 'D60') canhBaoLuong.d60++
    else if (bucket === 'D90') canhBaoLuong.d90++
  }

  const empty = { quyTrinhNangLuong: {} as Record<string, number>, xepLoai: {} as Record<string, number>, kyLuat: {} as Record<string, number> }
  if (ids.length === 0) {
    const docCount = await db.officeGeneratedDocument.count()
    return {
      nam, tongCanBo: 0, theoChucDanh, canhBaoLuong,
      ...empty, khenThuongCount: 0, chienSiThiDua: 0,
      vanBanTongCong: docCount, vanBanTrongNam: 0,
    }
  }

  const [reviewByStatus, khenThuongCount, evalByMuc, chienSiThiDua, kyLuatByType, vanBanTongCong, vanBanTrongNam] =
    await Promise.all([
      db.officeSalaryReviewCase.groupBy({ by: ['trangThai'], where: { canBoId: { in: ids }, namRaSoat: nam }, _count: { _all: true } }),
      db.officeRewardRecord.count({ where: { canBoId: { in: ids }, nam } }),
      db.officeAnnualEvaluation.groupBy({ by: ['mucXepLoai'], where: { canBoId: { in: ids }, nam }, _count: { _all: true } }),
      db.officeAnnualEvaluation.count({ where: { canBoId: { in: ids }, nam, laChienSiThiDua: true } }),
      db.officeDisciplineRecord.groupBy({ by: ['hinhThuc'], where: { canBoId: { in: ids }, tuNgay: { gte: namStart, lte: namEnd } }, _count: { _all: true } }),
      db.officeGeneratedDocument.count(),
      db.officeGeneratedDocument.count({ where: { createdAt: { gte: namStart, lte: namEnd } } }),
    ])

  const quyTrinhNangLuong: Record<string, number> = {}
  for (const r of reviewByStatus) quyTrinhNangLuong[r.trangThai] = r._count._all
  const xepLoai: Record<string, number> = {}
  for (const r of evalByMuc) xepLoai[r.mucXepLoai] = r._count._all
  const kyLuat: Record<string, number> = {}
  for (const r of kyLuatByType) kyLuat[r.hinhThuc] = r._count._all

  return {
    nam, tongCanBo: vps.length, theoChucDanh, canhBaoLuong,
    quyTrinhNangLuong, khenThuongCount, xepLoai, chienSiThiDua, kyLuat,
    vanBanTongCong, vanBanTrongNam,
  }
}
