// Xoay vòng nhật ký: log > toiDa byte thì đổi tên thành .1 (.1 → .2 …), giữ `giu` bản cũ.
// Gọi từ prisma/sync-vbpl.cmd TRƯỚC khi node đồng bộ mở log để ghi (Windows không đổi tên tệp đang mở).
//   node prisma/xoay-vong-log.mjs <duong-dan-log>
import { statSync, existsSync, renameSync, rmSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export function xoayVongLog(path, { toiDa = 10 * 1024 * 1024, giu = 2 } = {}) {
  let size
  try { size = statSync(path).size } catch { return false }
  if (size <= toiDa) return false
  for (let i = giu; i >= 1; i--) {
    const src = i === 1 ? path : `${path}.${i - 1}`
    const dst = `${path}.${i}`
    if (existsSync(src)) { rmSync(dst, { force: true }); renameSync(src, dst) }
  }
  return true
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Lỗi xoay vòng (tệp bị khoá…) không được chặn lần đồng bộ → chỉ báo, thoát 0.
  try { if (process.argv[2]) xoayVongLog(process.argv[2]) } catch (e) { console.error('xoay-vong-log:', e.message) }
}
