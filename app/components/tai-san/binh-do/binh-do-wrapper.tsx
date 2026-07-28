'use client'

import dynamic from 'next/dynamic'

const BinhDoSvg = dynamic(
  () => import('./binh-do-svg').then(m => m.BinhDoSvg),
  { ssr: false, loading: () => <p className="text-sm text-slate-400 py-8 text-center animate-pulse">Đang tải bình đồ...</p> }
)

export function BinhDoWrapper({ streetId }: { streetId: string }) {
  return <BinhDoSvg streetId={streetId} />
}
