chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.type === "CLOSE_SIDEBAR") {
		window.close();
		sendResponse({ success: true });
	}
});

window.addEventListener("DOMContentLoaded", () => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const tabId = tabs[0]?.id;
		if (tabId) {
			chrome.runtime.sendMessage({ type: "SIDEBAR_LOADED", tabId });
		}
	});
});
