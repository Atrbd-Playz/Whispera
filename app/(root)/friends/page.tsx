import ChatList from '@/components/shared/chat-list/ChatList'
import ChatFallback from '@/components/shared/chat/ChatFallback'
import React from 'react'

const Page = () => {
  return (
    <>
      <ChatList title='Friends' SearchPlaceholder='Search Friends...'>Friends Page</ChatList>
      <ChatFallback></ChatFallback>
    </>
  )
}

export default Page