// Smoke test RAG: embeddings OpenAI → insert vector → cosine search.
// Chạy: node prisma/test-rag.mjs  (đọc .env thủ công). Tự dọn dữ liệu test.
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import pg from 'pg'
import OpenAI from 'openai'

// Nạp .env tối giản
const env = {}
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?\s*$/)
  if (m) env[m[1]] = m[2]
}
const DB = env.DATABASE_URL
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

async function embed(texts) {
  const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: texts })
  return res.data.map((d) => d.embedding)
}
const vlit = (v) => `[${v.join(',')}]`

const client = new pg.Client({ connectionString: DB })
await client.connect()
const TAG = 'TEST_RAG_' + Date.now()
try {
  const docId = randomUUID()
  await client.query(
    `INSERT INTO tai_lieu (id,"tieuDe",loai,"phamVi","trangThai","soChunk","soKyTu","createdAt","updatedAt")
     VALUES ($1,$2,'HUONG_DAN','CONG_KHAI','san_sang',3,100,now(),now())`,
    [docId, TAG]
  )
  const passages = [
    'Quy trình cấp giấy phép xây dựng nhà ở riêng lẻ tại đô thị tỉnh Quảng Trị gồm các bước nộp hồ sơ, thẩm định và trả kết quả trong 15 ngày.',
    'Cây xanh đô thị được chăm sóc, cắt tỉa định kỳ; việc chặt hạ phải có giấy phép của cơ quan quản lý.',
    'Hệ thống chiếu sáng công cộng sử dụng đèn LED tiết kiệm điện, bật tắt theo lịch thiên văn.',
  ]
  const vecs = await embed(passages)
  for (let i = 0; i < passages.length; i++) {
    await client.query(
      `INSERT INTO tai_lieu_chunk (id,"taiLieuId","chunkIndex","noiDung",embedding,"soToken","createdAt")
       VALUES ($1,$2,$3,$4,$5::vector,$6,now())`,
      [randomUUID(), docId, i, passages[i], vlit(vecs[i]), 20]
    )
  }

  const q = 'Thủ tục xin phép xây nhà mất bao lâu?'
  const [qv] = await embed([q])
  const { rows } = await client.query(
    `SELECT c."noiDung", (c.embedding <=> $1::vector) AS distance
       FROM tai_lieu_chunk c JOIN tai_lieu d ON d.id=c."taiLieuId"
      WHERE d."tieuDe"=$2
      ORDER BY c.embedding <=> $1::vector LIMIT 2`,
    [vlit(qv), TAG]
  )
  console.log('Câu hỏi:', q)
  console.log('--- Top kết quả (distance nhỏ = gần nhất) ---')
  rows.forEach((r, i) => console.log(`${i + 1}. d=${Number(r.distance).toFixed(4)} | ${r.noiDung.slice(0, 70)}…`))
  const ok = rows[0].noiDung.includes('giấy phép xây dựng')
  console.log('\nKẾT QUẢ:', ok ? '✅ ĐÚNG — đoạn cấp phép xây dựng đứng đầu' : '❌ SAI — thứ tự không như kỳ vọng')
} finally {
  await client.query(`DELETE FROM tai_lieu WHERE "tieuDe"=$1`, [TAG]) // cascade xoá chunk
  await client.end()
}
