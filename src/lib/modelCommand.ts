import { listModels } from "../services/llm";
import type { AppSettings, LLMProvider } from "../types";
import { PROVIDERS } from "../utils/providers";

export interface ModelCommandResult {
	type: "success" | "error" | "info";
	message: string;
	modelChanged?: boolean;
	newModel?: string;
}

export async function handleModelCommand(
	action: string | undefined,
	currentSettings: AppSettings,
	updateSettings: (settings: Partial<AppSettings>) => void,
): Promise<ModelCommandResult> {
	const provider = currentSettings.selectedProvider;
	const currentModel = currentSettings.model;

	// No action - show current model and available models
	if (!action || action.trim() === "") {
		try {
			const models = await getAvailableModels(provider, currentSettings);
			const modelList =
				models.slice(0, 10).join(", ") + (models.length > 10 ? "..." : "");

			return {
				type: "info",
				message: `**Current Model:** ${currentModel}\n\n**Available Models (${provider}):**\n${modelList}\n\nUse \`/model <name>\` to switch models.`,
			};
		} catch (error) {
			return {
				type: "error",
				message: `Failed to fetch available models: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	const actionLower = action.toLowerCase().trim();

	// List all available models
	if (actionLower === "list") {
		try {
			const models = await getAvailableModels(provider, currentSettings);
			const modelList = models.map((model) => `• ${model}`).join("\n");

			return {
				type: "info",
				message: `**Available Models for ${PROVIDERS[provider].label}:**\n\n${modelList}\n\nUse \`/model <name>\` to switch to a specific model.`,
			};
		} catch (error) {
			return {
				type: "error",
				message: `Failed to fetch models: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	// Refresh models (for providers that support it)
	if (actionLower === "refresh") {
		if (!PROVIDERS[provider]?.supportsModelRefresh) {
			return {
				type: "error",
				message: `${PROVIDERS[provider].label} doesn't support model refresh. Models are predefined.`,
			};
		}

		try {
			// Clear cache and fetch fresh models
			const cacheKey = getCacheKey(provider, currentSettings);
			const newCache = { ...currentSettings.modelCache };
			delete newCache[cacheKey];

			updateSettings({ modelCache: newCache });

			const models = await getAvailableModels(provider, currentSettings, true);

			return {
				type: "success",
				message: `Refreshed models for ${PROVIDERS[provider].label}. Found ${models.length} models.`,
			};
		} catch (error) {
			return {
				type: "error",
				message: `Failed to refresh models: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	// Switch to specific model
	try {
		const models = await getAvailableModels(provider, currentSettings);

		// Exact match
		if (models.includes(action)) {
			updateSettings({ model: action });
			return {
				type: "success",
				message: `Switched to model: **${action}**`,
				modelChanged: true,
				newModel: action,
			};
		}

		// Fuzzy match
		const fuzzyMatches = models.filter(
			(model) =>
				model.toLowerCase().includes(actionLower) ||
				actionLower.includes(model.toLowerCase()),
		);

		if (fuzzyMatches.length === 1) {
			const matchedModel = fuzzyMatches[0];
			updateSettings({ model: matchedModel });
			return {
				type: "success",
				message: `Switched to model: **${matchedModel}**`,
				modelChanged: true,
				newModel: matchedModel,
			};
		}

		if (fuzzyMatches.length > 1) {
			const matchList = fuzzyMatches.slice(0, 5).join(", ");
			return {
				type: "error",
				message: `Multiple models match "${action}": ${matchList}. Please be more specific.`,
			};
		}

		// No match - suggest adding as custom model for supported providers
		if (PROVIDERS[provider]?.supportsCustomModels) {
			// Add as custom model
			const customModels = currentSettings.customModels?.[provider] || [];
			if (!customModels.includes(action)) {
				const newCustomModels = [...customModels, action].sort();

				// Clear cache to force refresh with new model
				const cacheKey = getCacheKey(provider, currentSettings);
				const newCache = { ...currentSettings.modelCache };
				delete newCache[cacheKey];

				updateSettings({
					customModels: {
						...currentSettings.customModels,
						[provider]: newCustomModels,
					},
					model: action,
					modelCache: newCache,
				});

				return {
					type: "success",
					message: `Added and switched to custom model: **${action}**`,
					modelChanged: true,
					newModel: action,
				};
			} else {
				updateSettings({ model: action });
				return {
					type: "success",
					message: `Switched to custom model: **${action}**`,
					modelChanged: true,
					newModel: action,
				};
			}
		}

		// Model not found and can't add custom
		const availableList = models.slice(0, 5).join(", ");
		return {
			type: "error",
			message: `Model "${action}" not found. Available models: ${availableList}${models.length > 5 ? "..." : ""}`,
		};
	} catch (error) {
		return {
			type: "error",
			message: `Failed to switch model: ${error instanceof Error ? error.message : "Unknown error"}`,
		};
	}
}

async function getAvailableModels(
	provider: LLMProvider,
	settings: AppSettings,
	skipCache: boolean = false,
): Promise<string[]> {
	// Check cache first (unless skipping)
	if (!skipCache) {
		const cacheKey = getCacheKey(provider, settings);
		const cache = settings.modelCache?.[cacheKey];
		const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

		if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
			return cache.models;
		}
	}

	// Fetch from API
	const apiKey = settings.apiKeys[provider];
	const customUrl = settings.customUrls?.[provider];

	const apiModels = await listModels(provider, apiKey, customUrl);
	const customModels = settings.customModels?.[provider] || [];

	return [...new Set([...apiModels, ...customModels])].sort();
}

function getCacheKey(provider: LLMProvider, settings: AppSettings): string {
	const apiKey = settings.apiKeys[provider] || "";
	const customUrl =
		settings.customUrls?.[provider] || PROVIDERS[provider]?.defaultUrl || "";
	return `${provider}-${customUrl}-${apiKey.slice(0, 8)}`;
}
