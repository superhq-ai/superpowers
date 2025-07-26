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
};

export const PROVIDERS: Record<LLMProvider, ProviderInfo> = {
	gemini: {
		label: "Gemini",
		apiKeyUrl: "https://makersuite.google.com/app/apikey",
		requiresApiKey: true,
		isLocal: false,
		supportsModelRefresh: false,
		supportsCustomModels: false,
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
	},
};
