const { Client } = require('pg');

const c = new Client({
  host: 'localhost',
  user: 'postgres',
  password: 'PR_2026_PgAdmin!Secure',
  database: 'ql_htkt',
  port: 5432
});

(async () => {
  await c.connect();
  const res = await c.query(
    'SELECT id, "linhVuc", "maBanGhi", "tieuDe", "customFields" FROM nghiep_vu_ban_ghi WHERE "linhVuc" = $1 LIMIT 5',
    ['trung-tam-bao-tri/tuyen-duong-mat-cat-lon']
  );
  console.log(`Found ${res.rows.length} records:`);
  for (const r of res.rows) {
    console.log(`ID: ${r.id}, Code: ${r.maBanGhi}, Title: ${r.tieuDe}`);
    console.log(`  CustomFields: ${JSON.stringify(r.customFields)}`);
  }
  await c.end();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
