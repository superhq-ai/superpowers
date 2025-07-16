const openSidebar = (tab: chrome.tabs.Tab) => {
	if (tab && typeof tab.id === "number" && typeof tab.windowId === "number") {
		chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
	}
};

const initSidebar = () => {
	chrome.runtime.onInstalled.addListener(() => {
		chrome.contextMenus.create({
			id: "openSidebar",
			title: "Use Superpowers",
			contexts: ["all"],
		});
	});

	chrome.contextMenus.onClicked.addListener((info, tab) => {
		if (info.menuItemId === "openSidebar" && tab) {
			openSidebar(tab);
		}
	});

	chrome.action.onClicked.addListener((tab) => {
		openSidebar(tab);
	});

	chrome.commands.onCommand.addListener((command, tab) => {
		if (command === "open_sidebar") {
			openSidebar(tab);
		}
	});
};

export default initSidebar;
