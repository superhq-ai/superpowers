import { SIDEBAR_MESSAGES, SIDEBAR_STATE } from "./sidebar-manager";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.type === SIDEBAR_MESSAGES.CLOSE) {
		window.close();
		sendResponse({ success: true });
	}
});

window.addEventListener("DOMContentLoaded", () => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const tabId = tabs[0]?.id;
		if (tabId) {
			chrome.runtime.sendMessage({ type: SIDEBAR_STATE.LOADED, tabId });
		}
	});
});

window.addEventListener("beforeunload", () => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const tabId = tabs[0]?.id;
		if (tabId) {
			chrome.runtime.sendMessage({ type: SIDEBAR_STATE.CLOSED, tabId });
		}
	});
});
