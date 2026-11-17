// Dùng chung cho script thử của module Nội dung AI: CHỈ kết nối CSDL có tên kết thúc "_ai_test".
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

export const APP = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

export function chuoiKetNoiThu() {
  const envFile = readFileSync(join(APP, '.env'), 'utf8')
  const env = (k) => envFile.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? ''
  const u = new URL(env('DIRECT_DATABASE_URL') || env('DATABASE_URL'))
  const ten = decodeURIComponent(u.pathname.slice(1))
  u.pathname = '/' + encodeURIComponent(ten.endsWith('_ai_test') ? ten : `${ten}_ai_test`)
  return u.toString()
}

/** Pool tới CSDL thử. Ném lỗi nếu CSDL đang nối không phải *_ai_test (chống chạy nhầm vào CSDL thật). */
export async function moPoolThu() {
  const pool = new pg.Pool({ connectionString: chuoiKetNoiThu(), max: 6 })
  const { rows } = await pool.query('select current_database() as ten')
  if (!rows[0].ten.endsWith('_ai_test')) {
    await pool.end()
    throw new Error('Từ chối: không phải CSDL thử (*_ai_test)')
  }
  return pool
}

/** Bọc pg.Pool thành giao diện Db của lib/ai-content/kho.ts. */
export function dbTuPool(pool) {
  const boc = (c) => ({
    q: async (sql, params = []) => (await c.query(sql, params)).rows,
    tx: async () => { throw new Error('không lồng giao dịch') },
  })
  return {
    q: async (sql, params = []) => (await pool.query(sql, params)).rows,
    tx: async (fn) => {
      const c = await pool.connect()
      try {
        await c.query('BEGIN')
        const kq = await fn(boc(c))
        await c.query('COMMIT')
        return kq
      } catch (e) {
        await c.query('ROLLBACK').catch(() => {})
        throw e
      } finally {
        c.release()
      }
    },
  }
}
