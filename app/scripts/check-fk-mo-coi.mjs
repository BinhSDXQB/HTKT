// Kiểm tra "FK mềm" mồ côi — các cột id thuần (không ràng buộc khoá ngoại)
// trỏ tới bản ghi không còn tồn tại. Sinh ra từ đợt rà soát CSDL 03/07/2026.
//
// Cách dùng:
//   node scripts/check-fk-mo-coi.mjs          → in báo cáo; exit code 1 nếu có mồ côi
//   node scripts/check-fk-mo-coi.mjs --chi-tiet → in kèm tối đa 10 id mồ côi mỗi cột
//
// Khi thêm cột FK mềm mới vào schema, bổ sung 1 dòng vào CHECKS bên dưới.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const env = (k) =>
  process.env[k] ||
  (readFileSync(join(root, '.env'), 'utf8')
    .match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]
    .trim()
    .replace(/^["']|["']$/g, '') ?? '')

const CHI_TIET = process.argv.includes('--chi-tiet')

// [bảng nguồn, cột FK mềm, bảng đích, cột đích]
const CHECKS = [
  // Chấm công làm thêm giờ
  ['overtime_timesheets', 'toChucId', 'to_chuc', 'id'],
  ['overtime_timesheets', 'createdById', 'users', 'id'],
  ['overtime_entries', 'canBoId', 'can_bo', 'id'],
  ['overtime_signatures', 'nguoiKyId', 'users', 'id'],
  // Phân công lĩnh vực & định kỳ
  ['phan_cong_linh_vuc', 'nguoiPhuTrachId', 'users', 'id'],
  ['phan_cong_dinh_ky', 'nguoiPhuTrachId', 'users', 'id'],
  ['phan_cong_dinh_ky', 'loaiId', 'cong_viec_loai', 'id'],
  // BIM/AIM
  ['bim_models', 'projectId', 'projects', 'id'],
  ['bim_models', 'assetId', 'assets', 'id'],
  ['bim_models', 'wardId', 'administrative_units', 'id'],
  ['bim_view_permissions', 'roleId', 'roles', 'id'],
  ['bim_view_permissions', 'toChucId', 'to_chuc', 'id'],
  ['bim_view_permissions', 'userId', 'users', 'id'],
  // Cấp phép đường bộ (module 9)
  ['oversized_vehicle_permits', 'wardId', 'administrative_units', 'id'],
  ['oversized_vehicle_permits', 'createdById', 'users', 'id'],
  ['oversized_vehicle_permits', 'applicantOrgId', 'to_chuc', 'id'],
  ['road_connection_applications', 'wardId', 'administrative_units', 'id'],
  ['road_connection_applications', 'createdById', 'users', 'id'],
  ['road_permit_status_logs', 'changedById', 'users', 'id'],
  // Quản lý công việc — liên thông mềm
  ['cong_viec', 'duAnId', 'projects', 'id'],
  ['cong_viec', 'workOrderId', 'work_orders', 'id'],
  ['cong_viec', 'incidentId', 'incidents', 'id'],
  // Nghỉ phép — cột duyệt các cấp (scalar)
  ['office_leave_requests', 'tpDuyetId', 'users', 'id'],
  ['office_leave_requests', 'ldsKyId', 'users', 'id'],
  ['office_leave_requests', 'vpsId', 'users', 'id'],
  ['office_leave_requests', 'khtcId', 'users', 'id'],
  ['office_leave_requests', 'createdById', 'users', 'id'],
  // Dự án đường sắt GPMB — liên thông mềm
  ['ds_du_an_gpmb', 'congViecId', 'cong_viec', 'id'],
  ['ds_du_an_gpmb', 'projectId', 'projects', 'id'],
  // Tài liệu RAG
  ['tai_lieu', 'createdById', 'users', 'id'],
  // Văn bản đã sinh / thu hồi tài sản
  ['office_collective_reward_records', 'toChucId', 'to_chuc', 'id'],
  ['permit_vehicles', 'createdById', 'users', 'id'],
]

async function main() {
  const client = new pg.Client({ connectionString: env('DIRECT_DATABASE_URL') || env('DATABASE_URL') })
  await client.connect()
  let tongMoCoi = 0
  const loi = []

  for (const [bang, cot, bangDich, cotDich] of CHECKS) {
    const sql = `
      SELECT count(*)::int AS n,
             (array_agg(s."${cot}"))[1:10] AS mau
        FROM "${bang}" s
       WHERE s."${cot}" IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM "${bangDich}" d WHERE d."${cotDich}" = s."${cot}")`
    try {
      const { rows } = await client.query(sql)
      const n = rows[0].n
      if (n > 0) {
        tongMoCoi += n
        console.log(`✗ ${bang}.${cot} → ${bangDich}: ${n} bản ghi mồ côi`)
        if (CHI_TIET) console.log(`   id mẫu: ${rows[0].mau.join(', ')}`)
      }
    } catch (e) {
      loi.push(`${bang}.${cot}: ${e.message}`)
    }
  }

  if (loi.length) {
    console.log('\nCột không kiểm tra được (đổi tên bảng/cột?):')
    for (const l of loi) console.log(`  ! ${l}`)
  }

  if (tongMoCoi === 0) {
    console.log(`✓ Không có FK mềm mồ côi (${CHECKS.length} cột đã kiểm tra).`)
  } else {
    console.log(`\nTổng: ${tongMoCoi} bản ghi mồ côi. Cần rà soát trước khi nâng thành FK thật.`)
  }
  await client.end()
  process.exit(tongMoCoi > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('Lỗi:', e.message)
  process.exit(2)
})
