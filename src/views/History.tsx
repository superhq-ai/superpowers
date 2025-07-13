import { useState, useEffect, useRef, useCallback } from "react";
import { useConversationStore } from "../lib/store";
import { formatDate } from "../lib/utils";
import { useViewContext } from "../contexts/ViewContext";
import Popup from "../components/ui/Popup";
import { Trash2 } from "lucide-react";
import type { Conversation } from "../lib/store";

const CONVERSATION_PAGE_SIZE = 20;

const History = () => {
    const { getConversations, setCurrentConversationId, clearConversations } = useConversationStore();
    const { setView } = useViewContext();
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [cursor, setCursor] = useState<number | undefined>();
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const observer = useRef<IntersectionObserver | null>(null);

    const loadMoreConversations = useCallback(() => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        const { conversations: newConversations, nextCursor } = getConversations({
            limit: CONVERSATION_PAGE_SIZE,
            cursor,
        });
        setConversations((prev) => [...prev, ...newConversations]);
        setCursor(nextCursor);
        setHasMore(!!nextCursor);
        setIsLoading(false);
    }, [cursor, getConversations, hasMore, isLoading]);

    const lastConversationElementRef = useCallback(
        (node: HTMLButtonElement) => {
            if (isLoading) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    loadMoreConversations();
                }
            });
            if (node) observer.current.observe(node);
        },
        [isLoading, hasMore, loadMoreConversations]
    );

    useEffect(() => {
        loadMoreConversations();
    }, []);

    const handleConversationClick = (id: string) => {
        setCurrentConversationId(id);
        setView("chat");
    };

    const handleClearHistory = () => {
        setIsPopupOpen(true);
    };

    const handleConfirmClear = () => {
        clearConversations();
        setConversations([]);
        setCursor(undefined);
        setHasMore(true);
        setIsPopupOpen(false);
    };

    return (
        <div className="px-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-lg font-bold">History</h1>
                <button
                    onClick={handleClearHistory}
                    className="inline-flex items-center justify-center text-xs hover:text-red-500"
                >
                    <Trash2 size={14} className="mr-1" />
                    Clear History
                </button>
            </div>
            <div className="space-y-2 overflow-y-auto flex-grow mb-4">
                {conversations.length > 0 ? (
                    conversations.map((conversation, index) => (
                        <button
                            ref={index === conversations.length - 1 ? lastConversationElementRef : null}
                            key={conversation.id}
                            onClick={() => handleConversationClick(conversation.id)}
                            className="w-full text-left p-2 rounded-md bg-white/50 transition-colors border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 focus::outline-none focus:border-indigo-500 focus:text-indigo-600"
                        >
                            <p className="font-semibold truncate">{conversation.title || "Untitled Conversation"}</p>
                            <p className="text-xs text-gray-500">
                                {formatDate(new Date(conversation.lastModified))}
                            </p>
                        </button>
                    ))
                ) : (
                    <p className="text-center text-gray-500">No conversations to show.</p>
                )}
                {isLoading && <p className="text-center text-gray-500">Loading...</p>}
                {!hasMore && conversations.length > 0 && (
                    <p className="text-center text-gray-500 mt-4">No more conversations.</p>
                )}
            </div>
            <Popup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                onConfirm={handleConfirmClear}
                title="Clear History"
            >
                <p>Are you sure you want to clear all conversation history? This action cannot be undone.</p>
            </Popup>
        </div>
    );
};

export default History;
