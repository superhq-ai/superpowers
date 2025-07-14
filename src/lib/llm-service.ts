import type { AppSettings, BackgroundRequest } from "../types";
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

				const apiKey = settings.apiKeys[settings.selectedProvider];

				if (!apiKey) {
					throw new ConfigError(
						"API key not found for the selected provider.",
					);
				}

				const llm = getLlm(settings.selectedProvider);
				const stream = llm.generate(
					messages,
					options,
					apiKey,
					abortController.signal,
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
