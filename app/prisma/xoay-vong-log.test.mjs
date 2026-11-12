import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { xoayVongLog } from './xoay-vong-log.mjs'

test('log vượt ngưỡng → đổi sang .1, bản cũ hơn sang .2, bản .2 cũ bị bỏ', () => {
  const d = mkdtempSync(join(tmpdir(), 'log-'))
  try {
    const p = join(d, 'sync.log')
    writeFileSync(p, 'MOI'.repeat(10))
    writeFileSync(p + '.1', 'CU1')
    writeFileSync(p + '.2', 'CU2')
    assert.equal(xoayVongLog(p, { toiDa: 10, giu: 2 }), true)
    assert.equal(existsSync(p), false)
    assert.equal(readFileSync(p + '.1', 'utf8'), 'MOI'.repeat(10))
    assert.equal(readFileSync(p + '.2', 'utf8'), 'CU1')
  } finally { rmSync(d, { recursive: true, force: true }) }
})
test('log dưới ngưỡng hoặc chưa có → không làm gì', () => {
  const d = mkdtempSync(join(tmpdir(), 'log-'))
  try {
    const p = join(d, 'sync.log')
    assert.equal(xoayVongLog(p, { toiDa: 10 }), false)
    writeFileSync(p, 'nho')
    assert.equal(xoayVongLog(p, { toiDa: 10 }), false)
    assert.equal(readFileSync(p, 'utf8'), 'nho')
  } finally { rmSync(d, { recursive: true, force: true }) }
})
