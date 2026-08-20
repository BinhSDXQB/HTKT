import { db } from '@/lib/db'

// ── ĐỐI SOÁT 3 NGUỒN chiều dài đường (LIVE từ DB) ───────────────────────────
//   S_chi_tiết = SUM report_duong.chieuDaiKm (động, cán bộ sửa là đổi ngay)
//   S_khai_báo = ward_khai_bao (đơn vị tự khai)
//   GIS        = ward_gis_length (chiều dài hình học đo từ bản đồ)
// Chỉ lưu dòng lá trong report_* nên tổng = SUM, KHÔNG BAO GIỜ cộng trùng.

export type MucDo = 'NGHIÊM TRỌNG' | 'CẢNH BÁO' | 'LƯU Ý' | 'ĐẠT'

export type DoiSoatRow = {
  wardId: string
  donVi: string
  code: string
  chiTiet: number
  khaiBao: number | null
  gisDiaPhuong: number
  gisTong: number
  thieuSoVoiBanDo: number
  mucDo: MucDo
  nhanDinh: string
  deNghi: string
  mau: string
}

export const MAU_MUC: Record<MucDo, string> = {
  'NGHIÊM TRỌNG': '#ef4444', 'CẢNH BÁO': '#f97316', 'LƯU Ý': '#eab308', 'ĐẠT': '#22c55e',
}
export const MUC_ORDER: Record<MucDo, number> = {
  'NGHIÊM TRỌNG': 0, 'CẢNH BÁO': 1, 'LƯU Ý': 2, 'ĐẠT': 3,
}

const XA = 'Cán bộ địa chính - xây dựng xã/phường'
const HT = 'Chuyên viên Phòng Hạ tầng kỹ thuật'
const r2 = (x: number) => Math.round(x * 100) / 100

function classify(sChi: number, sKhai: number | null, gdp: number, gt: number):
  { mucDo: MucDo; nhanDinh: string; deNghi: string } {
  if (gt > 0 && sChi > gt * 1.5) {
    return {
      mucDo: 'NGHIÊM TRỌNG',
      nhanDinh: `Chiều dài kê khai ${sChi.toFixed(1)} km VƯỢT XA tổng chiều dài TẤT CẢ đường trên bản đồ trong ranh (${gt.toFixed(1)} km). Nghi có DÒNG GỘP nhiều tuyến hoặc đo nhầm đơn vị (mét ghi thành km).`,
      deNghi: `${XA}: rà soát, TÁCH các dòng gộp (vd "đường trục các thôn", "đường liên thôn") thành từng tuyến có điểm đầu–cuối; kiểm tra đơn vị đo (km/m). ${HT}: đối chiếu thực địa/ảnh vệ tinh trước khi tổng hợp.`,
    }
  }
  if (gt > 0 && sChi > gt * 1.15) {
    return {
      mucDo: 'CẢNH BÁO',
      nhanDinh: `Kê khai ${sChi.toFixed(1)} km nhỉnh hơn tổng mạng đường trên bản đồ (${gt.toFixed(1)} km). Có thể còn dòng gộp, hoặc bản đồ chưa số hóa hết ngõ/ngách.`,
      deNghi: `${XA}: xác minh lại các tuyến dài bất thường. ${HT}: cập nhật (số hóa) các tuyến còn thiếu lên GIS để khớp thực tế.`,
    }
  }
  if (gt > 0 && gdp === 0) {
    return {
      mucDo: 'CẢNH BÁO',
      nhanDinh: `Bản đồ GIS CHƯA CÓ tuyến đường địa phương/đô thị nào trong ranh đơn vị (chỉ có QL/ĐT/cao tốc ${gt.toFixed(1)} km), trong khi đơn vị kê ${sChi.toFixed(1)} km.`,
      deNghi: `${HT}: số hóa BỔ SUNG đường đô thị/địa phương của đơn vị lên bản đồ GIS. ${XA}: cung cấp sơ đồ/danh mục tuyến để đối chiếu.`,
    }
  }
  if (gdp > 0 && sChi < gdp * 0.5) {
    return {
      mucDo: 'LƯU Ý',
      nhanDinh: `Kê khai ${sChi.toFixed(1)} km THẤP hơn nhiều so với đường địa phương đã có trên bản đồ (${gdp.toFixed(1)} km). Nghi đơn vị KÊ THIẾU tuyến.`,
      deNghi: `${XA}: bổ sung các tuyến còn thiếu vào biểu kê khai. ${HT}: gửi danh mục tuyến GIS cho đơn vị đối chiếu.`,
    }
  }
  if (sKhai && sChi < sKhai * 0.6) {
    return {
      mucDo: 'LƯU Ý',
      nhanDinh: `Số chi tiết ${sChi.toFixed(1)} km thấp hơn nhiều so với dòng TỔNG đơn vị tự khai (${sKhai.toFixed(1)} km) → thiếu dòng chi tiết trong biểu.`,
      deNghi: `${XA}: bổ sung đủ các dòng chi tiết cho khớp dòng tổng đã ghi.`,
    }
  }
  return {
    mucDo: 'ĐẠT',
    nhanDinh: `Nằm trong dải hợp lý so với bản đồ GIS (${gdp.toFixed(1)}–${gt.toFixed(1)} km).`,
    deNghi: 'Không cần điều chỉnh. Định kỳ đối chiếu khi cập nhật bản đồ.',
  }
}

export async function computeDoiSoatDuong(year = 2025): Promise<DoiSoatRow[]> {
  const [wards, duong, gis, kb] = await Promise.all([
    db.administrativeUnit.findMany({
      where: { type: 'PHUONG_XA', isActive: true },
      select: { id: true, name: true, fullName: true, code: true },
    }),
    db.reportDuong.groupBy({ by: ['wardId'], where: { year }, _sum: { chieuDaiKm: true } }),
    db.wardGisLength.findMany(),
    db.wardKhaiBao.findMany({ where: { year, linhVuc: 'DUONG', chiTieu: 'chieuDaiKm' } }),
  ])
  const chiMap = new Map(duong.map((d) => [d.wardId, d._sum.chieuDaiKm ?? 0]))
  const gisMap = new Map(gis.map((g) => [g.wardId, g]))
  const kbMap = new Map(kb.map((k) => [k.wardId, k.giaTri]))

  const rows: DoiSoatRow[] = []
  for (const w of wards) {
    const sChi = chiMap.get(w.id) ?? 0
    const sKhai = kbMap.get(w.id) ?? null
    if (sChi <= 0 && sKhai == null) continue // chỉ đối soát đơn vị có số liệu
    const g = gisMap.get(w.id)
    const gdp = g?.duongDiaPhuongKm ?? 0
    const gt = g?.tongKm ?? 0
    const { mucDo, nhanDinh, deNghi } = classify(sChi, sKhai, gdp, gt)
    rows.push({
      wardId: w.id, donVi: w.fullName || w.name, code: w.code,
      chiTiet: r2(sChi), khaiBao: sKhai != null ? r2(sKhai) : null,
      gisDiaPhuong: r2(gdp), gisTong: r2(gt), thieuSoVoiBanDo: r2(sChi - gt),
      mucDo, nhanDinh, deNghi, mau: MAU_MUC[mucDo],
    })
  }
  rows.sort((a, b) => MUC_ORDER[a.mucDo] - MUC_ORDER[b.mucDo] || a.donVi.localeCompare(b.donVi, 'vi'))
  return rows
}

export function tomTat(rows: DoiSoatRow[]) {
  const s: Record<MucDo, number> = { 'NGHIÊM TRỌNG': 0, 'CẢNH BÁO': 0, 'LƯU Ý': 0, 'ĐẠT': 0 }
  for (const r of rows) s[r.mucDo]++
  return s
}
