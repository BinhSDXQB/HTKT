'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveCanBoProfileAction, deleteCanBoAction } from '@/app/actions/can-bo'
import type { OfficeFormState } from '@/app/actions/office'

export interface CanBoDefaults {
  id?: string
  hoTen?: string; cccd?: string; gioiTinh?: string; ngaySinh?: string
  toChucId?: string; chucDanhId?: string; chucVu?: string
  soDienThoai?: string; email?: string
  queQuanTruoc?: string; queQuanSau?: string; noiOTruoc?: string; noiOHienNay?: string; quangTriCuRa?: string
  doiTuong?: string; viTriViecLam?: string; loaiHopDong?: string; ngayKetThucHopDong?: string
  loaiHinh?: string; ngayVaoBienChe?: string; boNhiemLanDau?: string; ngayBoNhiemGanNhat?: string
  ngayVeHuu?: string; ngayNghiHuuLui?: string; truongHopLui?: string; vanBanLuiNghiHuu?: string
  maNgach?: string; bacLuong?: string; heSoLuong?: string; phuCap?: string; vuotKhung?: string
  ngayNangLuong?: string; ngachHienHuong?: string; ngayBoNhiemNgach?: string
  trinhDoChuyenMon?: string; chuyenNganh?: string; namTotNghiep?: string; heDaoTao?: string
  trinhDoQLNN?: string; namDaoTaoQLNN?: string; trinhDoLLCT?: string; namDaoTaoLLCT?: string
  trinhDoNgoaiNgu?: string; namDaoTaoNgoaiNgu?: string; trinhDoTinHoc?: string; namDaoTaoTinHoc?: string
  namDaoTaoCapPhong?: string; namDaoTaoCapSo?: string; qpAn?: string; namDaoTaoQPAN?: string
  soTheDang?: string; ngayKetNapDang?: string; ngayVaoDangChinhThuc?: string; chiBo?: string
  trangThai?: string; ghiChu?: string
}

interface Option { id: string; ten: string }

const TRANG_THAI_OPTIONS = [
  { value: 'DANG_CONG_TAC', label: 'Đang công tác' },
  { value: 'HOP_DONG', label: 'Hợp đồng' },
  { value: 'NGHI_HUU', label: 'Nghỉ hưu' },
  { value: 'CHUYEN_CONG_TAC', label: 'Chuyển công tác' },
  { value: 'NGHI_VIEC', label: 'Nghỉ việc' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-5 space-y-3">
      <h2 className="text-sm font-bold text-indigo-800 uppercase tracking-wide">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
    </section>
  )
}

function Field({ label, error, children, span }: { label: string; error?: string[]; children: React.ReactNode; span?: number }) {
  return (
    <div className={`space-y-1 ${span === 2 ? 'sm:col-span-2' : span === 3 ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
      <Label className="text-xs font-medium text-slate-600">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error[0]}</p>}
    </div>
  )
}

function SubmitButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]" disabled={pending}>
      {pending ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Đang lưu</> : isNew ? 'Tạo hồ sơ' : 'Lưu hồ sơ'}
    </Button>
  )
}

export function CanBoProfileForm({ defaults, toChucOptions, chucDanhOptions }: {
  defaults: CanBoDefaults
  toChucOptions: Option[]
  chucDanhOptions: Option[]
}) {
  const [state, formAction] = useActionState<OfficeFormState, FormData>(saveCanBoProfileAction, null)
  const [delState, delAction, delPending] = useActionState<OfficeFormState, FormData>(deleteCanBoAction, null)
  const [queQuanSau, setQueQuanSau] = useState(defaults.queQuanSau ?? '')
  const [dangChuyenDoi, setDangChuyenDoi] = useState(false)
  const isNew = !defaults.id
  const fe = state?.fieldErrors

  async function goiYQueQuan(truoc: string, force = false) {
    if (!truoc.trim() || (queQuanSau && !force)) return
    setDangChuyenDoi(true)
    try {
      const res = await fetch(`/api/office/que-quan?truoc=${encodeURIComponent(truoc)}`)
      const data = await res.json()
      if (data.sau) setQueQuanSau(data.sau)
    } finally {
      setDangChuyenDoi(false)
    }
  }

  const cls = 'w-full h-9 px-3 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <form action={formAction} className="space-y-5">
      {defaults.id && <input type="hidden" name="canBoId" value={defaults.id} />}
      {(state?.error || delState?.error) && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {state?.error ?? delState?.error}
        </div>
      )}

      <Section title="1. Thông tin cá nhân">
        <Field label="Họ và tên *" error={fe?.hoTen}>
          <Input name="hoTen" defaultValue={defaults.hoTen} className="h-9" />
        </Field>
        <Field label="Số CCCD (12 số)" error={fe?.cccd}>
          <Input name="cccd" defaultValue={defaults.cccd?.startsWith('TAM-') ? '' : defaults.cccd} className="h-9 font-mono" placeholder={defaults.cccd?.startsWith('TAM-') ? 'Chưa có — cần bổ sung' : ''} />
        </Field>
        <Field label="Giới tính">
          <select name="gioiTinh" defaultValue={defaults.gioiTinh ?? ''} className={cls}>
            <option value="">—</option>
            <option value="NAM">Nam</option>
            <option value="NU">Nữ</option>
          </select>
        </Field>
        <Field label="Ngày sinh (ngày về hưu sẽ tự tính theo NĐ 135/2020)">
          <Input name="ngaySinh" type="date" defaultValue={defaults.ngaySinh} className="h-9" />
        </Field>
        <Field label="Số điện thoại">
          <Input name="soDienThoai" defaultValue={defaults.soDienThoai} className="h-9" />
        </Field>
        <Field label="Email">
          <Input name="email" defaultValue={defaults.email} className="h-9" />
        </Field>
        <Field label="Quê quán (trước hợp nhất)" span={2}>
          <Input name="queQuanTruoc" defaultValue={defaults.queQuanTruoc} className="h-9"
            onBlur={(e) => goiYQueQuan(e.target.value)} />
        </Field>
        <Field label="Quê quán (sau hợp nhất) — tự chuyển đổi theo NQ 1680">
          <div className="flex gap-1.5">
            <Input name="queQuanSau" value={queQuanSau} onChange={(e) => setQueQuanSau(e.target.value)} className="h-9" />
            <button type="button" title="Chuyển đổi lại từ quê quán trước hợp nhất"
              className="h-9 px-2.5 border rounded-lg text-indigo-600 hover:bg-indigo-50 shrink-0"
              onClick={(e) => {
                const form = (e.target as HTMLElement).closest('form') as HTMLFormElement
                const truoc = (form.elements.namedItem('queQuanTruoc') as HTMLInputElement)?.value
                goiYQueQuan(truoc, true)
              }}>
              {dangChuyenDoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            </button>
          </div>
        </Field>
        <Field label="Nơi ở (trước hợp nhất)" span={2}>
          <Input name="noiOTruoc" defaultValue={defaults.noiOTruoc} className="h-9" />
        </Field>
        <Field label="Nơi ở (hiện nay)">
          <Input name="noiOHienNay" defaultValue={defaults.noiOHienNay} className="h-9" />
        </Field>
        <Field label="QT (cũ) ra">
          <Input name="quangTriCuRa" defaultValue={defaults.quangTriCuRa} className="h-9" placeholder="VD: QT" />
        </Field>
      </Section>

      <Section title="2. Công tác — biên chế, bổ nhiệm">
        <Field label="Đối tượng (Công chức / Viên chức / NLĐ)">
          <select name="doiTuong" defaultValue={defaults.doiTuong ?? ''} className={cls}>
            <option value="">— Chưa phân loại —</option>
            <option value="CONG_CHUC">Công chức</option>
            <option value="VIEN_CHUC">Viên chức</option>
            <option value="NGUOI_LAO_DONG">Người lao động (hợp đồng)</option>
          </select>
        </Field>
        <Field label="Vị trí việc làm (NĐ 62/2020 · với CC/VC)" span={2}>
          <Input name="viTriViecLam" defaultValue={defaults.viTriViecLam} className="h-9" placeholder="VD: Chuyên viên quản lý hạ tầng kỹ thuật" />
        </Field>
        <Field label="Loại hợp đồng (với NLĐ)">
          <Input name="loaiHopDong" defaultValue={defaults.loaiHopDong} className="h-9" placeholder="KXĐTH / XĐTH 12 tháng / HĐ111" />
        </Field>
        <Field label="Ngày kết thúc HĐ (cảnh báo hết hạn)">
          <Input name="ngayKetThucHopDong" type="date" defaultValue={defaults.ngayKetThucHopDong} className="h-9" />
        </Field>
        <Field label="Đơn vị *" error={fe?.toChucId}>
          <select name="toChucId" defaultValue={defaults.toChucId ?? ''} className={cls}>
            <option value="">-- Chọn đơn vị --</option>
            {toChucOptions.map((o) => <option key={o.id} value={o.id}>{o.ten}</option>)}
          </select>
        </Field>
        <Field label="Chức danh (danh mục)">
          <select name="chucDanhId" defaultValue={defaults.chucDanhId ?? ''} className={cls}>
            <option value="">—</option>
            {chucDanhOptions.map((o) => <option key={o.id} value={o.id}>{o.ten}</option>)}
          </select>
        </Field>
        <Field label="Chức vụ (ghi như hồ sơ)">
          <Input name="chucVu" defaultValue={defaults.chucVu} className="h-9" />
        </Field>
        <Field label="Loại hình (BCHC, BCSN, HĐ...)">
          <Input name="loaiHinh" defaultValue={defaults.loaiHinh} className="h-9" />
        </Field>
        <Field label="Ngày vào BC, HĐ">
          <Input name="ngayVaoBienChe" type="date" defaultValue={defaults.ngayVaoBienChe} className="h-9" />
        </Field>
        <Field label="Bổ nhiệm lần đầu (chức vụ hiện tại / cao hơn)">
          <Input name="boNhiemLanDau" defaultValue={defaults.boNhiemLanDau} className="h-9" placeholder="VD: 6/2020 GĐ Sở KHĐT QT" />
        </Field>
        <Field label="Ngày bổ nhiệm gần nhất (tiếp theo tự +5 năm)">
          <Input name="ngayBoNhiemGanNhat" type="date" defaultValue={defaults.ngayBoNhiemGanNhat} className="h-9" />
        </Field>
        {/* Ngày nghỉ hưu dự kiến do máy tính, KHÔNG cho sửa tay. Muốn đổi thời điểm
            nghỉ hưu thì phải qua quyết định lùi (NĐ 170/2025 Điều 61) ở ba ô dưới. */}
        <Field label="Ngày nghỉ hưu dự kiến (máy tự tính theo NĐ 135/2020)">
          <Input value={defaults.ngayVeHuu ?? ''} type="date" disabled readOnly className="h-9 bg-slate-50 text-slate-500" />
        </Field>
        <Field label="Lùi thời điểm nghỉ hưu — trường hợp (NĐ 170/2025 Điều 61 khoản 3)" span={2}>
          <select name="truongHopLui" defaultValue={defaults.truongHopLui ?? ''} className={cls}>
            <option value="">— Không lùi —</option>
            <option value="A">A · tối đa 01 tháng — trùng nghỉ Tết; thân nhân từ trần/mất tích; thiên tai, địch hoạ, hoả hoạn</option>
            <option value="B">B · tối đa 03 tháng — bệnh nặng hoặc tai nạn, có giấy xác nhận của bệnh viện</option>
            <option value="C">C · tối đa 06 tháng — điều trị bệnh cần chữa trị dài ngày, có giấy xác nhận của bệnh viện</option>
          </select>
        </Field>
        <Field label="Thời điểm nghỉ hưu sau khi lùi" error={fe?.ngayNghiHuuLui}>
          <Input name="ngayNghiHuuLui" type="date" defaultValue={defaults.ngayNghiHuuLui} className="h-9" />
        </Field>
        <Field label="Văn bản quyết định lùi (số, ngày)" error={fe?.vanBanLuiNghiHuu}>
          <Input name="vanBanLuiNghiHuu" defaultValue={defaults.vanBanLuiNghiHuu} className="h-9" placeholder="VD: 123/QĐ-SXD ngày 10/9/2026" />
        </Field>
        <Field label="Trạng thái">
          <select name="trangThai" defaultValue={defaults.trangThai ?? 'DANG_CONG_TAC'} className={cls}>
            {TRANG_THAI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Ghi chú">
          <Input name="ghiChu" defaultValue={defaults.ghiChu} className="h-9" />
        </Field>
      </Section>

      <Section title="3. Ngạch, bậc, lương">
        <Field label="Mã ngạch">
          <Input name="maNgach" defaultValue={defaults.maNgach} className="h-9" placeholder="VD: 01.003" />
        </Field>
        <Field label="Ngạch hiện hưởng">
          <Input name="ngachHienHuong" defaultValue={defaults.ngachHienHuong} className="h-9" placeholder="CV / CVC / CVCC" />
        </Field>
        <Field label="Ngày bổ nhiệm vào ngạch">
          <Input name="ngayBoNhiemNgach" type="date" defaultValue={defaults.ngayBoNhiemNgach} className="h-9" />
        </Field>
        <Field label="Bậc lương">
          <Input name="bacLuong" type="number" min="1" max="12" defaultValue={defaults.bacLuong} className="h-9" />
        </Field>
        <Field label="Hệ số lương">
          <Input name="heSoLuong" defaultValue={defaults.heSoLuong} className="h-9" placeholder="VD: 4.32" />
        </Field>
        <Field label="Phụ cấp chức vụ">
          <Input name="phuCap" defaultValue={defaults.phuCap} className="h-9" placeholder="VD: 0.5" />
        </Field>
        <Field label="% Vượt khung">
          <Input name="vuotKhung" defaultValue={defaults.vuotKhung} className="h-9" placeholder="VD: 9 (số nguyên %, không phải 0,09)" />
        </Field>
        <Field label="Ngày hưởng lương (lên lương tự +3 năm)">
          <Input name="ngayNangLuong" type="date" defaultValue={defaults.ngayNangLuong} className="h-9" />
        </Field>
      </Section>

      <Section title="4. Trình độ đào tạo">
        <Field label="Trình độ chuyên môn" span={2}>
          <textarea name="trinhDoChuyenMon" defaultValue={defaults.trinhDoChuyenMon} rows={2} className={`${cls} h-auto py-2`} placeholder="Mỗi văn bằng một dòng" />
        </Field>
        <Field label="Ngành / Chuyên ngành">
          <textarea name="chuyenNganh" defaultValue={defaults.chuyenNganh} rows={2} className={`${cls} h-auto py-2`} />
        </Field>
        <Field label="Năm học chuyên môn">
          <Input name="namTotNghiep" defaultValue={defaults.namTotNghiep} className="h-9" />
        </Field>
        <Field label="Hệ đào tạo">
          <Input name="heDaoTao" defaultValue={defaults.heDaoTao} className="h-9" placeholder="Chính quy / Tại chức" />
        </Field>
        <Field label="Trình độ QLNN">
          <Input name="trinhDoQLNN" defaultValue={defaults.trinhDoQLNN} className="h-9" placeholder="CV / CVC / CVCC" />
        </Field>
        <Field label="Năm đào tạo QLNN">
          <Input name="namDaoTaoQLNN" defaultValue={defaults.namDaoTaoQLNN} className="h-9" />
        </Field>
        <Field label="Trình độ LLCT">
          <Input name="trinhDoLLCT" defaultValue={defaults.trinhDoLLCT} className="h-9" placeholder="Sơ/Trung/Cao cấp" />
        </Field>
        <Field label="Năm đào tạo LLCT">
          <Input name="namDaoTaoLLCT" defaultValue={defaults.namDaoTaoLLCT} className="h-9" />
        </Field>
        <Field label="Trình độ ngoại ngữ">
          <Input name="trinhDoNgoaiNgu" defaultValue={defaults.trinhDoNgoaiNgu} className="h-9" />
        </Field>
        <Field label="Năm đào tạo ngoại ngữ">
          <Input name="namDaoTaoNgoaiNgu" defaultValue={defaults.namDaoTaoNgoaiNgu} className="h-9" />
        </Field>
        <Field label="Trình độ tin học">
          <Input name="trinhDoTinHoc" defaultValue={defaults.trinhDoTinHoc} className="h-9" />
        </Field>
        <Field label="Năm đào tạo tin học">
          <Input name="namDaoTaoTinHoc" defaultValue={defaults.namDaoTaoTinHoc} className="h-9" />
        </Field>
        <Field label="Năm đào tạo Cấp phòng">
          <Input name="namDaoTaoCapPhong" defaultValue={defaults.namDaoTaoCapPhong} className="h-9" />
        </Field>
        <Field label="Năm đào tạo Cấp Sở">
          <Input name="namDaoTaoCapSo" defaultValue={defaults.namDaoTaoCapSo} className="h-9" />
        </Field>
        <Field label="QP-AN (đối tượng)">
          <Input name="qpAn" defaultValue={defaults.qpAn} className="h-9" placeholder="ĐT1 / ĐT2 / ĐT3" />
        </Field>
        <Field label="Năm đào tạo QP-AN">
          <Input name="namDaoTaoQPAN" defaultValue={defaults.namDaoTaoQPAN} className="h-9" />
        </Field>
      </Section>

      <Section title="5. Thông tin Đảng">
        <Field label="Số thẻ Đảng viên">
          <Input name="soTheDang" defaultValue={defaults.soTheDang} className="h-9 font-mono" />
        </Field>
        <Field label="Ngày kết nạp Đảng">
          <Input name="ngayKetNapDang" type="date" defaultValue={defaults.ngayKetNapDang} className="h-9" />
        </Field>
        <Field label="Ngày chính thức vào Đảng">
          <Input name="ngayVaoDangChinhThuc" type="date" defaultValue={defaults.ngayVaoDangChinhThuc} className="h-9" />
        </Field>
        <Field label="Chi bộ" span={2}>
          <Input name="chiBo" defaultValue={defaults.chiBo} className="h-9" />
        </Field>
      </Section>

      <div className="flex items-center justify-between gap-2">
        {!isNew ? (
          <Button type="submit" variant="outline" size="sm" disabled={delPending}
            formAction={delAction}
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={(e) => { if (!confirm('Xoá hồ sơ cán bộ này? Thao tác không thể hoàn tác.')) e.preventDefault() }}>
            {delPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xoá hồ sơ'}
          </Button>
        ) : <span />}
        <SubmitButton isNew={isNew} />
      </div>
    </form>
  )
}
