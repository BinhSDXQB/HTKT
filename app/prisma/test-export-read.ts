import ExcelJS from 'exceljs'

async function main() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile('c:/Troly/HTKT/backups/test-export-qlns.xlsx')
  const ws = wb.getWorksheet('DS SXD')!
  for (const r of [4, 5]) {
    const row = ws.getRow(r)
    for (const col of ['A', 'B', 'R', 'Z', 'AA', 'AD', 'AX', 'AY']) {
      const c = row.getCell(col)
      console.log(`${col}${r}: type=${c.type} formula=${(c.value as { formula?: string })?.formula ?? c.formula ?? '-'} value=${JSON.stringify(c.value)?.slice(0, 80)}`)
    }
  }
}
main().catch(console.error)
