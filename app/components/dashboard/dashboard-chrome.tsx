'use client'

import { useState } from 'react'
import { SidebarNew as Sidebar } from './sidebar-new'
import { Header } from './header'

type Props = {
  roleName: string
  email: string
  userName: string
  userEmail: string
  roleDisplayName: string
  mustChangePassword?: boolean
  canOffice?: boolean
  canHtkt?: boolean
  canCongViec?: boolean
  toChucMa?: string | null
}

export function DashboardChrome({ roleName, email, userName, userEmail, roleDisplayName, mustChangePassword, canOffice, canHtkt, canCongViec, toChucMa }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <Sidebar
        roleName={roleName}
        email={email}
        canOffice={canOffice}
        canHtkt={canHtkt}
        canCongViec={canCongViec}
        toChucMa={toChucMa}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <Header
        userName={userName}
        userEmail={userEmail}
        roleDisplayName={roleDisplayName}
        roleName={roleName}
        mustChangePassword={mustChangePassword}
        canOffice={canOffice}
        onMenuClick={() => setMobileOpen(true)}
      />
    </>
  )
}
