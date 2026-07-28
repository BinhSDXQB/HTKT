/**
 * Seed ToChuc + ChucDanh, rồi migrate can_bo text → FK
 * Chạy: npx jiti prisma/seed-to-chuc.ts
 */
import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? process.env.DIRECT_DATABASE_URL!,
})
const db = new PrismaClient({ adapter } as never)

// ─── 1. Dữ liệu ToChuc ───────────────────────────────────────────────────────

const SO_MA = 'SO_XD_QT'

const TO_CHUC_SEED = [
  // Cấp 1 — Sở
  { ma: SO_MA, ten: 'Sở Xây dựng tỉnh Quảng Trị', tenVietTat: 'Sở XD', loai: 'SO' as const, cap: 1, thuTu: 0 },

  // Cấp 2 — Nhóm Lãnh đạo + Các phòng
  { ma: 'LANH_DAO_SO',   ten: 'Lãnh đạo Sở',                                      tenVietTat: 'Lãnh đạo Sở',   loai: 'LANH_DAO_SO' as const, cap: 2, thuTu: 1,  parentMa: SO_MA },
  { ma: 'VAN_PHONG_SO',  ten: 'Văn Phòng Sở',                                      tenVietTat: 'VP Sở',          loai: 'VAN_PHONG'   as const, cap: 2, thuTu: 2,  parentMa: SO_MA },
  { ma: 'PHONG_QH_KT',   ten: 'Phòng Quy hoạch - Kiến trúc',                       tenVietTat: 'P.QH-KT',        loai: 'PHONG'       as const, cap: 2, thuTu: 3,  parentMa: SO_MA },
  { ma: 'PHONG_KH_TC',   ten: 'Phòng Kế hoạch - Tài chính',                        tenVietTat: 'P.KH-TC',        loai: 'PHONG'       as const, cap: 2, thuTu: 4,  parentMa: SO_MA },
  { ma: 'PHONG_QLKCHT',  ten: 'Phòng Quản lý kết cấu hạ tầng giao thông',          tenVietTat: 'P.QLKCHT',       loai: 'PHONG'       as const, cap: 2, thuTu: 5,  parentMa: SO_MA },
  { ma: 'PHONG_PTDT',    ten: 'Phòng Phát triển đô thị',                           tenVietTat: 'P.PTĐT',         loai: 'PHONG'       as const, cap: 2, thuTu: 6,  parentMa: SO_MA },
  { ma: 'PHONG_QL_VT',   ten: 'Phòng Quản lý vận tải',                             tenVietTat: 'P.QLVT',         loai: 'PHONG'       as const, cap: 2, thuTu: 7,  parentMa: SO_MA },
  { ma: 'PHONG_QLHD_XD', ten: 'Phòng Quản lý hoạt động xây dựng',                 tenVietTat: 'P.QLHĐXD',       loai: 'PHONG'       as const, cap: 2, thuTu: 8,  parentMa: SO_MA },
  { ma: 'PHONG_KT_VL',   ten: 'Phòng Kinh tế và vật liệu xây dựng',               tenVietTat: 'P.KT-VL',        loai: 'PHONG'       as const, cap: 2, thuTu: 9,  parentMa: SO_MA },
  { ma: 'PHONG_CLCT',    ten: 'Phòng Quản lý chất lượng công trình giao thông',    tenVietTat: 'P.CLCT',         loai: 'PHONG'       as const, cap: 2, thuTu: 10, parentMa: SO_MA },
  { ma: 'PHONG_HTKT',    ten: 'Phòng Hạ tầng kỹ thuật',                           tenVietTat: 'P.HTKT',         loai: 'PHONG'       as const, cap: 2, thuTu: 11, parentMa: SO_MA },
  { ma: 'PHONG_QL_NHA',  ten: 'Phòng Quản lý nhà và thị trường bất động sản',     tenVietTat: 'P.QL Nhà-BĐS',  loai: 'PHONG'       as const, cap: 2, thuTu: 12, parentMa: SO_MA },
]

// Map text phongBan → mã ToChuc
const PHONG_BAN_MAP: Record<string, string> = {
  'Lãnh đạo Sở':                                       'LANH_DAO_SO',
  'Văn Phòng Sở':                                      'VAN_PHONG_SO',
  'Phòng Quy hoạch - Kiến trúc':                       'PHONG_QH_KT',
  'Phòng Kế hoạch - Tài chính':                        'PHONG_KH_TC',
  'Phòng Quản lý kết cấu hạ tầng giao thông':          'PHONG_QLKCHT',
  'Phòng Phát triển đô thị':                           'PHONG_PTDT',
  'Phòng Quản lý vận tải':                             'PHONG_QL_VT',
  'Phòng Quản lý hoạt động xây dựng':                  'PHONG_QLHD_XD',
  'Phòng Kinh tế và vật liệu xây dựng':                'PHONG_KT_VL',
  'Phòng Quản lý chất lượng công trình giao thông':    'PHONG_CLCT',
  'Phòng Hạ tầng kỹ thuật':                           'PHONG_HTKT',
  'Phòng Quản lý nhà và thị trường bất động sản':     'PHONG_QL_NHA',
}

// ─── 2. Dữ liệu ChucDanh ─────────────────────────────────────────────────────

const CHUC_DANH_SEED = [
  // Lãnh đạo Sở
  { ma: 'GIAM_DOC',         ten: 'Giám đốc',             loai: 'LANH_DAO_SO'   as const, capQuanLy: 1, isLanhDao: true  },
  { ma: 'PHO_GIAM_DOC',     ten: 'Phó Giám đốc',         loai: 'LANH_DAO_SO'   as const, capQuanLy: 2, isLanhDao: true  },
  // Quản lý phòng / văn phòng
  { ma: 'CHANH_VP',         ten: 'Chánh Văn phòng',      loai: 'QUAN_LY'       as const, capQuanLy: 3, isLanhDao: true  },
  { ma: 'PHO_CHANH_VP',     ten: 'Phó Chánh Văn phòng',  loai: 'QUAN_LY'       as const, capQuanLy: 4, isLanhDao: true  },
  { ma: 'TRUONG_PHONG',     ten: 'Trưởng phòng',         loai: 'QUAN_LY'       as const, capQuanLy: 3, isLanhDao: true  },
  { ma: 'PHO_TRUONG_PHONG', ten: 'Phó Trưởng phòng',     loai: 'QUAN_LY'       as const, capQuanLy: 4, isLanhDao: true  },
  // Chuyên môn
  { ma: 'CHUYEN_VIEN',      ten: 'Chuyên viên',          loai: 'CHUYEN_MON'    as const, capQuanLy: 5, isLanhDao: false },
  { ma: 'KY_SU',            ten: 'Kỹ sư',                loai: 'CHUYEN_MON'    as const, capQuanLy: 5, isLanhDao: false },
  { ma: 'KIEN_TRUC_SU',     ten: 'Kiến trúc sư',         loai: 'CHUYEN_MON'    as const, capQuanLy: 5, isLanhDao: false },
  // Hành chính
  { ma: 'VAN_THU',          ten: 'Văn thư',              loai: 'HANH_CHINH'    as const, capQuanLy: 5, isLanhDao: false },
  { ma: 'KE_TOAN',          ten: 'Kế toán',              loai: 'HANH_CHINH'    as const, capQuanLy: 5, isLanhDao: false },
  { ma: 'LAI_XE',           ten: 'Lái xe',               loai: 'HANH_CHINH'    as const, capQuanLy: 5, isLanhDao: false },
  { ma: 'THU_QUY',          ten: 'Thủ quỹ',              loai: 'HANH_CHINH'    as const, capQuanLy: 5, isLanhDao: false },
  // Lãnh đạo UBND phường/xã
  { ma: 'CHU_TICH_UBND',    ten: 'Chủ tịch UBND',        loai: 'LANH_DAO_UBND' as const, capQuanLy: 1, isLanhDao: true  },
  { ma: 'PHO_CHU_TICH',     ten: 'Phó Chủ tịch UBND',   loai: 'LANH_DAO_UBND' as const, capQuanLy: 2, isLanhDao: true  },
  // Công chức phường/xã
  { ma: 'CONG_CHUC_XA',     ten: 'Công chức',            loai: 'CONG_CHUC_PHUONG' as const, capQuanLy: 5, isLanhDao: false },
]

// Map text chucVu → mã ChucDanh (chuẩn hoá cả trường hợp sai hoa/thường)
const CHUC_VU_MAP: Record<string, string> = {
  'Giám đốc':         'GIAM_DOC',
  'Phó Giám đốc':     'PHO_GIAM_DOC',
  'Chánh Văn phòng':  'CHANH_VP',
  'Phó Chánh VP':     'PHO_CHANH_VP',
  'Trưởng phòng':     'TRUONG_PHONG',
  'Phó Trưởng phòng': 'PHO_TRUONG_PHONG',
  'Phó trưởng phòng': 'PHO_TRUONG_PHONG', // sai hoa/thường
  'Chuyên viên':      'CHUYEN_VIEN',
  'Văn thư':          'VAN_THU',
  'Lái xe':           'LAI_XE',
  'Kế toán':          'KE_TOAN',
  'Thủ quỹ':          'THU_QUY',
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Seed ToChuc + ChucDanh ===')

  // 1. Upsert ToChuc (cần insert theo thứ tự để parent trước)
  const toChucMap: Record<string, string> = {} // ma → id

  for (const item of TO_CHUC_SEED) {
    const { parentMa, ...data } = item as typeof item & { parentMa?: string }
    const parentId = parentMa ? toChucMap[parentMa] : undefined
    const rec = await db.toChuc.upsert({
      where: { ma: data.ma },
      update: { ...data, parentId: parentId ?? null },
      create: { ...data, parentId: parentId ?? null },
    })
    toChucMap[data.ma] = rec.id
    console.log(`  ToChuc: ${rec.ma} → ${rec.id}`)
  }

  // 2. Upsert ChucDanh
  const chucDanhMap: Record<string, string> = {} // ma → id

  for (const item of CHUC_DANH_SEED) {
    const rec = await db.chucDanh.upsert({
      where: { ma: item.ma },
      update: item,
      create: item,
    })
    chucDanhMap[rec.ma] = rec.id
    console.log(`  ChucDanh: ${rec.ma} → ${rec.id}`)
  }

  // 3. Migrate can_bo text → FK
  console.log('\n=== Migrate can_bo text → toChucId / chucDanhId ===')
  const canBos = await db.canBo.findMany({
    select: { id: true, phongBan: true, chucVu: true },
  })

  let updated = 0
  let skipped = 0
  for (const cb of canBos) {
    const toChucMa = cb.phongBan ? PHONG_BAN_MAP[cb.phongBan.trim()] : undefined
    const chucDanhMa = cb.chucVu ? CHUC_VU_MAP[cb.chucVu.trim()] : undefined

    const toChucId = toChucMa ? toChucMap[toChucMa] : undefined
    const chucDanhId = chucDanhMa ? chucDanhMap[chucDanhMa] : undefined

    if (!toChucId && !chucDanhId) { skipped++; continue }

    await db.canBo.update({
      where: { id: cb.id },
      data: {
        toChucId:   toChucId   ?? undefined,
        chucDanhId: chucDanhId ?? undefined,
      },
    })
    updated++
  }
  console.log(`  Cập nhật: ${updated} / ${canBos.length} cán bộ  (bỏ qua: ${skipped})`)

  // 4. Tạo PhanCong cho phân công chính (từ FK vừa điền)
  console.log('\n=== Tạo PhanCong (phân công chính) ===')
  const canBosFull = await db.canBo.findMany({
    where: { toChucId: { not: null }, chucDanhId: { not: null } },
    select: { id: true, toChucId: true, chucDanhId: true },
  })

  let created = 0
  for (const cb of canBosFull) {
    if (!cb.toChucId || !cb.chucDanhId) continue
    // Không dùng upsert vì tuNgay nullable không hỗ trợ tốt
    const existing = await db.phanCong.findFirst({
      where: { canBoId: cb.id, toChucId: cb.toChucId, chucDanhId: cb.chucDanhId, denNgay: null },
    })
    if (existing) continue
    await db.phanCong.create({
      data: {
        canBoId:    cb.id,
        toChucId:   cb.toChucId,
        chucDanhId: cb.chucDanhId,
        laChinh:    true,
      },
    })
    created++
  }
  console.log(`  Tạo PhanCong: ${created} bản ghi`)

  // 5. Thống kê cuối
  console.log('\n=== Tổng kết ===')
  const stats = await Promise.all([
    db.toChuc.count(),
    db.chucDanh.count(),
    db.phanCong.count(),
    db.canBo.count({ where: { toChucId: { not: null } } }),
  ])
  console.log(`  ToChuc:   ${stats[0]}`)
  console.log(`  ChucDanh: ${stats[1]}`)
  console.log(`  PhanCong: ${stats[2]}`)
  console.log(`  CanBo có toChucId: ${stats[3]} / ${canBos.length}`)
  console.log('\nDone ✓')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
