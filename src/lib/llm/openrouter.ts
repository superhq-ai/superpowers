import type { AppSettings, LLMMessage } from "../../types";
import { apiRequest } from "../apiRequest";
import type { LLM } from "./index";

interface OpenRouterModel {
	id: string;
	name: string;
	description?: string;
	pricing: {
		prompt: string;
		completion: string;
	};
	context_length: number;
	architecture: {
		modality: string;
		tokenizer: string;
		instruct_type?: string;
	};
	top_provider: {
		max_completion_tokens?: number;
		is_moderated: boolean;
	};
	per_request_limits?: {
		prompt_tokens: string;
		completion_tokens: string;
	};
}

export class OpenRouterProvider implements LLM {
	static async listModels(
		apiKey?: string,
		customUrl?: string,
	): Promise<string[]> {
		// Create a minimal settings object for the unified API request
		const settings: AppSettings = {
			selectedProvider: "openrouter",
			model: "",
			apiKeys: { openrouter: apiKey || "" },
			customUrls: customUrl ? { openrouter: customUrl } : {},
		} as AppSettings;

		try {
			const response = await apiRequest("/models", "openrouter", settings);
			const data = await response.json();

			console.log("OpenRouter: Received data structure:", {
				hasData: !!data.data,
				dataLength: data.data?.length || 0,
				firstModel: data.data?.[0]?.id || "none",
			});

			// OpenRouter returns models in format: { data: [{ id: "model-name", ... }] }
			if (!data.data || !Array.isArray(data.data)) {
				console.error("OpenRouter: Unexpected response format:", data);
				throw new Error("Invalid response format from OpenRouter API");
			}

			const models = (data.data as OpenRouterModel[])
				.filter((model) => {
					if (!model.id) return false;

					const modelName = model.id.toLowerCase();
					// Filter out embedding and reranking models
					const isValidModel =
						!modelName.includes("embed") &&
						!modelName.includes("rerank") &&
						!modelName.includes("moderation") &&
						model.architecture?.modality === "text"; // Only text models

					return isValidModel;
				})
				.map((model) => model.id)
				.sort();

			console.log("OpenRouter: Filtered models count:", models.length);
			console.log("OpenRouter: First 5 models:", models.slice(0, 5));

			return models;
		} catch (error) {
			console.error("OpenRouter models fetch error:", error);

			// Return curated fallback models if API fails
			const fallbackModels = [
				"openai/gpt-4o",
				"openai/gpt-4o-mini",
				"anthropic/claude-3.5-sonnet",
				"anthropic/claude-3-haiku",
				"meta-llama/llama-3.1-8b-instruct",
				"meta-llama/llama-3.1-70b-instruct",
				"google/gemini-pro-1.5",
				"mistralai/mistral-7b-instruct",
				"qwen/qwen-2.5-72b-instruct",
				"microsoft/wizardlm-2-8x22b",
			].sort();

			console.log("OpenRouter: Using fallback models:", fallbackModels.length);
			return fallbackModels;
		}
	}

	// Enhanced method to get models with metadata for filtering
	static async listModelsWithMetadata(
		apiKey?: string,
		customUrl?: string,
	): Promise<OpenRouterModel[]> {
		// Create a minimal settings object for the unified API request
		const settings: AppSettings = {
			selectedProvider: "openrouter",
			model: "",
			apiKeys: { openrouter: apiKey || "" },
			customUrls: customUrl ? { openrouter: customUrl } : {},
		} as AppSettings;

		try {
			const response = await apiRequest("/models", "openrouter", settings);
			const data = await response.json();

			if (!data.data || !Array.isArray(data.data)) {
				console.error("OpenRouter Metadata: Invalid response format:", data);
				return [];
			}

			const filteredModels = (data.data as OpenRouterModel[])
				.filter((model) => {
					if (!model.id) return false;

					const modelName = model.id.toLowerCase();
					return (
						!modelName.includes("embed") &&
						!modelName.includes("rerank") &&
						!modelName.includes("moderation") &&
						model.architecture?.modality === "text"
					);
				})
				.sort((a, b) => a.id.localeCompare(b.id));

			console.log(
				"OpenRouter Metadata: Filtered models with metadata:",
				filteredModels.length,
			);
			return filteredModels;
		} catch (error) {
			console.error("OpenRouter models metadata fetch error:", error);
			return [];
		}
	}

	async *generate(
		messages: LLMMessage[],
		options: {
			model: string;
			temperature?: number;
			maxTokens?: number;
			topP?: number;
		},
		apiKey?: string,
		signal?: AbortSignal,
		customUrl?: string,
	): AsyncGenerator<string, void, unknown> {
		const baseUrl = customUrl || "https://openrouter.ai";

		if (!apiKey) {
			throw new Error("OpenRouter API key is required");
		}

		// Convert messages to OpenAI format
		const openAIMessages = messages.map((msg) => ({
			role: msg.role,
			content: msg.content,
		}));

		const requestBody = {
			model: options.model,
			messages: openAIMessages,
			temperature: options.temperature ?? 0.7,
			max_tokens: options.maxTokens ?? 4000,
			top_p: options.topP ?? 1,
			stream: true,
		};

		const response = await fetch(`${baseUrl}/api/v1/chat/completions`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				"HTTP-Referer":
					typeof window !== "undefined"
						? window.location.origin
						: "https://superpowers-extension",
				"X-Title": "Superpowers AI Extension",
			},
			body: JSON.stringify(requestBody),
			signal,
		});

		if (!response.ok) {
			const errorText = await response.text();
			if (response.status === 401) {
				throw new Error(
					"Invalid OpenRouter API key. Please check your API key.",
				);
			}
			if (response.status === 402) {
				throw new Error("Insufficient credits in your OpenRouter account.");
			}
			if (response.status === 429) {
				throw new Error("Rate limit exceeded. Please try again later.");
			}
			throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
		}

		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error("Failed to get response reader");
		}

		const decoder = new TextDecoder();
		let buffer = "";

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() || "";

				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed || !trimmed.startsWith("data: ")) continue;

					const data = trimmed.slice(6);
					if (data === "[DONE]") return;

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
		} finally {
			reader.releaseLock();
		}
	}
}
