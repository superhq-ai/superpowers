import { useState } from "react";
import { useAppSettings } from "../contexts/AppSettingsContext";
import type { Agent, ExtendedAgentResponse } from "../lib/agent";
import type { PlannerStep } from "../lib/streaming-tool-parser";
import type { UseLLMOptions } from "../types";
import type { AgentMessage } from "../types/agent";

export const useAgent = (
	agent: Agent,
	{
		onMessage,
		onComplete,
		onPlannerUpdate,
	}: {
		onMessage?: (message: string) => void;
		onComplete?: (response: ExtendedAgentResponse) => void;
		onPlannerUpdate?: (steps: PlannerStep[]) => void;
	} = {},
) => {
	const { settings } = useAppSettings();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [plannerSteps, setPlannerSteps] = useState<PlannerStep[]>([]);

	const runAgent = async (
		history: AgentMessage[],
		llmOptions: UseLLMOptions,
	) => {
		if (isLoading) return;

		setError(null);
		setIsLoading(true);
		setPlannerSteps([]);

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

				if (progress.plannerSteps) {
					setPlannerSteps(progress.plannerSteps);
					onPlannerUpdate?.(progress.plannerSteps);
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
				console.log("Planner Steps:", response.plannerSteps);
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

	return { isLoading, error, runAgent, stopAgent, plannerSteps };
};
