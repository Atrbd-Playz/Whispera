"use client"

import ChatPanel from '@/components/ChatPanel/ChatPanel'
import ChatList from '@/components/shared/chat-list/ChatList'
import UserListDialog from '@/components/shared/dialouges/user-list-dialog'
import React from 'react'

type Props = React.PropsWithChildren<[]>

const ChatLayout = ({children}: Props) => {
  
  return (
    <>
    <ChatList title='Chats' action={<UserListDialog/>} SearchPlaceholder="Search or start a new chat">
    <ChatPanel />
    </ChatList>
    {children}
    </>
  )
}

export default ChatLayout