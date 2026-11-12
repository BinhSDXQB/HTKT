// Kiểm tra tệp bàn giao (handoff) theo docs/ai/templates/handoff.schema.json.
// Dùng: node tools/validate-handoff.mjs <tep.json>   → thoát mã 0 nếu hợp lệ, 1 nếu lỗi.
// Không dùng thư viện ngoài (tránh đổi package-lock); chỉ hiện thực các từ khoá schema đang dùng:
// type, enum, required, properties, additionalProperties, items, minLength, minItems, format=date-time.
// Từ khoá lạ trong schema → báo lỗi thay vì lặng lẽ bỏ qua (fail closed).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const KNOWN = new Set(['$schema', 'title', 'description', 'type', 'enum', 'required', 'properties',
  'additionalProperties', 'items', 'minLength', 'minItems', 'format'])
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/

const kieu = v => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v)

export function validate(data, schema, path = '$') {
  const errs = []
  for (const k of Object.keys(schema)) if (!KNOWN.has(k)) errs.push(`${path}: schema dùng từ khoá chưa hỗ trợ '${k}'`)
  if (schema.type) {
    const ds = [].concat(schema.type)
    const k = kieu(data)
    if (!ds.includes(k)) return [...errs, `${path}: kiểu '${k}', cần ${ds.join('|')}`]
  }
  if (schema.enum && !schema.enum.includes(data)) errs.push(`${path}: '${data}' không thuộc ${JSON.stringify(schema.enum)}`)
  if (typeof data === 'string') {
    if (schema.minLength != null && data.length < schema.minLength) errs.push(`${path}: chuỗi rỗng/ngắn hơn ${schema.minLength}`)
    if (schema.format === 'date-time' && (!DATE_TIME.test(data) || Number.isNaN(Date.parse(data)))) errs.push(`${path}: không phải date-time ISO-8601`)
  }
  if (Array.isArray(data)) {
    if (schema.minItems != null && data.length < schema.minItems) errs.push(`${path}: cần ≥ ${schema.minItems} phần tử`)
    if (schema.items) data.forEach((x, i) => errs.push(...validate(x, schema.items, `${path}[${i}]`)))
  }
  if (kieu(data) === 'object') {
    for (const r of schema.required ?? []) if (!(r in data)) errs.push(`${path}: thiếu '${r}'`)
    const props = schema.properties ?? {}
    for (const [k, v] of Object.entries(data)) {
      if (props[k]) errs.push(...validate(v, props[k], `${path}.${k}`))
      else if (schema.additionalProperties === false) errs.push(`${path}: thuộc tính thừa '${k}'`)
    }
  }
  return errs
}

export const SCHEMA_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'ai', 'templates', 'handoff.schema.json')

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const f = process.argv[2]
  if (!f) { console.error('Dùng: node tools/validate-handoff.mjs <tep.json>'); process.exit(2) }
  let data
  try { data = JSON.parse(readFileSync(f, 'utf8')) } catch (e) { console.error('Không đọc được JSON:', e.message); process.exit(1) }
  const errs = validate(data, JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')))
  errs.forEach(e => console.log('LỖI', e))
  console.log(errs.length ? `KHÔNG HỢP LỆ (${errs.length} lỗi)` : 'HỢP LỆ')
  process.exit(errs.length ? 1 : 0)
}
