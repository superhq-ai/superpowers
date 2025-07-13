import type {
    BackgroundRequest,
    AppSettings
} from "../types";
import { getLlm } from "./llm";
import { ConfigError } from "./errors";
import { browserActions } from "./browser-actions";

const fetchLlmsFiles = async (url: string) => {
    try {
        const llmsUrl = new URL('llms.txt', url).toString();
        const llmsFullUrl = new URL('llms-full.txt', url).toString();

        const [llmsResponse, llmsFullResponse] = await Promise.all([
            fetch(llmsUrl),
            fetch(llmsFullUrl)
        ]);

        if (!llmsResponse.ok && !llmsFullResponse.ok) {
            console.log("No llms files found for this site.");
            return null;
        }

        const llmsData = llmsResponse.ok ? await llmsResponse.text() : '';
        const llmsFullData = llmsFullResponse.ok ? await llmsFullResponse.text() : '';

        return {
            llms: llmsData,
            llmsFull: llmsFullData
        };
    } catch (error) {
        console.error("Error fetching llms files:", error);
        return null;
    }
};

chrome.runtime.onInstalled.addListener(() => {
    console.log("You have superpowers now!");
    chrome.contextMenus.create({
        id: "openSidebar",
        title: "Use Superpowers",
        contexts: ["all"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (
        info.menuItemId === "openSidebar" &&
        tab &&
        typeof tab.id === "number" &&
        typeof tab.windowId === "number"
    ) {
        chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
    }
});

chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== "llm") return;

    const abortController = new AbortController();

    port.onDisconnect.addListener(() => {
        abortController.abort();
    });

    port.onMessage.addListener(async (request: BackgroundRequest) => {
        const { messages, options } = request;

        try {
            const { settings } = (await chrome.storage.sync.get("settings")) as { settings: AppSettings };

            if (!settings) {
                throw new ConfigError("Settings not configured. Please set your API key in the settings.");
            }

            if (!settings.selectedProvider || !settings.model) {
                throw new ConfigError("LLM provider or model not configured.");
            }

            const apiKey = settings.apiKeys[settings.selectedProvider];

            if (!apiKey) {
                throw new ConfigError("API key not found for the selected provider.");
            }

            const llm = getLlm(settings.selectedProvider);
            const stream = llm.generate(
                messages,
                options,
                apiKey,
                abortController.signal
            );

            for await (const chunk of stream) {
                port.postMessage({ type: "stream", content: chunk });
            }

            port.postMessage({ type: "done" });
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                console.log('LLM request aborted.');
                return;
            }
            const err = error as Error;
            port.postMessage({ type: "error", error: err.message });
        }
    });
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    const { type, data } = request;
    const action = browserActions[type as keyof typeof browserActions];

    if (action) {
        action(data)
            .then((result: any) => sendResponse(result))
            .catch((error: Error) => sendResponse({ error: error.message }));
        return true; // Indicates that the response is sent asynchronously
    } else if (type === 'fetchLlms') {
        fetchLlmsFiles(data.url)
            .then(result => sendResponse(result))
            .catch((error: Error) => sendResponse({ error: error.message }));
        return true;
    }

    sendResponse({ error: "Unknown action" });
    return false;
});

chrome.commands.onCommand.addListener((command) => {
    if (command === "open_sidebar") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (tab?.id && tab?.windowId) {
                chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
            }
        });
    }
});
