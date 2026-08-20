import { db } from '@/lib/db'

// ─── BÁO CÁO NQ 06 – MỤC 4.1 "HẠ TẦNG KỸ THUẬT CƠ BẢN" (LIVE từ DB) ──────────
// Rút số tự động cho các chỉ tiêu 4.1 mà hệ thống HTKT có dữ liệu:
//   ③ Tỷ lệ đường đô thị được trải nhựa/bê tông hóa  ← report_duong (chieuDaiKm + ketCauMat)
//   ④ Tỷ lệ hộ được cấp nước sạch tập trung          ← report_cap_nuoc (soHoGiaDinh + hienTrang)
// Các chỉ tiêu ①②⑤ (đất XD đô thị, đất giao thông, điện+internet) KHÔNG có nguồn
// trong HTKT → trả về null để biểu tổng hợp đánh dấu "nhập tay / xin ngoài".

// Nhóm đô thị (từ trường vungLoi, mig 032) — 29 đơn vị "có đô thị" theo CV NQ 06.
export const VUNG_LOI_DO_THI = [
  'Lõi đô thị',
  'Thuộc đô thị (phần xã)',
  'Bán đô thị (thị trấn)',
] as const

export type KetCauLoai = 'CUNG_HOA' | 'HON_HOP' | 'CHUA_CUNG_HOA' | 'KHONG_RO'

// Chuẩn hóa text tự do "kết cấu mặt đường" → phân loại cứng hóa.
//   CUNG_HOA      = bê tông nhựa (BTN), bê tông xi măng (BTXM), láng nhựa (LN), bê tông
//   CHUA_CUNG_HOA = cấp phối, đá dăm, đất  (chưa trải nhựa/bê tông)
//   HON_HOP       = ghi cả 2 loại trên một dòng (vd "BTXM+CP") → có phần cứng hóa
//   KHONG_RO      = trống hoặc không nhận dạng được → loại khỏi mẫu số khi tính %
export function phanLoaiKetCau(raw?: string | null): KetCauLoai {
  if (!raw || !raw.trim()) return 'KHONG_RO'
  const t = raw
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
  // Cứng hóa: bê tông (nhựa/xi măng) + láng nhựa. Bắt cả viết tắt BTN/BTXM/BNT/LN.
  const cung = /b[eê]\s?t[oô]ng|beton|\bbtn\b|\bbtxm\b|\bbnt\b|nh[uự]a|l[aá]ng nh[uự]a|\bln\b/
  // Chưa cứng hóa: cấp phối, đá dăm, đất.
  // LƯU Ý: KHÔNG dùng \b quanh ký tự tiếng Việt (đ/ấ) — \b của JS chỉ hiểu [A-Za-z0-9_],
  // nên \bđất\b KHÔNG khớp "đất đồi". Bỏ \b cho token có dấu.
  const mem = /c[aấ]p ph[oố]i|\bcp\b|đ[aá] d[aă]m|đ[aấ]t/
  const hasCung = cung.test(t)
  const hasMem = mem.test(t)
  if (hasCung && hasMem) return 'HON_HOP'
  if (hasCung) return 'CUNG_HOA'
  if (hasMem) return 'CHUA_CUNG_HOA'
  return 'KHONG_RO'
}

const r1 = (x: number) => Math.round(x * 10) / 10

// Ngưỡng nghi ngờ đơn vị đo: 1 tuyến đường đô thị/xã dài ≥ 20 km gần như chắc chắn
// là mét ghi nhầm thành km, hoặc "dòng gộp" nhiều tuyến (vd "đường trục các thôn").
// Khớp với quy tắc đã ghi nhận + logic đối soát ở doi-soat.ts. Các tuyến này bị TÁCH
// riêng, KHÔNG tính vào tỷ lệ, và liệt kê để cán bộ xã/phường rà soát lại. Áp dụng ĐỀU
// cho mọi đơn vị (dữ liệu Trung tâm đều là tuyến ngắn <4km nên không bị ảnh hưởng).
export const NGUONG_NGHI_KM = 20

// Nguồn thứ 2 cho chỉ tiêu ③: "Trung tâm Quản lý, bảo trì giao thông và hạ tầng kỹ
// thuật" quản lý các tuyến mặt cắt ≥ 20m ở 3 phường Đồng Hới/Đồng Thuận/Đồng Sơn.
// Lưu ở NghiepVuBanGhi (customFields: chieuDai km, ketCau). diaBan = tên phường.
// report_duong phường Đồng Hới ĐÃ chứa phần lớn các tuyến này ⇒ phải KHỬ TRÙNG theo
// (đơn vị + tên tuyến), ưu tiên số liệu Trung tâm.
export const LINH_VUC_TRUNG_TAM_DUONG = 'trung-tam-bao-tri/tuyen-duong-mat-cat-lon'

// Chuẩn hóa tên tuyến để so khớp khử trùng: bỏ tiền tố "Đường ", gộp khoảng trắng.
function normTen(s: string): string {
  return s.toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim().replace(/^đường\s+/, '')
}

export type ChiTieu3Row = {
  wardId: string
  code: string
  donVi: string
  vungLoi: string | null
  tongKm: number      // tổng đã LOẠI tuyến nghi ngờ (đã khử trùng 2 nguồn)
  cungHoaKm: number   // CUNG_HOA + HON_HOP
  chuaKm: number
  khongRoKm: number
  nghiNgoKm: number   // tuyến ≥ NGUONG_NGHI_KM (mét↦km / dòng gộp) — không tính tỷ lệ
  trungTamKm: number  // km đóng góp từ nguồn Trung tâm (mặt cắt ≥20m)
  tyLe: number | null // % trên mẫu số (đã loại KHONG_RO + nghi ngờ); null nếu chưa có dữ liệu
}

export type TuyenNghiNgo = { donVi: string; tenDuong: string; km: number; ketCau: string | null }

export type ChiTieu41 = {
  year: number
  // ③
  duong: {
    rows: ChiTieu3Row[]
    tong: { tongKm: number; cungHoaKm: number; chuaKm: number; khongRoKm: number; nghiNgoKm: number; trungTamKm: number; tyLe: number | null }
    tuyenNghiNgo: TuyenNghiNgo[]  // tuyến ≥20km (mét↦km / dòng gộp) → cán bộ rà soát
  }
  // ④
  capNuoc: {
    coDuLieu: boolean
    tongHo: number
    hoCoNuoc: number
    tyLe: number | null
  }
  // ①②⑤ — ngoài phạm vi dữ liệu HTKT
  ngoaiPhamVi: { ma: string; ten: string; nguon: string }[]
}

export async function computeChiTieu41(year = 2025): Promise<ChiTieu41> {
  const [wards, duong, trungTam, capNuoc] = await Promise.all([
    db.administrativeUnit.findMany({
      where: { type: 'PHUONG_XA', isActive: true, vungLoi: { in: [...VUNG_LOI_DO_THI] } },
      select: { id: true, code: true, name: true, vungLoi: true },
    }),
    db.reportDuong.findMany({
      where: { year, status: 'DA_DUYET' },
      select: { wardId: true, tenDuong: true, chieuDaiKm: true, ketCauMat: true },
    }),
    // Nguồn 2: tuyến do Trung tâm quản lý (mặt cắt ≥20m) — không lọc theo year.
    db.nghiepVuBanGhi.findMany({
      where: { linhVuc: LINH_VUC_TRUNG_TAM_DUONG, deletedAt: null },
      select: { tieuDe: true, diaBan: true, customFields: true },
    }),
    db.reportCapNuoc.findMany({
      where: { year, status: 'DA_DUYET' },
      select: { wardId: true, soHoGiaDinh: true, hienTrang: true },
    }),
  ])

  const urbanIds = new Set(wards.map((w) => w.id))
  const wardByName = new Map(wards.map((w) => [w.name.trim(), w])) // "Phường Đồng Hới" → ward
  const byWard = new Map<string, ChiTieu3Row>()
  for (const w of wards) {
    byWard.set(w.id, {
      wardId: w.id, code: w.code, donVi: w.name, vungLoi: w.vungLoi,
      tongKm: 0, cungHoaKm: 0, chuaKm: 0, khongRoKm: 0, nghiNgoKm: 0, trungTamKm: 0, tyLe: null,
    })
  }

  const cong = (row: ChiTieu3Row, km: number, cat: KetCauLoai) => {
    row.tongKm += km
    if (cat === 'CUNG_HOA' || cat === 'HON_HOP') row.cungHoaKm += km
    else if (cat === 'CHUA_CUNG_HOA') row.chuaKm += km
    else row.khongRoKm += km
  }

  // (A) Nạp nguồn Trung tâm TRƯỚC + ghi khóa khử trùng (đơn-vị|tên-tuyến).
  const trungKey = new Set<string>()
  for (const t of trungTam) {
    const w = wardByName.get((t.diaBan ?? '').trim())
    if (!w) continue // diaBan không khớp phường đô thị nào → bỏ qua
    const cf = (t.customFields ?? {}) as Record<string, unknown>
    const km = Number(cf.chieuDai) || 0
    const cat = phanLoaiKetCau(typeof cf.ketCau === 'string' ? cf.ketCau : null)
    const row = byWard.get(w.id)!
    cong(row, km, cat)
    row.trungTamKm += km
    trungKey.add(`${w.id}|${normTen(t.tieuDe)}`)
  }

  // (B) Nạp report_duong, BỎ tuyến đã có ở nguồn Trung tâm (khử trùng), tách tuyến nghi ngờ.
  const tuyenNghiNgo: TuyenNghiNgo[] = []
  for (const d of duong) {
    if (!urbanIds.has(d.wardId)) continue // chỉ tổng hợp đơn vị đô thị
    const row = byWard.get(d.wardId)!
    if (trungKey.has(`${d.wardId}|${normTen(d.tenDuong)}`)) continue // đã tính ở nguồn Trung tâm
    const km = d.chieuDaiKm ?? 0
    if (km >= NGUONG_NGHI_KM) { // nghi mét↦km / dòng gộp → tách riêng, không vào tỷ lệ
      row.nghiNgoKm += km
      tuyenNghiNgo.push({ donVi: row.donVi, tenDuong: d.tenDuong, km: r1(km), ketCau: d.ketCauMat })
      continue
    }
    cong(row, km, phanLoaiKetCau(d.ketCauMat))
  }

  const rows = [...byWard.values()].map((r) => {
    const mau = r.tongKm - r.khongRoKm // loại đoạn không rõ kết cấu khỏi mẫu số
    return {
      ...r,
      tongKm: r1(r.tongKm), cungHoaKm: r1(r.cungHoaKm), chuaKm: r1(r.chuaKm),
      khongRoKm: r1(r.khongRoKm), nghiNgoKm: r1(r.nghiNgoKm), trungTamKm: r1(r.trungTamKm),
      tyLe: mau > 0 ? r1((100 * r.cungHoaKm) / mau) : null,
    }
  }).sort((a, b) => a.code.localeCompare(b.code))

  const sum = (k: keyof ChiTieu3Row) => rows.reduce((s, r) => s + (r[k] as number), 0)
  const tCung = sum('cungHoaKm'), tChua = sum('chuaKm'), tKhong = sum('khongRoKm')
  const tTong = sum('tongKm'), tNghi = sum('nghiNgoKm'), tTrung = sum('trungTamKm')
  const tMau = tTong - tKhong
  tuyenNghiNgo.sort((a, b) => b.km - a.km)

  // ④ cấp nước — hienTrang free-text; coi "đã có/đang dùng nước sạch/máy" là có nước tập trung.
  let tongHo = 0, hoCoNuoc = 0
  for (const cn of capNuoc) {
    if (!urbanIds.has(cn.wardId)) continue
    const ho = cn.soHoGiaDinh ?? 0
    tongHo += ho
    const ht = (cn.hienTrang ?? '').toLowerCase().normalize('NFC')
    const phuNhan = /(chưa|không|ko\b|chưa có)/.test(ht) // "chưa có nước sạch" ⇒ KHÔNG tính
    const khangDinh = /(đã có|đang d[uù]ng|đang sử dụng|nư[oớ]c s[aạ]ch|nư[oớ]c m[aá]y|c[aấ]p nư[oớ]c)/.test(ht)
    if (khangDinh && !phuNhan) hoCoNuoc += ho
  }

  return {
    year,
    duong: {
      rows,
      tong: {
        tongKm: r1(tTong), cungHoaKm: r1(tCung), chuaKm: r1(tChua), khongRoKm: r1(tKhong),
        nghiNgoKm: r1(tNghi), trungTamKm: r1(tTrung),
        tyLe: tMau > 0 ? r1((100 * tCung) / tMau) : null,
      },
      tuyenNghiNgo,
    },
    capNuoc: {
      coDuLieu: capNuoc.length > 0,
      tongHo, hoCoNuoc,
      tyLe: tongHo > 0 ? r1((100 * hoCoNuoc) / tongHo) : null,
    },
    ngoaiPhamVi: [
      { ma: '4.1.①', ten: 'Tỷ lệ đất xây dựng đô thị / tổng diện tích tự nhiên', nguon: 'Quy hoạch chung / kiểm kê đất (QH-KT, Sở NN&MT)' },
      { ma: '4.1.②', ten: 'Tỷ lệ đất giao thông / đất xây dựng đô thị', nguon: 'Ước tính lộ giới × chiều dài (tử số) — mẫu số cần quy hoạch' },
      { ma: '4.1.⑤', ten: 'Tỷ lệ hộ tiếp cận điện lưới, internet tốc độ cao', nguon: 'Điện lực + doanh nghiệp viễn thông' },
    ],
  }
}
