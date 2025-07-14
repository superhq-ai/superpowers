import { create, type StateCreator } from "zustand";
import {
	persist,
	createJSONStorage,
	type StateStorage,
} from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import type { AgentMessage as Message } from "../types/agent";

export const indexDBStorage: StateStorage = {
	getItem: async (name: string): Promise<string | null> => {
		return (await get(name)) || null;
	},
	setItem: async (name: string, value: string): Promise<void> => {
		await set(name, value);
	},
	removeItem: async (name: string): Promise<void> => {
		await del(name);
	},
};

export const createIndexDBStore = <T extends object>({
	name,
	handler,
}: {
	name: string;
	handler: StateCreator<T>;
}) =>
	create(
		persist(handler, {
			name,
			storage: createJSONStorage(() => indexDBStorage),
		}),
	);

export interface Conversation {
	id: string;
	title: string;
	messages: Message[];
	lastModified: number;
}

interface ConversationState {
	conversations: Record<string, Conversation>;
	currentConversationId: string | null;
	validationError: string | null;
	addMessage: (message: Message) => void;
	updateLastMessage: (message: Partial<Message>) => void;
	getConversations: (options: { limit: number; cursor?: number }) => {
		conversations: Conversation[];
		nextCursor?: number;
	};
	setCurrentConversationId: (id: string | null) => void;
	setConversationTitle: (conversationId: string, title: string) => void;
	clearConversations: () => void;
	startNewConversation: () => void;
	startConversation: (message: Message) => string;
	setValidationError: (error: string | null) => void;
}

export const useConversationStore = createIndexDBStore<ConversationState>({
	name: "superpowers/conversations",
	handler: (set, get) => ({
		conversations: {},
		currentConversationId: null,
		validationError: null,
		addMessage: (message: Message) => {
			const { conversations, currentConversationId } = get();
			if (!currentConversationId) return;

			const conversation = conversations[currentConversationId];
			if (!conversation) return;

			const newConversation = {
				...conversation,
				messages: [...conversation.messages, message],
				lastModified: Date.now(),
			};

			set({
				conversations: {
					...conversations,
					[currentConversationId]: newConversation,
				},
			});
		},
		updateLastMessage: (message: Partial<Message>) => {
			const { conversations, currentConversationId } = get();
			if (!currentConversationId) return;

			const conversation = conversations[currentConversationId];
			if (!conversation || conversation.messages.length === 0) return;

			const lastMessage =
				conversation.messages[conversation.messages.length - 1];
			const updatedMessage = { ...lastMessage, ...message };

			const updatedMessages = [
				...conversation.messages.slice(0, -1),
				updatedMessage,
			];
			const updatedConversation = {
				...conversation,
				messages: updatedMessages,
			};

			set({
				conversations: {
					...conversations,
					[currentConversationId]: updatedConversation,
				},
			});
		},
		setCurrentConversationId: (id: string | null) => {
			if (id === null || get().conversations[id]) {
				set({ currentConversationId: id });
			}
		},
		getConversations: ({ limit, cursor }) => {
			const { conversations } = get();
			const sortedConversations = Object.values(conversations).sort(
				(a, b) => b.lastModified - a.lastModified,
			);

			if (!cursor) {
				const paginatedConversations = sortedConversations.slice(0, limit);
				return {
					conversations: paginatedConversations,
					nextCursor:
						paginatedConversations[paginatedConversations.length - 1]
							?.lastModified,
				};
			}

			const cursorIndex = sortedConversations.findIndex(
				(c) => c.lastModified === cursor,
			);
			if (cursorIndex === -1) {
				return { conversations: [], nextCursor: undefined };
			}

			const paginatedConversations = sortedConversations.slice(
				cursorIndex + 1,
				cursorIndex + 1 + limit,
			);

			return {
				conversations: paginatedConversations,
				nextCursor:
					paginatedConversations[paginatedConversations.length - 1]
						?.lastModified,
			};
		},
		setConversationTitle: (conversationId: string, title: string) => {
			set((state) => ({
				conversations: {
					...state.conversations,
					[conversationId]: {
						...state.conversations[conversationId],
						title,
						lastModified: Date.now(),
					},
				},
			}));
		},
		startNewConversation: () => {
			set({ currentConversationId: null, validationError: null });
		},
		startConversation: (message: Message) => {
			const id = crypto.randomUUID();
			const tempTitle = message.content.slice(0, 50);

			const newConversation: Conversation = {
				id,
				title: tempTitle,
				messages: [message],
				lastModified: Date.now(),
			};

			set((state) => ({
				conversations: {
					...state.conversations,
					[id]: newConversation,
				},
				currentConversationId: id,
				validationError: null,
			}));

			return id;
		},
		clearConversations: () => {
			set({
				conversations: {},
				currentConversationId: null,
				validationError: null,
			});
		},
		setValidationError: (error: string | null) => {
			set({ validationError: error });
		},
	}),
});
