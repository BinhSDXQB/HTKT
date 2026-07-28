'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ExportBaoCaoButton() {
  const now = new Date()
  const firstDay = `${now.getFullYear()}-01-01`
  const today = now.toISOString().slice(0, 10)

  const [tuNgay, setTuNgay]   = useState(firstDay)
  const [denNgay, setDenNgay] = useState(today)
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const url = `/api/export/bao-cao?tuNgay=${tuNgay}&denNgay=${denNgay}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Lỗi xuất báo cáo')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `BaoCao_HTKT_${today}.xlsx`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      alert('Không thể xuất báo cáo. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-wrap items-end gap-4">
      <div className="space-y-1">
        <Label className="text-xs font-medium text-green-800">Từ ngày</Label>
        <Input type="date" value={tuNgay} onChange={e => setTuNgay(e.target.value)}
          className="h-8 text-sm w-36 bg-white border-green-300" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-medium text-green-800">Đến ngày</Label>
        <Input type="date" value={denNgay} onChange={e => setDenNgay(e.target.value)}
          className="h-8 text-sm w-36 bg-white border-green-300" />
      </div>
      <Button onClick={handleExport} disabled={loading}
        className="h-8 bg-green-700 hover:bg-green-800 text-white text-sm gap-1.5">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        {loading ? 'Đang xuất...' : 'Xuất Excel (QĐ2597)'}
      </Button>
      <p className="text-xs text-green-700 self-center">Xuất báo cáo 5 sheet: Tổng quan · Tài sản · Sự cố · Phiếu CV · Dự án</p>
    </div>
  )
}
