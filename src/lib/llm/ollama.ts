import OpenAI from "openai";
import type { LLMMessage, UseLLMOptions } from "../../types";
import { ProviderApiError } from "../errors";
import type { LLM } from "./index";

export class OllamaProvider implements LLM {
	static async listModels(
		_apiKey?: string,
		customUrl?: string,
	): Promise<string[]> {
		const baseUrl = customUrl || "http://localhost:11434";

		try {
			// Use Ollama's native /api/tags endpoint
			const response = await fetch(`${baseUrl}/api/tags`);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch models from Ollama: ${response.status} ${response.statusText}`,
				);
			}

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

		const openai = new OpenAI({
			apiKey: apiKey || "ollama",
			baseURL: `${baseUrl}/v1`,
		});

		// Convert messages to OpenAI format
		const openAIMessages = messages.map((msg) => {
			switch (msg.role) {
				case "system":
				case "assistant":
				case "user":
					return {
						role: msg.role,
						content: msg.content,
					};
				case "tool":
					return {
						role: msg.role,
						content: msg.content,
						tool_call_id: msg.tool_call_id || "",
					};
				default:
					throw new Error(`Unknown message role: ${msg.role}`);
			}
		});

		try {
			const stream = await openai.chat.completions.create(
				{
					model: options.model,
					messages: openAIMessages,
					stream: true,
					temperature: options.temperature || 0.7,
					max_tokens: options.maxTokens,
					top_p: options.topP,
				},
				{ signal },
			);

			for await (const chunk of stream) {
				const content = chunk.choices[0]?.delta?.content;
				if (content) {
					yield content;
				}
			}
		} catch (err) {
			const error = err as Error;

			if (error.name === "AbortError") {
				throw new ProviderApiError("Request was cancelled");
			}

			// Handle connection errors
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
