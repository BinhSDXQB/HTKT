'use client'

import { Check, X } from 'lucide-react'

type Rule = { label: string; ok: boolean }

function evaluate(pw: string): { score: number; rules: Rule[] } {
  const rules: Rule[] = [
    { label: 'Tối thiểu 8 ký tự', ok: pw.length >= 8 },
    { label: 'Có chữ HOA và chữ thường', ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
    { label: 'Có chữ số', ok: /\d/.test(pw) },
    { label: 'Có ký tự đặc biệt', ok: /[^A-Za-z0-9]/.test(pw) },
  ]
  return { score: rules.filter((r) => r.ok).length, rules }
}

const LEVELS = [
  { label: 'Rất yếu', color: 'bg-rose-500', text: 'text-rose-600' },
  { label: 'Yếu', color: 'bg-orange-500', text: 'text-orange-600' },
  { label: 'Trung bình', color: 'bg-amber-500', text: 'text-amber-600' },
  { label: 'Khá', color: 'bg-lime-500', text: 'text-lime-600' },
  { label: 'Mạnh', color: 'bg-emerald-500', text: 'text-emerald-600' },
]

/** Thanh đo độ mạnh + danh sách yêu cầu mật khẩu (khớp chính sách: HOA/thường/số/đặc biệt, ≥8). */
export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null
  const { score, rules } = evaluate(value)
  const level = LEVELS[score]

  return (
    <div className="space-y-2 pt-0.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? level.color : 'bg-slate-200'}`}
            />
          ))}
        </div>
        <span className={`text-xs font-semibold ${level.text}`}>{level.label}</span>
      </div>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {rules.map((r) => (
          <li key={r.label} className={`flex items-center gap-1.5 text-[11px] ${r.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
            {r.ok ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
