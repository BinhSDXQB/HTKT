'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser, isLeadership } from '@/lib/auth'
import { loaiMaNangLuc } from '@/lib/xd-lien-thong/dinh-danh'

// CRUD năng lực HĐXD cá nhân (chứng chỉ hành nghề) — bảng httt_nang_luc_ca_nhan.
// Khi lưu, TỰ KHỞI TẠO mã định danh vào sổ httt_dinh_danh (NĐ212 Đ19/21): cá nhân VN=CCCD.
// Quản lý: admin / lãnh đạo Sở / cán bộ Sở (phân quyền tinh chỉnh sau).

const db_ = db as unknown as {
  httt_nang_luc_ca_nhan: {
    findMany: (a: unknown) => Promise<Record<string, unknown>[]>
    findUnique: (a: unknown) => Promise<Record<string, unknown> | null>
    create: (a: unknown) => Promise<{ id: string }>
    update: (a: unknown) => Promise<{ id: string }>
  }
  httt_dinh_danh: {
    findFirst: (a: unknown) => Promise<{ id: string } | null>
    create: (a: unknown) => Promise<{ id: string }>
    update: (a: unknown) => Promise<unknown>
  }
}

export type NangLucCaNhanRow = {
  id: string; hoTen: string; maDinhDanh: string | null; loaiMa: string
  linhVucHanhNghe: string | null; hangChungChi: string | null
  soChungChi: string | null; trangThai: string; thoiHan: string | null
  dinhDanhId: string | null
}
export type NlResult = { ok: boolean; error?: string; id?: string }

export type NangLucCaNhanInput = {
  id?: string
  hoTen: string
  maDinhDanh?: string        // CCCD (VN) hoặc hộ chiếu
  laCongDanVN?: boolean      // true → CCCD, false → hộ chiếu
  linhVucHanhNghe?: string
  hangChungChi?: string      // I|II|III
  thoiHanChungChi?: string
  coSoDaoTao?: string
  trinhDoChuyenMon?: string
  soChungChi?: string
  loaiCap?: string           // CAP_MOI|CAP_LAI|CHUYEN_DOI
  quyetDinhCap?: string
  coQuanCap?: string
  ngayCap?: string
}

function parseDate(v?: string): Date | null {
  if (!v || !v.trim()) return null
  const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d
}
async function requireManage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const canManage = user.role.name === 'admin' || isLeadership(user) || user.toChucId != null
  return { user, canManage }
}

export async function listNangLucCaNhan(): Promise<NangLucCaNhanRow[]> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const rows = await db_.httt_nang_luc_ca_nhan.findMany({
    where: { deleted_at: null }, orderBy: { created_at: 'desc' }, take: 500,
  })
  return rows.map((r) => ({
    id: r.id as string,
    hoTen: r.ho_ten as string,
    maDinhDanh: (r.ma_dinh_danh as string) ?? null,
    loaiMa: r.loai_ma as string,
    linhVucHanhNghe: (r.linh_vuc_hanh_nghe as string) ?? null,
    hangChungChi: (r.hang_chung_chi as string) ?? null,
    soChungChi: (r.so_chung_chi as string) ?? null,
    trangThai: r.trang_thai as string,
    thoiHan: r.thoi_han_chung_chi ? (r.thoi_han_chung_chi as Date).toISOString() : null,
    dinhDanhId: (r.dinh_danh_id as string) ?? null,
  }))
}

/** Khởi tạo/liên kết mã định danh năng lực cá nhân vào sổ httt_dinh_danh (Đ19/21). */
async function upsertDinhDanh(maDinhDanh: string | null, loaiMa: string, bangLocal: string, idLocal: string): Promise<string | null> {
  if (!maDinhDanh) return null
  const existed = await db_.httt_dinh_danh.findFirst({
    where: { loai_doi_tuong: 'NANG_LUC_CA_NHAN', ma_dinh_danh: maDinhDanh }, select: { id: true },
  })
  if (existed) {
    await db_.httt_dinh_danh.update({ where: { id: existed.id }, data: { bang_local: bangLocal, id_local: idLocal } })
    return existed.id
  }
  const dd = await db_.httt_dinh_danh.create({
    data: {
      loai_doi_tuong: 'NANG_LUC_CA_NHAN', ma_dinh_danh: maDinhDanh, loai_ma: loaiMa,
      bang_local: bangLocal, id_local: idLocal,
      trang_thai_dong_bo: 'DA_KHOI_TAO', thoi_diem_khoi_tao: new Date(),
    },
  })
  return dd.id
}

function buildData(input: NangLucCaNhanInput, loaiMa: string) {
  return {
    ho_ten: input.hoTen.trim(),
    ma_dinh_danh: input.maDinhDanh?.trim() || null,
    loai_ma: loaiMa,
    linh_vuc_hanh_nghe: input.linhVucHanhNghe?.trim() || null,
    hang_chung_chi: input.hangChungChi || null,
    thoi_han_chung_chi: parseDate(input.thoiHanChungChi),
    co_so_dao_tao: input.coSoDaoTao?.trim() || null,
    trinh_do_chuyen_mon: input.trinhDoChuyenMon?.trim() || null,
    so_chung_chi: input.soChungChi?.trim() || null,
    loai_cap: input.loaiCap || null,
    quyet_dinh_cap: input.quyetDinhCap?.trim() || null,
    co_quan_cap: input.coQuanCap?.trim() || null,
    ngay_cap: parseDate(input.ngayCap),
  }
}

export async function saveNangLucCaNhan(input: NangLucCaNhanInput): Promise<NlResult> {
  const { user, canManage } = await requireManage()
  if (!canManage) return { ok: false, error: 'Không có quyền quản lý năng lực HĐXD.' }
  if (!input.hoTen?.trim()) return { ok: false, error: 'Vui lòng nhập họ tên.' }

  const loaiMa = loaiMaNangLuc('CA_NHAN', input.laCongDanVN !== false)
  const data = buildData(input, loaiMa)

  try {
    let id: string
    if (input.id) {
      const cur = await db_.httt_nang_luc_ca_nhan.findUnique({ where: { id: input.id }, select: { id: true } })
      if (!cur) return { ok: false, error: 'Không tìm thấy bản ghi.' }
      await db_.httt_nang_luc_ca_nhan.update({ where: { id: input.id }, data })
      id = input.id
    } else {
      const created = await db_.httt_nang_luc_ca_nhan.create({ data: { ...data, created_by_id: user.id, to_chuc_id: user.toChucId } })
      id = created.id
    }
    // Khởi tạo/liên kết mã định danh vào sổ liên thông.
    const ddId = await upsertDinhDanh(data.ma_dinh_danh, loaiMa, 'httt_nang_luc_ca_nhan', id)
    if (ddId) await db_.httt_nang_luc_ca_nhan.update({ where: { id }, data: { dinh_danh_id: ddId } })

    revalidatePath('/dashboard/nang-luc-hdxd')
    return { ok: true, id }
  } catch (e) {
    console.error('[saveNangLucCaNhan]', e)
    return { ok: false, error: 'Lỗi lưu dữ liệu, vui lòng thử lại.' }
  }
}

export async function deleteNangLucCaNhan(id: string): Promise<NlResult> {
  const { canManage } = await requireManage()
  if (!canManage) return { ok: false, error: 'Không có quyền xoá.' }
  try {
    await db_.httt_nang_luc_ca_nhan.update({ where: { id }, data: { deleted_at: new Date() } })
    revalidatePath('/dashboard/nang-luc-hdxd')
    return { ok: true }
  } catch (e) {
    console.error('[deleteNangLucCaNhan]', e)
    return { ok: false, error: 'Lỗi xoá dữ liệu.' }
  }
}
