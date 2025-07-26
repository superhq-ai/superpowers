import type { AppSettings, LLMMessage, UseLLMOptions } from "../../types";
import { apiRequest } from "../apiRequest";
import { ProviderApiError } from "../errors";
import type { LLM } from "./index";

export class OllamaProvider implements LLM {
	static async listModels(
		_apiKey?: string,
		customUrl?: string,
	): Promise<string[]> {
		// Create a minimal settings object for the unified API request
		const settings: AppSettings = {
			selectedProvider: "ollama",
			model: "",
			apiKeys: {},
			customUrls: customUrl ? { ollama: customUrl } : {},
		} as AppSettings;

		try {
			// Use Ollama's native /api/tags endpoint (not /v1/models)
			const response = await apiRequest("/api/tags", "ollama", settings);
			const data = await response.json();

			// Ollama returns: { models: [{ name: "llama3.2:latest", ... }, ...] }
			if (!data.models || !Array.isArray(data.models)) {
				throw new Error(
					"Invalid response format from Ollama /api/tags endpoint",
				);
			}

			const models = data.models
				.map((model: { name: string }) => model.name)
				.filter((name: string) => name && typeof name === "string")
				.sort();

			return models.length > 0 ? models : getFallbackOllamaModels();
		} catch (error) {
			console.error("Failed to fetch Ollama models:", error);
			// Return fallback models if API fails
			return getFallbackOllamaModels();
		}
	}

	async *generate(
		messages: LLMMessage[],
		options: UseLLMOptions,
		apiKey: string,
		signal?: AbortSignal,
		customUrl?: string,
	): AsyncGenerator<string> {
		const baseUrl = customUrl || "http://localhost:11434";
		const url = `${baseUrl}/v1/chat/completions`;

		// Convert messages to OpenAI format
		const openAIMessages = messages.map((msg) => ({
			role: msg.role,
			content: msg.content,
		}));

		const requestBody = {
			model: options.model,
			messages: openAIMessages,
			stream: true,
			temperature: options.temperature || 0.7,
			max_tokens: options.maxTokens,
			top_p: options.topP,
		};

		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		// Add Authorization header only if API key is provided
		if (apiKey?.trim()) {
			headers.Authorization = `Bearer ${apiKey}`;
		}

		try {
			const response = await fetch(url, {
				method: "POST",
				headers,
				body: JSON.stringify(requestBody),
				signal,
			});

			if (!response.ok) {
				const errorText = await response.text();
				let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

				try {
					const errorJson = JSON.parse(errorText);
					if (errorJson.error) {
						errorMessage = errorJson.error.message || errorJson.error;
					}
				} catch {
					// Use the raw error text if JSON parsing fails
					if (errorText) {
						errorMessage = errorText;
					}
				}

				throw new ProviderApiError(errorMessage);
			}

			if (!response.body) {
				throw new ProviderApiError("No response body received");
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					const lines = chunk.split("\n");

					for (const line of lines) {
						if (!line.trim()) continue;

						if (line.startsWith("data: ")) {
							const data = line.slice(6);

							if (data === "[DONE]") {
								return;
							}

							try {
								const parsed = JSON.parse(data);
								const content = parsed.choices?.[0]?.delta?.content;

								if (content) {
									yield content;
								}
							} catch (_parseError) {
								console.warn("Failed to parse SSE data:", data);
							}
						}
					}
				}
			} finally {
				reader.releaseLock();
			}
		} catch (err) {
			if (err instanceof ProviderApiError) {
				throw err;
			}

			const error = err as Error;
			if (error.name === "AbortError") {
				throw new ProviderApiError("Request was cancelled");
			}

			// Handle network errors
			if (error.message.includes("fetch")) {
				throw new ProviderApiError(
					`Failed to connect to Ollama at ${baseUrl}. Make sure Ollama is running.`,
				);
			}

			throw new ProviderApiError(error.message);
		}
	}
}

function getFallbackOllamaModels(): string[] {
	return [
		"llama3.2:latest",
		"llama3.1:latest",
		"llama3:latest",
		"mistral:latest",
		"codellama:latest",
		"phi3:latest",
		"qwen2.5:latest",
		"gemma2:latest",
	];
}
