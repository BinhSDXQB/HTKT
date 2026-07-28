import 'server-only'

import { unstable_cache } from 'next/cache'
import { db } from './db'
import { getSoToChucIds } from './office-scope'
import { missingRequiredChoCanhBao } from './ho-so-alert'
import { checkSalaryConsistency } from './bang-luong'
import { classifyRetireAlert } from './nghi-huu-alert'
import { classifySalaryAlert } from './salary-alert'
import { huongLuongNgachBac } from './luong'
import { classifyContractAlert } from './hop-dong-alert'
import { tinhNgayNghiHuu } from './nghi-huu'

// Đếm SỐ NGƯỜI cần xử lý (có ≥1 cảnh báo) — khớp các nhóm ở trang
// /dashboard/van-phong-so/canh-bao. Chỉ 1 query + lọc bằng hàm thuần (≈157 cán bộ).
async function computeCount(includeSensitive: boolean): Promise<number> {
  const soIds = await getSoToChucIds()
  const list = await db.canBo.findMany({
    where: { toChucId: { in: soIds }, trangThai: { in: ['DANG_CONG_TAC', 'HOP_DONG'] } },
  })

  let n = 0
  for (const cb of list) {
    const veHuu = cb.ngayVeHuu ?? tinhNgayNghiHuu(cb.ngaySinh, cb.gioiTinh as 'NAM' | 'NU' | null)
    const flagged =
      // Thiếu giấy tờ hồ sơ cá nhân cần bổ sung
      missingRequiredChoCanhBao(cb).length > 0 ||
      // CC/VC chưa gán vị trí việc làm
      ((cb.doiTuong === 'CONG_CHUC' || cb.doiTuong === 'VIEN_CHUC') && !cb.viTriViecLam?.trim()) ||
      // Sắp nghỉ hưu (không tính NLĐ hợp đồng)
      (cb.doiTuong !== 'NGUOI_LAO_DONG' && classifyRetireAlert(veHuu).bucket !== null) ||
      // Sắp đến hạn nâng lương (chỉ người hưởng lương ngạch bậc)
      (huongLuongNgachBac(cb) && classifySalaryAlert(cb.ngayNangLuongKeTiep).bucket !== null) ||
      // Sắp hết hạn hợp đồng
      classifyContractAlert(cb.ngayKetThucHopDong).bucket !== null ||
      // CCCD chưa hợp lệ
      cb.cccd.startsWith('TAM-') || !/^\d{12}$/.test(cb.cccd) ||
      // Chưa có tài khoản đăng nhập
      !cb.userId ||
      // Sai lương (chỉ với người được xem dữ liệu nhạy cảm)
      (includeSensitive && ['MISMATCH', 'BAC_OUT_OF_RANGE'].includes(checkSalaryConsistency(cb).status))

    if (flagged) n++
  }
  return n
}

// Cache 5 phút để không tính lại mỗi lần tải trang (badge chuông không cần realtime tuyệt đối).
export function getCanhBaoCount(includeSensitive: boolean): Promise<number> {
  return unstable_cache(
    () => computeCount(includeSensitive),
    ['canh-bao-count', String(includeSensitive)],
    { revalidate: 300, tags: ['canh-bao-count'] },
  )()
}
