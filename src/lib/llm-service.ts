import type { AppSettings, BackgroundRequest } from "../types";
import { ConfigError } from "./errors";
import { getLlm } from "./llm";
import {
	getProviderErrorMessage,
	validateProvider,
} from "./providerValidation";

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
						"Settings not configured. Please configure your AI provider in the extension settings.",
					);
				}

				if (!settings.selectedProvider) {
					throw new ConfigError(
						"No AI provider selected. Please select a provider in settings.",
					);
				}

				// Comprehensive provider validation
				const validation = validateProvider(
					settings.selectedProvider,
					settings,
				);
				if (!validation.isValid) {
					const errorMessage = getProviderErrorMessage(
						settings.selectedProvider,
						settings,
					);
					throw new ConfigError(errorMessage);
				}

				// Get provider details
				const apiKey = settings.apiKeys[settings.selectedProvider];
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

/**
 * Fetches the llms.txt and llms-full.txt from the given url
 * @param url The url to fetch the files from
 * @returns The content of the files or an error
 */
export async function fetchLlmsFiles(url: string) {
	try {
		const llmsUrl = new URL("llms.txt", url).toString();
		const llmsFullUrl = new URL("llms-full.txt", url).toString();

		const [llmsResponse, llmsFullResponse] = await Promise.all([
			fetch(llmsUrl),
			fetch(llmsFullUrl),
		]);

		if (!llmsResponse.ok && !llmsFullResponse.ok) {
			return null;
		}

		const llmsData = llmsResponse.ok ? await llmsResponse.text() : "";
		const llmsFullData = llmsFullResponse.ok
			? await llmsFullResponse.text()
			: "";

		return {
			llms: llmsData,
			llmsFull: llmsFullData,
		};
	} catch (error) {
		console.error("Error fetching llms files:", error);
		return { error: (error as Error).message };
	}
}
