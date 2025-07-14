const sendMessageToContent = (type: string, data?: any): Promise<any> => {
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
                resolve(response);
            });
        });
    });
};

export const browserActions = {
    getCurrentTab: async (): Promise<any> => {
        const tab = await sendMessageToContent('getCurrentTab');
        return tab;
    },

    clickElement: async (args: { selector: string }): Promise<string> => {
        return sendMessageToContent('clickElement', args);
    },

    fillInput: async (args: { selector: string; value: string }): Promise<string> => {
        return sendMessageToContent('fillInput', args);
    },

    getPageContent: async (args: { selector?: string }): Promise<string> => {
        return sendMessageToContent('getPageContent', args);
    },

    navigateToUrl: async (args: { url: string }): Promise<string> => {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tabId = tabs[0]?.id;
                if (!tabId) return reject(new Error("No active tab found"));

                let { url } = args;
                if (!url.startsWith("http")) {
                    url = `https://${url}`;
                }

                // Create a one-time webNavigation listener
                const handleCompleted = (details: chrome.webNavigation.WebNavigationFramedCallbackDetails) => {
                    if (details.tabId === tabId && details.frameId === 0) {
                        chrome.webNavigation.onCompleted.removeListener(handleCompleted);

                        chrome.scripting.executeScript({
                            target: { tabId },
                            files: ['content.js'],
                        }, (_results) => {
                            if (chrome.runtime.lastError) {
                                return reject(chrome.runtime.lastError);
                            }
                            resolve(`Navigated to: ${url} and content script injected`);
                        });
                    }
                };

                chrome.webNavigation.onCompleted.addListener(handleCompleted);

                chrome.tabs.update(tabId, { url });
            });
        });
    },

    searchGoogle: async (args: { query: string }): Promise<string> => {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(args.query)}`;
        return browserActions.navigateToUrl({ url: searchUrl });
    },



    scrollToElement: async (args: { selector: string }): Promise<string> => {
        return sendMessageToContent('scrollToElement', args);
    },

    queryTabs: async (args: { query: string }): Promise<chrome.tabs.Tab[]> => {
        return new Promise((resolve) => {
            chrome.tabs.query({ title: `*${args.query}*` }, (tabs) => {
                resolve(tabs);
            });
        });
    },

    switchToTab: async (args: { tabId: number }): Promise<string> => {
        return new Promise((resolve) => {
            chrome.tabs.update(args.tabId, { active: true }, () => {
                resolve(`Switched to tab ${args.tabId}`);
            });
        });
    },

    listTabs: async (): Promise<{ id: number, title: string, url: string }[]> => {
        return new Promise((resolve) => {
            chrome.tabs.query({}, (tabs) => {
                resolve(tabs.map(tab => ({ id: tab.id || 0, title: tab.title || '', url: tab.url || '' })));
            });
        });
    },
    historyNav: async (args: { action: 'back' | 'forward' }): Promise<string> => {
        return new Promise((resolve) => {
            if (args.action === 'back') {
                chrome.tabs.goBack();
                resolve("Navigated back");
            } else {
                chrome.tabs.goForward();
                resolve("Navigated forward");
            }
        });
    }
};
