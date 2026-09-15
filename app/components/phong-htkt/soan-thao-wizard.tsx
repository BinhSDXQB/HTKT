'use client'

import { useCallback, useRef, useState } from 'react'
import { FolderSearch, PenLine, Zap } from 'lucide-react'
import { smartPredictLoaiCongTrinh } from '@/lib/htkt/ai-auto-fill'
import { KiemKeHoSo, type ApplyKiemKe } from './kiem-ke-ho-so'
import { SoanThaoFormAI, type SoanThaoSeed } from './soan-thao-form-ai'

type Buoc = 'kiem-ke' | 'soan-thao'

// Quy trình kiểm kê (lib/htkt/tham-dinh) → loại thẩm định của form soạn thảo.
// CHỈ 4 loại thẩm định thật được chuyền. Quy trình 'nhan-dien-phan-loai' (HTKT.01) KHÔNG
// phải loại thẩm định → không map, để người dùng tự chọn loại ở bước 2 (không fallback bừa).
const QT_SANG_LOAI: Record<string, NonNullable<SoanThaoSeed['thamDinhType']>> = {
  'bcnckt': 'bcnckt',
  'bcktkt': 'bcktkt',
  'thiet-ke-tk': 'thiet-ke',
  'nghiem-thu': 'nghiem-thu',
}

export function SoanThaoWizard() {
  const [buoc, setBuoc] = useState<Buoc>('kiem-ke')
  const [seed, setSeed] = useState<SoanThaoSeed | undefined>(undefined)
  // Đổi mỗi lần "dùng kết quả" để remount form, buộc nó đọc lại seed mới.
  const [phienBanSeed, setPhienBanSeed] = useState(0)
  // Form bước 2 báo lên khi đang có dữ liệu nhập dở. Dùng ref vì chỉ đọc lúc bấm nút,
  // không cần render lại wizard mỗi lần gõ phím.
  const dangNhapDoRef = useRef(false)
  const ghiNhanDangNhapDo = useCallback((d: boolean) => { dangNhapDoRef.current = d }, [])

  function dungKetQua(p: ApplyKiemKe) {
    // Remount form ở bước 2 sẽ XOÁ TRẮNG những ô người dùng đã tự gõ (chủ đầu tư, địa điểm,
    // quy mô cụ thể, cấp công trình...) vì chúng không nằm trong seed. Phải hỏi trước.
    if (dangNhapDoRef.current && !window.confirm(
      'Bước 2 đang có dữ liệu bạn nhập dở (chủ đầu tư, địa điểm, quy mô, cấp công trình...).\n\n' +
      'Mang kết quả kiểm kê mới sang sẽ XOÁ hết phần đang nhập đó và điền lại từ đầu.\n\nTiếp tục?'
    )) return

    // Chỉ chuyền dữ liệu ĐÁNG TIN: loại thẩm định (nếu map được) + tên dự án + lĩnh vực đoán theo tên.
    // KHÔNG đoán cấp/quy mô công trình từ tên thư mục — đó là kết luận pháp lý, để cán bộ tự chọn.
    const duDoan = smartPredictLoaiCongTrinh(p.tenGoiY, '')
    setSeed({
      thamDinhType: QT_SANG_LOAI[p.quyTrinhKey],
      tenDuAn: p.tenGoiY,
      linhVuc: duDoan.linhVuc ?? undefined,
      loaiCongTrinh: duDoan.loaiCongTrinh || undefined,
    })
    setPhienBanSeed((v) => v + 1)
    setBuoc('soan-thao')
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          Kiểm kê hồ sơ &amp; Soạn thảo tờ trình thẩm định
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Một luồng liền mạch: kiểm kê hồ sơ dự án từ thư mục máy chủ → chuyển thẳng dữ liệu sang bước soạn thảo,
          khỏi gõ lại thông tin.
        </p>
      </div>

      {/* Thanh 2 bước — bấm để chuyển qua lại */}
      <div className="mb-6 flex flex-wrap items-center gap-2" role="tablist" aria-label="Các bước">
        <button
          role="tab"
          id="tab-kiem-ke"
          aria-selected={buoc === 'kiem-ke'}
          aria-controls="panel-kiem-ke"
          onClick={() => setBuoc('kiem-ke')}
          className={`h-10 px-4 rounded-lg text-sm font-medium inline-flex items-center gap-2 border transition ${
            buoc === 'kiem-ke'
              ? 'bg-cyan-600 text-white border-cyan-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300'
          }`}
        >
          <FolderSearch className="w-4 h-4" />
          <span><span className="font-bold">Bước 1</span> · Kiểm kê hồ sơ</span>
        </button>
        <span className="text-slate-300">→</span>
        <button
          role="tab"
          id="tab-soan-thao"
          aria-selected={buoc === 'soan-thao'}
          aria-controls="panel-soan-thao"
          onClick={() => setBuoc('soan-thao')}
          className={`h-10 px-4 rounded-lg text-sm font-medium inline-flex items-center gap-2 border transition ${
            buoc === 'soan-thao'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <PenLine className="w-4 h-4" />
          <span><span className="font-bold">Bước 2</span> · Soạn thảo tờ trình</span>
        </button>
        <span className="text-xs text-slate-400 ml-1">Có thể bỏ qua Bước 1 để soạn trực tiếp.</span>
      </div>

      {/* Giữ cả hai bước trong DOM (ẩn/hiện) để không mất trạng thái kiểm kê khi chuyển tab */}
      <div role="tabpanel" id="panel-kiem-ke" aria-labelledby="tab-kiem-ke" className={buoc === 'kiem-ke' ? '' : 'hidden'}>
        <div className="mb-4 flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
            <FolderSearch className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Bước 1 — Kiểm kê hồ sơ thẩm định từ thư mục</h2>
            <p className="text-sm text-slate-600">
              Trỏ tới thư mục dự án trên máy chủ; hệ thống đọc tờ trình, thuyết minh, bản vẽ, dự toán và đối chiếu
              thành phần hồ sơ. Kết quả là <strong>gợi ý cần xác nhận</strong>, không phải kết luận thẩm định.
            </p>
          </div>
        </div>
        <KiemKeHoSo onApply={dungKetQua} />
      </div>

      <div role="tabpanel" id="panel-soan-thao" aria-labelledby="tab-soan-thao" className={buoc === 'soan-thao' ? '' : 'hidden'}>
        <div className="mb-4 flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <PenLine className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Bước 2 — Soạn thảo tờ trình / văn bản thẩm định</h2>
            <p className="text-sm text-slate-600">
              Auto-fill nội dung, thẩm quyền, căn cứ pháp lý theo lĩnh vực và quy mô công trình.
            </p>
          </div>
        </div>
        <SoanThaoFormAI key={phienBanSeed} seed={seed} embedded onDirtyChange={ghiNhanDangNhapDo} />
      </div>
    </div>
  )
}
