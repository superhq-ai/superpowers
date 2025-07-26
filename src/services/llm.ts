import { fetchModelsForProvider } from "../lib/apiRequest";
import type {
	AppSettings,
	BackgroundRequest,
	BackgroundResponse,
	LLMMessage,
	LLMProvider,
	UseLLMOptions,
} from "../types";

export async function listModels(
	provider: LLMProvider,
	apiKey?: string,
	customUrl?: string,
) {
	// Create a minimal settings object for the unified API request
	const settings: AppSettings = {
		selectedProvider: provider,
		model: "",
		apiKeys: { [provider]: apiKey || "" },
		customUrls: customUrl ? { [provider]: customUrl } : {},
	} as AppSettings;

	// Use the unified API request function
	return fetchModelsForProvider(provider, settings);
}

export function streamLlm(
	messages: LLMMessage[],
	options: UseLLMOptions,
): ReadableStream<string> {
	let port: chrome.runtime.Port;
	return new ReadableStream({
		start(controller) {
			port = chrome.runtime.connect({ name: "llm" });
			let isClosed = false;

			const closeStream = () => {
				if (!isClosed) {
					isClosed = true;
					controller.close();
					port.disconnect();
				}
			};

			port.onMessage.addListener((response: BackgroundResponse) => {
				switch (response.type) {
					case "stream":
						controller.enqueue(response.content);
						break;
					case "error":
						controller.error(new Error(response.error));
						break;
					case "done":
						closeStream();
						break;
				}
			});

			port.onDisconnect.addListener(() => {
				closeStream();
			});

			const request: BackgroundRequest = { messages, options };
			port.postMessage(request);
		},
		cancel() {
			if (port) {
				port.disconnect();
			}
		},
	});
}
