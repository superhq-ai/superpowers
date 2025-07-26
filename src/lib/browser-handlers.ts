import type { MessageType } from "../types/browser";

const sendMessageToBackground = (message: {
	type: MessageType;
	data?: unknown;
}): Promise<unknown> => {
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
	fillInput: async (args: { selector: string; value: string }) => {
		const result = await sendMessageToBackground({
			type: "fillInput",
			data: args,
		});

		const filledValueResult = (await browserHandlers.getFieldValue({
			selector: args.selector,
		})) as { value: string } | { error: string };

		if ("error" in filledValueResult) {
			throw new Error(
				`Failed to verify input value for selector ${args.selector}: ${filledValueResult.error}`,
			);
		}

		if (filledValueResult.value !== args.value) {
			throw new Error(
				`Failed to fill input with selector ${args.selector}. Expected value: "${args.value}", but got: "${filledValueResult.value}"`,
			);
		}

		return result;
	},
	getFieldValue: (args: { selector: string }) =>
		sendMessageToBackground({ type: "getFieldValue", data: args }),
	navigateToUrl: (args: { url: string }) =>
		sendMessageToBackground({ type: "navigateToUrl", data: args }),
	searchGoogle: (args: { query: string }) =>
		sendMessageToBackground({ type: "searchGoogle", data: args }),
	switchToTab: (args: { tabId: number }) => {
		return sendMessageToBackground({ type: "switchToTab", data: args });
	},
	listTabs: () => sendMessageToBackground({ type: "listTabs" }),
	historyNav: (args: { action: "back" | "forward" }) =>
		sendMessageToBackground({ type: "historyNav", data: args }),
	simulateKeyPress: (args: { selector: string; key: string }) =>
		sendMessageToBackground({ type: "simulateKeyPress", data: args }),
};
