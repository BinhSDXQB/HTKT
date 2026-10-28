// Bộ nạp cho `node --test`: cho phép nạp module của app/lib vào test KHÔNG cần sửa mã nguồn.
//  - alias '@/x' → app/x.ts (Next dùng alias này, Node thì không)
//  - 'server-only', 'next/navigation', '@/lib/db', '@/lib/session' → bản giả (không kết nối CSDL/phiên)
// Chỉ dùng cho test: bản giả `db` ném lỗi nếu lỡ bị gọi, để test không âm thầm chạm CSDL.
import { registerHooks } from 'node:module'
import { existsSync, statSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join, dirname } from 'node:path'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'app')
const stub = src => ({ url: 'data:text/javascript,' + encodeURIComponent(src), shortCircuit: true })

const STUBS = {
  'server-only': 'export {}',
  'next/navigation': "export const redirect = (u) => { throw new Error('redirect:' + u) }; export const notFound = () => { throw new Error('notFound') }",
  '@/lib/db': "export const db = new Proxy({}, { get() { throw new Error('test: db bi goi') } })",
  '@/lib/session': 'export const getSession = async () => null',
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier in STUBS) return stub(STUBS[specifier])
    if (specifier.startsWith('@/')) {
      const base = join(APP, specifier.slice(2))
      for (const cand of [base + '.ts', join(base, 'index.ts')]) {
        if (existsSync(cand) && statSync(cand).isFile()) return nextResolve(pathToFileURL(cand).href, context)
      }
    }
    // import tương đối không đuôi (kiểu Next/TS bundler): './x' → './x.ts' hoặc './x/index.ts'
    if (/^\.{1,2}\//.test(specifier) && !/\.[a-z]+$/i.test(specifier) && context.parentURL?.startsWith('file:')) {
      const base = join(dirname(fileURLToPath(context.parentURL)), specifier)
      for (const cand of [base + '.ts', join(base, 'index.ts')]) {
        if (existsSync(cand) && statSync(cand).isFile()) return nextResolve(pathToFileURL(cand).href, context)
      }
    }
    return nextResolve(specifier, context)
  },
})
