// Test xác thực webhook (B0 — S1). Chạy: npm test   (hoặc node --test --experimental-strip-types lib/webhook-auth.test.ts)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { layTokenTuHeader, xacThucWebhook, DO_DAI_TOI_THIEU_SECRET } from './webhook-auth.ts'

const SECRET = 'x'.repeat(DO_DAI_TOI_THIEU_SECRET) + '-secret-thu-nghiem'

test('thiếu WEBHOOK_SECRET → 503, kể cả khi gửi đúng token mặc định cũ', () => {
  for (const s of [undefined, '', '   ']) {
    const kq = xacThucWebhook('htkt-webhook-2025', s)
    assert.equal(kq.ok, false)
    assert.equal(kq.ok === false && kq.status, 503)
  }
})

test('secret quá ngắn bị coi như chưa cấu hình', () => {
  const ngan = 'a'.repeat(DO_DAI_TOI_THIEU_SECRET - 1)
  const kq = xacThucWebhook(ngan, ngan)
  assert.equal(kq.ok === false && kq.status, 503)
})

test('sai token / token rỗng → 401', () => {
  assert.equal(xacThucWebhook('sai', SECRET).ok, false)
  assert.equal(xacThucWebhook('', SECRET).ok, false)
  const kq = xacThucWebhook(SECRET + 'x', SECRET)
  assert.equal(kq.ok === false && kq.status, 401)
})

test('đúng token → ok', () => {
  assert.equal(xacThucWebhook(SECRET, SECRET).ok, true)
  assert.equal(xacThucWebhook(SECRET, `  ${SECRET}  `).ok, true)
})

test('đọc token từ Bearer hoặc X-API-Key', () => {
  assert.equal(layTokenTuHeader(`Bearer ${SECRET}`, null), SECRET)
  assert.equal(layTokenTuHeader(`bearer   ${SECRET} `, null), SECRET)
  assert.equal(layTokenTuHeader(null, SECRET), SECRET)
  assert.equal(layTokenTuHeader('', SECRET), SECRET)
  assert.equal(layTokenTuHeader(null, null), '')
})
