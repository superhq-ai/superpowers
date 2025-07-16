export const SIDEBAR_MESSAGES = {
	CLOSE: "CLOSE_SIDEBAR",
};

export const SIDEBAR_STATE = {
	LOADED: "SIDEBAR_LOADED",
	CLOSED: "SIDEBAR_CLOSED",
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
				contexts: ["all"],
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

	public onMessage(
		request: SidebarMessage,
		sendResponse: (response: SidebarResponse) => void,
	): boolean {
		if (request.type === SIDEBAR_STATE.LOADED && request.tabId) {
			this.sidebarState.set(request.tabId, true);
			sendResponse({ success: true });
			return true;
		}
		if (request.type === SIDEBAR_STATE.CLOSED && request.tabId) {
			this.sidebarState.set(request.tabId, false);
			sendResponse({ success: true });
			return true;
		}

		return false;
	}

	private async toggleSidebar(tabId: number, windowId: number) {
		const isOpen = this.sidebarState.get(tabId) || false;

		if (isOpen) {
			chrome.runtime.sendMessage({ type: SIDEBAR_MESSAGES.CLOSE }).then(() => {
				this.sidebarState.set(tabId, false);
			});
		} else {
			await chrome.sidePanel.open({ tabId, windowId });
			this.sidebarState.set(tabId, true);
		}
	}

	public async toggle(tab: chrome.tabs.Tab) {
		if (tab?.id && tab?.windowId) {
			await this.toggleSidebar(tab.id, tab.windowId);
		}
	}
}
