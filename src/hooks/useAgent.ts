import { useState } from "react";
import type { Agent } from "../lib/agent";
import type { UseLLMOptions } from "../types";
import type { AgentMessage, AgentResponse } from "../types/agent";
import { useAppSettings } from "../contexts/AppSettingsContext";

export const useAgent = (
	agent: Agent,
	{
		onMessage,
		onComplete,
	}: {
		onMessage?: (message: string) => void;
		onComplete?: (response: AgentResponse) => void;
	} = {},
) => {
	const { settings } = useAppSettings();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const runAgent = async (
		history: AgentMessage[],
		llmOptions: UseLLMOptions,
	) => {
		if (isLoading) return;

		setError(null);
		setIsLoading(true);

		try {
			if (settings.developerMode) {
				console.groupCollapsed("Agent Run:", new Date().toLocaleTimeString());
				console.log("History:", history);
				console.log("LLM Options:", llmOptions);
				console.groupEnd();
			}
			const response = await agent.run(history, llmOptions, (progress) => {
				if (progress.message && onMessage) {
					onMessage(progress.message);
				}
			});

			if (onComplete) {
				onComplete(response);
			}

			if (settings.developerMode) {
				console.groupCollapsed(
					"Agent Response:",
					new Date().toLocaleTimeString(),
				);
				console.log("Response:", response);
				console.log("History:", history);
				console.groupEnd();
			}
		} catch (error) {
			console.error("Agent run failed:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Sorry, something went wrong.";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const stopAgent = () => {
		agent.stop();
		setIsLoading(false);
	};

	return { isLoading, error, runAgent, stopAgent };
};
