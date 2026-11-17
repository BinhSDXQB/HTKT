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
  bamNoiDung, chuanHoa, kiemTraUrlBaiDang, kiemTraCongXuatBan, kiemTraBienThe, chuyenTheTheoQuyTac, gioDiaPhuongSangUtc,
  lyDoKhongDuocDuyet, duocSoan, laKenh, phanLoaiLoi, trangThaiSauLoi, thoiGianCho,
  PHAN_LOAI, MUI_GIO_MAC_DINH, type Kenh, type NguoiDungToiThieu, type NguonTrich,
} from './nghiep-vu'
import { duocChuyenNoiDung, gopTheoKenh, type TrangThaiNoiDung, type TrangThaiLich } from './trang-thai'

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
  /** Những người đã đổi phân loại / cờ AI / nguồn kể từ phiên bản hiện hành — tính vào nguyên tắc bốn mắt. */
  meta_editors: string[]
}
const COT_BAI = 'id::text, title, status, classification, ai_generated, may_mislead, current_version_id::text, created_by, meta_editors'
type PhienBan = { id: string; version_no: number; title: string; body_md: string; content_hash: string; created_by: string }
/** editors: MỌI người từng sửa biến thể này trong phiên bản hiện hành (không chỉ người lưu cuối). */
type BienThe = { id: string; channel: Kenh; body: string; created_by: string; editors: string[] }

/**
 * Mọi cột thời gian trả ra ngoài đều đổi sang CHUỖI ISO-8601 UTC ngay trong SQL.
 * Lý do: đọc timestamptz qua $queryRaw của Prisma (adapter pg) trên máy đặt múi giờ +07 trả về Date lệch 7 giờ
 * (lịch 08:30 hiện thành 15:30), còn đọc qua pg thuần thì đúng. Chuỗi do PostgreSQL tự định dạng thì
 * không phụ thuộc trình điều khiển hay múi giờ máy chủ.
 */
const iso = (cot: string, ten = cot.split('.').pop()) =>
  `to_char(${cot} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as ${ten}`

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
    `select ${COT_BAI} from ai_content_items where id = $1::uuid and deleted_at is null for update`, [id])
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
    `select id::text, channel, body, created_by, editors from ai_channel_variants where version_id = $1::uuid order by channel`, [versionId])
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
export function goiPheDuyet(b: Pick<Bai, 'classification' | 'ai_generated' | 'may_mislead'>, v: Pick<PhienBan, 'id' | 'content_hash'>,
  bienThe: Pick<BienThe, 'channel' | 'body'>[], nguonIds: string[]): string {
  return JSON.stringify({
    v: v.id, h: v.content_hash, c: b.classification, ai: b.ai_generated, ml: b.may_mislead,
    bt: [...bienThe].sort((x, y) => x.channel.localeCompare(y.channel)).map((x) => [x.channel, chuanHoa(x.body)]),
    ng: [...nguonIds].sort(),
  })
}

export function bamPheDuyet(...a: Parameters<typeof goiPheDuyet>): string {
  return createHash('sha256').update(goiPheDuyet(...a), 'utf8').digest('hex')
}

async function bamHienTai(d: Db, b: Bai): Promise<{ bam: string; goi: string; v: PhienBan; bienThe: BienThe[]; nguon: (NguonTrich & { id: string })[] }> {
  const v = await layPhienBan(d, b.current_version_id)
  const bienThe = await layBienThe(d, v.id)
  const nguon = await layNguon(d, b.id)
  const goi = goiPheDuyet(b, v, bienThe, nguon.map((n) => n.id))
  return { bam: createHash('sha256').update(goi, 'utf8').digest('hex'), goi, v, bienThe, nguon }
}

/** Mọi người có phần trong nội dung thuộc phạm vi duyệt: người soạn phiên bản, người đổi phân loại/cờ/nguồn, người sửa biến thể. */
export function tacGiaTrongPhamViDuyet(b: Pick<Bai, 'meta_editors'>, v: Pick<PhienBan, 'created_by'>, bienThe: Pick<BienThe, 'created_by' | 'editors'>[]): string[] {
  return [...new Set([v.created_by, ...b.meta_editors, ...bienThe.flatMap((x) => [x.created_by, ...x.editors])])]
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
     select $1::uuid, t.id, t."tieuDe" from tai_lieu t
      where t.id = any($2::text[]) and t."deletedAt" is null and t."trangThai" = 'san_sang' returning tai_lieu_id as id`,
    // Chỉ gắn tài liệu ĐÃ SẴN SÀNG. Ngoài lý do nghiệp vụ (bản đang nạp/chờ thay chưa phải văn bản của kho), đây là điều kiện
    // chống deadlock: sync-vbpl (thayBanCu) khoá bản MỚI 'cho_thay' rồi mới khoá bản cũ; nếu bài được phép viện dẫn bản
    // 'cho_thay' thì cổng (khoá chia sẻ theo thứ tự id) và sync có thể chờ vòng nhau. Không bài nào giữ khoá trên bản
    // 'cho_thay' → sync chỉ còn tranh MỘT khoá với module → không có chu trình.
    [contentId, nguonIds])
  if (co.length !== nguonIds.length) throw new LoiNghiepVu(400, 'Có tài liệu nguồn không tồn tại trong kho hoặc chưa nạp xong')
}

export async function taoBai(db: Db, u: NguoiDungToiThieu, dauVao: DauVaoBai): Promise<{ id: string }> {
  kiemQuyenSoan(u)
  const i = chuanDauVao(dauVao)
  return db.tx(async (d) => {
    const [{ id }] = await d.q<{ id: string }>(
      `insert into ai_content_items (title, classification, ai_generated, may_mislead, created_by, meta_editors)
       values ($1, $2, $3, $4, $5, array[$5]::text[]) returning id::text`, [i.tieuDe, i.phanLoai, i.doAiTao, i.coTheGayNhamLan, u.id])
    const [{ id: vid }] = await d.q<{ id: string }>(
      `insert into ai_content_versions (content_id, version_no, title, body_md, content_hash, created_by)
       values ($1::uuid, 1, $2, $3, $4, $5) returning id::text`, [id, i.tieuDe, i.noiDung, bamNoiDung(i.tieuDe, i.noiDung), u.id])
    await d.q(`update ai_content_items set current_version_id = $2::uuid where id = $1::uuid`, [id, vid])
    await ganNguon(d, id, i.nguonIds)
    await ghiNhatKy(d, randomUUID(), u.id, 'TAO_BAI', 'content', id, { phienBan: 1 })
    return { id }
  })
}

/** Chống thao tác từ màn hình cũ: băm gói hiện hành (nội dung + biến thể + nguồn) phải đúng bản người dùng đang nhìn. Phải gọi dưới khoá bài. */
async function kiemNen(d: Db, b: Bai, bamNen?: string) {
  if (bamNen === undefined) return
  if ((await bamHienTai(d, b)).bam !== bamNen) throw new LoiNghiepVu(409, 'Bài đã thay đổi kể từ lúc bạn mở. Tải lại trang để xem bản mới rồi thao tác tiếp.')
}

/**
 * Sửa bài: nội dung đổi → PHIÊN BẢN MỚI (biến thể kênh phải tạo lại). Dù đổi gì, bài luôn trở về DRAFT
 * và mọi lịch chưa đăng bị huỷ: phê duyệt cũ không còn giá trị cho nội dung mới (AT-06).
 */
export async function suaBai(db: Db, u: NguoiDungToiThieu, idRaw: string, dauVao: DauVaoBai, bamNen?: string) {
  kiemQuyenSoan(u)
  const id = canUuid(idRaw, 'Mã bài')
  const i = chuanDauVao(dauVao)
  return db.tx(async (d) => {
    const b = await khoaBai(d, id)
    if (b.status === 'CANCELLED') throw new LoiNghiepVu(409, 'Bài đã huỷ, không sửa được')
    await kiemNen(d, b, bamNen)
    const v = await layPhienBan(d, b.current_version_id)
    const bamMoi = bamNoiDung(i.tieuDe, i.noiDung)
    let versionId = v.id
    let soPhienBan = v.version_no
    const nguonCu = (await layNguon(d, id)).map((n) => n.id).sort().join('\n')
    const metaDoi = b.classification !== i.phanLoai || b.ai_generated !== i.doAiTao || b.may_mislead !== i.coTheGayNhamLan ||
      nguonCu !== [...i.nguonIds].sort().join('\n')
    const noiDungDoi = bamMoi !== v.content_hash
    // Không đổi gì → không làm gì (không kéo bài đã duyệt về nháp, không ghi tên người bấm lưu vào danh sách tác giả).
    if (!noiDungDoi && !metaDoi) return { id, phienBan: soPhienBan, khongDoi: true }
    // Phiên bản mới: danh sách người sửa siêu dữ liệu tính lại từ người tạo phiên bản. Chỉ đổi siêu dữ liệu: cộng thêm người sửa.
    const metaEditors = noiDungDoi ? [u.id] : [...new Set([...b.meta_editors, u.id])]
    if (noiDungDoi) {
      soPhienBan = v.version_no + 1
      const [nv] = await d.q<{ id: string }>(
        `insert into ai_content_versions (content_id, version_no, title, body_md, content_hash, created_by)
         values ($1::uuid, $2, $3, $4, $5, $6) returning id::text`, [id, soPhienBan, i.tieuDe, i.noiDung, bamMoi, u.id])
      versionId = nv.id
    }
    await d.q(
      `update ai_content_items set title = $2, classification = $3, ai_generated = $4, may_mislead = $5,
              current_version_id = $6::uuid, meta_editors = $7::text[], status = 'DRAFT', updated_at = now() where id = $1::uuid`,
      [id, i.tieuDe, i.phanLoai, i.doAiTao, i.coTheGayNhamLan, versionId, metaEditors])
    await ganNguon(d, id, i.nguonIds)
    const huy = await huyLichChuaDang(d, id, 'NOI_DUNG_DA_SUA')
    await ghiNhatKy(d, randomUUID(), u.id, 'SUA_BAI', 'content', id, { phienBan: soPhienBan, tuTrangThai: b.status, lichBiHuy: huy })
    return { id, phienBan: soPhienBan }
  })
}

/** Lưu biến thể một kênh cho phiên bản hiện hành. Sửa biến thể sau khi gửi/đã duyệt → bài về DRAFT. */
export async function luuBienThe(db: Db, u: NguoiDungToiThieu, idRaw: string, kenh: string, noiDungRaw: string, phienBanNen?: string, bienTheNen?: string) {
  kiemQuyenSoan(u)
  const id = canUuid(idRaw, 'Mã bài')
  if (!laKenh(kenh)) throw new LoiNghiepVu(400, 'Kênh không hợp lệ')
  const noiDung = chuanHoa(String(noiDungRaw ?? ''))
  const loi = kiemTraBienThe(kenh, noiDung)
  if (loi.length) throw new LoiNghiepVu(400, 'Biến thể chưa hợp lệ', loi)
  return db.tx(async (d) => {
    const b = await khoaBai(d, id)
    if (phienBanNen !== undefined && b.current_version_id !== phienBanNen) throw new LoiNghiepVu(409, 'Bài đã sang phiên bản khác kể từ lúc bạn mở. Tải lại trang rồi soạn lại bản kênh.')
    if (bienTheNen !== undefined) {
      // Cùng phiên bản nhưng người khác đã lưu biến thể này kể từ lúc mở → không ghi đè.
      const [hien] = await d.q<{ body: string }>(`select body from ai_channel_variants where version_id = $1::uuid and channel = $2`, [b.current_version_id, kenh])
      if (chuanHoa(hien?.body ?? '') !== chuanHoa(bienTheNen)) throw new LoiNghiepVu(409, 'Bản theo kênh này đã được người khác lưu kể từ lúc bạn mở. Tải lại trang rồi soạn tiếp.')
    }
    return { id, kenh, ...(await luuBienTheTrong(d, b, u, kenh, noiDung)) }
  })
}

/** Phần lõi của lưu biến thể — PHẢI gọi trong giao dịch đã khoá hàng bài. Trả trạng thái bài sau khi lưu. */
async function luuBienTheTrong(d: Db, b: Bai, u: NguoiDungToiThieu, kenh: Kenh, noiDung: string): Promise<{ khongDoi: boolean }> {
  if (b.status === 'CANCELLED') throw new LoiNghiepVu(409, 'Bài đã huỷ')
  const [cu] = await d.q<{ body: string }>(
    `select body from ai_channel_variants where version_id = $1::uuid and channel = $2`, [b.current_version_id, kenh])
  // Lưu lại đúng nguyên văn → không làm gì: không đổi tác giả (nếu đổi, người viết thật sẽ lọt khỏi kiểm tra bốn mắt).
  if (cu && chuanHoa(cu.body) === noiDung) return { khongDoi: true }
  await d.q(
    `insert into ai_channel_variants (content_id, version_id, channel, body, created_by, editors)
     values ($1::uuid, $2::uuid, $3, $4, $5, array[$5]::text[])
     on conflict (version_id, channel) do update set body = excluded.body, created_by = excluded.created_by, updated_at = now(),
       editors = (select array_agg(distinct e) from unnest(ai_channel_variants.editors || excluded.editors) e)`,
    [b.id, b.current_version_id, kenh, noiDung, u.id])
  let huy = 0
  const tuTrangThai = b.status
  if (b.status !== 'DRAFT') {
    await d.q(`update ai_content_items set status = 'DRAFT', updated_at = now() where id = $1::uuid`, [b.id])
    huy = await huyLichChuaDang(d, b.id, 'BIEN_THE_DA_SUA')
    b.status = 'DRAFT'
  }
  await ghiNhatKy(d, randomUUID(), u.id, 'LUU_BIEN_THE', 'content', b.id, { kenh, tuTrangThai, lichBiHuy: huy })
  return { khongDoi: false }
}

/** Tạo biến thể theo quy tắc (không gọi AI) cho các kênh yêu cầu. */
export async function taoBienTheTheoQuyTac(db: Db, u: NguoiDungToiThieu, idRaw: string, kenhs: string[], bamNen?: string) {
  kiemQuyenSoan(u)
  const id = canUuid(idRaw, 'Mã bài')
  const ds = [...new Set(kenhs)]
  for (const k of ds) if (!laKenh(k)) throw new LoiNghiepVu(400, `Kênh không hợp lệ: ${k}`)
  // Đọc phiên bản và ghi biến thể trong CÙNG giao dịch đã khoá bài: không thể lấy thân bài cũ gắn vào phiên bản mới.
  return db.tx(async (d) => {
    const b = await khoaBai(d, id)
    await kiemNen(d, b, bamNen)
    const v = await layPhienBan(d, b.current_version_id)
    for (const k of ds as Kenh[]) {
      const noiDung = chuanHoa(chuyenTheTheoQuyTac(k, v.title, v.body_md, b.ai_generated && b.may_mislead))
      const loi = kiemTraBienThe(k, noiDung)
      if (loi.length) throw new LoiNghiepVu(400, 'Biến thể chưa hợp lệ', loi)
      await luuBienTheTrong(d, b, u, k, noiDung)
    }
    return { id, kenh: ds }
  })
}

export async function guiDuyet(db: Db, u: NguoiDungToiThieu, idRaw: string, bamNen?: string) {
  kiemQuyenSoan(u)
  const id = canUuid(idRaw, 'Mã bài')
  return db.tx(async (d) => {
    const b = await khoaBai(d, id)
    await kiemNen(d, b, bamNen)
    if (!duocChuyenNoiDung(b.status, 'PENDING_REVIEW')) throw new LoiNghiepVu(409, `Không gửi duyệt được từ trạng thái ${b.status}`)
    const bienThe = await layBienThe(d, b.current_version_id)
    if (bienThe.length === 0) throw new LoiNghiepVu(400, 'Cần ít nhất một biến thể kênh trước khi gửi duyệt')
    await d.q(`update ai_content_items set status = 'PENDING_REVIEW', updated_at = now() where id = $1::uuid`, [id])
    await ghiNhatKy(d, randomUUID(), u.id, 'GUI_DUYET', 'content', id, { kenh: bienThe.map((x) => x.channel) })
    return { id }
  })
}

/**
 * Quyết định duyệt/từ chối.
 *  - bamDuKien: mã băm của bản mà người duyệt ĐANG XEM trên màn hình. Nếu trong lúc đó bài đã đổi (người khác sửa rồi
 *    gửi duyệt lại) thì băm lệch → 409: không ai duyệt được nội dung mình chưa nhìn thấy.
 *  - Bốn mắt: người duyệt phải khác MỌI người có phần trong phạm vi duyệt (tacGiaTrongPhamViDuyet).
 *  - Toàn bộ gói đã duyệt (nội dung các biến thể, phân loại, nguồn) được lưu kèm quyết định để phục dựng về sau.
 */
export async function quyetDinhDuyet(db: Db, u: NguoiDungToiThieu, idRaw: string, quyetDinh: string, bamDuKien: string, ghiChu?: string) {
  const id = canUuid(idRaw, 'Mã bài')
  if (quyetDinh !== 'APPROVED' && quyetDinh !== 'REJECTED') throw new LoiNghiepVu(400, 'Quyết định không hợp lệ')
  if (!/^[0-9a-f]{64}$/.test(String(bamDuKien ?? ''))) throw new LoiNghiepVu(400, 'Thiếu mã băm của bản đang xem')
  return db.tx(async (d) => {
    const b = await khoaBai(d, id)
    if (b.status !== 'PENDING_REVIEW') throw new LoiNghiepVu(409, 'Bài không ở trạng thái chờ duyệt')
    const { bam, goi, v, bienThe } = await bamHienTai(d, b)
    if (bam !== bamDuKien) throw new LoiNghiepVu(409, 'Bài đã thay đổi kể từ lúc bạn mở. Tải lại để xem bản mới nhất rồi mới quyết định.')
    for (const tacGia of tacGiaTrongPhamViDuyet(b, v, bienThe)) {
      const lyDo = lyDoKhongDuocDuyet(u, tacGia)
      if (lyDo) throw new LoiNghiepVu(403, lyDo)
    }
    const [{ id: aid }] = await d.q<{ id: string }>(
      `insert into ai_approvals (content_id, version_id, decision, approved_hash, approved_payload, actor_id, note)
       values ($1::uuid, $2::uuid, $3, $4, $7::jsonb, $5, $6) returning id::text`, [id, v.id, quyetDinh, bam, u.id, ghiChu?.slice(0, 2000) ?? null, goi])
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
    const { bam, goi, v } = await bamHienTai(d, b)
    await d.q(
      `insert into ai_approvals (content_id, version_id, decision, approved_hash, approved_payload, actor_id, note)
       values ($1::uuid, $2::uuid, 'REVOKED', $3, $6::jsonb, $4, $5)`, [id, v.id, bam, u.id, ghiChu?.slice(0, 2000) ?? null, goi])
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
  // Khoá chia sẻ các tài liệu nguồn đến hết giao dịch: việc xoá tài liệu hay đồng bộ hiệu lực không thể chen vào
  // giữa lúc kiểm cổng và lúc ghi kết quả. Thứ tự khoá toàn module: bài → lịch → tài liệu (tiến trình khác chỉ khoá tài liệu).
  await d.q(
    `select t.id from tai_lieu t where t.id in (select tai_lieu_id from ai_content_sources where content_id = $1::uuid)
      order by t.id for share`, [b.id])
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

export type DauVaoLich = {
  kenh: string; ngay: string; gio: string; muiGio?: string; adapter?: string; bamNen?: string
  /** Đăng lại bản ĐÃ ĐĂNG của phiên bản hiện hành trên kênh này (đăng thật bắt buộc kèm lý do, ghi nhật ký). */
  dangLai?: boolean; lyDoDangLai?: string
}

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
    await kiemNen(d, b, i.bamNen)
    const c = await congTrongGiaoDich(d, b, kenh)
    if (c.loi.length) throw new LoiNghiepVu(409, 'Chưa đủ điều kiện đặt lịch xuất bản', c.loi)
    const khoa = createHash('sha256').update(`${c.versionId}|${kenh}`).digest('hex')
    const song = await d.q<{ id: string; status: string }>(
      `select id::text, status from ai_publication_schedules
        where version_id = $1::uuid and channel = $2
          and (adapter = 'dry_run') = ($3 = 'dry_run')   -- chạy thử không chiếm chỗ của lịch đăng thật, và ngược lại
          and status in ('SCHEDULED','PUBLISHING','RETRY_PENDING','UNKNOWN_OUTCOME','PUBLISHED')
        order by created_at`, [c.versionId, kenh, adapter])
    const dangCho = song.find((x) => x.status !== 'PUBLISHED')
    if (dangCho) throw new LoiNghiepVu(409, `Kênh này đã có lịch (${dangCho.status}) cho phiên bản hiện hành`)
    // Đã đăng rồi: không chặn cứng (bài bị gỡ nhầm, cần đăng nhắc lại là việc có thật) nhưng không được xảy ra do bấm nhầm.
    // Đăng thật: phải nói rõ là ĐĂNG LẠI và ghi lý do. Chạy thử: không có bài thật nên chạy lại tự do.
    const daDang = song.filter((x) => x.status === 'PUBLISHED')
    const lyDoDangLai = (i.lyDoDangLai ?? '').trim()
    if (daDang.length && adapter !== 'dry_run') {
      if (!i.dangLai) throw new LoiNghiepVu(409, 'Kênh này đã đăng phiên bản hiện hành. Nếu cần đăng lại (bài bị gỡ, đăng nhắc lại), chọn "Đăng lại" và ghi lý do.')
      if (lyDoDangLai.length < 10 || lyDoDangLai.length > 500) throw new LoiNghiepVu(400, 'Lý do đăng lại cần từ 10 đến 500 ký tự')
    }
    const [{ id: lid }] = await d.q<{ id: string }>(
      `insert into ai_publication_schedules
         (content_id, version_id, variant_id, channel, adapter, scheduled_at_utc, timezone, approval_id, idempotency_key, created_by, body_snapshot)
       values ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6::timestamptz, $7, $8::uuid, $9, $10, $11) returning id::text`,
      // body_snapshot: đúng văn bản đã duyệt cho kênh này — giữ lại vĩnh viễn dù biến thể về sau bị sửa.
      [id, c.versionId, c.bienThe!.id, kenh, adapter, luc.toISOString(), muiGio, c.pheDuyetId, `${khoa}:${randomUUID()}`, u.id, c.bienThe!.body])
    await ghiNhatKy(d, randomUUID(), u.id, 'DAT_LICH', 'schedule', lid, {
      kenh, luc: luc.toISOString(), muiGio, adapter,
      ...(daDang.length ? { dangLai: true, lanDangThu: daDang.length + 1, lichTruoc: daDang[daDang.length - 1].id, ...(adapter !== 'dry_run' ? { lyDo: lyDoDangLai } : {}) } : {}),
    })
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

type Lich = { id: string; content_id: string; version_id: string; body_snapshot: string | null; channel: Kenh; adapter: string; status: TrangThaiLich; retry_count: number; idempotency_key: string }

async function khoaLich(d: Db, lichId: string): Promise<Lich> {
  const [l] = await d.q<Lich>(
    `select id::text, content_id::text, version_id::text, body_snapshot, channel, adapter, status, retry_count, idempotency_key
       from ai_publication_schedules where id = $1::uuid for update`, [lichId])
  if (!l) throw new LoiNghiepVu(404, 'Không tìm thấy lịch')
  return l
}

function canUrl(kenh: string, s: unknown): string {
  try { return kiemTraUrlBaiDang(kenh, s) } catch (e) { throw new LoiNghiepVu(400, (e as Error).message) }
}

/** Kênh đăng tay: người dùng đăng rồi xác nhận kèm đường dẫn. Cổng xuất bản vẫn được kiểm lại tại đây. */
export async function xacNhanDangTay(db: Db, u: NguoiDungToiThieu, lichIdRaw: string, urlRaw: string) {
  kiemQuyenSoan(u)
  const lichId = canUuid(lichIdRaw, 'Mã lịch')
  return db.tx(async (d) => {
    const [x] = await d.q<{ content_id: string }>(`select content_id::text from ai_publication_schedules where id = $1::uuid`, [lichId])
    if (!x) throw new LoiNghiepVu(404, 'Không tìm thấy lịch')
    const b = await khoaBai(d, x.content_id)     // khoá bài TRƯỚC lịch: cùng thứ tự khoá với worker
    const l = await khoaLich(d, lichId)
    if (l.adapter !== 'manual') throw new LoiNghiepVu(409, 'Lịch này không phải loại đăng tay')
    if (l.status !== 'SCHEDULED') throw new LoiNghiepVu(409, 'Lịch không ở trạng thái chờ đăng')
    const url = canUrl(l.channel, urlRaw)
    const c = await congTrongGiaoDich(d, b, l.channel)
    if (l.version_id !== c.versionId) c.loi.push('Lịch thuộc phiên bản cũ của bài.')
    else if (c.bienThe && l.body_snapshot !== null && chuanHoa(l.body_snapshot) !== chuanHoa(c.bienThe.body)) c.loi.push('Văn bản kênh đã đổi sau khi đặt lịch.')
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
  return db.tx(async (d) => {
    const l = await khoaLich(d, lichId)
    if (l.status !== 'UNKNOWN_OUTCOME') throw new LoiNghiepVu(409, 'Lịch không ở trạng thái cần đối soát')
    const url = ketQua === 'PUBLISHED' ? canUrl(l.channel, urlRaw) : null
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
        where status = 'PUBLISHING' and locked_at < now() - make_interval(mins => $1::int) returning id::text`, [KHOA_TREO_PHUT])
    const quaHan = await d.q<{ id: string }>(
      `update ai_publication_schedules set status = 'EXPIRED', error_code = 'QUA_HAN', updated_at = now()
        where status in ('SCHEDULED','RETRY_PENDING') and adapter <> 'manual'
          and scheduled_at_utc < now() - make_interval(hours => $1::int) returning id::text`, [QUA_HAN_GIO])
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
  // Một lịch bị cổng chặn hoặc bài đang bị người dùng thao tác KHÔNG được làm dừng cả hàng đợi: bỏ qua nó, thử lịch kế.
  const boQua: string[] = []
  for (let i = 0; i < 10; i++) {
    const r = await nhanMot(db, workerId, boQua)
    if (r === null) return null
    if ('viec' in r) return r.viec
    boQua.push(r.boQua)
  }
  return null
}

async function nhanMot(db: Db, workerId: string, boQua: string[]): Promise<{ viec: ViecDang } | { boQua: string } | null> {
  return db.tx(async (d) => {
    const [ung] = await d.q<{ id: string; content_id: string }>(
      `select id::text, content_id::text from ai_publication_schedules
        where status in ('SCHEDULED','RETRY_PENDING') and adapter <> 'manual'
          and coalesce(next_attempt_at, scheduled_at_utc) <= now()
          and scheduled_at_utc >= now() - make_interval(hours => $1::int)   -- quá hạn thì KHÔNG đăng bù (xem donDepHangDoi)
          and id <> all($2::uuid[])
        order by coalesce(next_attempt_at, scheduled_at_utc)
        limit 1 for update skip locked`, [QUA_HAN_GIO, boQua])
    if (!ung) return null
    // Giải phóng thứ tự khoá: bài trước, lịch sau (giống các thao tác của người dùng) — tránh deadlock
    // bằng cách KHÔNG giữ khoá lịch khi chờ khoá bài: thử khoá bài không chờ.
    const [bai] = await d.q<Bai>(
      `select ${COT_BAI} from ai_content_items where id = $1::uuid and deleted_at is null for update skip locked`, [ung.content_id])
    if (!bai) return { boQua: ung.id }          // bài đang bị thao tác khác giữ → lần quét sau thử lại, giờ sang lịch kế
    const l = await khoaLich(d, ung.id)
    const c = await congTrongGiaoDich(d, bai, l.channel)
    // Lịch gắn với MỘT phiên bản: sau khi bài sửa sang phiên bản khác, lịch cũ (vd. đang chờ thử lại) không được lấy nội dung mới.
    if (l.version_id !== c.versionId) c.loi.push('Lịch thuộc phiên bản cũ của bài.')
    // Cùng phiên bản nhưng biến thể đã bị sửa sau khi đặt lịch (lịch đang đăng không bị huỷ): văn bản gửi đi phải đúng bản đã duyệt cho lịch này.
    else if (c.bienThe && l.body_snapshot !== null && chuanHoa(l.body_snapshot) !== chuanHoa(c.bienThe.body)) c.loi.push('Văn bản kênh đã đổi sau khi đặt lịch.')
    const cid = randomUUID()
    const maNhan = `${workerId}:${randomUUID()}`
    if (c.loi.length) {
      await d.q(
        `update ai_publication_schedules set status = 'CANCELLED', error_code = 'CONG_XUAT_BAN_CHAN', error_detail = $2, updated_at = now()
          where id = $1::uuid`, [l.id, c.loi.join(' | ').slice(0, 2000)])
      await ghiNhatKy(d, cid, null, 'CONG_CHAN', 'schedule', l.id, { loi: c.loi })
      return { boQua: l.id }
    }
    await d.q(
      `update ai_publication_schedules set status = 'PUBLISHING', locked_at = now(), locked_by = $2, updated_at = now()
        where id = $1::uuid`, [l.id, maNhan])
    await ghiNhatKy(d, cid, null, 'BAT_DAU_DANG', 'schedule', l.id, { workerId, lanThu: l.retry_count + 1 })
    return { viec: { lichId: l.id, contentId: l.content_id, kenh: l.channel, adapter: l.adapter, noiDung: c.bienThe!.body, khoaIdempotency: l.idempotency_key, lanThu: l.retry_count + 1, maNhan } }
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
  const hang = await db.q<{ lich: { channel: string; status: TrangThaiLich }[] } & Record<string, unknown>>(
    `select i.id::text, i.title, i.status, i.classification, i.ai_generated, ${iso('i.updated_at')}, u.name as nguoi_tao,
            v.version_no,
            -- chỉ lịch của PHIÊN BẢN HIỆN HÀNH và là lịch đăng thật: bản cũ đã đăng không làm bản mới trông như "đã đăng"
            coalesce((select json_agg(json_build_object('channel', s.channel, 'status', s.status)) from ai_publication_schedules s
                       where s.content_id = i.id and s.version_id = i.current_version_id and s.adapter <> 'dry_run'), '[]'::json) as lich
       from ai_content_items i
       join users u on u.id = i.created_by
       join ai_content_versions v on v.id = i.current_version_id
      where i.deleted_at is null
        and ($1::text is null or i.status = $1)
        and ($2::text is null or i.title ilike '%' || $2 || '%')
      order by i.updated_at desc limit 200`, [loc.trangThai || null, loc.tu?.slice(0, 100) || null])
  // Mỗi KÊNH một trạng thái đại diện: kênh đã đăng đang có lịch đăng lại vẫn là "đã đăng", không thành "đăng một phần".
  return hang.map((h) => ({ ...h, lich: gopTheoKenh(h.lich) }))
}

export async function chiTietBai(db: Db, idRaw: string) {
  const id = canUuid(idRaw, 'Mã bài')
  const [bai] = await db.q<Bai & { updated_at: string }>(
    `select ${COT_BAI}, ${iso('updated_at')}
       from ai_content_items where id = $1::uuid and deleted_at is null`, [id])
  if (!bai) throw new LoiNghiepVu(404, 'Không tìm thấy bài viết')
  const phienBan = await layPhienBan(db, bai.current_version_id)
  const bienThe = await layBienThe(db, phienBan.id)
  const nguon = await layNguon(db, id)
  const pheDuyet = await db.q(
    `select a.id::text, a.decision, a.approved_hash, a.note, ${iso('a.created_at')}, a.version_id::text, u.name as nguoi
       from ai_approvals a join users u on u.id = a.actor_id where a.content_id = $1::uuid order by a.seq desc limit 20`, [id])
  const lich = await db.q(
    `select id::text, channel, adapter, status, ${iso('scheduled_at_utc')}, timezone, retry_count, external_post_id, external_url,
            error_code, error_detail, ${iso('published_at')}, version_id::text
       from ai_publication_schedules where content_id = $1::uuid order by created_at desc limit 50`, [id])
  const lichSuPhienBan = await db.q(
    `select v.id::text, v.version_no, ${iso('v.created_at')}, u.name as nguoi from ai_content_versions v join users u on u.id = v.created_by
      where v.content_id = $1::uuid order by v.version_no desc limit 30`, [id])
  // Kênh đã đăng phiên bản hiện hành — hỏi thẳng CSDL, không suy từ danh sách `lich` bị cắt 50 dòng (nhiều lần chạy thử
  // có thể đẩy lịch đăng thật ra ngoài, làm giao diện không mời "Đăng lại" trong khi máy chủ đòi cờ dangLai).
  const kenhDaDang = await db.q<{ channel: string; chay_thu: boolean }>(
    `select distinct channel, (adapter = 'dry_run') as chay_thu from ai_publication_schedules
      where content_id = $1::uuid and version_id = $2::uuid and status = 'PUBLISHED'`, [id, phienBan.id])
  const bam = bamPheDuyet(bai, phienBan, bienThe, nguon.map((n) => n.id))
  return { bai, phienBan, bienThe, nguon, pheDuyet, lich, kenhDaDang, lichSuPhienBan, bamHienTai: bam }
}

export async function lichTrongKhoang(db: Db, tuIso: string, denIso: string) {
  return db.q(
    `select s.id::text, s.content_id::text, s.channel, s.adapter, s.status, ${iso('s.scheduled_at_utc')}, s.timezone, s.external_url, i.title
       from ai_publication_schedules s join ai_content_items i on i.id = s.content_id
      where s.scheduled_at_utc >= $1::timestamptz and s.scheduled_at_utc < $2::timestamptz
      order by s.scheduled_at_utc limit 500`, [tuIso, denIso])
}

export async function nhatKy(db: Db, gioiHan = 100) {
  return db.q(
    `select e.id::text, e.correlation_id::text, e.action, e.target_type, e.target_id, e.detail, ${iso('e.created_at')}, u.name as nguoi
       from ai_audit_events e left join users u on u.id = e.actor_id order by e.id desc limit $1::int`, [Math.min(Math.max(gioiHan, 1), 500)])
}

export async function thongKe(db: Db) {
  const [r] = await db.q(
    `select
       (select count(*)::int from ai_content_items where deleted_at is null) as tong_bai,
       (select count(*)::int from ai_content_items where deleted_at is null and status = 'DRAFT') as ban_nhap,
       (select count(*)::int from ai_content_items where deleted_at is null and status = 'PENDING_REVIEW') as cho_duyet,
       (select count(*)::int from ai_content_items where deleted_at is null and status = 'APPROVED') as da_duyet,
       (select count(*)::int from ai_publication_schedules where adapter <> 'dry_run' and status in ('SCHEDULED','RETRY_PENDING')) as lich_cho,
       (select count(*)::int from ai_publication_schedules where adapter <> 'dry_run' and status = 'PUBLISHED') as da_dang,
       (select count(*)::int from ai_publication_schedules where adapter <> 'dry_run' and status = 'FAILED') as loi,
       (select count(*)::int from ai_publication_schedules where adapter <> 'dry_run' and status = 'UNKNOWN_OUTCOME') as can_doi_soat`)
  return r
}
