"use client"
import ChatBody from '@/app/_components/Body/ChatBody'
import ChatFooter from '@/app/_components/Footer/ChatFooter'
import ChatHeader from '@/app/_components/Header/ChatHeader'
import ChatContainer from '@/components/shared/chat/ChatContainer'
import { Button } from '@/components/ui/button'
import { useConversationStore } from '@/store/chat-store'
import { Ghost, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'



function Page() {

  const { selectedConversation, setSelectedConversation } = useConversationStore();
  
  const router = useRouter()
	const handleBackClick = () => {
		router.replace("/chats");
		setSelectedConversation(null)

	}

  return selectedConversation === undefined ? <div className="w-full bg-accent h-full flex item-center justify-center">
    <Loader2 className='h-8 w-8'/>
  </div> : selectedConversation === null ? <div className="w-full gap-4 bg-accent h-full flex item-center justify-center flex-col">
    <p className='text-center'>No Conversation Found</p>
<div className='flex justify-center'>

    <Button variant={'outline'} onClick={handleBackClick} className='w- bg-green-400 dark:bg-zinc-700' size={'lg'}>Return To The Chat Page</Button>
</div>
  </div> :
   <ChatContainer>
      <ChatHeader/>
      <ChatBody/>
      <ChatFooter/>
    </ChatContainer>
}

  
    
  


export default Page