import { db } from '@/lib/db'

export async function GET() {
  try {
    // Kiểm tra ĐVHC
    const dvhc = await db.administrativeUnit.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        dienTichKm2: true,
        danSo: true,
      },
    })

    const dvhcStats = {
      tong: dvhc.length,
      coDienTich: dvhc.filter((d) => d.dienTichKm2 !== null).length,
      coDanSo: dvhc.filter((d) => d.danSo !== null).length,
      danh_sach_thieu: dvhc
        .filter((d) => !d.dienTichKm2 || !d.danSo)
        .map((d) => ({ id: d.id, name: d.name, code: d.code })),
    }

    // Kiểm tra Trung tâm Bảo trì
    const ttbt = await db.toChuc.findFirst({
      where: { ma: 'TC_BAN_BAO_TRI_GT' },
    })

    return Response.json({
      timestamp: new Date().toISOString(),
      dvhc: dvhcStats,
      ttbt: ttbt
        ? {
            id: ttbt.id,
            ten: ttbt.ten,
            ma: ttbt.ma,
            maSoThue: (ttbt as any).maSoThue || 'Chưa cập nhật',
          }
        : null,
    })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
