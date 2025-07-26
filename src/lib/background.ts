import { RUNTIME_MESSAGES } from "../constants";
import type { BrowserActionResult } from "../types/browser";
import { browserActions } from "./browser-actions";
import { listenForConnections } from "./llm-service";
import initSidebar from "./sidebar";

listenForConnections();
initSidebar();

// Combined message listener
chrome.runtime.onMessage.addListener(
	(
		request: { type: string; data?: any; tabId?: number },
		sender: chrome.runtime.MessageSender,
		sendResponse: (response?: unknown) => void,
	) => {
		const { type, data } = request;
		const action = browserActions[type as keyof typeof browserActions];

		if (action) {
			action(data)
				.then((result: BrowserActionResult) => sendResponse(result))
				.catch((error: Error) => sendResponse({ error: error.message }));
			return true; // Indicates that the response is sent asynchronously
		}

		switch (type) {
			case "tabTitleUpdated":
				if (sender.tab) {
					const { title, url } = data;
					const tabId = sender.tab.id;
					console.log("Title updated from content script:", {
						url,
						title,
						tabId,
					});
					chrome.runtime.sendMessage({
						type: RUNTIME_MESSAGES.SET_CONTEXT,
						data: { url, title, tabId },
					});
				}
				sendResponse({ success: true });
				return true;

			default:
				// Optional: handle unknown actions
				// sendResponse({ error: "Unknown action" });
				return false;
		}
	},
);

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
