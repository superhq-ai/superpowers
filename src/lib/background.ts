import { browserActions } from "./browser-actions";
import type { BrowserActionResult } from "../types/browser";
import { SidebarManager } from "./sidebar-manager";
import { LlmService } from "./llm-service";
import { RUNTIME_MESSAGES } from "../constants";

const sidebarManager = new SidebarManager();
sidebarManager.init();

LlmService.listenForConnections();

function handleRuntimeMessage(
    request: { type: string; data?: any; tabId?: number },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
): boolean {
    if (sidebarManager.onMessage(request, sendResponse)) {
        return true;
    }

    const { type, data } = request;
    const action = browserActions[type as keyof typeof browserActions];

    if (action) {
        action(data)
            .then((result: BrowserActionResult) => sendResponse(result))
            .catch((error: Error) => sendResponse({ error: error.message }));
        return true; // Indicates that the response is sent asynchronously
    } else if (type === RUNTIME_MESSAGES.FETCH_LLMS) {
        LlmService.fetchLlmsFiles(data.url)
            .then((result: { llms: string; llmsFull: string; } | { error: string; } | null) => sendResponse(result))
            .catch((error: Error) => sendResponse({ error: error.message }));
        return true;
    }

    sendResponse({ error: "Unknown action" });
    return false;
}

chrome.runtime.onMessage.addListener(handleRuntimeMessage);
