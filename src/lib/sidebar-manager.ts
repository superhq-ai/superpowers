const SIDEBAR_MESSAGES = {
    CLOSE: 'CLOSE_SIDEBAR',
    LOADED: 'SIDEBAR_LOADED'
};

interface SidebarMessage {
    type: string;
    tabId?: number;
}

interface SidebarResponse {
    success: boolean;
}

export class SidebarManager {
    private sidebarState = new Map<number, boolean>();

    public init() {
        chrome.runtime.onInstalled.addListener(() => {
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
                this.toggleSidebar(tab.id, tab.windowId);
            }
        });

        chrome.commands.onCommand.addListener((command) => {
            if (command === "open_sidebar") {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    const tab = tabs[0];
                    if (tab?.id && tab?.windowId) {
                        this.toggleSidebar(tab.id, tab.windowId);
                    }
                });
            }
        });

        chrome.tabs.onRemoved.addListener((tabId) => {
            this.sidebarState.delete(tabId);
        });
    }

    public onMessage(request: SidebarMessage, sendResponse: (response: SidebarResponse) => void): boolean {
        if (request.type === SIDEBAR_MESSAGES.LOADED && request.tabId) {
            this.sidebarState.set(request.tabId, true);
            sendResponse({ success: true });
            return true;
        }

        return false;
    }

    private async toggleSidebar(tabId: number, windowId: number) {
        const isOpen = this.sidebarState.get(tabId) || false;

        if (isOpen) {
            try {
                await chrome.runtime.sendMessage({ type: SIDEBAR_MESSAGES.CLOSE });
            } catch (error) {
                console.log('I guess the sidebar is already closed');
            }
            this.sidebarState.set(tabId, false);
        } else {
            await chrome.sidePanel.open({ tabId, windowId });
            this.sidebarState.set(tabId, true);
        }
    }
}
