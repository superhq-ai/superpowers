import type {
	ClickElementResult,
	CurrentTabResult,
	FillInputArgs,
	FillInputResult,
	HistoryNavArgs,
	MessageType,
	NavigateToUrlArgs,
	PageContentResult,
	ScrollToElementResult,
	SearchGoogleArgs,
	SelectorArgs,
	TabInfo,
} from "../types/browser";

const sendMessageToContent = <T>(
	type: MessageType,
	data?: object,
): Promise<T> => {
	return new Promise((resolve, reject) => {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const tabId = tabs[0]?.id;
			if (!tabId) {
				return reject(new Error("No active tab found"));
			}
			chrome.tabs.sendMessage(tabId, { type, data }, (response) => {
				if (chrome.runtime.lastError) {
					return reject(chrome.runtime.lastError);
				}
				if (response?.error) {
					return reject(new Error(response.error));
				}
				resolve(response as T);
			});
		});
	});
};

export const browserActions = {
	getCurrentTab: (): Promise<CurrentTabResult> => {
		return sendMessageToContent<CurrentTabResult>("getCurrentTab");
	},

	clickElement: (args: SelectorArgs): Promise<ClickElementResult> => {
		return sendMessageToContent<ClickElementResult>("clickElement", args);
	},

	fillInput: (args: FillInputArgs): Promise<FillInputResult> => {
		return sendMessageToContent<FillInputResult>("fillInput", args);
	},

	getPageContent: (args: SelectorArgs): Promise<PageContentResult> => {
		return sendMessageToContent<PageContentResult>("getPageContent", args);
	},

	navigateToUrl: (args: NavigateToUrlArgs): Promise<string> => {
		return new Promise((resolve, reject) => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const tabId = tabs[0]?.id;
				if (!tabId) return reject(new Error("No active tab found"));

				let { url } = args;
				if (!url.startsWith("http")) {
					url = `https://${url}`;
				}

				const handleCompleted = (
					details: chrome.webNavigation.WebNavigationFramedCallbackDetails,
				) => {
					if (details.tabId === tabId && details.frameId === 0) {
						chrome.webNavigation.onCompleted.removeListener(handleCompleted);

						chrome.scripting.executeScript(
							{
								target: { tabId },
								files: ["content.js"],
							},
							(_results) => {
								if (chrome.runtime.lastError) {
									return reject(chrome.runtime.lastError);
								}
								resolve(`Navigated to: ${url} and content script injected`);
							},
						);
					}
				};

				chrome.webNavigation.onCompleted.addListener(handleCompleted);

				chrome.tabs.update(tabId, { url });
			});
		});
	},

	searchGoogle: (args: SearchGoogleArgs): Promise<string> => {
		const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(args.query)}`;
		return browserActions.navigateToUrl({ url: searchUrl });
	},

	scrollToElement: (args: SelectorArgs): Promise<ScrollToElementResult> => {
		return sendMessageToContent<ScrollToElementResult>("scrollToElement", args);
	},

	queryTabs: (args: { query: string }): Promise<chrome.tabs.Tab[]> => {
		return new Promise((resolve) => {
			chrome.tabs.query({ title: `*${args.query}*` }, (tabs) => {
				resolve(tabs);
			});
		});
	},

	switchToTab: (args: { tabId: number }): Promise<string> => {
		return new Promise((resolve) => {
			chrome.tabs.update(args.tabId, { active: true }, () => {
				resolve(`Switched to tab ${args.tabId}`);
			});
		});
	},

	listTabs: (): Promise<TabInfo[]> => {
		return new Promise((resolve) => {
			chrome.tabs.query({}, (tabs) => {
				resolve(
					tabs.map((tab) => ({
						id: tab.id || 0,
						title: tab.title || "",
						url: tab.url || "",
					})),
				);
			});
		});
	},

	historyNav: (args: HistoryNavArgs): Promise<string> => {
		return new Promise((resolve) => {
			if (args.action === "back") {
				chrome.tabs.goBack();
				resolve("Navigated back");
			} else {
				chrome.tabs.goForward();
				resolve("Navigated forward");
			}
		});
	},
};
