import { PrismaClient, type InfrastructureDomain } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

function getConnectionString(): string {
  if (process.env.DIRECT_DATABASE_URL) return process.env.DIRECT_DATABASE_URL
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL environment variable is not set')
  return url
}

const connectionString = getConnectionString()
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// ─── MODULES & ACTIONS ───────────────────────────────────────────────────────

const MODULES = {
  TAI_SAN:  'tai_san',
  KIEM_TRA: 'kiem_tra',
  SU_CO:    'su_co',
  PHIEU_CV: 'phieu_cv',
  DU_AN:    'du_an',
  VAT_TU:   'vat_tu',
  BAO_CAO:  'bao_cao',
  DANH_MUC: 'danh_muc',
  ADMIN:    'admin',
} as const

const ACTIONS = {
  VIEW:   'view',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  IMPORT: 'import',
} as const

type ModuleValue = (typeof MODULES)[keyof typeof MODULES]
type ActionValue = (typeof ACTIONS)[keyof typeof ACTIONS]

// ─── SEED PERMISSIONS ────────────────────────────────────────────────────────

async function seedPermissions() {
  console.log('  Seeding permissions...')
  const permissionMap = new Map<string, { id: string }>()

  for (const mod of Object.values(MODULES) as ModuleValue[]) {
    for (const action of Object.values(ACTIONS) as ActionValue[]) {
      const permission = await prisma.permission.upsert({
        where: { module_action: { module: mod, action } },
        update: {},
        create: { module: mod, action, description: `Quyền ${action} trên module ${mod}` },
      })
      permissionMap.set(`${mod}:${action}`, permission)
    }
  }

  console.log(`    ${permissionMap.size} permissions`)
  return permissionMap
}

// ─── SEED ROLES ──────────────────────────────────────────────────────────────

async function seedRoles(permissionMap: Map<string, { id: string }>) {
  console.log('  Seeding roles...')

  const allModules = Object.values(MODULES) as ModuleValue[]
  const allActions = Object.values(ACTIONS) as ActionValue[]
  const nonAdminModules = allModules.filter((m) => m !== MODULES.ADMIN)

  const allPermKeys = allModules.flatMap((m) => allActions.map((a) => `${m}:${a}`))
  const managerPermKeys = nonAdminModules.flatMap((m) => allActions.map((a) => `${m}:${a}`))

  // Kỹ thuật viên: tài sản + kiểm tra + phiếu CV (không có admin, báo cáo nâng cao)
  const technicianPermKeys = [
    MODULES.TAI_SAN,
    MODULES.KIEM_TRA,
    MODULES.PHIEU_CV,
    MODULES.SU_CO,
  ].flatMap((m) => allActions.filter((a) => a !== ACTIONS.DELETE).map((a) => `${m}:${a}`))

  // Nhân viên sự cố: tiếp nhận sự cố + xem tài sản
  const staffPermKeys = [
    `${MODULES.TAI_SAN}:${ACTIONS.VIEW}`,
    `${MODULES.SU_CO}:${ACTIONS.VIEW}`,
    `${MODULES.SU_CO}:${ACTIONS.CREATE}`,
    `${MODULES.SU_CO}:${ACTIONS.UPDATE}`,
    `${MODULES.KIEM_TRA}:${ACTIONS.VIEW}`,
    `${MODULES.KIEM_TRA}:${ACTIONS.CREATE}`,
    `${MODULES.KIEM_TRA}:${ACTIONS.UPDATE}`,
    `${MODULES.BAO_CAO}:${ACTIONS.VIEW}`,
    `${MODULES.BAO_CAO}:${ACTIONS.EXPORT}`,
  ]

  const roleDefs = [
    {
      name: 'admin',
      displayName: 'Quản trị viên',
      description: 'Toàn quyền quản trị hệ thống',
      isSystem: true,
      permKeys: allPermKeys,
    },
    {
      name: 'manager',
      displayName: 'Quản lý',
      description: 'Xem tất cả, CRUD trừ module admin',
      isSystem: true,
      permKeys: managerPermKeys,
    },
    {
      name: 'technician',
      displayName: 'Kỹ thuật viên',
      description: 'Quản lý tài sản, kiểm tra, phiếu công việc, sự cố',
      isSystem: true,
      permKeys: technicianPermKeys,
    },
    {
      name: 'staff',
      displayName: 'Nhân viên',
      description: 'Tiếp nhận sự cố và kiểm tra hiện trạng',
      isSystem: true,
      permKeys: staffPermKeys,
    },
  ]

  const roleMap = new Map<string, string>()

  for (const roleDef of roleDefs) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { displayName: roleDef.displayName, description: roleDef.description },
      create: {
        name: roleDef.name,
        displayName: roleDef.displayName,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
    })

    roleMap.set(role.name, role.id)
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })

    const rolePermissions = roleDef.permKeys
      .filter((key) => permissionMap.has(key))
      .map((key) => ({ roleId: role.id, permissionId: permissionMap.get(key)!.id }))

    await prisma.rolePermission.createMany({ data: rolePermissions, skipDuplicates: true })
    console.log(`    Role "${roleDef.displayName}": ${rolePermissions.length} permissions`)
  }

  return roleMap
}

// ─── SEED ADMIN USER ─────────────────────────────────────────────────────────

async function seedAdminUser(adminRoleId: string) {
  console.log('  Seeding admin user...')
  const email = 'admin@htkt.com.vn'
  const plainPassword = 'Admin@123456'
  const hashedPassword = await bcrypt.hash(plainPassword, 12)

  await prisma.user.upsert({
    where: { email },
    update: { name: 'Quản trị viên', roleId: adminRoleId, isActive: true },
    create: {
      email,
      name: 'Quản trị viên',
      password: hashedPassword,
      roleId: adminRoleId,
      isActive: true,
    },
  })

  console.log(`    Admin: ${email} / ${plainPassword}`)
}

// ─── SEED ĐƠN VỊ HÀNH CHÍNH ─────────────────────────────────────────────────
// Theo Quyết định 19 — sau sáp nhập 2025, không còn cấp huyện
// Cấu trúc 2 cấp: Tỉnh → Phường/Xã trực thuộc

async function seedAdministrativeUnits() {
  console.log('  Seeding administrative units (Quảng Trị — QĐ19)...')

  // Đơn vị cấp xã/phường theo QĐ19 — trực thuộc tỉnh
  const QD19: { code: string; name: string }[] = [
    // PHƯỜNG
    { code: '18859', name: 'Phường Đồng Thuận' },
    { code: '18871', name: 'Phường Đồng Sơn' },
    { code: '18880', name: 'Phường Đồng Hới' },
    { code: '19009', name: 'Phường Ba Đồn' },
    { code: '19066', name: 'Phường Bắc Gianh' },
    { code: '19333', name: 'Phường Đông Hà' },
    { code: '19351', name: 'Phường Nam Đông Hà' },
    { code: '19360', name: 'Phường Quảng Trị' },
    // XÃ
    { code: '18901', name: 'Xã Minh Hóa' },
    { code: '18904', name: 'Xã Dân Hóa' },
    { code: '18919', name: 'Xã Tân Thành' },
    { code: '18922', name: 'Xã Kim Điền' },
    { code: '18943', name: 'Xã Kim Phú' },
    { code: '18949', name: 'Xã Đồng Lề' },
    { code: '18952', name: 'Xã Tuyên Sơn' },
    { code: '18958', name: 'Xã Tuyên Lâm' },
    { code: '18985', name: 'Xã Tuyên Phú' },
    { code: '18991', name: 'Xã Tuyên Bình' },
    { code: '18997', name: 'Xã Tuyên Hóa' },
    { code: '19021', name: 'Xã Phú Trạch' },
    { code: '19030', name: 'Xã Trung Thuận' },
    { code: '19033', name: 'Xã Hòa Trạch' },
    { code: '19051', name: 'Xã Tân Gianh' },
    { code: '19057', name: 'Xã Quảng Trạch' },
    { code: '19075', name: 'Xã Nam Ba Đồn' },
    { code: '19093', name: 'Xã Nam Gianh' },
    { code: '19111', name: 'Xã Hoàn Lão' },
    { code: '19126', name: 'Xã Bắc Trạch' },
    { code: '19138', name: 'Xã Phong Nha' },
    { code: '19141', name: 'Xã Bố Trạch' },
    { code: '19147', name: 'Xã Thượng Trạch' },
    { code: '19159', name: 'Xã Đông Trạch' },
    { code: '19198', name: 'Xã Nam Trạch' },
    { code: '19204', name: 'Xã Trường Sơn' },
    { code: '19207', name: 'Xã Quảng Ninh' },
    { code: '19225', name: 'Xã Ninh Châu' },
    { code: '19237', name: 'Xã Trường Ninh' },
    { code: '19246', name: 'Xã Lệ Ninh' },
    { code: '19249', name: 'Xã Lệ Thủy' },
    { code: '19255', name: 'Xã Cam Hồng' },
    { code: '19288', name: 'Xã Sen Ngư' },
    { code: '19291', name: 'Xã Tân Mỹ' },
    { code: '19309', name: 'Xã Trường Phú' },
    { code: '19318', name: 'Xã Kim Ngân' },
    { code: '19363', name: 'Xã Vĩnh Linh' },
    { code: '19366', name: 'Xã Bến Quan' },
    { code: '19372', name: 'Xã Vĩnh Hoàng' },
    { code: '19405', name: 'Xã Vĩnh Thủy' },
    { code: '19414', name: 'Xã Cửa Tùng' },
    { code: '19429', name: 'Xã Khe Sanh' },
    { code: '19432', name: 'Xã Lao Bảo' },
    { code: '19435', name: 'Xã Hướng Lập' },
    { code: '19441', name: 'Xã Hướng Phùng' },
    { code: '19462', name: 'Xã Tân Lập' },
    { code: '19483', name: 'Xã A Dơi' },
    { code: '19489', name: 'Xã Lìa' },
    { code: '19495', name: 'Xã Gio Linh' },
    { code: '19496', name: 'Xã Cửa Việt' },
    { code: '19501', name: 'Xã Bến Hải' },
    { code: '19537', name: 'Xã Cồn Tiên' },
    { code: '19555', name: 'Xã Hướng Hiệp' },
    { code: '19564', name: 'Xã Đakrông' },
    { code: '19567', name: 'Xã Ba Lòng' },
    { code: '19588', name: 'Xã Tà Rụt' },
    { code: '19594', name: 'Xã La Lay' },
    { code: '19597', name: 'Xã Cam Lộ' },
    { code: '19603', name: 'Xã Hiếu Giang' },
    { code: '19624', name: 'Xã Triệu Phong' },
    { code: '19639', name: 'Xã Nam Cửa Việt' },
    { code: '19645', name: 'Xã Triệu Bình' },
    { code: '19654', name: 'Xã Triệu Cơ' },
    { code: '19669', name: 'Xã Ái Tử' },
    { code: '19681', name: 'Xã Diên Sanh' },
    { code: '19699', name: 'Xã Vĩnh Định' },
    { code: '19702', name: 'Xã Hải Lăng' },
    { code: '19735', name: 'Xã Nam Hải Lăng' },
    { code: '19741', name: 'Xã Mỹ Thủy' },
    { code: '19742', name: 'Đặc khu Cồn Cỏ' },
  ]

  const qd19Codes = QD19.map((u) => u.code)

  // Xóa đơn vị cũ không còn trong QĐ19 (cả cấp huyện lẫn xã cũ)
  const toDelete = await prisma.administrativeUnit.findMany({
    where: {
      OR: [
        { type: 'QUAN_HUYEN' },
        { type: 'PHUONG_XA', code: { notIn: qd19Codes } },
      ],
    },
    select: { code: true },
  })
  if (toDelete.length > 0) {
    const codesToDelete = toDelete.map((u) => u.code)
    await prisma.user.deleteMany({ where: { email: { in: codesToDelete } } })
    await prisma.administrativeUnit.deleteMany({ where: { code: { in: codesToDelete } } })
    console.log(`    Đã xóa ${toDelete.length} đơn vị cũ (cấp huyện + xã cũ)`)
  }

  const tinh = await prisma.administrativeUnit.upsert({
    where: { code: '45' },
    update: { name: 'Quảng Trị', fullName: 'Tỉnh Quảng Trị' },
    create: { code: '45', name: 'Quảng Trị', fullName: 'Tỉnh Quảng Trị', type: 'TINH', isActive: true },
  })

  for (const px of QD19) {
    await prisma.administrativeUnit.upsert({
      where: { code: px.code },
      update: { name: px.name, parentId: tinh.id },
      create: { code: px.code, name: px.name, type: 'PHUONG_XA', parentId: tinh.id, isActive: true },
    })
  }

  console.log(`    Tỉnh Quảng Trị: ${QD19.length} đơn vị cấp xã/phường trực thuộc tỉnh (QĐ19)`)
}

// ─── SEED TÀI KHOẢN PHƯỜNG/XÃ ────────────────────────────────────────────────

async function seedWardUsers(staffRoleId: string) {
  console.log('  Seeding ward user accounts...')

  const defaultPassword = 'Abc@12345'
  const hashedPassword = await bcrypt.hash(defaultPassword, 12)

  const phuongXaUnits = await prisma.administrativeUnit.findMany({
    where: { type: 'PHUONG_XA', isActive: true },
    orderBy: { code: 'asc' },
  })

  let created = 0
  let synced = 0

  for (const unit of phuongXaUnits) {
    // Upsert: tài khoản phường/xã có email = code, name & wardId luôn bám theo
    // administrative_units (QĐ19). KHÔNG ghi đè mật khẩu của tài khoản đã có.
    const existing = await prisma.user.findUnique({ where: { email: unit.code } })
    if (existing) {
      if (existing.name !== unit.name || existing.wardId !== unit.id) {
        await prisma.user.update({
          where: { email: unit.code },
          data: { name: unit.name, wardId: unit.id },
        })
        synced++
      }
      continue
    }

    await prisma.user.create({
      data: {
        email: unit.code,
        name: unit.name,
        password: hashedPassword,
        roleId: staffRoleId,
        wardId: unit.id,
        isActive: true,
      },
    })
    created++
  }

  console.log(`    ${created} tài khoản mới, ${synced} đồng bộ lại tên/đơn vị (mật khẩu mặc định: ${defaultPassword})`)
}

// ─── SEED ASSET TYPES ────────────────────────────────────────────────────────

async function seedAssetTypes() {
  console.log('  Seeding asset types...')

  const assetTypes = [
    // GIAO THÔNG
    { code: 'GT_DUONG',   name: 'Đường giao thông',        domain: 'GIAO_THONG' as const },
    { code: 'GT_VIA_HE',  name: 'Vỉa hè / Lề đường',      domain: 'GIAO_THONG' as const },
    { code: 'GT_CAU',     name: 'Cầu',                     domain: 'GIAO_THONG' as const },
    { code: 'GT_CONG',    name: 'Cống hộp đường',          domain: 'GIAO_THONG' as const },
    { code: 'GT_DEN_TH',  name: 'Đèn tín hiệu giao thông', domain: 'GIAO_THONG' as const },
    { code: 'GT_BIEN',    name: 'Biển báo giao thông',     domain: 'GIAO_THONG' as const },
    // CẤP NƯỚC
    { code: 'CN_ONG_CAI', name: 'Đường ống cái cấp nước',  domain: 'CAP_NUOC' as const },
    { code: 'CN_ONG_PHAN',name: 'Đường ống phân phối',     domain: 'CAP_NUOC' as const },
    { code: 'CN_VAN',     name: 'Van khóa cấp nước',       domain: 'CAP_NUOC' as const },
    { code: 'CN_TRAM_BOM',name: 'Trạm bơm cấp nước',       domain: 'CAP_NUOC' as const },
    // THOÁT NƯỚC
    { code: 'TN_CONG',    name: 'Cống thoát nước',         domain: 'THOAT_NUOC' as const },
    { code: 'TN_HO_GA',   name: 'Hố ga / Miệng thu',       domain: 'THOAT_NUOC' as const },
    { code: 'TN_MUONG',   name: 'Mương thoát nước',        domain: 'THOAT_NUOC' as const },
    { code: 'TN_TRAM_BOM',name: 'Trạm bơm thoát nước',    domain: 'THOAT_NUOC' as const },
    // CHIẾU SÁNG
    { code: 'CS_DEN_DUONG',name: 'Đèn đường',              domain: 'CHIEU_SANG' as const },
    { code: 'CS_TRU_DIEN', name: 'Trụ điện chiếu sáng',   domain: 'CHIEU_SANG' as const },
    { code: 'CS_TU_DIEN',  name: 'Tủ điện chiếu sáng',    domain: 'CHIEU_SANG' as const },
    { code: 'CS_DAY_CAP',  name: 'Dây cáp điện chiếu sáng',domain: 'CHIEU_SANG' as const },
    // CÂY XANH
    { code: 'CX_CAY_DUONG',name: 'Cây xanh đường phố',    domain: 'CAY_XANH' as const },
    { code: 'CX_CONG_VIEN',name: 'Cây trong công viên',   domain: 'CAY_XANH' as const },
    { code: 'CX_THAO_VIEN',name: 'Thảm cỏ / Thảo viên',  domain: 'CAY_XANH' as const },
    // MÔI TRƯỜNG
    { code: 'MT_THUNG_RAC',name: 'Thùng rác công cộng',   domain: 'MOI_TRUONG' as const },
    { code: 'MT_NHA_CHO',  name: 'Nhà chờ xe buýt',       domain: 'MOI_TRUONG' as const },
    // CHỈNH TRANG
    { code: 'CT_TUONG_RAO',name: 'Tường rào / Hàng rào',  domain: 'CHINH_TRANG' as const },
    { code: 'CT_VIA_DAP',  name: 'Vỉa gạch / Đá vỉa',    domain: 'CHINH_TRANG' as const },
    { code: 'CT_BIEN_HIEU',name: 'Biển hiệu / Pano',      domain: 'CHINH_TRANG' as const },
  ]

  for (const at of assetTypes) {
    await prisma.assetType.upsert({
      where: { code: at.code },
      update: { name: at.name, domain: at.domain, isActive: true },
      create: { code: at.code, name: at.name, domain: at.domain, isActive: true },
    })
  }

  console.log(`    ${assetTypes.length} loại tài sản`)
}

// ─── SEED MẪU KIỂM TRA ───────────────────────────────────────────────────────

async function seedInspectionTemplates() {
  console.log('  Seeding inspection templates...')

  type InputType = 'RATING' | 'YES_NO' | 'TEXT' | 'NUMBER' | 'PHOTO'
  type Item = { name: string; inputType: InputType; isRequired: boolean }
  type Tpl = { name: string; domain: string; description: string; items: Item[] }

  const templates: Tpl[] = [
    {
      name: 'Kiểm tra đường giao thông',
      domain: 'GIAO_THONG',
      description: 'Mẫu kiểm tra định kỳ đường bộ, vỉa hè, biển báo',
      items: [
        { name: 'Mặt đường (ổ gà, nứt, lún)', inputType: 'RATING', isRequired: true },
        { name: 'Vỉa hè (gạch vỡ, lún sụt)', inputType: 'RATING', isRequired: true },
        { name: 'Thoát nước mặt đường', inputType: 'YES_NO', isRequired: true },
        { name: 'Biển báo đầy đủ, rõ ràng', inputType: 'YES_NO', isRequired: true },
        { name: 'Vạch kẻ đường còn rõ', inputType: 'YES_NO', isRequired: false },
        { name: 'Chiều rộng mặt đường thực tế (m)', inputType: 'NUMBER', isRequired: false },
        { name: 'Ghi chú hiện trạng', inputType: 'TEXT', isRequired: false },
        { name: 'Hình ảnh thực địa', inputType: 'PHOTO', isRequired: false },
      ],
    },
    {
      name: 'Kiểm tra cầu đường bộ',
      domain: 'GIAO_THONG',
      description: 'Mẫu kiểm tra định kỳ kết cấu cầu',
      items: [
        { name: 'Kết cấu nhịp cầu (nứt, gỉ sét)', inputType: 'RATING', isRequired: true },
        { name: 'Mặt cầu (ổ gà, bong tróc)', inputType: 'RATING', isRequired: true },
        { name: 'Lan can, tay vịn an toàn', inputType: 'YES_NO', isRequired: true },
        { name: 'Tải trọng cho phép còn phù hợp', inputType: 'YES_NO', isRequired: true },
        { name: 'Biển báo tải trọng đầy đủ', inputType: 'YES_NO', isRequired: true },
        { name: 'Ghi chú', inputType: 'TEXT', isRequired: false },
        { name: 'Hình ảnh', inputType: 'PHOTO', isRequired: false },
      ],
    },
    {
      name: 'Kiểm tra cống thoát nước',
      domain: 'THOAT_NUOC',
      description: 'Mẫu kiểm tra cống hộp, hố ga, mương thoát nước',
      items: [
        { name: 'Khả năng thoát nước (không bị tắc)', inputType: 'RATING', isRequired: true },
        { name: 'Tình trạng nắp hố ga (đủ, không vỡ)', inputType: 'YES_NO', isRequired: true },
        { name: 'Bùn lắng trong cống (cần nạo vét)', inputType: 'YES_NO', isRequired: true },
        { name: 'Kết cấu cống không nứt, sụt', inputType: 'RATING', isRequired: true },
        { name: 'Chiều sâu bùn lắng (cm)', inputType: 'NUMBER', isRequired: false },
        { name: 'Ghi chú', inputType: 'TEXT', isRequired: false },
        { name: 'Hình ảnh', inputType: 'PHOTO', isRequired: false },
      ],
    },
    {
      name: 'Kiểm tra đèn chiếu sáng đường phố',
      domain: 'CHIEU_SANG',
      description: 'Mẫu kiểm tra đèn đường, trụ đèn, cáp điện',
      items: [
        { name: 'Đèn hoạt động đúng giờ', inputType: 'YES_NO', isRequired: true },
        { name: 'Công suất ánh sáng đạt yêu cầu', inputType: 'RATING', isRequired: true },
        { name: 'Trụ đèn không nghiêng, gỉ sét', inputType: 'YES_NO', isRequired: true },
        { name: 'Dây điện/cáp không hở, an toàn', inputType: 'YES_NO', isRequired: true },
        { name: 'Tủ điện khoá đúng quy định', inputType: 'YES_NO', isRequired: false },
        { name: 'Số bóng hỏng cần thay', inputType: 'NUMBER', isRequired: false },
        { name: 'Ghi chú', inputType: 'TEXT', isRequired: false },
        { name: 'Hình ảnh', inputType: 'PHOTO', isRequired: false },
      ],
    },
    {
      name: 'Kiểm tra cây xanh đường phố',
      domain: 'CAY_XANH',
      description: 'Mẫu kiểm tra sinh trưởng, an toàn cây đường phố',
      items: [
        { name: 'Sinh trưởng cây (tốt/khá/xấu)', inputType: 'RATING', isRequired: true },
        { name: 'Cây không nghiêng ngả, nguy hiểm', inputType: 'YES_NO', isRequired: true },
        { name: 'Cành không xâm phạm công trình', inputType: 'YES_NO', isRequired: true },
        { name: 'Bồn cây đủ đất, không lún', inputType: 'YES_NO', isRequired: false },
        { name: 'Sâu bệnh hại (có/không)', inputType: 'YES_NO', isRequired: false },
        { name: 'Chu vi gốc cây (cm)', inputType: 'NUMBER', isRequired: false },
        { name: 'Ghi chú / đề xuất cắt tỉa', inputType: 'TEXT', isRequired: false },
        { name: 'Hình ảnh', inputType: 'PHOTO', isRequired: false },
      ],
    },
    {
      name: 'Kiểm tra đường ống cấp nước',
      domain: 'CAP_NUOC',
      description: 'Mẫu kiểm tra đường ống, van khoá, trạm bơm',
      items: [
        { name: 'Không rò rỉ, thất thoát nước', inputType: 'YES_NO', isRequired: true },
        { name: 'Áp lực nước đạt tiêu chuẩn', inputType: 'RATING', isRequired: true },
        { name: 'Van khoá hoạt động tốt', inputType: 'YES_NO', isRequired: true },
        { name: 'Không có hiện tượng ăn mòn', inputType: 'YES_NO', isRequired: false },
        { name: 'Áp lực thực tế (bar)', inputType: 'NUMBER', isRequired: false },
        { name: 'Ghi chú', inputType: 'TEXT', isRequired: false },
        { name: 'Hình ảnh', inputType: 'PHOTO', isRequired: false },
      ],
    },
    {
      name: 'Kiểm tra thiết bị môi trường đô thị',
      domain: 'MOI_TRUONG',
      description: 'Mẫu kiểm tra thùng rác, nhà chờ xe buýt',
      items: [
        { name: 'Tình trạng tổng thể', inputType: 'RATING', isRequired: true },
        { name: 'Không bị hỏng, mất mát', inputType: 'YES_NO', isRequired: true },
        { name: 'Sạch sẽ, không mùi hôi', inputType: 'YES_NO', isRequired: true },
        { name: 'Vị trí hợp lý, an toàn', inputType: 'YES_NO', isRequired: false },
        { name: 'Ghi chú', inputType: 'TEXT', isRequired: false },
        { name: 'Hình ảnh', inputType: 'PHOTO', isRequired: false },
      ],
    },
    {
      name: 'Kiểm tra công trình chỉnh trang đô thị',
      domain: 'CHINH_TRANG',
      description: 'Mẫu kiểm tra tường rào, pano, vỉa gạch',
      items: [
        { name: 'Tình trạng tổng thể', inputType: 'RATING', isRequired: true },
        { name: 'Không nứt, vỡ, nghiêng đổ', inputType: 'YES_NO', isRequired: true },
        { name: 'Màu sắc, hình thức còn đảm bảo', inputType: 'YES_NO', isRequired: false },
        { name: 'An toàn cho người đi đường', inputType: 'YES_NO', isRequired: true },
        { name: 'Ghi chú', inputType: 'TEXT', isRequired: false },
        { name: 'Hình ảnh', inputType: 'PHOTO', isRequired: false },
      ],
    },
  ]

  let created = 0
  for (const tpl of templates) {
    const existing = await prisma.inspectionTemplate.findFirst({ where: { name: tpl.name } })
    if (existing) continue

    const t = await prisma.inspectionTemplate.create({
      data: {
        name: tpl.name,
        domain: tpl.domain as InfrastructureDomain,
        description: tpl.description,
        isActive: true,
      },
    })

    for (let i = 0; i < tpl.items.length; i++) {
      const item = tpl.items[i]
      await prisma.inspectionTemplateItem.create({
        data: {
          templateId: t.id,
          name: item.name,
          inputType: item.inputType,
          isRequired: item.isRequired,
          sortOrder: i + 1,
        },
      })
    }
    created++
  }

  console.log(`    ${created} mẫu kiểm tra mới (${templates.length} tổng)`)
}

// ─── SEED MATERIAL CATEGORIES ────────────────────────────────────────────────

async function seedMaterialCategories() {
  console.log('  Seeding material categories...')

  const categories = [
    { code: 'VL_XD',   name: 'Vật liệu xây dựng' },
    { code: 'VL_DIEN', name: 'Vật tư điện' },
    { code: 'VL_NUOC', name: 'Vật tư đường ống nước' },
    { code: 'VL_CANH', name: 'Cây cảnh / Hạt giống' },
    { code: 'DUNG_CU', name: 'Dụng cụ / Thiết bị nhỏ' },
    { code: 'HOA_CHAT',name: 'Hoá chất / Sơn' },
    { code: 'KHAC',    name: 'Vật tư khác' },
  ]

  for (const cat of categories) {
    await prisma.materialCategory.upsert({
      where: { code: cat.code },
      update: { name: cat.name },
      create: { code: cat.code, name: cat.name, isActive: true },
    })
  }

  console.log(`    ${categories.length} nhóm vật tư`)
}

// ─── SEED FACILITY CONFIG ────────────────────────────────────────────────────

async function seedFacilityConfig() {
  console.log('  Seeding facility config...')
  const existing = await prisma.facilityConfig.findFirst()
  if (!existing) {
    await prisma.facilityConfig.create({
      data: {
        coQuanCapTren: 'ỦY BAN NHÂN DÂN TỈNH QUẢNG TRỊ',
        tenCoQuan: 'SỞ XÂY DỰNG QUẢNG TRỊ',
        tenDonVi: 'SỞ XÂY DỰNG QUẢNG TRỊ',
        diaChi: '',
        dienThoai: '',
        email: '',
        website: '',
      },
    })
    console.log('    Đã tạo cấu hình cơ quan mặc định')
  } else {
    await prisma.facilityConfig.update({
      where: { id: existing.id },
      data: {
        coQuanCapTren: existing.coQuanCapTren || 'ỦY BAN NHÂN DÂN TỈNH QUẢNG TRỊ',
        tenCoQuan: existing.tenCoQuan || 'SỞ XÂY DỰNG QUẢNG TRỊ',
        tenDonVi: existing.tenDonVi || 'SỞ XÂY DỰNG QUẢNG TRỊ',
      },
    })
    console.log('    Đã cập nhật cấu hình cơ quan')
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting seed...\n')

  const permissionMap = await seedPermissions()
  const roleMap = await seedRoles(permissionMap)

  const adminRoleId = roleMap.get('admin')
  if (!adminRoleId) throw new Error('Admin role not found!')
  await seedAdminUser(adminRoleId)

  await seedAdministrativeUnits()

  const staffRoleId = roleMap.get('staff')
  if (!staffRoleId) throw new Error('Staff role not found!')
  await seedWardUsers(staffRoleId)

  await seedAssetTypes()
  await seedInspectionTemplates()
  await seedMaterialCategories()
  await seedFacilityConfig()

  console.log('\nSeed completed successfully!')
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
