import type { AppSettings, LLMProvider } from "../types";
import { PROVIDERS } from "../utils/providers";

/**
 * Unified API request function that matches the reference implementation
 * This is the key missing piece - all providers use the same request method
 */
export async function apiRequest(
	endpoint: string,
	provider: LLMProvider,
	settings: AppSettings,
	method: string = "GET",
	body?: any,
	additionalHeaders: Record<string, string> = {},
): Promise<Response> {
	// Get provider configuration
	const providerInfo = PROVIDERS[provider];
	if (!providerInfo) {
		throw new Error(`Unknown provider: ${provider}`);
	}

	// Get API key if required
	let apiKey: string | undefined;
	if (providerInfo.requiresApiKey) {
		apiKey = settings.apiKeys[provider];
		if (!apiKey) {
			throw new Error(
				`API key is required for ${providerInfo.label} but none is provided.`,
			);
		}
	}

	// Get base URL (custom URL or default)
	const baseUrl = settings.customUrls?.[provider] || providerInfo.defaultUrl;
	if (!baseUrl) {
		throw new Error(`No URL configured for ${providerInfo.label}`);
	}

	// Get API endpoint prefix
	const apiPrefix = providerInfo.apiEndpointPrefix || "";

	// Construct the full URL exactly like the reference implementation
	// Make sure we don't have double slashes between prefix and endpoint
	const apiEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

	// Special case: if endpoint already contains a full path (like /api/tags for Ollama), don't add prefix
	const fullUrl = endpoint.startsWith("/api/")
		? `${baseUrl}${apiEndpoint}`
		: `${baseUrl}${apiPrefix}${apiEndpoint}`;

	console.log(`API Request for ${provider}:`, {
		baseUrl,
		apiPrefix,
		endpoint: apiEndpoint,
		fullUrl,
		hasApiKey: !!apiKey,
		method,
	});

	// Prepare headers
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...additionalHeaders,
	};

	// Add authorization header if API key is available
	if (apiKey) {
		headers["Authorization"] = `Bearer ${apiKey}`;
	}

	// Add provider-specific headers
	if (provider === "openrouter") {
		headers["HTTP-Referer"] =
			typeof window !== "undefined"
				? window.location.origin
				: "https://superpowers-extension";
		headers["X-Title"] = "Superpowers AI Extension";
	}

	// Create request options
	const options: RequestInit = {
		method,
		headers,
	};

	if (body && method !== "GET") {
		options.body = JSON.stringify(body);
	}

	try {
		const response = await fetch(fullUrl, options);

		console.log(`API Response for ${provider}:`, {
			status: response.status,
			statusText: response.statusText,
			ok: response.ok,
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`API Error for ${provider}:`, {
				status: response.status,
				details: errorText,
			});

			// Provider-specific error handling
			if (provider === "openrouter") {
				if (response.status === 401) {
					throw new Error(
						"Invalid OpenRouter API key. Please check your API key in settings.",
					);
				}
				if (response.status === 402) {
					throw new Error("Insufficient credits in your OpenRouter account.");
				}
				if (response.status === 429) {
					throw new Error(
						"OpenRouter rate limit exceeded. Please try again later.",
					);
				}
			}

			// Try to extract JSON error details if available
			try {
				const errorJson = JSON.parse(errorText);
				if (errorJson.error) {
					throw new Error(
						`${providerInfo.label} API error: ${errorJson.error.message || errorJson.error}`,
					);
				}
			} catch (e) {
				// Not valid JSON, continue with text error
			}

			throw new Error(
				`${providerInfo.label} API error (${response.status}): ${errorText}`,
			);
		}

		return response;
	} catch (error) {
		console.error(`API Request failed for ${provider}:`, error);
		throw error;
	}
}

/**
 * Fetch models for any provider using the unified API request
 */
export async function fetchModelsForProvider(
	provider: LLMProvider,
	settings: AppSettings,
): Promise<string[]> {
	const providerInfo = PROVIDERS[provider];
	if (!providerInfo) {
		throw new Error(`Unknown provider: ${provider}`);
	}

	// Special case: Gemini uses native SDK, not API calls
	if (provider === "gemini") {
		console.log("Gemini: Using predefined model list (native SDK)");
		return [
			"gemini-2.0-flash",
			"gemini-1.5-flash-latest",
			"gemini-1.5-flash-8b-latest",
			"gemini-1.5-pro-latest",
			"gemini-1.0-pro-latest",
		];
	}

	// Use the modelsEndpoint from provider config
	const endpoint = providerInfo.modelsEndpoint || "/models";

	console.log(`Fetching models for ${provider} using endpoint: ${endpoint}`);

	try {
		const response = await apiRequest(endpoint, provider, settings);
		const data = await response.json();

		console.log(`Raw models response for ${provider}:`, {
			hasData: !!data.data,
			dataLength: data.data?.length || 0,
			dataType: typeof data.data,
			firstModel: data.data?.[0]?.id || data.data?.[0]?.name || "none",
			sampleData: data.data?.slice(0, 3),
		});

		let models: string[] = [];

		if (provider === "ollama") {
			// Ollama format: { models: [{ name: "model-name" }] }
			if (data.models && Array.isArray(data.models)) {
				models = data.models
					.map((model: any) => model.name)
					.filter((name: string) => name && typeof name === "string")
					.sort();
			}
		} else {
			// OpenAI format: { data: [{ id: "model-name" }] }
			if (data.data && Array.isArray(data.data)) {
				models = data.data
					.filter((model: any) => {
						if (!model.id) return false;

						const modelName = model.id.toLowerCase();
						// Filter out embedding and reranking models
						return (
							!modelName.includes("embed") &&
							!modelName.includes("rerank") &&
							!modelName.includes("moderation")
						);
					})
					.map((model: any) => model.id)
					.sort();
			}
		}

		console.log(`Processed models for ${provider}:`, {
			count: models.length,
			first5: models.slice(0, 5),
		});

		return models;
	} catch (error) {
		console.error(`Failed to fetch models for ${provider}:`, error);

		// Return fallback models based on provider
		const fallbackModels = getFallbackModels(provider);
		console.log(
			`Using fallback models for ${provider}:`,
			fallbackModels.length,
		);
		return fallbackModels;
	}
}

/**
 * Get fallback models for each provider
 */
function getFallbackModels(provider: LLMProvider): string[] {
	switch (provider) {
		case "openrouter":
			return [
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

		case "ollama":
			return [
				"llama3.2:latest",
				"llama3.1:latest",
				"mistral:latest",
				"codellama:latest",
				"phi3:latest",
			].sort();

		case "gemini":
			return ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"].sort();

		default:
			return [];
	}
}
