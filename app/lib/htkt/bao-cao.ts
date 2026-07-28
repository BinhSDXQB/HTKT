import 'server-only'
import { db } from '@/lib/db'

// Tổng hợp số liệu báo cáo công việc theo kỳ (tháng/quý/năm) cho 1 phòng.
// Đếm theo HẠN (ngayHetHan) rơi trong kỳ — phục vụ giao ban "việc phải hoàn thành trong kỳ".

export type KyType = 'THANG' | 'QUY' | 'NAM'

export type DongThongKe = {
  key: string
  ten: string
  tong: number
  hoanThanh: number
  dangLam: number
  moi: number
  quaHan: number
  tyLe: number // % hoàn thành
}

export type CongViecDong = {
  id: string
  maCongViec: string
  tieuDe: string
  nguoiPhuTrach: string | null
  trangThai: string
  tienDo: number
  ngayHetHan: Date | null
}

export type BaoCaoData = {
  kyLabel: string
  start: Date
  end: Date
  tongHop: Omit<DongThongKe, 'key' | 'ten'>
  theoNguoi: DongThongKe[]
  theoLinhVuc: DongThongKe[]
  danhSach: CongViecDong[]
}

export function tinhKy(kyType: KyType, y: number, q: number, m: number): { start: Date; end: Date; label: string } {
  if (kyType === 'NAM') {
    return { start: new Date(Date.UTC(y, 0, 1)), end: new Date(Date.UTC(y, 11, 31, 23, 59, 59)), label: `Năm ${y}` }
  }
  if (kyType === 'QUY') {
    const sm = (q - 1) * 3
    return { start: new Date(Date.UTC(y, sm, 1)), end: new Date(Date.UTC(y, sm + 3, 0, 23, 59, 59)), label: `Quý ${q}/${y}` }
  }
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 0, 23, 59, 59)), label: `Tháng ${m}/${y}` }
}

const tyLe = (ht: number, tong: number) => (tong > 0 ? Math.round((ht / tong) * 100) : 0)

export async function getBaoCao(toChucId: string, kyType: KyType, y: number, q: number, m: number): Promise<BaoCaoData> {
  const { start, end, label } = tinhKy(kyType, y, q, m)

  // Tổng hợp theo NGƯỜI phụ trách
  const theoNguoiRaw = await db.$queryRawUnsafe<Array<{
    key: string | null; ten: string | null; tong: bigint; hoanthanh: bigint; danglam: bigint; moi: bigint; quahan: bigint
  }>>(
    `SELECT cv."nguoiPhuTrachId" AS key,
            u.name AS ten,
            COUNT(*) AS tong,
            COUNT(*) FILTER (WHERE cv."trangThai"='HOAN_THANH') AS hoanthanh,
            COUNT(*) FILTER (WHERE cv."trangThai" IN ('DANG_LAM','TAM_DUNG','CHO_DUYET')) AS danglam,
            COUNT(*) FILTER (WHERE cv."trangThai"='MOI') AS moi,
            COUNT(*) FILTER (WHERE cv."trangThai" NOT IN ('HOAN_THANH','HUY') AND cv."ngayHetHan" < now()) AS quahan
     FROM cong_viec cv
     LEFT JOIN users u ON u.id = cv."nguoiPhuTrachId"
     WHERE cv."toChucId"=$1 AND cv."deletedAt" IS NULL
       AND cv."ngayHetHan" BETWEEN $2 AND $3
     GROUP BY cv."nguoiPhuTrachId", u.name
     ORDER BY tong DESC`,
    toChucId, start, end,
  )

  // Tổng hợp theo LĨNH VỰC (customFields->>'linhVucKey'), lấy tên từ phan_cong_linh_vuc
  const theoLinhVucRaw = await db.$queryRawUnsafe<Array<{
    key: string | null; ten: string | null; tong: bigint; hoanthanh: bigint; danglam: bigint; moi: bigint; quahan: bigint
  }>>(
    `SELECT (cv."customFields"->>'linhVucKey') AS key,
            pc."linhVucTen" AS ten,
            COUNT(*) AS tong,
            COUNT(*) FILTER (WHERE cv."trangThai"='HOAN_THANH') AS hoanthanh,
            COUNT(*) FILTER (WHERE cv."trangThai" IN ('DANG_LAM','TAM_DUNG','CHO_DUYET')) AS danglam,
            COUNT(*) FILTER (WHERE cv."trangThai"='MOI') AS moi,
            COUNT(*) FILTER (WHERE cv."trangThai" NOT IN ('HOAN_THANH','HUY') AND cv."ngayHetHan" < now()) AS quahan
     FROM cong_viec cv
     LEFT JOIN phan_cong_linh_vuc pc
            ON pc."toChucId"=cv."toChucId" AND pc."linhVucKey" = (cv."customFields"->>'linhVucKey')
     WHERE cv."toChucId"=$1 AND cv."deletedAt" IS NULL
       AND cv."ngayHetHan" BETWEEN $2 AND $3
     GROUP BY (cv."customFields"->>'linhVucKey'), pc."linhVucTen"
     ORDER BY tong DESC`,
    toChucId, start, end,
  )

  const danhSachRaw = await db.$queryRawUnsafe<Array<{
    id: string; macongviec: string; tieude: string; nguoiphutrach: string | null
    trangthai: string; tiendo: number; ngayhethan: Date | null
  }>>(
    `SELECT cv.id, cv."maCongViec" AS macongviec, cv."tieuDe" AS tieude,
            u.name AS nguoiphutrach, cv."trangThai" AS trangthai, cv."tienDo" AS tiendo,
            cv."ngayHetHan" AS ngayhethan
     FROM cong_viec cv
     LEFT JOIN users u ON u.id = cv."nguoiPhuTrachId"
     WHERE cv."toChucId"=$1 AND cv."deletedAt" IS NULL
       AND cv."ngayHetHan" BETWEEN $2 AND $3
     ORDER BY cv."ngayHetHan" ASC, cv."uuTien" DESC`,
    toChucId, start, end,
  )

  const mapDong = (r: { key: string | null; ten: string | null; tong: bigint; hoanthanh: bigint; danglam: bigint; moi: bigint; quahan: bigint }, fb: string): DongThongKe => {
    const tong = Number(r.tong), ht = Number(r.hoanthanh)
    return { key: r.key ?? '_', ten: r.ten ?? fb, tong, hoanThanh: ht, dangLam: Number(r.danglam), moi: Number(r.moi), quaHan: Number(r.quahan), tyLe: tyLe(ht, tong) }
  }

  const theoNguoi = theoNguoiRaw.map((r) => mapDong(r, 'Chưa giao'))
  const theoLinhVuc = theoLinhVucRaw.map((r) => mapDong(r, 'Việc khác'))

  const tong = theoNguoi.reduce((s, r) => s + r.tong, 0)
  const hoanThanh = theoNguoi.reduce((s, r) => s + r.hoanThanh, 0)
  const tongHop = {
    tong,
    hoanThanh,
    dangLam: theoNguoi.reduce((s, r) => s + r.dangLam, 0),
    moi: theoNguoi.reduce((s, r) => s + r.moi, 0),
    quaHan: theoNguoi.reduce((s, r) => s + r.quaHan, 0),
    tyLe: tyLe(hoanThanh, tong),
  }

  return {
    kyLabel: label, start, end, tongHop, theoNguoi, theoLinhVuc,
    danhSach: danhSachRaw.map((r) => ({
      id: r.id, maCongViec: r.macongviec, tieuDe: r.tieude, nguoiPhuTrach: r.nguoiphutrach,
      trangThai: r.trangthai, tienDo: Number(r.tiendo), ngayHetHan: r.ngayhethan,
    })),
  }
}
