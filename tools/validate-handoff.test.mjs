import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validate, SCHEMA_PATH } from './validate-handoff.mjs'

const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'))
const tot = () => ({
  task_id: 'AI-07-001', parent_id: null, owner: 'A2', status: 'IN_REVIEW', goal: 'Dọn gốc repo',
  scope: { allowed_paths: ['docs/**'], forbidden_paths: ['app/.env'] },
  acceptance_criteria: ['npm test đạt'], risk_level: 'low', approval_required: false,
  updated_at: '2026-10-28T09:00:00Z',
})
const loi = d => validate(d, schema)

test('bản bàn giao hợp lệ', () => assert.deepEqual(loi(tot()), []))

test('thiếu trường bắt buộc', () => {
  const d = tot(); delete d.acceptance_criteria
  assert.match(loi(d).join('|'), /thiếu 'acceptance_criteria'/)
})

test('enum: owner, status, risk_level sai', () => {
  assert.ok(loi({ ...tot(), owner: 'A9' }).length)
  assert.ok(loi({ ...tot(), status: 'HOAN_THANH' }).length)
  assert.ok(loi({ ...tot(), risk_level: 'extreme' }).length)
})

test('thuộc tính thừa bị chặn (ở gốc và trong scope)', () => {
  assert.match(loi({ ...tot(), tuy_y: 1 }).join('|'), /thừa 'tuy_y'/)
  const d = tot(); d.scope.khac = []
  assert.match(loi(d).join('|'), /thừa 'khac'/)
})

test('kiểu dữ liệu và acceptance_criteria rỗng', () => {
  assert.ok(loi({ ...tot(), approval_required: 'false' }).length)
  assert.ok(loi({ ...tot(), acceptance_criteria: [] }).length)
  assert.ok(loi({ ...tot(), acceptance_criteria: [1] }).length)
  assert.ok(loi({ ...tot(), goal: '' }).length)
})

test('updated_at phải là date-time ISO-8601 thật', () => {
  assert.ok(loi({ ...tot(), updated_at: '28/10/2026' }).length)
  assert.ok(loi({ ...tot(), updated_at: '2026-13-45T00:00:00Z' }).length)
  assert.deepEqual(loi({ ...tot(), updated_at: '2026-10-28T09:00:00+07:00' }), [])
})

test('parent_id nhận null hoặc chuỗi, không nhận số', () => {
  assert.deepEqual(loi({ ...tot(), parent_id: 'AI-07' }), [])
  assert.ok(loi({ ...tot(), parent_id: 7 }).length)
})

test('fail closed: schema có từ khoá chưa hỗ trợ thì báo lỗi', () => {
  const l = validate({ a: 1 }, { type: 'object', pattern: '^x$' })
  assert.match(l.join('|'), /chưa hỗ trợ 'pattern'/)
})
