// Tìm ĐOẠN theo TỪ KHOÁ trong kho tài liệu (SQL LIKE, không dùng véc-tơ nên không tốn hạn mức OpenAI).
// Dùng khi cần đối chiếu nguyên văn để soạn nội dung nghiệp vụ có dẫn nguồn.
//   node scripts/tim-doan-trong-kho.mjs "<tu khoa>" ["<loc tieu de>"] [soDoan]
import 'dotenv/config'
import pg from 'pg'

const [kw, docLike = '', limit = '6'] = process.argv.slice(2)
const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()
const r = await c.query(
  `select d."tieuDe", ch."chunkIndex", ch."viTri", ch."noiDung"
     from tai_lieu_chunk ch join tai_lieu d on d.id = ch."taiLieuId"
    where d."deletedAt" is null and d."tieuDe" ilike $2 and ch."noiDung" ilike $1
    order by d."tieuDe", ch."chunkIndex" limit $3`,
  [`%${kw}%`, `%${docLike}%`, Number(limit)]
)
console.log(`>>> "${kw}" — ${r.rowCount} đoạn\n`)
for (const x of r.rows) console.log(`### ${x.tieuDe} [${x.chunkIndex}] ${x.viTri || ''}\n${x.noiDung}\n`)
await c.end()
