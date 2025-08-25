import SidebarWrapper from '@/components/shared/sidebar/SidebarWrapper'
import React from 'react'

type Props = React.PropsWithChildren<[]>

const ChatLayout = ({children}: Props) => {
  return (
    <SidebarWrapper>{children}</SidebarWrapper>
  )
}

export default ChatLayout