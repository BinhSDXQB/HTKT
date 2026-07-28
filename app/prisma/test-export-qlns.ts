// Kiểm thử xuất biểu QLNS ra file tạm (không qua auth) rồi đọc lại đối chiếu công thức
process.env.DATABASE_URL ??= 'postgresql://postgres:Postgres%402025@localhost:5432/ql_htkt'
import * as xlsx from 'xlsx'

async function main() {
  const { buildQlnsWorkbook } = await import('../lib/office-export-qlns')
  const wb = await buildQlnsWorkbook()
  const out = 'c:/Troly/HTKT/backups/test-export-qlns.xlsx'
  await wb.xlsx.writeFile(out)

  const rb = xlsx.readFile(out, { cellFormula: true })
  const ws = rb.Sheets['DS SXD']
  const range = xlsx.utils.decode_range(ws['!ref'] as string)
  console.log('Phạm vi:', ws['!ref'])
  // Tiêu đề + 5 dòng đầu
  for (let r = 0; r < 7; r++) {
    const cells: string[] = []
    for (const col of ['A', 'B', 'C', 'D', 'E', 'L', 'R', 'S', 'U', 'V', 'AA', 'AX', 'BA']) {
      const cell = ws[`${col}${r + 1}`]
      if (cell?.f) cells.push(`${col}==${cell.f}`)
      else if (cell?.v != null) cells.push(`${col}=${String(cell.w ?? cell.v).slice(0, 28)}`)
    }
    console.log(`R${r + 1}: ${cells.join(' | ')}`)
  }
  // Đếm dòng tiêu mục & dữ liệu
  let sections = 0, data = 0
  for (let r = 2; r <= range.e.r; r++) {
    const b = ws[`B${r + 1}`], a = ws[`A${r + 1}`]
    if (a?.f) data++
    else if (b?.v && /^[IVX]+$/.test(String(b.v))) sections++
  }
  console.log(`Tiêu mục: ${sections}, dòng cán bộ: ${data}`)
}
main().catch((e) => { console.error(e); process.exitCode = 1 })
