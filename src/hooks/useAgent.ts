import { useState } from 'react';
import { Agent } from '../lib/agent';
import type { UseLLMOptions } from '../types';
import type { AgentMessage, AgentResponse } from '../types/agent';

export const useAgent = (agent: Agent, { onMessage, onComplete }: { onMessage?: (message: string) => void, onComplete?: (response: AgentResponse) => void } = {}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runAgent = async (history: AgentMessage[], llmOptions: UseLLMOptions) => {
        if (isLoading) return;

        setError(null);
        setIsLoading(true);

        try {
            const response = await agent.run(
                history,
                llmOptions,
                (progress) => {
                    if (progress.message && onMessage) {
                        onMessage(progress.message);
                    }
                },
            );

            if (onComplete) {
                onComplete(response);
            }

        } catch (error) {
            console.error("Agent run failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Sorry, something went wrong.";
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
