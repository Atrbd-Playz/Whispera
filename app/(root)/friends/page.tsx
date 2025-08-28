import ChatList from '@/components/shared/chat-list/ChatList'
import ChatFallback from '@/components/shared/chat/ChatFallback'
import React from 'react'

const Page = () => {
  return (
    <>
      <ChatList SearchPlaceholder='Search Friends...' title='Friends'>Friends Page</ChatList>
      <ChatFallback></ChatFallback>
    </>
  )
}

export default Page