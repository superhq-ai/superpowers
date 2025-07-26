import { useCallback, useEffect, useState } from "react";
import { listModels } from "../services/llm";
import type { AppSettings, LLMProvider } from "../types";
import { PROVIDERS } from "../utils/providers";

interface UseModelsReturn {
	models: string[];
	isLoading: boolean;
	error: string | null;
	refreshModels: () => Promise<void>;
}

const MODEL_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useModels(
	provider: LLMProvider,
	settings: AppSettings,
	onSettingsChange: (newSettings: Partial<AppSettings>) => void,
): UseModelsReturn {
	const [models, setModels] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const getCacheKey = useCallback(() => {
		const apiKey = settings.apiKeys[provider] || "";
		const customUrl =
			settings.customUrls?.[provider] || PROVIDERS[provider]?.defaultUrl || "";
		return `${provider}-${customUrl}-${apiKey.slice(0, 8)}`;
	}, [provider, settings.apiKeys, settings.customUrls]);

	const getFromCache = useCallback(
		(modelCache: typeof settings.modelCache) => {
			const cacheKey = getCacheKey();
			const cache = modelCache?.[cacheKey];

			if (cache && Date.now() - cache.timestamp < MODEL_CACHE_DURATION) {
				return cache.models;
			}
			return null;
		},
		[getCacheKey],
	);

	const refreshModels = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			// Check cache first - pass current cache to avoid dependency
			const cachedModels = getFromCache(settings.modelCache);
			if (cachedModels) {
				setModels(cachedModels);
				setIsLoading(false);
				return;
			}

			const apiKey = settings.apiKeys[provider];
			const customUrl = settings.customUrls?.[provider];

			// Check if provider requires API key
			const providerInfo = PROVIDERS[provider];
			if (providerInfo?.requiresApiKey && !apiKey) {
				throw new Error(`API key required for ${providerInfo.label}`);
			}

			const fetchedModels = await listModels(provider, apiKey, customUrl);

			const allModels = [...new Set([...fetchedModels])].sort();

			setModels(allModels);

			// Update cache
			const cacheKey = getCacheKey();
			const newCache = {
				...settings.modelCache,
				[cacheKey]: {
					models: allModels,
					timestamp: Date.now(),
				},
			};
			onSettingsChange({ modelCache: newCache });
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to fetch models";
			setError(errorMessage);

			// Fallback to default models based on provider
			const fallbackModels = getFallbackModels(provider);
			setModels(fallbackModels);
		} finally {
			setIsLoading(false);
		}
	}, [
		provider,
		settings.apiKeys,
		settings.customUrls,
		settings.modelCache,
		getFromCache,
		getCacheKey,
		onSettingsChange,
	]);

	useEffect(() => {
		refreshModels();
	}, [refreshModels]);

	return {
		models,
		isLoading,
		error,
		refreshModels,
	};
}

function getFallbackModels(provider: LLMProvider): string[] {
	switch (provider) {
		case "ollama":
			return [
				"llama3.2:latest",
				"llama3.1:latest",
				"llama3:latest",
				"mistral:latest",
				"codellama:latest",
				"phi3:latest",
			];
		case "gemini":
			return [
				"gemini-2.0-flash",
				"gemini-1.5-flash-latest",
				"gemini-1.5-pro-latest",
			];
		default:
			return [];
	}
}
