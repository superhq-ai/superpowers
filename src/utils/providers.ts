import type { LLMProvider } from "../types";

type ProviderInfo = {
	label: string;
	apiKeyUrl: string;
};

export const PROVIDERS: Record<LLMProvider, ProviderInfo> = {
	gemini: {
		label: "Gemini",
		apiKeyUrl: "https://makersuite.google.com/app/apikey",
	},
};
