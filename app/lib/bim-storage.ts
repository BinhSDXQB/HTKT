import 'server-only'
import { createHash } from 'crypto'
import { createWriteStream } from 'fs'
import { mkdir, stat, open } from 'fs/promises'
import path from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { db } from '@/lib/db'

// NĐ 175/2024/NĐ-CP (kế thừa tại NĐ 217/2026/NĐ-CP — Điều 8 BIM, hiệu lực 01/7/2026): mỗi tệp BIM không quá 500 MB
export const BIM_MAX_FILE_BYTES = 500 * 1024 * 1024

// Ổ lưu trữ — cấu hình qua env, mặc định C:\BIM_Storage (private, ngoài webroot)
export function bimStorageDir(): string {
  return process.env.BIM_STORAGE_DIR || 'C:\\BIM_Storage'
}

export const BIM_DISCIPLINES = [
  'KIEN_TRUC', 'KET_CAU', 'CO_DIEN', 'HA_TANG_GIAO_THONG',
  'CAP_THOAT_NUOC', 'CHIEU_SANG', 'TONG_HOP',
] as const

export const BIM_STAGES = ['NCTKT', 'NCKT_TKCS', 'TK_KY_THUAT', 'TK_BAN_VE_THI_CONG', 'HOAN_CONG'] as const
export const BIM_LODS = ['LOD_100', 'LOD_200', 'LOD_300', 'LOD_350', 'LOD_400', 'LOD_500'] as const
export const BIM_FILE_KINDS = ['GOC', 'IFC', 'PHU_TRO'] as const

// Định dạng cho phép theo kind — chặn upload file nguy hiểm (nguyên tắc bảo mật)
const ALLOWED_EXT: Record<string, string[]> = {
  GOC: ['rvt', 'rfa', 'dgn', 'pln', 'skp', 'nwd', 'nwc', 'dwg', 'dxf', '3dm'],
  IFC: ['ifc', 'ifczip'],
  PHU_TRO: ['bcf', 'bcfzip', 'pdf', 'docx', 'xlsx', 'zip', 'png', 'jpg'],
}

export function validateExtension(kind: string, fileName: string): { ok: boolean; ext: string } {
  const ext = (fileName.split('.').pop() || '').toLowerCase()
  const allowed = ALLOWED_EXT[kind] || []
  return { ok: allowed.includes(ext), ext }
}

/** Sinh mã mô hình nghiệp vụ BIM-YYYY-NNNN (đếm theo năm). */
export async function nextMaMoHinh(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await db.bimModel.count({
    where: { maMoHinh: { startsWith: `BIM-${year}-` } },
  })
  return `BIM-${year}-${String(count + 1).padStart(4, '0')}`
}

/** Mã container theo ISO 19650: QT-SXD-BIM-2026-0001-V03 */
export function maContainer(maMoHinh: string, versionNo: number): string {
  return `QT-SXD-${maMoHinh}-V${String(versionNo).padStart(2, '0')}`
}

/**
 * Ghi stream upload xuống đĩa + tính SHA-256 song song.
 * Trả về { absPath, relPath, size, sha256 }. Throw nếu vượt 500MB.
 */
export async function saveBimStream(args: {
  webStream: ReadableStream<Uint8Array>
  modelId: string
  versionId: string
  fileName: string
}): Promise<{ absPath: string; relPath: string; size: number; sha256: string }> {
  // Tên file an toàn: bỏ ký tự lạ, chống path traversal
  const safeName = path.basename(args.fileName).replace(/[^\w.\-()À-ỹ ]/g, '_')
  const relPath = path.join(args.modelId, args.versionId, `${Date.now()}_${safeName}`)
  const absPath = path.join(bimStorageDir(), relPath)
  await mkdir(path.dirname(absPath), { recursive: true })

  const hash = createHash('sha256')
  let size = 0

  const nodeStream = Readable.fromWeb(args.webStream as never)
  nodeStream.on('data', (chunk: Buffer) => {
    size += chunk.length
    hash.update(chunk)
    if (size > BIM_MAX_FILE_BYTES) {
      nodeStream.destroy(new Error('FILE_TOO_LARGE'))
    }
  })

  await pipeline(nodeStream, createWriteStream(absPath))

  return { absPath, relPath, size, sha256: hash.digest('hex') }
}

/**
 * Đọc header file IFC (dòng FILE_SCHEMA) để xác định phiên bản schema.
 * IFC là file text STEP — schema nằm trong ~2KB đầu.
 */
export async function detectIfcSchema(absPath: string): Promise<string | null> {
  const fh = await open(absPath, 'r')
  try {
    const buf = Buffer.alloc(4096)
    const { bytesRead } = await fh.read(buf, 0, 4096, 0)
    const head = buf.subarray(0, bytesRead).toString('latin1')
    const m = head.match(/FILE_SCHEMA\s*\(\s*\(\s*'([^']+)'/i)
    if (!m) return null
    const schema = m[1].toUpperCase()
    if (schema.startsWith('IFC4X3')) return 'IFC4X3'
    if (schema.startsWith('IFC4')) return 'IFC4'
    if (schema.startsWith('IFC2X3')) return 'IFC2X3'
    return schema
  } finally {
    await fh.close()
  }
}

type CheckResult = { checkCode: string; ketQua: 'PASS' | 'FAIL' | 'WARNING'; chiTiet?: object }

/**
 * Bộ kiểm tra hợp lệ B1 theo NĐ 175/2024 (kế thừa tại NĐ 217/2026) — mức tiếp nhận, chưa parse hình học.
 * Kiểm tra sâu (HAS_GEOMETRY_3D, HAS_MAIN_DIMENSIONS) thuộc đợt B3 khi có web-ifc.
 */
export async function runBasicChecks(args: {
  fileId: string
  kind: string
  absPath: string
  size: number
}): Promise<CheckResult[]> {
  const results: CheckResult[] = []

  // 1. Dung lượng ≤ 500MB
  results.push({
    checkCode: 'FILE_SIZE_500MB',
    ketQua: args.size <= BIM_MAX_FILE_BYTES ? 'PASS' : 'FAIL',
    chiTiet: { sizeByte: args.size, maxByte: BIM_MAX_FILE_BYTES },
  })

  // 2. Schema IFC (chỉ file IFC)
  if (args.kind === 'IFC') {
    const schema = await detectIfcSchema(args.absPath)
    if (schema === 'IFC4' || schema === 'IFC4X3') {
      results.push({ checkCode: 'IFC_SCHEMA_VALID', ketQua: 'PASS', chiTiet: { schema } })
    } else if (schema === 'IFC2X3') {
      // Quy định BIM (NĐ 175/2024, kế thừa tại NĐ 217/2026) yêu cầu IFC 4.0 — IFC2x3 cũ, cảnh báo yêu cầu bổ sung
      results.push({ checkCode: 'IFC_SCHEMA_VALID', ketQua: 'WARNING', chiTiet: { schema, note: 'IFC2X3 cũ — quy định BIM (NĐ 217/2026) yêu cầu IFC 4.0' } })
    } else {
      results.push({ checkCode: 'IFC_SCHEMA_VALID', ketQua: 'FAIL', chiTiet: { schema: schema || 'KHONG_DOC_DUOC' } })
    }
  }

  // Ghi DB
  for (const r of results) {
    await db.bimValidationCheck.create({
      data: { fileId: args.fileId, checkCode: r.checkCode, ketQua: r.ketQua, chiTiet: r.chiTiet as never },
    })
  }
  return results
}

/** Tính diện tích đĩa còn trống của ổ chứa BIM storage (cảnh báo trước khi nhận file). */
export async function storageDirExists(): Promise<boolean> {
  try {
    await stat(bimStorageDir())
    return true
  } catch {
    return false
  }
}

/**
 * Quyền truy cập mô hình:
 * - admin/manager: full
 * - có bản ghi bim_view_permissions khớp user/role/toChuc: theo quyền cấp
 */
export async function canAccessModel(user: {
  id: string
  toChucId: string | null
  role: { id: string; name: string }
}, modelId: string, need: 'VIEW' | 'DOWNLOAD' | 'MANAGE'): Promise<boolean> {
  if (user.role.name === 'admin' || user.role.name === 'manager') return true

  const perms = await db.bimViewPermission.findMany({
    where: {
      modelId,
      OR: [
        { userId: user.id },
        { roleId: user.role.id },
        ...(user.toChucId ? [{ toChucId: user.toChucId }] : []),
      ],
    },
    select: { quyen: true },
  })
  if (perms.length === 0) return false
  const rank = { VIEW: 1, DOWNLOAD: 2, MANAGE: 3 }
  const have = Math.max(...perms.map((p) => rank[p.quyen as keyof typeof rank] || 0))
  return have >= rank[need]
}

/** QĐ 258/QĐ-TTg: xác định hồ sơ có thuộc diện bắt buộc BIM không (theo năm hiện tại 2026). */
export function isBimMandatory(capCongTrinh: string | null, nguonVon: string | null): boolean {
  if (!capCongTrinh) return false
  const capCaoHonII = ['CAP_DAC_BIET', 'CAP_I', 'CAP_II'].includes(capCongTrinh)
  if (!capCaoHonII) return false
  // Từ 2025: vốn đầu tư công/NN/PPP cấp II trở lên; từ 2026: mọi nguồn vốn cấp II trở lên
  return true
}
