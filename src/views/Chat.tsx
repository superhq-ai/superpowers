import { useEffect, useRef, useState } from "react";
import ChatMessage from "../components/ChatMessage";
import ContextRibbon from "../components/ContextRibbon";
import EmptyState from "../components/EmptyState";
import PlannerPanel from "../components/PlannerPanel";
import PromptBox from "../components/PromptInput";
import { useAppSettings } from "../contexts/AppSettingsContext";
import { useTabContext } from "../contexts/TabContext";
import { useAgent } from "../hooks/useAgent";
import { agent } from "../lib/agent-instance";
import { PROMPTS } from "../lib/prompts";
import { TOOL_CALL_JSON_CODE_BLOCK_REGEX } from "../lib/regex";
import { useConversationStore } from "../lib/store";
import type { PlannerStep } from "../lib/streaming-tool-parser";
import { fileToDataURL, readStream } from "../lib/utils";
import { streamLlm } from "../services/llm";
import type { LLMMessage } from "../types";

const Chat = () => {
	const [inputValue, setInputValue] = useState("");
	const { contextUrl, contextTitle, contextTabId } = useTabContext();
	const [currentPlannerSteps, setCurrentPlannerSteps] = useState<PlannerStep[]>(
		[],
	);

	const { settings } = useAppSettings();
	const {
		conversations,
		currentConversationId,
		validationError,
		addMessages,
		updateLastMessage,
		setConversationTitle,
		startConversation,
		setValidationError,
	} = useConversationStore();

	const { isLoading, error, runAgent, stopAgent } = useAgent(agent, {
		onMessage: (content) => {
			updateLastMessage({ content });
		},
		onComplete: (response) => {
			// Clean up the message content by removing the raw tool call JSON
			const finalMessage = response.message
				.replace(TOOL_CALL_JSON_CODE_BLOCK_REGEX, "")
				.trim();
			updateLastMessage({
				content: finalMessage,
				toolCalls: response.toolCalls,
				toolResults: response.toolResults,
			});
			setCurrentPlannerSteps([]);
		},
		onPlannerUpdate: (steps) => {
			setCurrentPlannerSteps(steps);
		},
	});

	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const currentMessages = currentConversationId
		? conversations[currentConversationId]?.messages || []
		: [];

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: This effect runs on mount and when messages change
	useEffect(() => {
		scrollToBottom();
	}, [currentMessages]);

	const handleSubmit = async (images?: File[]) => {
		if (
			!settings ||
			!settings.selectedProvider ||
			!settings.model ||
			!settings.apiKeys[settings.selectedProvider]
		) {
			setValidationError(
				"Please select a provider and model in settings, and ensure you have entered an API key.",
			);
			return;
		}
		setValidationError(null);

		setCurrentPlannerSteps([]);

		const attachments = await Promise.all(
			(images || []).map(async (file) => {
				const { mediaType, data } = await fileToDataURL(file);
				return {
					id: crypto.randomUUID(),
					type: "image" as const,
					mediaType,
					data,
				};
			}),
		);

		const userMessage = {
			id: crypto.randomUUID(),
			role: "user" as const,
			content: inputValue,
			attachments,
		};

		if (inputValue.startsWith("/")) {
			const [command, ...args] = inputValue.slice(1).split(" ");
			const prompt = PROMPTS.find((p) => p.name === command);

			if (prompt) {
				// Add user's slash command to the conversation
				if (!currentConversationId) {
					startConversation(userMessage);
				} else {
					addMessages([userMessage]);
				}

				const messages = await prompt.getMessages({ text: args.join(" ") });

				if (prompt.llmTrigger) {
					// For LLM triggers, add an empty assistant message and run the agent
					addMessages([
						{
							id: crypto.randomUUID(),
							role: "assistant",
							content: "",
						},
					]);
					const history = [...currentMessages, userMessage, ...messages];
					runAgent(
						history,
						{
							provider: settings.selectedProvider,
							model: settings.model,
							apiKey: settings.apiKeys[settings.selectedProvider],
							attachments,
						},
						{ url: contextUrl, title: contextTitle, id: contextTabId },
					);
				} else {
					// For direct responses, just add the message from the prompt
					addMessages(messages);
				}

				setInputValue("");
				return;
			}
		}

		if (!currentConversationId) {
			const newConversationId = startConversation(userMessage);
			addMessages([
				{
					id: crypto.randomUUID(),
					role: "assistant" as const,
					content: "",
				},
			]);

			// Generate title in the background
			(async () => {
				const titlePrompt = `Based on the following user query, create a short, descriptive title (3-5 words) for the conversation.

User Query: "${inputValue}"

Title:`;
				const titleLlmMessages: LLMMessage[] = [
					{ role: "user", content: titlePrompt },
				];
				try {
					const stream = streamLlm(titleLlmMessages, {
						provider: settings.selectedProvider,
						apiKey: settings.apiKeys[settings.selectedProvider],
						model: settings.model,
					});
					const title = await readStream(stream);
					setConversationTitle(newConversationId, title.trim());
				} catch (error) {
					console.error("Failed to generate title:", error);
				}
			})();
		} else {
			addMessages([
				userMessage,
				{
					id: crypto.randomUUID(),
					role: "assistant" as const,
					content: "",
				},
			]);
		}

		const history = [...currentMessages, userMessage];
		runAgent(
			history,
			{
				provider: settings.selectedProvider,
				model: settings.model,
				apiKey: settings.apiKeys[settings.selectedProvider],
				attachments,
			},
			{ url: contextUrl, title: contextTitle, id: contextTabId },
		);
		setInputValue("");
	};

	return (
		<>
			<div className="flex-1 flex flex-col p-4">
				{currentMessages.length === 0 && !isLoading ? (
					<EmptyState />
				) : (
					<div className="space-y-4">
						{currentMessages
							.filter((msg) => msg.role === "user" || msg.role === "assistant")
							.map((message, index) => {
								const chatMessage = {
									id: message.id,
									type: message.role as "user" | "assistant",
									content: message.content,
									toolCalls: message.toolCalls,
									toolResults: message.toolResults,
									attachments: message.attachments,
								};

								const isLastAssistantMessage =
									message.role === "assistant" &&
									index === currentMessages.length - 1;

								return (
									<div key={message.id}>
										{isLastAssistantMessage &&
											currentPlannerSteps.length > 0 && (
												<PlannerPanel steps={currentPlannerSteps} />
											)}
										{!(isLastAssistantMessage && isLoading) && (
											<ChatMessage message={chatMessage} />
										)}
									</div>
								);
							})}
					</div>
				)}
			</div>

			{isLoading && (
				<div className="text-gray-900 p-4">
					<div className="flex items-center gap-2">
						<span className="text-sm thinking-text">
							{currentPlannerSteps.length > 0 &&
							currentPlannerSteps.some((s) => !s.isCompleted)
								? "Executing tools..."
								: "Thinking..."}
						</span>
					</div>
				</div>
			)}

			{error && (
				<div className="px-4 py-3" role="alert">
					<strong className="font-bold text-red-500">Error:</strong>
					<span className="block sm:inline text-red-500"> {error}</span>
				</div>
			)}

			{validationError && (
				<div className="px-4 py-3" role="alert">
					<strong className="font-bold text-red-500">Error:</strong>
					<span className="block sm:inline text-red-500">
						{" "}
						{validationError}
					</span>
				</div>
			)}

			<div ref={messagesEndRef} />
			<div className="sticky bottom-0 left-0 right-0 z-50 p-4">
				<div className="bg-gray-100 overflow-hidden rounded-2xl">
					<ContextRibbon url={contextUrl} title={contextTitle} />
					<PromptBox
						prompt={inputValue}
						isLoading={isLoading}
						setPrompt={setInputValue}
						onSubmit={handleSubmit}
						onStop={stopAgent}
					/>
				</div>
			</div>
		</>
	);
};

export default Chat;
