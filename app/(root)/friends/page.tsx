import ChatList from '@/components/shared/chat-list/ChatList'
import ChatFallback from '@/components/shared/chat/ChatFallback'
import React from 'react'

const page = () => {
  return (
    <>
      <ChatList title='Friends'>Friends Page</ChatList>
      <ChatFallback></ChatFallback>
    </>
  )
}

export default page