import type { AppSettings, LLMProvider } from "../types";
import { PROVIDERS } from "../utils/providers";

export interface ValidationResult {
	isValid: boolean;
	error?: string;
	suggestion?: string;
}

export function validateProvider(
	provider: LLMProvider,
	settings: AppSettings,
): ValidationResult {
	const providerInfo = PROVIDERS[provider];

	if (!providerInfo) {
		return {
			isValid: false,
			error: `Unknown provider: ${provider}`,
			suggestion: "Please select a valid provider from the settings.",
		};
	}

	// Check if API key is required
	if (providerInfo.requiresApiKey) {
		const apiKey = settings.apiKeys[provider];

		if (!apiKey || apiKey.trim() === "") {
			return {
				isValid: false,
				error: `${providerInfo.label} requires an API key`,
				suggestion: `Please add your ${providerInfo.label} API key in settings. ${providerInfo.notes || ""}`,
			};
		}

		// Validate API key format if specified
		if (providerInfo.apiKeyFormat && providerInfo.apiKeyFormat !== "N/A") {
			const isValidFormat = validateApiKeyFormat(
				apiKey,
				providerInfo.apiKeyFormat,
			);
			if (!isValidFormat) {
				return {
					isValid: false,
					error: `Invalid ${providerInfo.label} API key format`,
					suggestion: `API key should match format: ${providerInfo.apiKeyFormat}`,
				};
			}
		}
	}

	// Check if model is selected
	if (!settings.model || settings.model.trim() === "") {
		return {
			isValid: false,
			error: "No model selected",
			suggestion: `Please select a model for ${providerInfo.label} in settings.`,
		};
	}

	// For local providers, check if URL is accessible (basic validation)
	if (providerInfo.isLocal) {
		const customUrl =
			settings.customUrls?.[provider] || providerInfo.defaultUrl;
		if (!customUrl || !isValidUrl(customUrl)) {
			return {
				isValid: false,
				error: `Invalid ${providerInfo.label} URL`,
				suggestion: `Please check that ${providerInfo.label} is running and the URL is correct. ${providerInfo.notes || ""}`,
			};
		}
	}

	return { isValid: true };
}

export function getProviderErrorMessage(
	provider: LLMProvider,
	settings: AppSettings,
): string {
	const validation = validateProvider(provider, settings);

	if (validation.isValid) {
		return "";
	}

	const providerInfo = PROVIDERS[provider];
	let message = validation.error || "Unknown error";

	if (validation.suggestion) {
		message += `\n\n${validation.suggestion}`;
	}

	// Add provider-specific help
	if (providerInfo?.apiKeyUrl) {
		message += `\n\nGet your API key: ${providerInfo.apiKeyUrl}`;
	}

	return message;
}

export function getRecommendedProvider(
	settings: AppSettings,
): LLMProvider | null {
	// Try providers in order of preference
	const preferredOrder: LLMProvider[] = ["ollama", "gemini", "openrouter"];

	for (const provider of preferredOrder) {
		const validation = validateProvider(provider, settings);
		if (validation.isValid) {
			return provider;
		}
	}

	return null;
}

export function canAutoFallback(
	_fromProvider: LLMProvider,
	toProvider: LLMProvider,
	settings: AppSettings,
): boolean {
	// Only auto-fallback to local providers or providers with API keys
	const validation = validateProvider(toProvider, settings);
	return validation.isValid;
}

function validateApiKeyFormat(apiKey: string, format: string): boolean {
	// Basic format validation
	switch (format) {
		case "AIza...":
			return apiKey.startsWith("AIza") && apiKey.length > 10;
		case "sk-or-...":
			return apiKey.startsWith("sk-or-") && apiKey.length > 20;
		case "sk-...":
			return apiKey.startsWith("sk-") && apiKey.length > 20;
		case "gsk_...":
			return apiKey.startsWith("gsk_") && apiKey.length > 20;
		case "N/A":
			return true;
		default:
			return apiKey.length > 5; // Basic length check
	}
}

function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

export function getProviderSetupInstructions(provider: LLMProvider): string {
	const providerInfo = PROVIDERS[provider];
	if (!providerInfo) return "";

	let instructions = `## ${providerInfo.label} Setup\n\n`;

	if (providerInfo.requiresApiKey) {
		instructions += `1. **Get API Key**: ${providerInfo.apiKeyUrl ? `Visit ${providerInfo.apiKeyUrl}` : "Get your API key from the provider"}\n`;
		instructions += `2. **Format**: ${providerInfo.apiKeyFormat}\n`;
		instructions += `3. **Add to Settings**: Paste your API key in the extension settings\n\n`;
	}

	if (providerInfo.isLocal) {
		instructions += `1. **Install**: Download and install ${providerInfo.label}\n`;
		instructions += `2. **Start Server**: Ensure the server is running on ${providerInfo.defaultUrl}\n`;
		instructions += `3. **Test Connection**: The extension will automatically detect when it's available\n\n`;
	}

	if (providerInfo.notes) {
		instructions += `**Note**: ${providerInfo.notes}\n\n`;
	}

	return instructions;
}
