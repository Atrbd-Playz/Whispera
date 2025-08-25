"use client"
import React from 'react'
import DesktopNav from './nav/DesktopNav'
import MobileNav from './nav/MobileNav'
import { cn } from '@/lib/utils'
import { useChat } from '@/hooks/useChat';



type Props = React.PropsWithChildren<{}>

const SidebarWrapper = ({children}: Props) => {
  return (
    <div className="h-full w-full flex lg:p-2 lg:pl-0 flex-col sm:flex-row  ">
      <MobileNav/>
      <DesktopNav/>
      <main className={cn('h-[calc(100%-60px)] sm:h-full w-full flex', {
        "h-full": useChat().isActive
      })
      }>
        {children}
      </main>
      </div>
  )
}

export default SidebarWrapper