'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAuth, isLeadership, type CurrentUser } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { MODULES } from '@/lib/permissions'

// ===== Phân công động & tự sinh công việc định kỳ — Phòng HTKT (mig 028) =====
// Quản lý (đổi người phụ trách, sinh việc): admin/Lãnh đạo Sở hoặc Trưởng/Phó phòng
// của chính phòng đó. Xem: mọi cán bộ trong phòng (gate ở requireHtktAccess/trang).

const HTKT_TOCHUC_ID = 'cmpz3u7uf000bf0umpijd8stn'

function canManagePhanCong(user: CurrentUser, toChucId: string): boolean {
  if (isLeadership(user)) return true
  return !!(user.isDepartmentLeader && user.toChucId === toChucId)
}

export type PhanCongState = { error?: string; ok?: boolean; created?: number } | null

/** Đổi người phụ trách chính / người phối hợp (làm thay) của một lĩnh vực. */
export async function reassignLinhVucAction(prev: PhanCongState, formData: FormData): Promise<PhanCongState> {
  const user = await requireAuth()
  const id = String(formData.get('id') ?? '')
  const nguoiPhuTrachId = String(formData.get('nguoiPhuTrachId') ?? '').trim() || null
  const phoiHopRaw = formData.getAll('nguoiPhoiHopIds').map(String).filter(Boolean)
  const ghiChu = String(formData.get('ghiChu') ?? '').trim() || null

  const row = await db.phanCongLinhVuc.findUnique({ where: { id } })
  if (!row) return { error: 'Không tìm thấy phân công lĩnh vực.' }
  if (!canManagePhanCong(user, row.toChucId)) return { error: 'Chỉ Lãnh đạo phòng/Sở mới được điều chỉnh phân công.' }

  await db.phanCongLinhVuc.update({
    where: { id },
    data: {
      nguoiPhuTrachId,
      nguoiPhoiHopIds: phoiHopRaw.filter((u) => u !== nguoiPhuTrachId),
      ghiChu,
    },
  })
  await logAction({
    userId: user.id, action: 'UPDATE', module: MODULES.HTKT, targetId: id, targetType: 'PhanCongLinhVuc',
    detail: `Điều chỉnh phân công lĩnh vực ${row.linhVucTen}`,
  })
  revalidatePath('/dashboard/phong-htkt/phan-cong')
  return { ok: true }
}

// ── Tính nhãn & khoá kỳ ──────────────────────────────────────────────────────
function kyThang(y: number, m: number) {
  return { label: `tháng ${m}/${y}`, seg: `${y}-${String(m).padStart(2, '0')}`, next: new Date(Date.UTC(y, m, 1)) }
}
function kyQuy(y: number, q: number) {
  return { label: `quý ${q}/${y}`, seg: `${y}-Q${q}`, next: new Date(Date.UTC(y, q * 3, 1)) }
}
function kyNam(y: number) {
  return { label: `năm ${y}`, seg: `${y}`, next: new Date(Date.UTC(y + 1, 0, 1)) }
}
function hetHan(nextStart: Date, soNgay: number): Date {
  const d = new Date(nextStart)
  d.setUTCDate(d.getUTCDate() + soNgay)
  return d
}

/**
 * Tự sinh công việc định kỳ cho tháng được chọn (mặc định tháng hiện tại):
 *  - mẫu THANG → sinh cho tháng đó;
 *  - mẫu QUY  → sinh khi tháng là cuối quý (3,6,9,12);
 *  - mẫu NAM  → sinh khi tháng = 12.
 * Mỗi mẫu phamVi=MOI_LINH_VUC sinh 1 việc / lĩnh vực, gắn đúng người phụ trách.
 * Idempotent nhờ cong_viec.dinhKyKey (chạy lại không tạo trùng).
 */
export async function sinhCongViecDinhKyAction(prev: PhanCongState, formData: FormData): Promise<PhanCongState> {
  const user = await requireAuth()
  const toChucId = String(formData.get('toChucId') ?? HTKT_TOCHUC_ID)
  if (!canManagePhanCong(user, toChucId)) return { error: 'Chỉ Lãnh đạo phòng/Sở mới được sinh công việc định kỳ.' }

  const thangRaw = String(formData.get('thang') ?? '') // YYYY-MM
  const now = new Date()
  let y = now.getFullYear(), m = now.getMonth() + 1
  const mt = /^(\d{4})-(\d{2})$/.exec(thangRaw)
  if (mt) { y = parseInt(mt[1], 10); m = parseInt(mt[2], 10) }

  const [dinhKys, linhVucs] = await Promise.all([
    db.phanCongDinhKy.findMany({ where: { toChucId, isActive: true } }),
    db.phanCongLinhVuc.findMany({ where: { toChucId, isActive: true }, orderBy: { thuTu: 'asc' } }),
  ])

  type Row = {
    maCongViec: string; tieuDe: string; moTa: string | null; toChucId: string; loaiId: string | null
    uuTien: never; nguoiGiaoId: string; nguoiPhuTrachId: string | null
    ngayBatDau: Date; ngayHetHan: Date; dinhKyKey: string; customFields: unknown; createdById: string
  }
  const rows: Row[] = []
  let counter = await db.congViec.count({ where: { maCongViec: { startsWith: `CV-${y}-` } } })

  for (const dk of dinhKys) {
    let ky: { label: string; seg: string; next: Date } | null = null
    if (dk.tanSuat === 'THANG') ky = kyThang(y, m)
    else if (dk.tanSuat === 'QUY' && m % 3 === 0) ky = kyQuy(y, m / 3)
    else if (dk.tanSuat === 'NAM' && m === 12) ky = kyNam(y)
    if (!ky) continue

    const ngayBatDau = new Date(Date.UTC(y, m - 1, 1))
    const ngayHetHan = hetHan(ky.next, dk.soNgayHetHan)

    const targets =
      dk.phamVi === 'CA_NHAN'
        ? [{ linhVucKey: '', linhVucTen: '', nguoiPhuTrachId: dk.nguoiPhuTrachId }]
        : linhVucs.map((lv) => ({ linhVucKey: lv.linhVucKey, linhVucTen: lv.linhVucTen, nguoiPhuTrachId: lv.nguoiPhuTrachId }))

    for (const t of targets) {
      counter += 1
      const tieuDe = dk.ten.replace('{ky}', ky.label).replace('{linhVuc}', t.linhVucTen || 'chung')
      rows.push({
        maCongViec: `CV-${y}-${String(counter).padStart(6, '0')}`,
        tieuDe,
        moTa: dk.moTa,
        toChucId,
        loaiId: dk.loaiId,
        uuTien: dk.uuTien as never,
        nguoiGiaoId: user.id,
        nguoiPhuTrachId: t.nguoiPhuTrachId,
        ngayBatDau,
        ngayHetHan,
        dinhKyKey: `${dk.id}:${t.linhVucKey}:${ky.seg}`,
        customFields: { dinhKyId: dk.id, linhVucKey: t.linhVucKey || null, ky: ky.seg, tanSuat: dk.tanSuat },
        createdById: user.id,
      })
    }
  }

  if (rows.length === 0) return { ok: true, created: 0 }
  const res = await db.congViec.createMany({ data: rows as never, skipDuplicates: true })
  await logAction({
    userId: user.id, action: 'CREATE', module: MODULES.HTKT, targetType: 'CongViec',
    detail: `Tự sinh ${res.count} công việc định kỳ (tháng ${m}/${y})`,
  })
  revalidatePath('/dashboard/phong-htkt/phan-cong')
  revalidatePath('/dashboard/phong-htkt/bao-cao')
  revalidatePath('/dashboard/cong-viec')
  return { ok: true, created: res.count }
}
