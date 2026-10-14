import 'server-only'
import { db } from '@/lib/db'
import type { CurrentUser } from '@/lib/auth'
import { getWardReportPerms, type WardReportPerms } from '@/lib/ward-report-perms'

// Truy vấn dùng chung cho bảng trung tâm HTKT (server actions, API GeoJSON, xuất Excel).
// Mọi thứ khoá theo MÃ XÃ (administrative_units.code). Quyền: tái dùng quyền Biểu mẫu xã/phường —
// tài khoản xã/phường chỉ thấy + sửa đơn vị mình; Phòng HTKT / admin: tất cả; cán bộ Sở khác: chỉ xem.

export type XaInfo = {
  id: string; code: string; name: string
  dxTu: number | null; dxDen: number | null; dthTu: number | null; dthDen: number | null; canCu: string | null
  laPhuong: boolean
}

export type QuyenXa = { perms: WardReportPerms; xa: XaInfo; ghi: boolean; laSo: boolean }

export async function layXa(maXa: string): Promise<XaInfo | null> {
  const x = await db.administrativeUnit.findFirst({
    where: { code: maXa, type: 'PHUONG_XA' },
    select: { id: true, code: true, name: true, soHieuDxTu: true, soHieuDxDen: true, soHieuDthTu: true, soHieuDthDen: true, soHieuCanCu: true },
  })
  if (!x) return null
  return {
    id: x.id, code: x.code, name: x.name,
    dxTu: x.soHieuDxTu, dxDen: x.soHieuDxDen, dthTu: x.soHieuDthTu, dthDen: x.soHieuDthDen, canCu: x.soHieuCanCu,
    laPhuong: x.name.startsWith('Phường'),
  }
}

/** Kiểm quyền trên một xã; trả null nếu không được xem. */
export async function quyenTrenXa(user: CurrentUser, maXa: string): Promise<QuyenXa | null> {
  const perms = await getWardReportPerms(user.id, user.role.name, user.wardId)
  const xa = await layXa(maXa)
  if (!xa) return null
  if (perms.limitWardId && perms.limitWardId !== xa.id) return null
  return { perms, xa, ghi: perms.canWrite, laSo: perms.type === 'ADMIN' || perms.type === 'SO_HTKT' }
}

/** Mã xã của tài khoản xã/phường (null nếu là cán bộ Sở). */
export async function maXaCuaTaiKhoan(user: CurrentUser): Promise<string | null> {
  if (!user.wardId) return null
  const x = await db.administrativeUnit.findUnique({ where: { id: user.wardId }, select: { code: true } })
  return x?.code ?? null
}

export type DoiTuongDong = {
  id: string; maDoiTuong: string; linhVuc: string; ten: string | null; nhan: string | null
  capDuong: string | null; phanLoaiDoThi: string | null; thon: string | null
  soHieu: string | null; shSo: number | null; shChuCai: string | null; shTrangThai: string | null
  shSoQd: string | null; shNgayQd: string | null; soHieuKhac: string | null; soHieuHienThi: string | null
  soHieuCu: string | null; tenCu: string | null
  tuyenDuongId: string | null; tuyenMa: string | null; tuyenSoHieu: string | null; tuyenTen: string | null; streetId: string | null; streetCode: string | null
  diemDau: string | null; diemCuoi: string | null; viTri: string | null
  chieuDaiM: number | null; chieuDaiGisM: number | null; lechChieuDaiPct: number | null
  dienTichM2: number | null; dienTichGisM2: number | null; soLuong: number | null
  beRongNenM: number | null; beRongMatM: number | null; ketCauMat: string | null
  namSuDung: number | null; tinhTrang: string | null; donViQuanLy: string | null; deXuatDieuChinh: string | null
  thongSo: Record<string, unknown>; coGis: boolean; tamLat: number | null; tamLng: number | null; ngoaiRanhPct: number | null
  soDoiTuongTrenTuyen: number; soDongBaoCao: number; ghiChu: string | null; updatedAt: string
}

const n = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v))
const d2s = (v: unknown): string | null => {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(String(v))
  return Number.isNaN(d.getTime()) ? null
    : `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

type Raw = Record<string, unknown>

function chuyen(r: Raw): DoiTuongDong {
  return {
    id: r.id as string, maDoiTuong: r.ma_doi_tuong as string, linhVuc: r.linh_vuc as string,
    ten: r.ten as string | null, nhan: r.nhan as string | null,
    capDuong: r.cap_duong as string | null, phanLoaiDoThi: r.phan_loai_do_thi as string | null, thon: r.thon as string | null,
    soHieu: r.so_hieu as string | null, shSo: n(r.sh_so), shChuCai: r.sh_chu_cai as string | null,
    shTrangThai: r.sh_trang_thai as string | null, shSoQd: r.sh_so_qd as string | null, shNgayQd: d2s(r.sh_ngay_qd),
    soHieuKhac: (r.so_hieu_hien_thi && !r.so_hieu ? r.so_hieu_hien_thi : null) as string | null,
    soHieuHienThi: r.so_hieu_hien_thi as string | null,
    soHieuCu: r.so_hieu_cu as string | null, tenCu: r.ten_cu as string | null,
    tuyenDuongId: r.tuyen_duong_id as string | null, tuyenMa: r.tuyen_ma as string | null,
    tuyenSoHieu: r.tuyen_so_hieu as string | null, tuyenTen: r.tuyen_ten as string | null, streetId: r.street_id as string | null, streetCode: r.street_code as string | null,
    diemDau: r.diem_dau as string | null, diemCuoi: r.diem_cuoi as string | null, viTri: r.vi_tri as string | null,
    chieuDaiM: n(r.chieu_dai_m), chieuDaiGisM: n(r.chieu_dai_gis_m), lechChieuDaiPct: n(r.lech_chieu_dai_pct),
    dienTichM2: n(r.dien_tich_m2), dienTichGisM2: n(r.dien_tich_gis_m2), soLuong: n(r.so_luong),
    beRongNenM: n(r.be_rong_nen_m), beRongMatM: n(r.be_rong_mat_m), ketCauMat: r.ket_cau_mat as string | null,
    namSuDung: n(r.nam_su_dung), tinhTrang: r.tinh_trang as string | null, donViQuanLy: r.don_vi_quan_ly as string | null,
    deXuatDieuChinh: r.de_xuat_dieu_chinh as string | null,
    thongSo: (r.thong_so ?? {}) as Record<string, unknown>, coGis: Boolean(r.co_gis),
    tamLat: n(r.tam_lat), tamLng: n(r.tam_lng), ngoaiRanhPct: n(r.ngoai_ranh_pct),
    soDoiTuongTrenTuyen: Number(r.so_doi_tuong_tren_tuyen ?? 0), soDongBaoCao: Number(r.so_dong_bao_cao ?? 0),
    ghiChu: r.ghi_chu as string | null, updatedAt: r.updated_at ? new Date(String(r.updated_at)).toISOString() : '',
  }
}

/** Toàn bộ đối tượng còn hiệu lực của một xã, đã JOIN động (tên xã, tuyến, số dòng báo cáo…). */
export async function danhSachDoiTuong(maXa: string): Promise<DoiTuongDong[]> {
  const rows = await db.$queryRaw<Raw[]>`
    SELECT * FROM v_htkt_doi_tuong WHERE ma_xa = ${maXa}
     ORDER BY linh_vuc, cap_duong NULLS LAST, sh_so NULLS LAST, sh_chu_cai NULLS FIRST, ten NULLS LAST, ma_doi_tuong`
  return rows.map(chuyen)
}

export type DaiSoHieu = {
  dxTu: number; dxDen: number; dxDaDung: number; dxSucChua: number
  dthTu: number; dthDen: number; dthDaDung: number; dthSucChua: number
  goiYDx: string | null; goiYDth: string | null; canCu: string | null
}

export async function daiSoHieu(maXa: string): Promise<DaiSoHieu | null> {
  const r = (await db.$queryRaw<Raw[]>`SELECT * FROM v_dai_so_hieu_xa WHERE ma_xa = ${maXa}`)[0]
  if (!r) return null
  const [gx] = await db.$queryRaw<{ ky_hieu: string }[]>`SELECT ky_hieu FROM fn_htkt_goi_y_so_hieu(${maXa}, 'DUONG_XA', NULL::int)`
  const [gt] = await db.$queryRaw<{ ky_hieu: string }[]>`SELECT ky_hieu FROM fn_htkt_goi_y_so_hieu(${maXa}, 'DUONG_THON', NULL::int)`
  return {
    dxTu: Number(r.dx_tu), dxDen: Number(r.dx_den), dxDaDung: Number(r.dx_da_dung), dxSucChua: Number(r.dx_suc_chua),
    dthTu: Number(r.dth_tu), dthDen: Number(r.dth_den), dthDaDung: Number(r.dth_da_dung), dthSucChua: Number(r.dth_suc_chua),
    goiYDx: gx?.ky_hieu ?? null, goiYDth: gt?.ky_hieu ?? null, canCu: (r.can_cu as string) ?? null,
  }
}

export type CanhBao = { id: string; maDoiTuong: string; nhan: string; muc: 'cao' | 'tb'; noiDung: string }

/** Cảnh báo chất lượng dữ liệu suy ra từ liên kết (không lưu cờ tay — xem nguyên tắc trạng thái động). */
export function canhBao(ds: DoiTuongDong[], laPhuong: boolean): CanhBao[] {
  const out: CanhBao[] = []
  const nhan = (d: DoiTuongDong) => d.nhan ?? d.maDoiTuong
  const daDung = new Set(ds.filter((d) => d.shSo !== null).map((d) => `${d.capDuong}:${d.shSo}:${d.shChuCai ?? ''}`))
  const tenTrung = new Map<string, number>()
  for (const d of ds) {
    if (d.linhVuc === 'DUONG' && d.ten) tenTrung.set(`${d.ten.toLowerCase()}|${d.diemDau ?? ''}`, (tenTrung.get(`${d.ten.toLowerCase()}|${d.diemDau ?? ''}`) ?? 0) + 1)
  }
  for (const d of ds) {
    const add = (muc: CanhBao['muc'], noiDung: string) => out.push({ id: d.id, maDoiTuong: d.maDoiTuong, nhan: nhan(d), muc, noiDung })
    if (d.capDuong === 'CHUA_PHAN_CAP') add('tb', 'Chưa xác định cấp đường (xã / thôn / đô thị / đường gom) — cần phân cấp trước khi đặt số hiệu')
    if (laPhuong && (d.capDuong === 'DUONG_XA' || d.capDuong === 'DUONG_THON'))
      add('cao', 'Phường không có đường xã/đường thôn: đường trong phường là đường đô thị (QĐ 56 Đ3)')
    if (d.shChuCai) {
      const i = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N'].indexOf(d.shChuCai)
      const truoc = i > 0 ? ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N'][i - 1] : ''
      if (i > 0 && !daDung.has(`${d.capDuong}:${d.shSo}:${truoc}`))
        add('tb', `Bỏ cách chữ cái: có ${d.soHieu} nhưng chưa có …${d.shSo}${truoc} (Đ5 k1 điểm c đặt lần lượt B, C, D…)`)
    }
    if (d.lechChieuDaiPct !== null && Math.abs(d.lechChieuDaiPct) > 30)
      add(Math.abs(d.lechChieuDaiPct) > 80 ? 'cao' : 'tb', `Chiều dài khai báo lệch ${d.lechChieuDaiPct}% so với đo trên bản đồ GIS — kiểm tra đơn vị km/m hoặc nét vẽ`)
    if (d.linhVuc === 'DUONG' && !laPhuong && d.chieuDaiM !== null && d.chieuDaiM >= 20000 && d.capDuong !== 'QUOC_LO' && d.capDuong !== 'DUONG_TINH')
      add('cao', `Chiều dài ${(d.chieuDaiM / 1000).toLocaleString('vi-VN')} km bất thường cho đường xã/thôn — có thể ghi mét thành km`)
    if (d.ngoaiRanhPct !== null && d.ngoaiRanhPct > 20) add('tb', `${d.ngoaiRanhPct}% điểm hình học nằm ngoài ranh giới xã/phường`)
    if (d.linhVuc !== 'DUONG' && LV_TREN_TUYEN.has(d.linhVuc) && !d.tuyenDuongId && !d.coGis)
      add('tb', 'Chưa gắn tuyến đường và chưa có vị trí trên bản đồ')
    if (d.linhVuc === 'DUONG' && d.ten && (tenTrung.get(`${d.ten.toLowerCase()}|${d.diemDau ?? ''}`) ?? 0) > 1)
      add('tb', 'Trùng tên và điểm đầu với một tuyến khác trong xã — có thể nhập trùng')
  }
  return out
}

const LV_TREN_TUYEN = new Set(['CHIEU_SANG', 'CAY_XANH', 'THOAT_NUOC_MUA', 'THOAT_NUOC_THAI', 'THOAT_NUOC_CHUNG'])
