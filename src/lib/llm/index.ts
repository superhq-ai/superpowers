import type { LLMMessage, LLMProvider, UseLLMOptions } from "../../types";
import { GeminiProvider } from "./gemini.js";
import { OllamaProvider } from "./ollama.js";
import { OpenRouterProvider } from "./openrouter";

export interface LLM {
	generate(
		messages: LLMMessage[],
		options: UseLLMOptions,
		apiKey: string,
		signal?: AbortSignal,
		customUrl?: string,
	): AsyncGenerator<string>;
}

export interface LLMProviderConstructor {
	new (): LLM;
	listModels(apiKey?: string, customUrl?: string): Promise<string[]>;
}

export function getLlmProvider(provider: LLMProvider): LLMProviderConstructor {
	switch (provider) {
		case "gemini":
			return GeminiProvider;
		case "ollama":
			return OllamaProvider;
		case "openrouter":
			return OpenRouterProvider;
		default:
			throw new Error(`Unknown LLM provider: ${provider}`);
	}
}

export function getLlm(provider: LLMProvider): LLM {
	const LlmProvider = getLlmProvider(provider);
	return new LlmProvider();
}
