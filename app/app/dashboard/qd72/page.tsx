import { requireAuth } from '@/lib/auth'
import { getQd72Auth } from '@/lib/qd72/auth'
import { listSurveyCases } from '@/app/actions/qd72'
import { QD72_MA_TRAN_QUYEN } from '@/lib/qd72/phan-quyen'
import { Qd72CaseList } from '@/components/qd72/qd72-case-list'
import { ShieldCheck } from 'lucide-react'

export default async function Qd72Page() {
  await requireAuth()
  const auth = await getQd72Auth()
  const vaiTro = auth?.vaiTro ?? 'SO_KHAC'
  const quyen = QD72_MA_TRAN_QUYEN[vaiTro]
  const canCreate = quyen.hanhDong.includes('TAO')
  const canReturn = quyen.hanhDong.includes('TRA_LAI')
  const cases = await listSurveyCases()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            Khảo sát, chỉnh trang đô thị không bảo đảm PCCC
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Quyết định 72/2026/QĐ-UBND — giao thông, chiều cao thông thủy, đường dây–cáp, nguồn nước chữa cháy.
            Kết quả tự tính chỉ là <b>đánh giá sơ bộ</b>; kết luận chính thức do người có thẩm quyền xác minh.
          </p>
          <p className="text-xs text-slate-400 mt-1">Vai trò của bạn: <b>{quyen.ten}</b></p>
        </div>
      </div>

      <Qd72CaseList initial={cases} canCreate={canCreate} canReturn={canReturn} />
    </div>
  )
}
