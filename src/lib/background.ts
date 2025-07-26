import { RUNTIME_MESSAGES } from "../constants";
import type { BrowserActionResult } from "../types/browser";
import { browserActions } from "./browser-actions";
import { fetchLlmsFiles, listenForConnections } from "./llm-service";
import initSidebar from "./sidebar";
import { StorageOptimizer } from "./storageOptimizer";

listenForConnections();
initSidebar();

function handleRuntimeMessage(
	request: { type: string; data?: any; tabId?: number },
	_sender: chrome.runtime.MessageSender,
	sendResponse: (response?: unknown) => void,
): boolean {
	const { type, data } = request;
	const action = browserActions[type as keyof typeof browserActions];

	if (action) {
		action(data)
			.then((result: BrowserActionResult) => sendResponse(result))
			.catch((error: Error) => sendResponse({ error: error.message }));
		return true; // Indicates that the response is sent asynchronously
	} else if (type === RUNTIME_MESSAGES.FETCH_LLMS) {
		fetchLlmsFiles(data.url)
			.then(
				(
					result: { llms: string; llmsFull: string } | { error: string } | null,
				) => sendResponse(result),
			)
			.catch((error: Error) => sendResponse({ error: error.message }));
		return true;
	}

	sendResponse({ error: "Unknown action" });
	return false;
}

chrome.runtime.onMessage.addListener(handleRuntimeMessage);

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
	const tab = await chrome.tabs.get(tabId);
	const url = tab.url || "chrome://newtab/";
	const title = tab.title || "New Tab";

	chrome.runtime.sendMessage({
		type: RUNTIME_MESSAGES.SET_CONTEXT,
		data: { url, title, tabId },
	});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.active && changeInfo.status === "complete") {
		const url = tab.url || "chrome://newtab/";
		const title = tab.title || "New Tab";

		chrome.runtime.sendMessage({
			type: RUNTIME_MESSAGES.SET_CONTEXT,
			data: { url, title, tabId },
		});
	}
});

// Initialize storage optimization
StorageOptimizer.initialize().catch(console.error);
