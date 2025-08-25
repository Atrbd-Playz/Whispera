import { useParams } from "next/navigation"
import { useMemo } from "react"

export const useChat = () => {
    const params = useParams();

    const chatId = params.chatid || null

    // `isActive` will be true if `chatId` exists (i.e., when a specific chat is open)
    const isActive = useMemo(() => !!chatId, [chatId]);

    return {
        isActive,
        chatId,
    }
}
