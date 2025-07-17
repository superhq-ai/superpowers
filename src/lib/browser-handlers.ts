import type { MessageType } from "../types/browser";

const sendMessageToBackground = (message: {
	type: MessageType;
	data?: any;
}): Promise<any> => {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage(message, (response) => {
			if (chrome.runtime.lastError) {
				return reject(chrome.runtime.lastError);
			}
			if (response?.error) {
				return reject(new Error(response.error));
			}
			resolve(response);
		});
	});
};

export const browserHandlers = {
	getCurrentTab: () => sendMessageToBackground({ type: "getCurrentTab" }),
	getPageContent: (args: { selector?: string }) =>
		sendMessageToBackground({ type: "getPageContent", data: args }),
	clickElement: (args: { selector: string }) =>
		sendMessageToBackground({ type: "clickElement", data: args }),
	fillInput: (args: { selector: string; value: string }) =>
		sendMessageToBackground({ type: "fillInput", data: args }),
	navigateToUrl: (args: { url: string }) =>
		sendMessageToBackground({ type: "navigateToUrl", data: args }),
	searchGoogle: (args: { query: string }) =>
		sendMessageToBackground({ type: "searchGoogle", data: args }),
	queryTabs: (args: { query: string }) =>
		sendMessageToBackground({ type: "queryTabs", data: args }),
	switchToTab: (args: { tabId: number }) => {
		return sendMessageToBackground({ type: "switchToTab", data: args });
	},
	listTabs: () => sendMessageToBackground({ type: "listTabs" }),
	historyNav: (args: { action: "back" | "forward" }) =>
		sendMessageToBackground({ type: "historyNav", data: args }),
	simulateKeyPress: (args: { selector: string; key: string }) =>
		sendMessageToBackground({ type: "simulateKeyPress", data: args }),
};
