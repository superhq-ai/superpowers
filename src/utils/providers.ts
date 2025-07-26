import type { LLMProvider } from "../types";

type ProviderInfo = {
	label: string;
	apiKeyUrl?: string;
	defaultUrl?: string;
	requiresApiKey?: boolean;
	isLocal?: boolean;
	supportsModelRefresh?: boolean;
	supportsCustomModels?: boolean;
	modelsEndpoint?: string;
	apiEndpointPrefix?: string;
	apiKeyFormat?: string;
	notes?: string;
};

export const PROVIDERS: Record<LLMProvider, ProviderInfo> = {
	gemini: {
		label: "Gemini",
		apiKeyUrl: "https://makersuite.google.com/app/apikey",
		requiresApiKey: true,
		isLocal: false,
		supportsModelRefresh: false,
		supportsCustomModels: false,
		apiKeyFormat: "AIza...",
		notes: "Get your API key from Google AI Studio",
		// No defaultUrl - uses native Google AI SDK
		// No modelsEndpoint - uses hardcoded model list
	},
	ollama: {
		label: "Ollama (Local)",
		defaultUrl: "http://localhost:11434",
		requiresApiKey: false,
		isLocal: true,
		supportsModelRefresh: true,
		supportsCustomModels: true,
		modelsEndpoint: "/api/tags",
		apiEndpointPrefix: "/v1",
		apiKeyFormat: "N/A",
		notes: "Ensure Ollama server is running locally",
	},
	openrouter: {
		label: "OpenRouter.ai",
		defaultUrl: "https://openrouter.ai",
		apiKeyUrl: "https://openrouter.ai/keys",
		requiresApiKey: true,
		isLocal: false,
		supportsModelRefresh: true,
		supportsCustomModels: false,
		modelsEndpoint: "/models", // Just the endpoint, prefix will be added
		apiEndpointPrefix: "/api/v1",
		apiKeyFormat: "sk-or-...",
		notes: "Requires an OpenRouter API key for access to multiple AI models",
	},
};
