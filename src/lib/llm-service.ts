import type { AppSettings, BackgroundRequest } from "../types";
import { PROVIDERS } from "../utils/providers";
import { ConfigError } from "./errors";
import { getLlm } from "./llm";

export function listenForConnections() {
	chrome.runtime.onConnect.addListener((port) => {
		if (port.name !== "llm") return;

		const abortController = new AbortController();

		port.onDisconnect.addListener(() => {
			abortController.abort();
		});

		port.onMessage.addListener(async (request: BackgroundRequest) => {
			const { messages, options } = request;

			try {
				const { settings } = (await chrome.storage.sync.get("settings")) as {
					settings: AppSettings;
				};

				if (!settings) {
					throw new ConfigError(
						"Settings not configured. Please set your API key in the settings.",
					);
				}

				if (!settings.selectedProvider || !settings.model) {
					throw new ConfigError("LLM provider or model not configured.");
				}

				const provider = PROVIDERS[settings.selectedProvider];
				const apiKey = settings.apiKeys[settings.selectedProvider];

				// Check if API key is required for this provider
				if (provider?.requiresApiKey && !apiKey) {
					throw new ConfigError(`API key is required for ${provider.label}.`);
				}

				// Get custom URL if available
				const customUrl = settings.customUrls?.[settings.selectedProvider];

				const llm = getLlm(settings.selectedProvider);
				const stream = llm.generate(
					messages,
					options,
					apiKey || "",
					abortController.signal,
					customUrl,
				);

				for await (const chunk of stream) {
					port.postMessage({ type: "stream", content: chunk });
				}

				port.postMessage({ type: "done" });
			} catch (error) {
				if ((error as Error).name === "AbortError") {
					return;
				}
				const err = error as Error;
				port.postMessage({ type: "error", error: err.message });
			}
		});
	});
}
