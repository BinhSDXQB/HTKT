import { db } from './lib/db.js'

async function checkData() {
  try {
    console.log('=== KIỂM TRA ĐVHC ===')
    const dvhc = await db.don_vi_hanh_chinh.aggregate([
      { $match: { xoa: false } },
      { $group: {
        _id: null,
        tong: { $sum: 1 },
        co_dien_tich: { $sum: { $cond: [{ $ne: ['\', null] }, 1, 0] } },
        co_dan_so: { $sum: { $cond: [{ $ne: ['\', null] }, 1, 0] } }
      }}
    ])
    console.log(dvhc)

    console.log('\n=== KIỂM TRA TRUNG TÂM BẢO TRÌ ===')
    const ttbt = await db.to_chuc.findUnique({
      where: { code: 'TC_BAN_BAO_TRI_GT' },
      include: { trai_duong: { where: { xoa: false } } }
    })
    console.log('Trung tâm:', ttbt?.ten)
    console.log('Số tuyến:', ttbt?.trai_duong?.length || 0)

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    process.exit(0)
  }
}

checkData()
