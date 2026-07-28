'use client'

import dynamic from 'next/dynamic'

const MapClient = dynamic(
  () => import('./map-client').then((m) => m.MapClient),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center bg-slate-100"><p className="text-slate-500 text-sm">Đang tải bản đồ...</p></div> }
)

type AssetType = { id: string; name: string; code: string; domain: string }

export function MapWrapper({ domain, assetTypeId, centerLat, centerLng, zoom }: {
  domain?: string
  assetTypeId?: string
  assetTypes: AssetType[]
  centerLat?: number
  centerLng?: number
  zoom?: number
}) {
  return (
    <div className="w-full h-full">
      <MapClient
        domain={domain}
        assetTypeId={assetTypeId}
        centerLat={centerLat}
        centerLng={centerLng}
        zoom={zoom}
      />
    </div>
  )
}
