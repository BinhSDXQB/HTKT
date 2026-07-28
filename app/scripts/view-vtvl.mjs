import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const p = new PrismaClient();

const rows = await p.$queryRawUnsafe(`
  SELECT tc.ten AS phong_ban, cb."hoTen", cb."chucVu", cb."viTriViecLam", cb."doiTuong"
  FROM can_bo cb
  LEFT JOIN to_chuc tc ON cb."toChucId" = tc.id
  WHERE cb."trangThai" = 'DANG_CONG_TAC'
  ORDER BY tc.ten, cb."hoTen"
`);

const grouped = {};
for (const r of rows) {
  const key = r.phong_ban || '(Chưa gán phòng)';
  if (!grouped[key]) grouped[key] = [];
  grouped[key].push(r);
}
for (const [phong, list] of Object.entries(grouped)) {
  console.log(`\n=== ${phong} (${list.length} người) ===`);
  for (const cb of list) {
    const vtvl = cb.viTriViecLam || '(chưa cập nhật)';
    const dt = cb.doiTuong || '';
    const cv = cb.chucVu || '';
    console.log(`  - ${cb.hoTen} | CV: ${cv} | VTVL: ${vtvl} | ${dt}`);
  }
}
await p.$disconnect();
