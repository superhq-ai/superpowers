import { useCallback, useEffect, useState } from "react";
import { StorageOptimizer } from "../lib/storageOptimizer";
import { listModels } from "../services/llm";
import type { AppSettings, LLMProvider } from "../types";
import { PROVIDERS } from "../utils/providers";

interface UseModelsReturn {
	models: string[];
	isLoading: boolean;
	error: string | null;
	refreshModels: () => Promise<void>;
	addCustomModel: (model: string) => void;
	removeCustomModel: (model: string) => void;
}

const MODEL_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useModels(
	provider: LLMProvider,
	settings: AppSettings,
): UseModelsReturn {
	const [models, setModels] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const getCacheKey = useCallback(() => {
		const apiKey = settings.apiKeys[provider] || "";
		const customUrl =
			settings.customUrls?.[provider] || PROVIDERS[provider]?.defaultUrl || "";
		return `${provider}-${customUrl}-${apiKey.slice(0, 8)}`;
	}, [provider, settings]);

	const getFromCache = useCallback(async () => {
		const cacheKey = getCacheKey();
		const cache = await StorageOptimizer.getModelCache();
		const cacheEntry = cache[cacheKey];

		if (
			cacheEntry &&
			Date.now() - cacheEntry.timestamp < MODEL_CACHE_DURATION
		) {
			return cacheEntry.models;
		}
		return null;
	}, [getCacheKey]);

	const saveToCache = useCallback(
		async (models: string[]) => {
			const cacheKey = getCacheKey();
			const currentCache = await StorageOptimizer.getModelCache();
			const newCache = {
				...currentCache,
				[cacheKey]: {
					models,
					timestamp: Date.now(),
				},
			};

			await StorageOptimizer.saveModelCache(newCache);
		},
		[getCacheKey],
	);

	const refreshModels = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			// Check cache first
			const cachedModels = await getFromCache();
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

			// Add custom models for this provider
			const customModels = settings.customModels?.[provider] || [];
			const allModels = [
				...new Set([...fetchedModels, ...customModels]),
			].sort();

			setModels(allModels);
			await saveToCache(allModels);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to fetch models";
			setError(errorMessage);

			// Fallback to custom models if available
			const customModels = settings.customModels?.[provider] || [];
			if (customModels.length > 0) {
				setModels(customModels);
			} else {
				// Fallback to default models based on provider
				const fallbackModels = getFallbackModels(provider);
				setModels(fallbackModels);
			}
		} finally {
			setIsLoading(false);
		}
	}, [provider, settings, getFromCache, saveToCache]);

	const addCustomModel = useCallback(
		async (model: string) => {
			if (!model.trim()) return;

			const customModels = settings.customModels?.[provider] || [];
			if (customModels.includes(model)) return;

			const newCustomModels = [...customModels, model].sort();
			const newSettings = {
				...settings,
				customModels: {
					...settings.customModels,
					[provider]: newCustomModels,
				},
			};

			await chrome.storage.sync.set({ settings: newSettings });

			// Update local state immediately
			const allModels = [...new Set([...models, model])].sort();
			setModels(allModels);

			// Also update cache to include the new model
			const cacheKey = getCacheKey();
			const newCache = {
				...settings.modelCache,
				[cacheKey]: {
					models: allModels,
					timestamp: Date.now(),
				},
			};

			await chrome.storage.sync.set({
				settings: {
					...newSettings,
					modelCache: newCache,
				},
			});
		},
		[provider, settings, models, getCacheKey],
	);

	const removeCustomModel = useCallback(
		async (model: string) => {
			const customModels = settings.customModels?.[provider] || [];
			const newCustomModels = customModels.filter((m) => m !== model);

			const newSettings = {
				...settings,
				customModels: {
					...settings.customModels,
					[provider]: newCustomModels,
				},
			};

			await chrome.storage.sync.set({ settings: newSettings });

			// Update local state - only remove if it was a custom model
			if (customModels.includes(model)) {
				setModels((prev) => prev.filter((m) => m !== model));
			}
		},
		[provider, settings],
	);

	// Auto-refresh when provider or settings change
	useEffect(() => {
		refreshModels();
	}, [refreshModels]);

	// Also refresh when custom models change for this provider
	useEffect(() => {
		const customModels = settings.customModels?.[provider] || [];
		if (customModels.length > 0) {
			// Force refresh to include new custom models
			refreshModels();
		}
	}, [settings.customModels, provider, refreshModels]);

	return {
		models,
		isLoading,
		error,
		refreshModels,
		addCustomModel,
		removeCustomModel,
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
