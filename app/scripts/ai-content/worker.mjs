// WORKER hàng đợi xuất bản của module Nội dung AI.
//
//   node --import ../tools/test-support/register.mjs scripts/ai-content/worker.mjs --once        # chạy một vòng rồi thoát
//   node --import ../tools/test-support/register.mjs scripts/ai-content/worker.mjs               # chạy liên tục (quét mỗi 60 giây)
//   ... --thu                                                                                     # dùng CSDL thử *_ai_test
//
// CHƯA đăng ký PM2/Task Scheduler — việc đó cần người quản trị duyệt (xem docs/ai-content/TRIEN_KHAI.md).
// An toàn:
//  - Cờ AI_CONTENT_ENABLED khác '1' → không nhận việc nào (kiểm lại MỖI vòng: tắt cờ là dừng đăng).
//  - Mốc M1 chỉ có adapter 'dry_run' (không gọi mạng xã hội thật). Lịch 'manual' do người đăng tay, worker bỏ qua.
//  - Pool tối đa 2 kết nối, mỗi vòng xử lý tối đa 20 việc, từng việc một — không tranh tài nguyên với web.
//  - Không ghi nội dung bài, token hay chuỗi kết nối ra log.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { APP, moPoolThu, dbTuPool } from './_csdl-thu.mjs'
import { nhanViec, ghiKetQua, donDepHangDoi } from '../../lib/ai-content/kho.ts'
import { aiContentBat } from '../../lib/ai-content/nghiep-vu.ts'

const MOT_LAN = process.argv.includes('--once')
const THU = process.argv.includes('--thu')
const CHU_KY_MS = 60_000
const TOI_DA_MOI_VONG = 20
const HAN_ADAPTER_MS = 30_000

function docEnv() {
  const t = readFileSync(join(APP, '.env'), 'utf8')
  return (k) => process.env[k] || (t.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '')
}
const env = docEnv()
// Cờ được ĐỌC LẠI TỪ TỆP .env mỗi lần hỏi (không dùng bản đã nạp lúc khởi động, không dùng biến môi trường của
// tiến trình): gỡ AI_CONTENT_ENABLED khỏi .env là worker đang chạy dừng nhận việc ở lần kiểm kế tiếp, không cần khởi động lại.
function coBat() {
  if (THU) return true
  try {
    const dong = readFileSync(join(APP, '.env'), 'utf8').match(/^AI_CONTENT_ENABLED=(.*)$/m)
    return aiContentBat({ AI_CONTENT_ENABLED: dong?.[1].trim().replace(/^["']|["']$/g, '') })
  } catch { return false }     // không đọc được .env → coi như tắt
}

/** Adapter mốc M1. Mỗi adapter nhận việc và trả KetQuaDang; ném lỗi = coi như chưa gửi được. */
const ADAPTER = {
  // Chạy thử: KHÔNG đăng đi đâu. Mã bài mang tiền tố "dryrun-" để không ai nhầm là bài thật.
  dry_run: async (v) => ({ ok: true, externalPostId: `dryrun-${v.khoaIdempotency.slice(0, 16)}` }),
}

function coHan(p, ms) {
  let t
  const han = new Promise((_, tu) => { t = setTimeout(() => tu(Object.assign(new Error('quá thời gian'), { code: 'TIMEOUT' })), ms) })
  return Promise.race([p, han]).finally(() => clearTimeout(t))
}

async function motVong(db, workerId) {
  if (!coBat()) return { boQua: 'cờ AI_CONTENT_ENABLED đang tắt' }
  const don = await donDepHangDoi(db)
  let xong = 0, loi = 0
  for (let i = 0; i < TOI_DA_MOI_VONG; i++) {
    if (!coBat()) break
    const v = await nhanViec(db, workerId)
    if (!v) break
    const adapter = ADAPTER[v.adapter]
    let kq
    if (!adapter) kq = { ok: false, ma: 'ADAPTER_KHONG_HO_TRO', daGui: false }
    else {
      try { kq = await coHan(adapter(v), HAN_ADAPTER_MS) }
      // Quá thời gian sau khi đã gọi adapter: không biết bài đã lên chưa → daGui = true → cần đối soát.
      catch (e) { kq = { ok: false, ma: e.code === 'TIMEOUT' ? 'TIMEOUT' : (e.code ?? 'LOI_ADAPTER'), daGui: true, thongBao: String(e.message).slice(0, 300) } }
    }
    const r = await ghiKetQua(db, v.maNhan, v.lichId, kq)
    if (r.trangThai === 'PUBLISHED') xong++; else loi++
    console.log(`[ai-worker] lịch ${v.lichId} kênh ${v.kenh} lần ${v.lanThu} → ${r.trangThai}`)
  }
  return { ...don, xong, loi }
}

const pool = THU ? await moPoolThu() : new pg.Pool({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL'), max: 2 })
const db = dbTuPool(pool)
const workerId = `w-${process.pid}-${randomUUID().slice(0, 8)}`
let dung = false
process.on('SIGINT', () => { dung = true })
process.on('SIGTERM', () => { dung = true })

try {
  do {
    try { console.log('[ai-worker]', new Date().toISOString(), JSON.stringify(await motVong(db, workerId))) }
    catch (e) { console.error('[ai-worker] lỗi vòng quét:', e.message) }
    if (MOT_LAN) break
    for (let i = 0; i < CHU_KY_MS / 1000 && !dung; i++) await new Promise((r) => setTimeout(r, 1000))
  } while (!dung)
} finally {
  await pool.end()
}
