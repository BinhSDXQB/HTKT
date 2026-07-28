'use client'

import { useState } from 'react'
import { Save, TestTube2, RefreshCw, CheckCircle2, XCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CongDanSoConfig } from '@/lib/congdanso-client'

type Props = {
  cfg: CongDanSoConfig
  htktDomains: string[]
  domainLabel: Record<string, string>
}

export function IntegrationConfigForm({ cfg, htktDomains, domainLabel }: Props) {
  const [form, setForm] = useState({
    enabled:       cfg.enabled,
    apiUrl:        cfg.apiUrl,
    clientId:      cfg.clientId,
    clientSecret:  cfg.clientSecret,
    tokenEndpoint: cfg.tokenEndpoint,
    syncEndpoint:  cfg.syncEndpoint,
    domainFilter:  cfg.domainFilter,
    syncIntervalH: cfg.syncIntervalH,
  })
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [syncResult, setSyncResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null)
  const [saveMsg, setSaveMsg] = useState('')

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch('/api/integration/congdanso/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, domainFilter: form.domainFilter }),
      })
      if (res.ok) setSaveMsg('Đã lưu cấu hình')
      else setSaveMsg('Lỗi khi lưu')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/integration/congdanso/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setTestResult(data)
    } finally {
      setTesting(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/integration/congdanso/sync', { method: 'POST' })
      const data = await res.json()
      setSyncResult(data)
    } finally {
      setSyncing(false)
    }
  }

  function toggleDomain(d: string) {
    setForm(f => ({
      ...f,
      domainFilter: f.domainFilter.includes(d)
        ? f.domainFilter.filter(x => x !== d)
        : [...f.domainFilter, d],
    }))
  }

  return (
    <div className="space-y-5">
      {/* Bật/tắt */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={form.enabled}
            onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
        </label>
        <span className="text-sm font-medium text-slate-700">
          {form.enabled ? 'Tích hợp đang bật' : 'Tích hợp đang tắt'}
        </span>
      </div>

      {/* Thông tin API */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">API Base URL</label>
          <Input value={form.apiUrl} onChange={e => setForm(f => ({ ...f, apiUrl: e.target.value }))}
            placeholder="https://quantri-congdanso.quangtri.gov.vn/ctz-api" className="h-9 font-mono text-xs" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Client ID <span className="text-red-500">*</span></label>
            <Input value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
              placeholder="Nhập Client ID từ Ban quản lý" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Client Secret <span className="text-red-500">*</span></label>
            <div className="relative">
              <Input value={form.clientSecret} type={showSecret ? 'text' : 'password'}
                onChange={e => setForm(f => ({ ...f, clientSecret: e.target.value }))}
                placeholder="••••••••••••" className="h-9 pr-10" />
              <button type="button" onClick={() => setShowSecret(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Token endpoint</label>
            <Input value={form.tokenEndpoint} onChange={e => setForm(f => ({ ...f, tokenEndpoint: e.target.value }))}
              placeholder="/auth/token" className="h-9 font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Sync endpoint</label>
            <Input value={form.syncEndpoint} onChange={e => setForm(f => ({ ...f, syncEndpoint: e.target.value }))}
              placeholder="/phan-anh" className="h-9 font-mono text-xs" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Chu kỳ đồng bộ (giờ)</label>
          <Input type="number" min={1} max={24} value={form.syncIntervalH}
            onChange={e => setForm(f => ({ ...f, syncIntervalH: parseInt(e.target.value) || 6 }))}
            className="h-9 w-32" />
        </div>
      </div>

      {/* Lĩnh vực lọc */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Lĩnh vực cần đồng bộ</label>
        <div className="flex flex-wrap gap-2">
          {htktDomains.map(d => (
            <button key={d} type="button" onClick={() => toggleDomain(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                form.domainFilter.includes(d)
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
              {domainLabel[d] ?? d}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">Chỉ nhập sự cố thuộc các lĩnh vực đã chọn vào HTKT</p>
      </div>

      {/* Test result */}
      {testResult && (
        <div className={`rounded-lg border p-3 flex items-start gap-2 text-sm ${testResult.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {testResult.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          {testResult.message}
        </div>
      )}

      {/* Sync result */}
      {syncResult && (
        <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 text-sm text-blue-800">
          <p className="font-semibold">Kết quả đồng bộ:</p>
          <p>✅ Tạo mới: {syncResult.created} · ⬜ Bỏ qua: {syncResult.skipped}</p>
          {syncResult.errors?.length > 0 && <p className="text-red-600 text-xs mt-1">Lỗi: {syncResult.errors.slice(0,3).join(', ')}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-700 hover:bg-blue-800 text-white gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu cấu hình
        </Button>
        <Button onClick={handleTest} disabled={testing || !form.clientId} variant="outline" className="gap-1.5">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube2 className="w-4 h-4" />}
          Test kết nối
        </Button>
        <Button onClick={handleSync} disabled={syncing || !form.enabled || !form.clientId} variant="outline" className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50">
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Đồng bộ ngay
        </Button>
        {saveMsg && <span className={`text-xs ${saveMsg.includes('Lỗi') ? 'text-red-600' : 'text-green-600'}`}>{saveMsg}</span>}
      </div>
    </div>
  )
}
