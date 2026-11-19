import { test } from 'node:test'
import assert from 'node:assert/strict'
import { laDuongDanDanhGiaNam } from './duong-dan-mo.ts'

test('mở các đường dẫn đánh giá cuối năm cho mọi cán bộ', () => {
  for (const p of [
    '/dashboard/van-phong-so/ho-so/abc123/danh-gia-nam',
    '/dashboard/van-phong-so/ho-so/abc123/danh-gia-nam/mau/2A',
    '/dashboard/van-phong-so/danh-gia/bien-ban',
    '/dashboard/van-phong-so/danh-gia/tong-hop',
    '/dashboard/van-phong-so/danh-gia/tong-hop/mau-01',
    '/dashboard/van-phong-so/danh-gia/tong-hop-so',
    '/api/office/danh-gia-nam/xuat',
  ]) assert.ok(laDuongDanDanhGiaNam(p), p)
})

test('KHÔNG mở các trang khác của Văn phòng Sở', () => {
  for (const p of [
    '/dashboard/van-phong-so',
    '/dashboard/van-phong-so/ho-so',
    '/dashboard/van-phong-so/ho-so/abc123',
    '/dashboard/van-phong-so/ho-so/abc123/luong',
    '/dashboard/van-phong-so/ho-so/abc123/danh-gia-nam-gia',
    '/dashboard/van-phong-so/ho-so/a/b/danh-gia-nam',
    '/dashboard/van-phong-so/danh-gia',
    '/dashboard/van-phong-so/danh-gia/ky-luat',
    '/dashboard/van-phong-so/danh-gia/tong-hop-gia',
    '/api/office/ho-so/export',
    '/api/office/danh-gia-nam-gia',
    '/x/dashboard/van-phong-so/danh-gia/bien-ban',
    '/api/office/danh-gia-nam/bat-ky-route-moi',
    '/api/office/danh-gia-nam',
    '/dashboard/van-phong-so/ho-so/abc123/danh-gia-nam/khac',
    '/dashboard/van-phong-so/ho-so/abc123/danh-gia-nam/mau/2A/them',
    '/dashboard/van-phong-so/danh-gia/bien-ban/xoa',
    '/dashboard/van-phong-so/danh-gia/tong-hop/khac',
  ]) assert.ok(!laDuongDanDanhGiaNam(p), p)
})
