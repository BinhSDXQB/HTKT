// Cờ secure của cookie phiên (B0 — S16). Chạy: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cookieSecure } from './cookie-an-toan.ts'

test('production mặc định secure khi không đặt biến', () => {
  assert.equal(cookieSecure({ NODE_ENV: 'production' }), true)
  assert.equal(cookieSecure({ NODE_ENV: 'production', COOKIE_SECURE: '' }), true)
})

test('tắt được TƯỜNG MINH bằng COOKIE_SECURE=false', () => {
  assert.equal(cookieSecure({ NODE_ENV: 'production', COOKIE_SECURE: 'false' }), false)
  assert.equal(cookieSecure({ NODE_ENV: 'production', COOKIE_SECURE: ' FALSE ' }), false)
})

test('môi trường phát triển mặc định không secure, bật được bằng COOKIE_SECURE=true', () => {
  assert.equal(cookieSecure({ NODE_ENV: 'development' }), false)
  assert.equal(cookieSecure({}), false)
  assert.equal(cookieSecure({ NODE_ENV: 'development', COOKIE_SECURE: 'true' }), true)
})
