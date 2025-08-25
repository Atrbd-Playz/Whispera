"use client"

import { Card } from '@/components/ui/card';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { ListFilter, Search } from 'lucide-react';
import React from 'react'

type Props = React.PropsWithChildren<{
    title: string;
    action?: React.ReactNode;
    SearchPlaceholder: string;
}>

const ChatList = ({children, title, action: Action, SearchPlaceholder }: Props) => {
  const {isActive} = useChat();
  return (
    <Card className={cn("h-full divide-y divide-divider w-full lg:flex-none lg:w-80 p-2 bg-accent lg:block lg:border-x-[1px] lg:border-divider-darker lg:rounded-l-sm sm:rounded-sm",{
      "hidden": isActive,
    })}>
        <div className='mb-4 flex items-center justify-between' >
            <h1 className='text-xl font-semibold tracking-tight'>{title}</h1>
            <div className='flex gap-2'>
            {Action? Action:null}
            <ListFilter className='cursor-pointer' />
            </div>
                

        </div>
        <div className="w-full h-full flex flex-col items-center justify-start">

        <div className='flex items-center justify-between w-full gap-4'>
            {/* Search */}
            <div className='relative h-10 mr-2 flex w-full'>
                <Search
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10'
                    size={18}
                />
                <input 
                    type="text"
                    placeholder={SearchPlaceholder}
                    className='pl-10 py-2 text-sm w-full rounded-[2px] focus:dark:bg-zinc-700 dark:bg-zinc-800 border-b-[1px] rounded-t-md border-primary-foreground focus:outline-none focus:border-primary' />
            </div>
        </div>

            {children}
        </div>
    </Card>
  )
}

export default ChatList