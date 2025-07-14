import { useState } from "react";
import { streamLlm } from "../services/llm";
import type { AppSettings, LLMProvider } from "../types";
import { readStream } from "../lib/utils";

export function useTestLlm() {
	const [testResponse, setTestResponse] = useState("");
	const [testError, setTestError] = useState("");
	const [isTesting, setIsTesting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const testConnection = async (
		provider: LLMProvider,
		settings: AppSettings,
	) => {
		setTestResponse("");
		setTestError("");
		setIsTesting(true);
		setIsSuccess(false);

		try {
			const stream = streamLlm(
				[{ role: "user", content: "Hello! Briefly introduce yourself." }],
				{
					provider,
					model: settings.model,
					apiKey: settings.apiKeys[provider],
				},
			);

			await readStream(stream, (chunk) => {
				setTestResponse(chunk);
			});

			setIsSuccess(true);
		} catch (error) {
			const err = error as Error;
			setTestError(err.message);
			setIsSuccess(false);
		} finally {
			setIsTesting(false);
		}
	};

	return { testConnection, isTesting, isSuccess, testResponse, testError };
}
