'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import {
  chuanNam, taoHoSo, chuyenBuoc, luuNoiDung, suaDoanNhanXet, soanTuDong, traVeBuocTruoc, type KetQuaThaoTac,
} from '@/lib/danh-gia-nam/may-chu'
import type { LoaiHoSo } from '@/lib/danh-gia-nam/quyen'
import type { DoDai } from '@/lib/danh-gia-nam/nhan-xet'
import { TIEU_CHI_CHUNG, type MucXepLoaiMa } from '@/lib/danh-gia-nam/tieu-chi'

// Mọi thao tác là server action dạng form: xong thì quay về trang hồ sơ kèm thông báo (?tb= / ?loi=).
// Kiểm quyền nằm ở lib/danh-gia-nam/may-chu.ts (xacDinhVaiTro), KHÔNG tin các trường ẩn trong form.

const s = (f: FormData, k: string) => String(f.get(k) ?? '')
function ve(canBoId: string, nam: number, loai: LoaiHoSo, r: KetQuaThaoTac | null, tb?: string): never {
  const q = new URLSearchParams({ nam: String(nam), loai })
  if (r && !r.ok) q.set('loi', r.loi); else if (tb) q.set('tb', tb)
  revalidatePath(`/dashboard/van-phong-so/ho-so/${canBoId}/danh-gia-nam`)
  redirect(`/dashboard/van-phong-so/ho-so/${canBoId}/danh-gia-nam?${q.toString()}`)
}
const loaiTu = (v: string): LoaiHoSo => (v === 'DANG_VIEN' ? 'DANG_VIEN' : 'CBCCVC')
const namTu = (v: string) => chuanNam(v) ?? 2026
const soHoacNull = (v: string) => { if (v.trim() === '') return null; const n = Number(v.replace(',', '.')); return Number.isFinite(n) ? n : NaN }

export async function taoHoSoAction(f: FormData) {
  const u = await requireAuth()
  const canBoId = s(f, 'canBoId'), nam = namTu(s(f, 'nam')), loai = loaiTu(s(f, 'loai'))
  ve(canBoId, nam, loai, await taoHoSo(u, canBoId, nam, loai), 'Đã lập hồ sơ.')
}

export async function luuAction(f: FormData) {
  const u = await requireAuth()
  const id = s(f, 'reviewId'), canBoId = s(f, 'canBoId'), nam = namTu(s(f, 'nam')), loai = loaiTu(s(f, 'loai'))
  const phan = s(f, 'phan')
  let r: KetQuaThaoTac | null = null
  if (phan === 'tuDanhGia') r = await luuNoiDung(u, id, { tuDanhGia: s(f, 'noiDung') })
  else if (phan === 'nhanXetLanhDao') r = await luuNoiDung(u, id, { nhanXetLanhDao: s(f, 'noiDung') })
  else if (phan === 'diem') {
    const diemChung: Record<string, number | null> = {}
    for (const c of TIEU_CHI_CHUNG) {
      const v = soHoacNull(s(f, `d_${c.ma}`))
      if (Number.isNaN(v)) return ve(canBoId, nam, loai, { ok: false, loi: `Điểm ${c.ma} không phải số.` })
      diemChung[c.ma] = v
    }
    const kpi = soHoacNull(s(f, 'diemKpiTong'))
    if (Number.isNaN(kpi)) return ve(canBoId, nam, loai, { ok: false, loi: 'Điểm KPI không phải số.' })
    const diemQuy: Record<string, number | null> = {}
    for (const q of ['I', 'II', 'III', 'IV']) { const v = soHoacNull(s(f, `q_${q}`)); diemQuy[q] = Number.isNaN(v) ? null : v }
    // Điều kiện xếp loại do người tổng hợp xác nhận (nguồn: văn bản hướng dẫn của Sở): top 20%, số quý xuất sắc / không hoàn thành
    diemQuy.top20 = f.get('top20') === 'on' ? 1 : 0
    for (const [k, ten] of [['soQuyXuatSac', 'qxs'], ['soQuyKHT', 'qkht']] as const) {
      const v = soHoacNull(s(f, ten)); diemQuy[k] = v === null || Number.isNaN(v) ? 0 : Math.max(0, Math.min(4, Math.trunc(v)))
    }
    r = await luuNoiDung(u, id, { diemChung, diemKpiTong: kpi, diemQuy })
  } else if (phan === 'mucDeXuat') r = await luuNoiDung(u, id, { mucDeXuat: (s(f, 'muc') || null) as MucXepLoaiMa | null })
  else r = { ok: false, loi: 'Phần không hợp lệ.' }
  ve(canBoId, nam, loai, r, 'Đã lưu.')
}

export async function suaDoanAction(f: FormData) {
  const u = await requireAuth()
  const canBoId = s(f, 'canBoId'), nam = namTu(s(f, 'nam')), loai = loaiTu(s(f, 'loai'))
  const nguon = s(f, 'nguon').split(/[,;\n]/).map((x) => x.trim()).filter(Boolean)
  ve(canBoId, nam, loai, await suaDoanNhanXet(u, s(f, 'reviewId'), s(f, 'muc'), s(f, 'noiDung'), nguon), 'Đã sửa đoạn nhận xét.')
}

export async function soanTuDongAction(f: FormData) {
  const u = await requireAuth()
  const canBoId = s(f, 'canBoId'), nam = namTu(s(f, 'nam')), loai = loaiTu(s(f, 'loai'))
  const dd = (['NGAN_GON', 'TIEU_CHUAN', 'CHI_TIET'].includes(s(f, 'doDai')) ? s(f, 'doDai') : 'TIEU_CHUAN') as DoDai
  ve(canBoId, nam, loai, await soanTuDong(u, s(f, 'reviewId'), dd), 'Đã soạn từ dữ liệu hệ thống; các đoạn đã sửa tay được giữ nguyên.')
}

export async function chuyenBuocAction(f: FormData) {
  const u = await requireAuth()
  const canBoId = s(f, 'canBoId'), nam = namTu(s(f, 'nam')), loai = loaiTu(s(f, 'loai'))
  ve(canBoId, nam, loai, await chuyenBuoc(u, s(f, 'reviewId'), s(f, 'mucPheDuyet') || undefined), 'Đã chuyển bước.')
}

export async function traVeAction(f: FormData) {
  const u = await requireAuth()
  const canBoId = s(f, 'canBoId'), nam = namTu(s(f, 'nam')), loai = loaiTu(s(f, 'loai'))
  ve(canBoId, nam, loai, await traVeBuocTruoc(u, s(f, 'reviewId'), s(f, 'lyDo')), 'Đã trả về bước trước.')
}
