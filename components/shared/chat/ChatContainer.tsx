import { Card } from '@/components/ui/card'
import React from 'react'

type Props = React.PropsWithChildren<{}>

const ChatContainer = ({children}: Props) => {
  return (
    <Card className="h-ful w-full bg-accent flex flex-col gap-2 ">
        {children}
        </Card>
  )
}

export default ChatContainer