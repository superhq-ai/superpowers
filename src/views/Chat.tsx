import { Globe, Lightbulb, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ChatMessage from "../components/ChatMessage";
import PlannerPanel from "../components/PlannerPanel";
import PromptBox from "../components/PromptInput";
import { useAppSettings } from "../contexts/AppSettingsContext";
import { useAgent } from "../hooks/useAgent";
import { agent } from "../lib/agent-instance";
import { TOOL_CALL_JSON_CODE_BLOCK_REGEX } from "../lib/regex";
import { useConversationStore } from "../lib/store";
import type { PlannerStep } from "../lib/streaming-tool-parser";
import { fileToDataURL, readStream } from "../lib/utils";
import { streamLlm } from "../services/llm";
import type { LLMMessage } from "../types";

const Chat = () => {
	const [inputValue, setInputValue] = useState("");
	const [showPlanner, setShowPlanner] = useState(true);
	const [currentPlannerSteps, setCurrentPlannerSteps] = useState<PlannerStep[]>(
		[],
	);

	const { settings } = useAppSettings();
	const {
		conversations,
		currentConversationId,
		validationError,
		addMessage,
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
			setShowPlanner(false);
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
		setShowPlanner(true);

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

		if (!currentConversationId) {
			const newConversationId = startConversation(userMessage);
			addMessage({
				id: crypto.randomUUID(),
				role: "assistant" as const,
				content: "",
			});

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
			addMessage(userMessage);
			addMessage({
				id: crypto.randomUUID(),
				role: "assistant" as const,
				content: "",
			});
		}

		const history = [...currentMessages, userMessage];
		runAgent(history, {
			provider: settings.selectedProvider,
			model: settings.model,
			apiKey: settings.apiKeys[settings.selectedProvider],
			attachments,
		});
		setInputValue("");
	};

	return (
		<>
			<div className="flex-1 flex flex-col p-4">
				{currentMessages.length === 0 && !isLoading ? (
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center max-w-lg">
							<div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
								<div className="p-4 rounded-lg">
									<div className="flex items-center">
										<Lightbulb size={16} className="text-gray-400" />
										<h2 className="font-semibold text-sm ml-2">Examples</h2>
									</div>
									<p className="text-xs text-gray-500 mt-1">
										"Find top 5 trending repositories on github"
									</p>
								</div>
								<div className="p-4 rounded-lg">
									<div className="flex items-center">
										<Zap size={16} className="text-gray-400" />
										<h2 className="font-semibold text-sm ml-2">Capabilities</h2>
									</div>
									<p className="text-xs text-gray-500 mt-1">
										I can search the web for real-time information.
									</p>
								</div>
								<div className="p-4 rounded-lg">
									<div className="flex items-center">
										<Globe size={16} className="text-gray-400" />
										<h2 className="font-semibold text-sm ml-2">Tools</h2>
									</div>
									<p className="text-xs text-gray-500 mt-1">
										I have access to this web browser to help you with your
										tasks.
									</p>
								</div>
							</div>
						</div>
					</div>
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
												<PlannerPanel
													steps={currentPlannerSteps}
													isVisible={showPlanner}
													onToggle={() => setShowPlanner(!showPlanner)}
												/>
											)}
										<ChatMessage message={chatMessage} />
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
			<div className="sticky bottom-0 left-0 right-0 z-50">
				<PromptBox
					prompt={inputValue}
					isLoading={isLoading}
					setPrompt={setInputValue}
					onSubmit={handleSubmit}
					onStop={stopAgent}
				/>
			</div>
		</>
	);
};

export default Chat;
