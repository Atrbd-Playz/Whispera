import { Card } from '@/components/ui/card'
import Image from 'next/image'

type Props = {}

const ChatFallback = (props: Props) => {
  return (
    <Card className="hidden lg:flex h-full w-full p-2 items-center lg:rounded-r-sm bg-accent text-accent-foreground justify-center lg:flex-col">
    <div className='flex items-center justify-center flex-col'>
      <Image
      src="logo.svg"
      alt='Whispera Logo'
      width={80}
      height={80}
     />
     <h2 className='mb-4'>
      Whispera for Windows
     </h2>
    </div>
<h3 className='text-sm tracking-wide text-gray-400 font-semibold'>
      Select a Chat to get started

</h3>
    </Card>
  )
}

export default ChatFallback