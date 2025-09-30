"use client"

import { Card } from '@/components/ui/card';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { ListFilter, Search, X } from 'lucide-react';
import React from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useConversationStore } from '@/store/chat-store'

type Props = React.PropsWithChildren<{
  title: string;
  action?: React.ReactNode;
  SearchPlaceholder: string;
}>

const ChatList = ({ children, title, action: Action, SearchPlaceholder }: Props) => {
  const { isActive } = useChat();
  const router = useRouter();
  const conversations = useQuery(api.conversations.getMyConversations);
  const users = useQuery(api.users.getUsers);
  const me = useQuery(api.users.getMe);
  const createConv = useMutation(api.conversations.createConversation);
  const setSelectedConversation = useConversationStore((s) => s.setSelectedConversation);

  const [query, setQuery] = React.useState("");
  const filteredConversations = React.useMemo(() => {
    if (!conversations) return [] as any[];
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter((c: any) => (c.groupName || c.name || "").toLowerCase().includes(q));
  }, [conversations, query]);

  const filteredUsers = React.useMemo(() => {
    if (!users) return [] as any[];
    if (!query.trim()) return users;
    const q = query.toLowerCase();
    return users.filter((u: any) => (u.name || u.email || "").toLowerCase().includes(q));
  }, [users, query]);

  const openConversation = (c: any) => {
    setSelectedConversation(c);
    router.push(`/chats/${c._id}`);
  };

  const startChatWith = async (user: any) => {
    if (!me) return;
    const existing = (conversations || []).find((c: any) =>
      !c.isGroup &&
      c.participants.includes(me._id) &&
      c.participants.includes(user._id)
    );
    if (existing) {
      openConversation(existing);
      return;
    }
    const id = await createConv({ isGroup: false, participants: [me._id, user._id] });
    setSelectedConversation({
      _id: id,
      isGroup: false,
      participants: [me._id, user._id],
      name: user.name,
      image: user.image
    } as any);
    router.push(`/chats/${id}`);
  };

  return (
    <Card
      className={cn(
        "h-full divide-y overflow-hidden divide-divider w-full lg:flex-none lg:w-80 p-2 bg-accent lg:block lg:border-x-[1px] lg:border-divider-darker lg:rounded-l-sm sm:rounded-sm",
        { hidden: isActive }
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <div className="flex gap-2">
          {Action ? Action : null}
          <ListFilter className="cursor-pointer" />
        </div>
      </div>

      <div className="w-full h-full flex flex-col items-center justify-start">
        {/* Search */}
        <div className="flex items-center justify-between w-full gap-4">
          <div className="relative h-10 mr-2 flex w-full">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10"
              size={18}
            />
            <input
              type="text"
              placeholder={SearchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-8 py-2 text-sm w-full rounded-[2px] focus:dark:bg-zinc-700 dark:bg-zinc-800 border-b-[1px] rounded-t-md border-primary-foreground focus:outline-none focus:border-primary"
            />
            {query && (
              <X
                size={18}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => setQuery("")}
              />
            )}
          </div>
        </div>

        {/* Results list */}
        {query && (
          <div className="w-full mt-2 space-y-3 overflow-y-auto">
            {/* Conversations */}
            <div>
              <p className="text-xs uppercase text-muted-foreground px-1 mb-1">Conversations</p>
              <div className="rounded-md border divide-y">
                {filteredConversations.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No conversations</div>
                )}
                {filteredConversations.map((c: any) => (
                  <div
                    key={c._id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer"
                    onClick={() => openConversation(c)}
                  >
                    <img
                      src={c.groupImage || c.image || "/placeholder.png"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {c.groupName || c.name || "Conversation"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Users */}
            <div>
              <p className="text-xs uppercase text-muted-foreground px-1 mb-1">Users</p>
              <div className="rounded-md border divide-y">
                {filteredUsers.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No users</div>
                )}
                {filteredUsers.map((u: any) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer"
                    onClick={() => startChatWith(u)}
                  >
                    <img src={u.image} className="w-8 h-8 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {u.name || u.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <button className="text-xs text-black px-2 py-1 rounded bg-[#419873] ">
                      Chat
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Only show children if not searching */}
        {!query && children}
      </div>
    </Card>
  );
};

export default ChatList;
