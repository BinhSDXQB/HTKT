// Tạo dữ liệu staging từ bản khôi phục — danh sách trắng + dữ liệu giả (B0 mục 7). Chạy: npm test
// Test đọc prisma/schema.prisma THẬT.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { docSchema, kiemTraQuyTac, sinhSql, thuTuXoa, laCotNoiDung, BANG_GIU, ID_GIU_CHO } from './an-danh.ts'

const schema = readFileSync(fileURLToPath(new URL('../../prisma/schema.prisma', import.meta.url)), 'utf8')
const bangs = docSchema(schema)
const theoModel = new Map(bangs.map((b) => [b.model, b]))
const sql = sinhSql(bangs)

test('đọc đủ model, cột (kể cả Bytes, mảng) và khoá ngoại', () => {
  assert.equal(bangs.length, [...schema.matchAll(/^model\s+\w+\s*\{/gm)].length)
  const doc = theoModel.get('OfficeGeneratedDocument')!
  assert.ok(doc.cot.some((c) => c.ten === 'noiDung' && c.kieu === 'Bytes'), 'phải đọc được cột Bytes')
  assert.ok(theoModel.get('Asset')!.cot.some((c) => c.ten === 'images' && c.mang), 'phải đọc được cột mảng')
  assert.ok(theoModel.get('User')!.fk.some((f) => f.toi === 'Role' && f.cot[0] === 'roleId' && !f.tuyChon))
})

test('quy tắc hợp lệ với schema: bảng/cột giữ tồn tại, không giữ nhị phân, khoá ngoại xử lý được, không vòng', () => {
  const loi = kiemTraQuyTac(bangs)
  assert.deepEqual(loi, [], loi.map((l) => `${l.loai}: ${l.chiTiet}`).join('\n'))
})

test('MẶC ĐỊNH XOÁ: bảng dữ liệu về con người KHÔNG nằm trong danh sách giữ', () => {
  for (const m of ['User', 'CanBo', 'ConCanBo', 'PhanCong', 'LanhDaoXa', 'cchn_ho_so', 'httt_nang_luc_ca_nhan', 'OfficeSalaryHistory',
    'OfficeLeaveRequest', 'OfficeLeaveSignature', 'OfficeGeneratedDocument', 'OvertimeTimesheet', 'OvertimeSignature', 'OfficeDisciplineRecord',
    'DsLienHe', 'LichCaNhan', 'CongViec', 'PermitVehicle', 'OversizedVehiclePermit', 'RoadConnectionApplication', 'AuditLog', 'ChatbotLog',
    'IntegrationConfig', 'WardReport', 'qd72_attachments', 'qd72_comments']) {
    assert.ok(!(m in BANG_GIU), `${m} không được giữ`)
    assert.ok(sql.includes(`DELETE FROM "${theoModel.get(m)!.bang}"`), `${m} phải bị xoá`)
  }
})

test('bảng giữ: mọi cột nội dung NGOÀI danh sách trắng bị xoá trắng (gồm Json, mảng)', () => {
  for (const [model, g] of Object.entries(BANG_GIU)) {
    const b = theoModel.get(model)!
    const fkXoa = new Set(b.fk.filter((f) => !(f.toi in BANG_GIU)).flatMap((f) => f.cot))
    for (const c of b.cot) {
      if (!laCotNoiDung(c) || c.ten === 'id' || g.cot.includes(c.ten) || fkXoa.has(c.ten)) continue
      assert.ok(new RegExp(`UPDATE "${b.bang}" SET[^;]*"${c.ten}" = `).test(sql), `${model}.${c.ten} phải bị xoá trắng`)
    }
  }
  // ví dụ cụ thể
  assert.match(sql, /UPDATE "den_chieu_sang" SET[^;]*"ghiChu" = NULL/)
  assert.match(sql, /UPDATE "assets" SET[^;]*"images" = '\{\}'/)
})

test('thứ tự xoá: bảng con trước bảng cha; users giữ tài khoản giữ chỗ', () => {
  const thuTu = thuTuXoa(bangs).map((b) => b.model)
  const vt = (m: string) => thuTu.indexOf(m)
  for (const b of thuTuXoa(bangs)) for (const fk of b.fk) {
    if (fk.toi !== b.model && thuTu.includes(fk.toi)) assert.ok(vt(b.model) < vt(fk.toi), `${b.model} phải xoá trước ${fk.toi}`)
  }
  assert.ok(sql.includes(`DELETE FROM "users" WHERE id <> '${ID_GIU_CHO}';`))
})

test('SQL: rào chặn trước BEGIN, hậu điều kiện TRƯỚC dữ liệu giả, không TRUNCATE, mật khẩu không vào khối DO', () => {
  const vt = (s: string) => { const i = sql.indexOf(s); assert.ok(i >= 0, `thiếu: ${s}`); return i }
  assert.ok(vt("current_database() IN ('ql_htkt', 'postgres')") < vt('BEGIN;'))
  assert.ok(vt("to_regclass('public.an_danh_moi_truong_noi_bo')") < vt('BEGIN;'))
  assert.ok(vt('\\if :mat_khau_dat') < vt('BEGIN;'), 'kiểm độ dài mật khẩu ngoài khối DO')
  assert.ok(vt('HAU_DIEU_KIEN_DAT') < vt("'staging-' || r.name"), 'quét phải chạy trước khi sinh dữ liệu giả')
  assert.ok(vt('bảng không giữ %s còn %s dòng') > 0)
  assert.ok(vt("data_type = 'bytea'") > 0)
  assert.ok(sql.trimEnd().endsWith('COMMIT;'))
  assert.ok(!/TRUNCATE/i.test(sql))
  // psql không thay biến trong $$…$$ → :'mat_khau' chỉ được xuất hiện ngoài khối DO
  for (const khoi of sql.match(/DO \$\$[\s\S]*?END \$\$;/g) ?? []) assert.ok(!khoi.includes(":'mat_khau'"), 'biến psql trong khối DO')
  assert.ok(!/LIKE ''%%'' \|\|/.test(sql), 'quét phải so khớp literal (position), không LIKE wildcard')
})

test('vòng 2: mô tả tự do bị xoá, Json mở bị xoá, geojson chỉ hình học, nguồn tài liệu chỉ tên tệp', () => {
  for (const [bang, cot] of [['roles', 'description'], ['permissions', 'description'], ['asset_types', 'description'],
    ['maintenance_schedules', 'description'], ['inspection_templates', 'description'], ['assets', 'techSpecs']]) {
    const b = bangs.find((x) => x.bang === bang)
    assert.ok(b, `không thấy bảng ${bang}`)
    assert.match(sql, new RegExp(`UPDATE "${bang}" SET[^;]*"${cot}" = `), `${bang}.${cot} phải bị xoá trắng`)
  }
  assert.ok(!BANG_GIU.Asset.cot.includes('techSpecs'))
  assert.match(sql, /"geojson" = CASE[\s\S]*'properties', '\{\}'::jsonb/)
  // vòng 3: coordinates phải thuần số; features phải là mảng (sai kiểu → NULL, không làm hỏng giao dịch)
  assert.ok(sql.includes(`jsonb_path_exists(("geojson"::jsonb)->'coordinates', '$.** ? (@.type() != "number" && @.type() != "array")')`))
  assert.ok(sql.includes(`jsonb_typeof("geojson"::jsonb->'features') = 'array'`))
  assert.ok(sql.includes(`"nguon" = regexp_replace("nguon", '^.*[\\\\/]', '')`), 'nguon: bỏ thư mục (cả \\ và /)')
})

test('vòng 2: hậu điều kiện đủ phạm vi', () => {
  assert.ok(sql.includes('SET standard_conforming_strings = on;'))
  assert.ok(sql.includes('pg_largeobject_metadata'))
  assert.ok(sql.includes('pg_matviews'))
  assert.ok(sql.includes('cột ngoài manifest Prisma'))
  assert.ok(sql.includes(`'_prisma_migrations'`), '_prisma_migrations được miễn kiểm rỗng (đã xoá log)')
  assert.ok(sql.includes('UPDATE public._prisma_migrations SET logs = NULL'))
  assert.ok(sql.includes('Từ điển định danh gốc rỗng'))
  assert.ok(!/format\('SELECT count\(\*\) FROM %I/.test(sql), 'truy vấn động phải chỉ rõ public.%I')
  assert.ok(!sql.includes("<> 'admin@htkt.com.vn'"), 'không còn ngoại lệ email')
  for (const s of ['cchn_ho_so', 'httt_nang_luc_ca_nhan', 'office_leave_requests', 'incidents']) {
    const b = bangs.find((x) => x.bang === s)
    assert.ok(b, `không thấy bảng ${s}`)
    assert.ok(sql.includes(`FROM public."${s}" WHERE`), `từ điển phải lấy từ ${s}`)
  }
})

test('dữ liệu giả không dùng giá trị trông như thật', () => {
  assert.ok(sql.includes(`'099' || lpad(g::text, 9, '0')`), 'CCCD giả mã tỉnh 099 (không tồn tại)')
  assert.ok(sql.includes(`'0999' || lpad(g::text, 6, '0')`))
  assert.ok(sql.includes(`'cb' || g || '@staging.local'`))
})
