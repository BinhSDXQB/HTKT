// Tạo CSDL THỬ cho module Nội dung AI: bản sao CẤU TRÚC (không dữ liệu) của CSDL chính.
//
//   node scripts/ai-content/tao-csdl-thu.mjs            # tạo <tên_csdl>_ai_test nếu chưa có
//   node scripts/ai-content/tao-csdl-thu.mjs --lam-lai  # xoá CSDL thử cũ rồi tạo lại
//
// An toàn:
//  - CSDL chính chỉ bị ĐỌC (pg_dump --schema-only). Không ghi gì vào CSDL chính.
//  - Tên đích LUÔN kết thúc bằng "_ai_test"; script từ chối mọi tên khác.
//  - Không in chuỗi kết nối / mật khẩu.
// Đồng thời là bài DIỄN TẬP KHÔI PHỤC CẤU TRÚC: nếu bản dump cấu trúc khôi phục sạch thì in số bảng để đối chiếu.

import { readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const envFile = readFileSync(join(root, '.env'), 'utf8')
const env = (k) => envFile.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? ''
const goc = new URL(env('DIRECT_DATABASE_URL') || env('DATABASE_URL'))
const tenGoc = decodeURIComponent(goc.pathname.slice(1))
const tenThu = `${tenGoc}_ai_test`
if (!tenThu.endsWith('_ai_test') || tenThu === tenGoc) throw new Error('Tên CSDL thử không hợp lệ')

const BIN = ['C:/Program Files/PostgreSQL/16/bin', ''].find((d) => d === '' || existsSync(join(d, 'pg_dump.exe')))
const exe = (n) => (BIN ? join(BIN, n + '.exe') : n)
const moiTruong = {
  ...process.env,
  PGHOST: goc.hostname, PGPORT: goc.port || '5432',
  PGUSER: decodeURIComponent(goc.username), PGPASSWORD: decodeURIComponent(goc.password),
}
function chay(ten, args, { choPhepLoi = false } = {}) {
  const r = spawnSync(exe(ten), args, { env: moiTruong, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  if (r.status !== 0 && !choPhepLoi) {
    throw new Error(`${ten} lỗi (mã ${r.status}): ${(r.stderr || '').split('\n').slice(0, 5).join(' | ')}`)
  }
  return r
}
const sql = (db, cau) => chay('psql', ['-d', db, '-At', '-v', 'ON_ERROR_STOP=1', '-c', cau]).stdout.trim()

const daCo = sql('postgres', `select 1 from pg_database where datname = '${tenThu.replace(/'/g, "''")}'`) === '1'
if (daCo && !process.argv.includes('--lam-lai')) {
  console.log(`CSDL thử ${tenThu} đã có. Dùng --lam-lai để tạo lại.`)
  process.exit(0)
}
if (daCo) chay('dropdb', [tenThu])

const tam = mkdtempSync(join(tmpdir(), 'ai-test-'))
const tep = join(tam, 'schema.sql')
try {
  chay('pg_dump', ['-d', tenGoc, '--schema-only', '--no-owner', '--no-privileges', '-f', tep])
  chay('createdb', [tenThu])
  const r = chay('psql', ['-d', tenThu, '-q', '-v', 'ON_ERROR_STOP=1', '-f', tep], { choPhepLoi: true })
  if (r.status !== 0) throw new Error('Khôi phục cấu trúc lỗi: ' + (r.stderr || '').split('\n').slice(0, 8).join(' | '))
  const dem = (db) => sql(db, `select count(*) from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'`)
  const [a, b] = [dem(tenGoc), dem(tenThu)]
  console.log(`Đã tạo ${tenThu}: ${b} bảng (CSDL chính: ${a} bảng) — ${a === b ? 'KHỚP' : 'LỆCH'}`)
  console.log(`Số dòng trong users của CSDL thử: ${sql(tenThu, 'select count(*) from users')} (phải = 0)`)
  if (a !== b) process.exit(1)
} finally {
  rmSync(tam, { recursive: true, force: true })
}
