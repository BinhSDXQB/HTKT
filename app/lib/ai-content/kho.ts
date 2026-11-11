/**
 * KHO DỮ LIỆU + NGHIỆP VỤ của module Nội dung AI (bảng ai_*, migration 050).
 *
 * Không import Prisma/Next: nhận một `Db` tối thiểu (q + tx) để cùng một mã chạy được với
 * Prisma (route), với pg (worker, test tích hợp trên CSDL thử).
 * Mọi thao tác ghi đi trong MỘT giao dịch, khoá hàng bài viết (FOR UPDATE) và ghi nhật ký
 * ai_audit_events trong cùng giao dịch — nhật ký lỗi thì thao tác cũng không thành (fail-closed).
 */
import { createHash, randomUUID } from 'node:crypto'
import {
  bamNoiDung, chuanHoa, kiemTraCongXuatBan, kiemTraBienThe, chuyenTheTheoQuyTac, gioDiaPhuongSangUtc,
  lyDoKhongDuocDuyet, duocSoan, laKenh, phanLoaiLoi, trangThaiSauLoi, thoiGianCho,
  PHAN_LOAI, MUI_GIO_MAC_DINH, type Kenh, type NguoiDungToiThieu, type NguonTrich,
} from './nghiep-vu'
import { duocChuyenNoiDung, type TrangThaiNoiDung, type TrangThaiLich } from './trang-thai'

export type Db = {
  q<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>
  tx<T>(fn: (d: Db) => Promise<T>): Promise<T>
}

export class LoiNghiepVu extends Error {
  ma: number
  chiTiet?: string[]
  constructor(ma: number, thongBao: string, chiTiet?: string[]) {
    super(thongBao)
    this.ma = ma
    this.chiTiet = chiTiet
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function laUuid(s: unknown): s is string { return typeof s === 'string' && UUID.test(s) }
function canUuid(s: unknown, ten: string): string {
  if (!laUuid(s)) throw new LoiNghiepVu(400, `${ten} không hợp lệ`)
  return s
}

type Bai = {
  id: string; title: string; status: TrangThaiNoiDung; classification: string
  ai_generated: boolean; may_mislead: boolean; current_version_id: string; created_by: string
}
type PhienBan = { id: string; version_no: number; title: string; body_md: string; content_hash: string; created_by: string }
type BienThe = { id: string; channel: Kenh; body: string; created_by: string }

const GIOI_HAN_TIEU_DE = 300
const GIOI_HAN_THAN_BAI = 100_000

async function ghiNhatKy(d: Db, cid: string, actorId: string | null, action: string, loai: string, id: string, detail: object = {}) {
  await d.q(
    `insert into ai_audit_events (correlation_id, actor_id, action, target_type, target_id, detail)
     values ($1::uuid, $2, $3, $4, $5, $6::jsonb)`,
    [cid, actorId, action, loai, id, JSON.stringify(detail)],
  )
}

async function khoaBai(d: Db, id: string): Promise<Bai> {
  const [b] = await d.q<Bai>(
    `select id::text, title, status, classification, ai_generated, may_mislead,
            current_version_id::text, created_by
       from ai_content_items where id = $1::uuid and deleted_at is null for update`, [id])
  if (!b) throw new LoiNghiepVu(404, 'Không tìm thấy bài viết')
  return b
}

async function layPhienBan(d: Db, id: string): Promise<PhienBan> {
  const [v] = await d.q<PhienBan>(
    `select id::text, version_no, title, body_md, content_hash, created_by from ai_content_versions where id = $1::uuid`, [id])
  if (!v) throw new LoiNghiepVu(500, 'Thiếu phiên bản hiện hành')
  return v
}

async function layBienThe(d: Db, versionId: string): Promise<BienThe[]> {
  return d.q<BienThe>(
    `select id::text, channel, body, created_by from ai_channel_variants where version_id = $1::uuid order by channel`, [versionId])
}

async function layNguon(d: Db, contentId: string): Promise<(NguonTrich & { id: string })[]> {
  return d.q(
    // LEFT JOIN: tài liệu bị xoá cứng khỏi kho vẫn hiện trong danh sách nguồn với daXoa = true → cổng chặn.
    `select s.tai_lieu_id as id, coalesce(t."tieuDe", s.tieu_de_luc_gan) as "tieuDe",
            coalesce(t."phamVi", '') as "phamVi", coalesce(t."tinhTrangHieuLuc", '') as "tinhTrangHieuLuc",
            (t.id is null or t."deletedAt" is not null) as "daXoa"
       from ai_content_sources s left join tai_lieu t on t.id = s.tai_lieu_id
      where s.content_id = $1::uuid order by s.tai_lieu_id`, [contentId])
}

/**
 * Băm PHÊ DUYỆT: bao trọn mọi thứ người duyệt đã nhìn thấy — nội dung phiên bản, phân loại, cờ AI,
 * từng biến thể kênh và danh sách nguồn. Đổi bất kỳ thứ nào sau khi duyệt → băm lệch → cổng chặn.
 */
export function bamPheDuyet(b: Pick<Bai, 'classification' | 'ai_generated' | 'may_mislead'>, v: Pick<PhienBan, 'id' | 'content_hash'>,
  bienThe: Pick<BienThe, 'channel' | 'body'>[], nguonIds: string[]): string {
  const duLieu = JSON.stringify({
    v: v.id, h: v.content_hash, c: b.classification, ai: b.ai_generated, ml: b.may_mislead,
    bt: [...bienThe].sort((x, y) => x.channel.localeCompare(y.channel)).map((x) => [x.channel, chuanHoa(x.body)]),
    ng: [...nguonIds].sort(),
  })
  return createHash('sha256').update(duLieu, 'utf8').digest('hex')
}

async function bamHienTai(d: Db, b: Bai): Promise<{ bam: string; v: PhienBan; bienThe: BienThe[]; nguon: (NguonTrich & { id: string })[] }> {
  const v = await layPhienBan(d, b.current_version_id)
  const bienThe = await layBienThe(d, v.id)
  const nguon = await layNguon(d, b.id)
  return { bam: bamPheDuyet(b, v, bienThe, nguon.map((n) => n.id)), v, bienThe, nguon }
}

/** Huỷ mọi lịch CHƯA đăng của bài (khi nội dung đổi hoặc phê duyệt bị thu hồi). Lịch đang đăng không huỷ được. */
async function huyLichChuaDang(d: Db, contentId: string, lyDo: string): Promise<number> {
  const r = await d.q(
    `update ai_publication_schedules set status = 'CANCELLED', error_code = $2, updated_at = now()
      where content_id = $1::uuid and status in ('SCHEDULED','RETRY_PENDING') returning id`, [contentId, lyDo])
  return r.length
}

function kiemQuyenSoan(u: NguoiDungToiThieu) {
  if (!duocSoan(u)) throw new LoiNghiepVu(403, 'Bạn không có quyền soạn nội dung')
}

export type DauVaoBai = {
  tieuDe: string; noiDung: string; phanLoai?: string; doAiTao?: boolean; coTheGayNhamLan?: boolean; nguonIds?: string[]
}

function chuanDauVao(i: DauVaoBai) {
  const tieuDe = chuanHoa(String(i.tieuDe ?? ''))
  const noiDung = chuanHoa(String(i.noiDung ?? ''))
  if (!tieuDe) throw new LoiNghiepVu(400, 'Thiếu tiêu đề')
  if (!noiDung) throw new LoiNghiepVu(400, 'Thiếu nội dung')
  if (tieuDe.length > GIOI_HAN_TIEU_DE) throw new LoiNghiepVu(400, `Tiêu đề quá ${GIOI_HAN_TIEU_DE} ký tự`)
  if (noiDung.length > GIOI_HAN_THAN_BAI) throw new LoiNghiepVu(400, 'Nội dung quá dài')
  const phanLoai = i.phanLoai ?? 'INTERNAL'
  if (!(PHAN_LOAI as readonly string[]).includes(phanLoai)) throw new LoiNghiepVu(400, 'Phân loại không hợp lệ')
  const nguonIds = [...new Set((i.nguonIds ?? []).map(String))]
  if (nguonIds.length > 50) throw new LoiNghiepVu(400, 'Quá nhiều tài liệu nguồn')
  return { tieuDe, noiDung, phanLoai, doAiTao: !!i.doAiTao, coTheGayNhamLan: !!i.coTheGayNhamLan, nguonIds }
}

async function ganNguon(d: Db, contentId: string, nguonIds: string[]) {
  await d.q(`delete from ai_content_sources where content_id = $1::uuid`, [contentId])
  if (nguonIds.length === 0) return
  const co = await d.q<{ id: string }>(
    `insert into ai_content_sources (content_id, tai_lieu_id, tieu_de_luc_gan)
     select $1::uuid, t.id, t."tieuDe" from tai_lieu t where t.id = any($2::text[]) and t."deletedAt" is null returning tai_lieu_id as id`,
    [contentId, nguonIds])
  if (co.length !== nguonIds.length) throw new LoiNghiepVu(400, 'Có tài liệu nguồn không tồn tại trong kho')
}

export async function taoBai(db: Db, u: NguoiDungToiThieu, dauVao: DauVaoBai): Promise<{ id: string }> {
  kiemQuyenSoan(u)
  const i = chuanDauVao(dauVao)
  return db.tx(async (d) => {
    const [{ id }] = await d.q<{ id: string }>(
      `insert into ai_content_items (title, classification, ai_generated, may_mislead, created_by)
       values ($1, $2, $3, $4, $5) returning id::text`, [i.tieuDe, i.phanLoai, i.doAiTao, i.coTheGayNhamLan, u.id])
    const [{ id: vid }] = await d.q<{ id: string }>(
      `insert into ai_content_versions (content_id, version_no, title, body_md, content_hash, created_by)
       values ($1::uuid, 1, $2, $3, $4, $5) returning id::text`, [id, i.tieuDe, i.noiDung, bamNoiDung(i.tieuDe, i.noiDung), u.id])
    await d.q(`update ai_content_items set current_version_id = $2::uuid where id = $1::uuid`, [id, vid])
    await ganNguon(d, id, i.nguonIds)
    await ghiNhatKy(d, randomUUID(), u.id, 'TAO_BAI', 'content', id, { phienBan: 1 })
    return { id }
  })
}

/**
 * Sửa bài: nội dung đổi → PHIÊN BẢN MỚI (biến thể kênh phải tạo lại). Dù đổi gì, bài luôn trở về DRAFT
 * và mọi lịch chưa đăng bị huỷ: phê duyệt cũ không còn giá trị cho nội dung mới (AT-06).
 */
export async function suaBai(db: Db, u: NguoiDungToiThieu, idRaw: string, dauVao: DauVaoBai) {
  kiemQuyenSoan(u)
  const id = canUuid(idRaw, 'Mã bài')
  const i = chuanDauVao(dauVao)
  return db.tx(async (d) => {
    const b = await khoaBai(d, id)
    if (b.status === 'CANCELLED') throw new LoiNghiepVu(409, 'Bài đã huỷ, không sửa được')
    const v = await layPhienBan(d, b.current_version_id)
    const bamMoi = bamNoiDung(i.tieuDe, i.noiDung)
    let versionId = v.id
    let soPhienBan = v.version_no
    if (bamMoi !== v.content_hash) {
      soPhienBan = v.version_no + 1
      const [nv] = await d.q<{ id: string }>(
        `insert into ai_content_versions (content_id, version_no, title, body_md, content_hash, created_by)
         values ($1::uuid, $2, $3, $4, $5, $6) returning id::text`, [id, soPhienBan, i.tieuDe, i.noiDung, bamMoi, u.id])
      versionId = nv.id
    }
    await d.q(
      `update ai_content_items set title = $2, classification = $3, ai_generated = $4, may_mislead = $5,
              current_version_id = $6::uuid, status = 'DRAFT', updated_at = now() where id = $1::uuid`,
      [id, i.tieuDe, i.phanLoai, i.doAiTao, i.coTheGayNhamLan, versionId])
    await ganNguon(d, id, i.nguonIds)
    const huy = await huyLichChuaDang(d, id, 'NOI_DUNG_DA_SUA')
    await ghiNhatKy(d, randomUUID(), u.id, 'SUA_BAI', 'content', id, { phienBan: soPhienBan, tuTrangThai: b.status, lichBiHuy: huy })
    return { id, phienBan: soPhienBan }
  })
}

/** Lưu biến thể một kênh cho phiên bản hiện hành. Sửa biến thể sau khi gửi/đã duyệt → bài về DRAFT. */
export async function luuBienThe(db: Db, u: NguoiDungToiThieu, idRaw: string, kenh: string, noiDungRaw: string) {
  kiemQuyenSoan(u)
  const id = canUuid(idRaw, 'Mã bài')
  if (!laKenh(kenh)) throw new LoiNghiepVu(400, 'Kênh không hợp lệ')
  const noiDung = chuanHoa(String(noiDungRaw ?? ''))
  const loi = kiemTraBienThe(kenh, noiDung)
  if (loi.length) throw new LoiNghiepVu(400, 'Biến thể chưa hợp lệ', loi)
  return db.tx(async (d) => {
    const b = await khoaBai(d, id)
    if (b.status === 'CANCELLED') throw new LoiNghiepVu(409, 'Bài đã huỷ')
    await d.q(
      `insert into ai_channel_variants (content_id, version_id, channel, body, created_by)
       values ($1::uuid, $2::uuid, $3, $4, $5)
       on conflict (version_id, channel) do update set body = excluded.body, created_by = excluded.created_by, updated_at = now()`,
      [id, b.current_version_id, kenh, noiDung, u.id])
    let huy = 0
    if (b.status !== 'DRAFT') {
      await d.q(`update ai_content_items set status = 'DRAFT', updated_at = now() where id = $1::uuid`, [id])
      huy = await huyLichChuaDang(d, id, 'BIEN_THE_DA_SUA')
    }
    await ghiNhatKy(d, randomUUID(), u.id, 'LUU_BIEN_THE', 'content', id, { kenh, tuTrangThai: b.status, lichBiHuy: huy })
    return { id, kenh }
  })
}

/** Tạo biến thể theo quy tắc (không gọi AI) cho các kênh yêu cầu. */
export async function taoBienTheTheoQuyTac(db: Db, u: NguoiDungToiThieu, idRaw: string, kenhs: string[]) {
  const id = canUuid(idRaw, 'Mã bài')
  const [b] = await db.q<Bai>(
    `select id::text, title, status, classification, ai_generated, may_mislead, current_version_id::text, created_by
       from ai_content_items where id = $1::uuid and deleted_at is null`, [id])
  if (!b) throw new LoiNghiepVu(404, 'Không tìm thấy bài viết')
  const v = await layPhienBan(db, b.current_version_id)
  const kq: string[] = []
  for (const k of kenhs) {
    if (!laKenh(k)) throw new LoiNghiepVu(400, `Kênh không hợp lệ: ${k}`)
    await luuBienThe(db, u, id, k, chuyenTheTheoQuyTac(k, v.title, v.body_md, b.ai_generated && b.may_mislead))
    kq.push(k)
  }
  return { id, kenh: kq }
}

export async function guiDuyet(db: Db, u: NguoiDungToiThieu, idRaw: string) {
  kiemQuyenSoan(u)
  const id = canUuid(idRaw, 'Mã bài')
  return db.tx(async (d) => {
    const b = await khoaBai(d, id)
    if (!duocChuyenNoiDung(b.status, 'PENDING_REVIEW')) throw new LoiNghiepVu(409, `Không gửi duyệt được từ trạng thái ${b.status}`)
    const bienThe = await layBienThe(d, b.current_version_id)
    if (bienThe.length === 0) throw new LoiNghiepVu(400, 'Cần ít nhất một biến thể kênh trước khi gửi duyệt')
    await d.q(`update ai_content_items set status = 'PENDING_REVIEW', updated_at = now() where id = $1::uuid`, [id])
    await ghiNhatKy(d, randomUUID(), u.id, 'GUI_DUYET', 'content', id, { kenh: bienThe.map((x) => x.channel) })
    return { id }
  })
}

/** Quyết định duyệt/từ chối. Bốn mắt: người duyệt khác người soạn phiên bản VÀ khác người soạn mọi biến thể. */
export async function quyetDinhDuyet(db: Db, u: NguoiDungToiThieu, idRaw: string, quyetDinh: string, ghiChu?: string) {
  const id = canUuid(idRaw, 'Mã bài')
  if (quyetDinh !== 'APPROVED' && quyetDinh !== 'REJECTED') throw new LoiNghiepVu(400, 'Quyết định không hợp lệ')
  return db.tx(async (d) => {
    const b = await khoaBai(d, id)
    if (b.status !== 'PENDING_REVIEW') throw new LoiNghiepVu(409, 'Bài không ở trạng thái chờ duyệt')
    const { bam, v, bienThe } = await bamHienTai(d, b)
    for (const tacGia of new Set([v.created_by, ...bienThe.map((x) => x.created_by)])) {
      const lyDo = lyDoKhongDuocDuyet(u, tacGia)
      if (lyDo) throw new LoiNghiepVu(403, lyDo)
    }
    const [{ id: aid }] = await d.q<{ id: string }>(
      `insert into ai_approvals (content_id, version_id, decision, approved_hash, actor_id, note)
       values ($1::uuid, $2::uuid, $3, $4, $5, $6) returning id::text`, [id, v.id, quyetDinh, bam, u.id, ghiChu?.slice(0, 2000) ?? null])
    await d.q(`update ai_content_items set status = $2, updated_at = now() where id = $1::uuid`, [id, quyetDinh])
    await ghiNhatKy(d, randomUUID(), u.id, quyetDinh === 'APPROVED' ? 'DUYET' : 'TU_CHOI', 'content', id, { pheDuyet: aid, bam })
    return { id, pheDuyetId: aid }
  })
}

/** Thu hồi phê duyệt: ghi REVOKED, bài về DRAFT, huỷ lịch chưa đăng (AT-12). */
export async function thuHoiDuyet(db: Db, u: NguoiDungToiThieu, idRaw: string, ghiChu?: string) {
  const id = canUuid(idRaw, 'Mã bài')
  if (!(u.laAdmin || u.laLanhDao)) throw new LoiNghiepVu(403, 'Chỉ lãnh đạo Sở hoặc quản trị viên được thu hồi phê duyệt')
  return db.tx(async (d) => {
    const b = await khoaBai(d, id)
    if (b.status !== 'APPROVED') throw new LoiNghiepVu(409, 'Bài không ở trạng thái đã duyệt')
    const { bam, v } = await bamHienTai(d, b)
    await d.q(
      `insert into ai_approvals (content_id, version_id, decision, approved_hash, actor_id, note)
       values ($1::uuid, $2::uuid, 'REVOKED', $3, $4, $5)`, [id, v.id, bam, u.id, ghiChu?.slice(0, 2000) ?? null])
    await d.q(`update ai_content_items set status = 'DRAFT', updated_at = now() where id = $1::uuid`, [id])
    const huy = await huyLichChuaDang(d, id, 'THU_HOI_PHE_DUYET')
    const dangDang = await d.q(`select id from ai_publication_schedules where content_id = $1::uuid and status = 'PUBLISHING'`, [id])
    await ghiNhatKy(d, randomUUID(), u.id, 'THU_HOI', 'content', id, { lichBiHuy: huy, dangDang: dangDang.length })
    return { id, lichBiHuy: huy, dangDangKhongDungDuoc: dangDang.length }
  })
}

/**
 * Chạy CỔNG XUẤT BẢN trên trạng thái hiện tại trong CSDL (gọi khi đặt lịch và NGAY TRƯỚC khi đăng).
 * Phải gọi trong giao dịch đã khoá hàng bài viết.
 */
async function congTrongGiaoDich(d: Db, b: Bai, kenh: Kenh): Promise<{ loi: string[]; pheDuyetId: string | null; bienThe: BienThe | null; versionId: string }> {
  const { bam, v, bienThe, nguon } = await bamHienTai(d, b)
  const [pd] = await d.q<{ id: string; decision: string; approved_hash: string; version_id: string }>(
    `select id::text, decision, approved_hash, version_id::text from ai_approvals
      where content_id = $1::uuid order by seq desc limit 1`, [b.id])
  const bt = bienThe.find((x) => x.channel === kenh) ?? null
  const loi = kiemTraCongXuatBan({
    phanLoai: b.classification, bamPhienBan: bam, phienBanId: v.id,
    pheDuyet: pd ? { quyetDinh: pd.decision, bam: pd.approved_hash, phienBanId: pd.version_id } : null,
    nguon, doAiTao: b.ai_generated, coTheGayNhamLan: b.may_mislead, noiDungSeDang: bt?.body ?? '',
  })
  if (b.status !== 'APPROVED') loi.unshift('Bài không ở trạng thái đã duyệt.')
  if (!bt) loi.push('Chưa có biến thể cho kênh này.')
  else loi.push(...kiemTraBienThe(kenh, bt.body))
  return { loi, pheDuyetId: pd?.id ?? null, bienThe: bt, versionId: v.id }
}

export type DauVaoLich = { kenh: string; ngay: string; gio: string; muiGio?: string; adapter?: string }

export async function datLich(db: Db, u: NguoiDungToiThieu, idRaw: string, i: DauVaoLich, bayGio: Date = new Date()) {
  kiemQuyenSoan(u)
  const id = canUuid(idRaw, 'Mã bài')
  if (!laKenh(i.kenh)) throw new LoiNghiepVu(400, 'Kênh không hợp lệ')
  const kenh: Kenh = i.kenh
  const adapter = i.adapter ?? 'manual'
  if (adapter !== 'manual' && adapter !== 'dry_run') throw new LoiNghiepVu(400, 'Cách đăng không hợp lệ')
  const muiGio = i.muiGio ?? MUI_GIO_MAC_DINH
  let luc: Date
  try { luc = gioDiaPhuongSangUtc(i.ngay, i.gio, muiGio) } catch (e) { throw new LoiNghiepVu(400, (e as Error).message) }
  if (luc.getTime() <= bayGio.getTime()) throw new LoiNghiepVu(400, 'Thời điểm đăng phải ở tương lai')
  return db.tx(async (d) => {
    const b = await khoaBai(d, id)
    const c = await congTrongGiaoDich(d, b, kenh)
    if (c.loi.length) throw new LoiNghiepVu(409, 'Chưa đủ điều kiện đặt lịch xuất bản', c.loi)
    const khoa = createHash('sha256').update(`${c.versionId}|${kenh}`).digest('hex')
    const song = await d.q<{ id: string; status: string }>(
      `select id::text, status from ai_publication_schedules
        where version_id = $1::uuid and channel = $2
          and status in ('SCHEDULED','PUBLISHING','RETRY_PENDING','UNKNOWN_OUTCOME','PUBLISHED')`, [c.versionId, kenh])
    if (song.length) throw new LoiNghiepVu(409, `Kênh này đã có lịch (${song[0].status}) cho phiên bản hiện hành`)
    const [{ id: lid }] = await d.q<{ id: string }>(
      `insert into ai_publication_schedules
         (content_id, version_id, variant_id, channel, adapter, scheduled_at_utc, timezone, approval_id, idempotency_key, created_by)
       values ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6::timestamptz, $7, $8::uuid, $9, $10) returning id::text`,
      [id, c.versionId, c.bienThe!.id, kenh, adapter, luc.toISOString(), muiGio, c.pheDuyetId, `${khoa}:${randomUUID()}`, u.id])
    await ghiNhatKy(d, randomUUID(), u.id, 'DAT_LICH', 'schedule', lid, { kenh, luc: luc.toISOString(), muiGio, adapter })
    return { id: lid, scheduledAtUtc: luc.toISOString() }
  })
}

export async function huyLich(db: Db, u: NguoiDungToiThieu, lichIdRaw: string) {
  kiemQuyenSoan(u)
  const lichId = canUuid(lichIdRaw, 'Mã lịch')
  return db.tx(async (d) => {
    const r = await d.q<{ id: string }>(
      `update ai_publication_schedules set status = 'CANCELLED', error_code = 'NGUOI_DUNG_HUY', updated_at = now()
        where id = $1::uuid and status in ('SCHEDULED','RETRY_PENDING','FAILED') returning id::text`, [lichId])
    if (!r.length) throw new LoiNghiepVu(409, 'Lịch không ở trạng thái huỷ được')
    await ghiNhatKy(d, randomUUID(), u.id, 'HUY_LICH', 'schedule', lichId)
    return { id: lichId }
  })
}

type Lich = { id: string; content_id: string; channel: Kenh; adapter: string; status: TrangThaiLich; retry_count: number; idempotency_key: string }

async function khoaLich(d: Db, lichId: string): Promise<Lich> {
  const [l] = await d.q<Lich>(
    `select id::text, content_id::text, channel, adapter, status, retry_count, idempotency_key
       from ai_publication_schedules where id = $1::uuid for update`, [lichId])
  if (!l) throw new LoiNghiepVu(404, 'Không tìm thấy lịch')
  return l
}

function canUrl(s: unknown): string {
  const url = String(s ?? '').trim()
  if (!/^https:\/\/[^\s]{4,500}$/i.test(url)) throw new LoiNghiepVu(400, 'Cần đường dẫn https của bài đã đăng')
  return url
}

/** Kênh đăng tay: người dùng đăng rồi xác nhận kèm đường dẫn. Cổng xuất bản vẫn được kiểm lại tại đây. */
export async function xacNhanDangTay(db: Db, u: NguoiDungToiThieu, lichIdRaw: string, urlRaw: string) {
  kiemQuyenSoan(u)
  const lichId = canUuid(lichIdRaw, 'Mã lịch')
  const url = canUrl(urlRaw)
  return db.tx(async (d) => {
    const [x] = await d.q<{ content_id: string }>(`select content_id::text from ai_publication_schedules where id = $1::uuid`, [lichId])
    if (!x) throw new LoiNghiepVu(404, 'Không tìm thấy lịch')
    const b = await khoaBai(d, x.content_id)     // khoá bài TRƯỚC lịch: cùng thứ tự khoá với worker
    const l = await khoaLich(d, lichId)
    if (l.adapter !== 'manual') throw new LoiNghiepVu(409, 'Lịch này không phải loại đăng tay')
    if (l.status !== 'SCHEDULED') throw new LoiNghiepVu(409, 'Lịch không ở trạng thái chờ đăng')
    const c = await congTrongGiaoDich(d, b, l.channel)
    if (c.loi.length) throw new LoiNghiepVu(409, 'Nội dung không còn đủ điều kiện xuất bản', c.loi)
    await d.q(
      `update ai_publication_schedules set status = 'PUBLISHED', published_at = now(), external_url = $2, updated_at = now()
        where id = $1::uuid`, [lichId, url])
    await ghiNhatKy(d, randomUUID(), u.id, 'XAC_NHAN_DANG_TAY', 'schedule', lichId, { url })
    return { id: lichId }
  })
}

/** Đối soát lịch "không rõ kết quả": con người kiểm tra trên nền tảng rồi chốt đã đăng / thất bại (AT-10). */
export async function doiSoat(db: Db, u: NguoiDungToiThieu, lichIdRaw: string, ketQua: string, urlRaw?: string) {
  kiemQuyenSoan(u)
  const lichId = canUuid(lichIdRaw, 'Mã lịch')
  if (ketQua !== 'PUBLISHED' && ketQua !== 'FAILED') throw new LoiNghiepVu(400, 'Kết quả đối soát không hợp lệ')
  const url = ketQua === 'PUBLISHED' ? canUrl(urlRaw) : null
  return db.tx(async (d) => {
    const l = await khoaLich(d, lichId)
    if (l.status !== 'UNKNOWN_OUTCOME') throw new LoiNghiepVu(409, 'Lịch không ở trạng thái cần đối soát')
    await d.q(
      `update ai_publication_schedules set status = $2, external_url = $3,
              published_at = case when $2 = 'PUBLISHED' then now() else null end,
              error_code = case when $2 = 'FAILED' then 'DOI_SOAT_KHONG_THAY_BAI' else error_code end, updated_at = now()
        where id = $1::uuid`, [lichId, ketQua, url])
    await ghiNhatKy(d, randomUUID(), u.id, 'DOI_SOAT', 'schedule', lichId, { ketQua, url })
    return { id: lichId }
  })
}

// ── Hàng đợi cho worker ───────────────────────────────────────────────────────
export type ViecDang = {
  lichId: string; contentId: string; kenh: Kenh; adapter: string; noiDung: string; khoaIdempotency: string; lanThu: number
  /** Mã của RIÊNG lần nhận việc này. Ghi kết quả phải trình đúng mã — worker cũ sống lại không ghi đè được. */
  maNhan: string
}

export const KHOA_TREO_PHUT = 15
export const QUA_HAN_GIO = 24

/**
 * Dọn dẹp định kỳ: (1) lịch PUBLISHING bị treo quá KHOA_TREO_PHUT (worker chết giữa chừng) → UNKNOWN_OUTCOME
 * — KHÔNG trả về hàng đợi vì bài có thể đã lên; (2) lịch tự động quá hạn QUA_HAN_GIO chưa chạy → EXPIRED.
 */
export async function donDepHangDoi(db: Db): Promise<{ treo: number; quaHan: number }> {
  return db.tx(async (d) => {
    const treo = await d.q<{ id: string }>(
      `update ai_publication_schedules set status = 'UNKNOWN_OUTCOME', error_code = 'WORKER_TREO', updated_at = now()
        where status = 'PUBLISHING' and locked_at < now() - make_interval(mins => $1) returning id::text`, [KHOA_TREO_PHUT])
    const quaHan = await d.q<{ id: string }>(
      `update ai_publication_schedules set status = 'EXPIRED', error_code = 'QUA_HAN', updated_at = now()
        where status = 'SCHEDULED' and adapter <> 'manual'
          and scheduled_at_utc < now() - make_interval(hours => $1) returning id::text`, [QUA_HAN_GIO])
    const cid = randomUUID()
    for (const r of treo) await ghiNhatKy(d, cid, null, 'LICH_TREO', 'schedule', r.id)
    for (const r of quaHan) await ghiNhatKy(d, cid, null, 'LICH_QUA_HAN', 'schedule', r.id)
    return { treo: treo.length, quaHan: quaHan.length }
  })
}

/**
 * Nhận MỘT việc đến hạn. An toàn với nhiều worker: FOR UPDATE SKIP LOCKED trên hàng lịch.
 * Cổng xuất bản được kiểm lại trong CÙNG giao dịch (đã khoá hàng bài): không đạt → lịch CANCELLED, không đăng.
 * Lịch đăng tay (adapter 'manual') không bao giờ được worker nhận.
 */
export async function nhanViec(db: Db, workerId: string): Promise<ViecDang | null> {
  return db.tx(async (d) => {
    const [ung] = await d.q<{ id: string; content_id: string }>(
      `select id::text, content_id::text from ai_publication_schedules
        where status in ('SCHEDULED','RETRY_PENDING') and adapter <> 'manual'
          and coalesce(next_attempt_at, scheduled_at_utc) <= now()
          and scheduled_at_utc >= now() - make_interval(hours => $1)   -- quá hạn thì KHÔNG đăng bù (xem donDepHangDoi)
        order by coalesce(next_attempt_at, scheduled_at_utc)
        limit 1 for update skip locked`, [QUA_HAN_GIO])
    if (!ung) return null
    // Giải phóng thứ tự khoá: bài trước, lịch sau (giống các thao tác của người dùng) — tránh deadlock
    // bằng cách KHÔNG giữ khoá lịch khi chờ khoá bài: thử khoá bài không chờ.
    const [bai] = await d.q<Bai>(
      `select id::text, title, status, classification, ai_generated, may_mislead, current_version_id::text, created_by
         from ai_content_items where id = $1::uuid and deleted_at is null for update skip locked`, [ung.content_id])
    if (!bai) return null                       // bài đang bị thao tác khác giữ → vòng sau thử lại
    const l = await khoaLich(d, ung.id)
    const c = await congTrongGiaoDich(d, bai, l.channel)
    const cid = randomUUID()
    const maNhan = `${workerId}:${randomUUID()}`
    if (c.loi.length) {
      await d.q(
        `update ai_publication_schedules set status = 'CANCELLED', error_code = 'CONG_XUAT_BAN_CHAN', error_detail = $2, updated_at = now()
          where id = $1::uuid`, [l.id, c.loi.join(' | ').slice(0, 2000)])
      await ghiNhatKy(d, cid, null, 'CONG_CHAN', 'schedule', l.id, { loi: c.loi })
      return null
    }
    await d.q(
      `update ai_publication_schedules set status = 'PUBLISHING', locked_at = now(), locked_by = $2, updated_at = now()
        where id = $1::uuid`, [l.id, maNhan])
    await ghiNhatKy(d, cid, null, 'BAT_DAU_DANG', 'schedule', l.id, { workerId, lanThu: l.retry_count + 1 })
    return { lichId: l.id, contentId: l.content_id, kenh: l.channel, adapter: l.adapter, noiDung: c.bienThe!.body, khoaIdempotency: l.idempotency_key, lanThu: l.retry_count + 1, maNhan }
  })
}

export type KetQuaDang =
  | { ok: true; externalPostId: string; externalUrl?: string }
  | { ok: false; ma?: string; httpStatus?: number; daGui?: boolean; thongBao?: string }

/** Ghi kết quả một lần đăng. Chỉ đúng LẦN NHẬN VIỆC đang giữ khoá mới ghi được (so mã nhận trong locked_by). */
export async function ghiKetQua(db: Db, maNhan: string, lichId: string, kq: KetQuaDang, ngauNhien?: () => number) {
  return db.tx(async (d) => {
    const l = await khoaLich(d, lichId)
    const [k] = await d.q<{ locked_by: string | null }>(`select locked_by from ai_publication_schedules where id = $1::uuid`, [lichId])
    if (l.status !== 'PUBLISHING' || k.locked_by !== maNhan) throw new LoiNghiepVu(409, 'Lịch không còn do lần nhận việc này giữ')
    const cid = randomUUID()
    if (kq.ok) {
      await d.q(
        `update ai_publication_schedules set status = 'PUBLISHED', published_at = now(), external_post_id = $2, external_url = $3,
                error_code = null, error_detail = null, locked_at = null, locked_by = null, updated_at = now() where id = $1::uuid`,
        [lichId, kq.externalPostId, kq.externalUrl ?? null])
      await ghiNhatKy(d, cid, null, 'DA_DANG', 'schedule', lichId, { externalPostId: kq.externalPostId })
      return { trangThai: 'PUBLISHED' as const }
    }
    const lanDaThu = l.retry_count + 1
    const moi = trangThaiSauLoi(phanLoaiLoi(kq), lanDaThu)
    const cho = moi === 'RETRY_PENDING' ? thoiGianCho(lanDaThu, ngauNhien) : null
    await d.q(
      `update ai_publication_schedules set status = $2, retry_count = $3, error_code = $4, error_detail = $5,
              next_attempt_at = case when $6::int is null then null else now() + make_interval(secs => $6::int / 1000.0) end,
              locked_at = null, locked_by = null, updated_at = now() where id = $1::uuid`,
      [lichId, moi, lanDaThu, kq.ma ?? (kq.httpStatus ? `HTTP_${kq.httpStatus}` : 'LOI'), kq.thongBao?.slice(0, 2000) ?? null, cho])
    await ghiNhatKy(d, cid, null, 'DANG_LOI', 'schedule', lichId, { trangThai: moi, lanDaThu, choMs: cho })
    return { trangThai: moi }
  })
}

// ── Đọc ───────────────────────────────────────────────────────────────────────
export async function danhSachBai(db: Db, loc: { trangThai?: string; tu?: string } = {}) {
  return db.q(
    `select i.id::text, i.title, i.status, i.classification, i.ai_generated, i.updated_at, u.name as nguoi_tao,
            v.version_no,
            coalesce((select array_agg(s.status order by s.channel) from ai_publication_schedules s where s.content_id = i.id), '{}') as lich
       from ai_content_items i
       join users u on u.id = i.created_by
       join ai_content_versions v on v.id = i.current_version_id
      where i.deleted_at is null
        and ($1::text is null or i.status = $1)
        and ($2::text is null or i.title ilike '%' || $2 || '%')
      order by i.updated_at desc limit 200`, [loc.trangThai || null, loc.tu?.slice(0, 100) || null])
}

export async function chiTietBai(db: Db, idRaw: string) {
  const id = canUuid(idRaw, 'Mã bài')
  const [bai] = await db.q<Bai & { updated_at: Date }>(
    `select id::text, title, status, classification, ai_generated, may_mislead, current_version_id::text, created_by, updated_at
       from ai_content_items where id = $1::uuid and deleted_at is null`, [id])
  if (!bai) throw new LoiNghiepVu(404, 'Không tìm thấy bài viết')
  const phienBan = await layPhienBan(db, bai.current_version_id)
  const bienThe = await layBienThe(db, phienBan.id)
  const nguon = await layNguon(db, id)
  const pheDuyet = await db.q(
    `select a.id::text, a.decision, a.approved_hash, a.note, a.created_at, a.version_id::text, u.name as nguoi
       from ai_approvals a join users u on u.id = a.actor_id where a.content_id = $1::uuid order by a.seq desc limit 20`, [id])
  const lich = await db.q(
    `select id::text, channel, adapter, status, scheduled_at_utc, timezone, retry_count, external_post_id, external_url,
            error_code, error_detail, published_at, version_id::text
       from ai_publication_schedules where content_id = $1::uuid order by created_at desc limit 50`, [id])
  const lichSuPhienBan = await db.q(
    `select v.id::text, v.version_no, v.created_at, u.name as nguoi from ai_content_versions v join users u on u.id = v.created_by
      where v.content_id = $1::uuid order by v.version_no desc limit 30`, [id])
  const bam = bamPheDuyet(bai, phienBan, bienThe, nguon.map((n) => n.id))
  return { bai, phienBan, bienThe, nguon, pheDuyet, lich, lichSuPhienBan, bamHienTai: bam }
}

export async function lichTrongKhoang(db: Db, tuIso: string, denIso: string) {
  return db.q(
    `select s.id::text, s.content_id::text, s.channel, s.adapter, s.status, s.scheduled_at_utc, s.timezone, s.external_url, i.title
       from ai_publication_schedules s join ai_content_items i on i.id = s.content_id
      where s.scheduled_at_utc >= $1::timestamptz and s.scheduled_at_utc < $2::timestamptz
      order by s.scheduled_at_utc limit 500`, [tuIso, denIso])
}

export async function nhatKy(db: Db, gioiHan = 100) {
  return db.q(
    `select e.id::text, e.correlation_id::text, e.action, e.target_type, e.target_id, e.detail, e.created_at, u.name as nguoi
       from ai_audit_events e left join users u on u.id = e.actor_id order by e.id desc limit $1`, [Math.min(Math.max(gioiHan, 1), 500)])
}

export async function thongKe(db: Db) {
  const [r] = await db.q(
    `select
       (select count(*)::int from ai_content_items where deleted_at is null) as tong_bai,
       (select count(*)::int from ai_content_items where deleted_at is null and status = 'DRAFT') as ban_nhap,
       (select count(*)::int from ai_content_items where deleted_at is null and status = 'PENDING_REVIEW') as cho_duyet,
       (select count(*)::int from ai_content_items where deleted_at is null and status = 'APPROVED') as da_duyet,
       (select count(*)::int from ai_publication_schedules where status in ('SCHEDULED','RETRY_PENDING')) as lich_cho,
       (select count(*)::int from ai_publication_schedules where status = 'PUBLISHED') as da_dang,
       (select count(*)::int from ai_publication_schedules where status = 'FAILED') as loi,
       (select count(*)::int from ai_publication_schedules where status = 'UNKNOWN_OUTCOME') as can_doi_soat`)
  return r
}
