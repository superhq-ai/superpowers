import type { Tool } from "../types/agent";

export const browserTools: Record<string, Tool> = {
	getCurrentTab: {
		name: "getCurrentTab",
		description: "Get information about the current active tab",
		parameters: {
			type: "object",
			properties: {},
			required: [],
		},
	},

	clickElement: {
		name: "clickElement",
		description: "Click on an element on the page.",
		parameters: {
			type: "object",
			properties: {
				selector: {
					type: "string",
					description: "CSS selector for the element to click",
				},
			},
			required: ["selector"],
		},
	},

	fillInput: {
		name: "fillInput",
		description: "Fill an input field with text.",
		parameters: {
			type: "object",
			properties: {
				selector: {
					type: "string",
					description: "CSS selector for the input element",
				},
				value: {
					type: "string",
					description: "Text to fill in the input",
				},
			},
			required: ["selector", "value"],
		},
	},

	navigateToUrl: {
		name: "navigateToUrl",
		description: "Navigate to a specific URL",
		parameters: {
			type: "object",
			properties: {
				url: {
					type: "string",
					description: "URL to navigate to",
				},
			},
			required: ["url"],
		},
	},

	searchGoogle: {
		name: "searchGoogle",
		description: "Search Google for a query",
		parameters: {
			type: "object",
			properties: {
				query: {
					type: "string",
					description: "Search query",
				},
			},
			required: ["query"],
		},
	},
	getPageContent: {
		name: "getPageContent",
		description:
			"Get the markdown content of the current page. This is useful for answering questions about the page's content.",
		parameters: {
			type: "object",
			properties: {
				selector: {
					type: "string",
					description: "CSS selector to get specific content (optional)",
				},
			},
			required: [],
		},
	},
	scrollToElement: {
		name: "scrollToElement",
		description: "Scroll the page to a specific element.",
		parameters: {
			type: "object",
			properties: {
				selector: {
					type: "string",
					description: "CSS selector for the element to scroll to.",
				},
			},
			required: ["selector"],
		},
	},
	queryTabs: {
		name: "queryTabs",
		description: "Query open tabs to find a specific tab by title.",
		parameters: {
			type: "object",
			properties: {
				query: {
					type: "string",
					description: "The title to search for in open tabs.",
				},
			},
			required: ["query"],
		},
	},
	switchToTab: {
		name: "switchToTab",
		description: "Switch to a specific tab by its ID.",
		parameters: {
			type: "object",
			properties: {
				tabId: {
					type: "number",
					description: "The ID of the tab to switch to.",
				},
			},
			required: ["tabId"],
		},
	},
	listTabs: {
		name: "listTabs",
		description: "List all open tabs.",
		parameters: {
			type: "object",
			properties: {},
			required: [],
		},
	},
	historyNav: {
		name: "historyNav",
		description: "Navigate forwards or backwards in the browser history.",
		parameters: {
			type: "object",
			properties: {
				action: {
					type: "string",
					description:
						"The history navigation action to perform. Can be 'back' or 'forward'.",
				},
			},
			required: ["action"],
		},
	},

	simulateKeyPress: {
		name: "simulateKeyPress",
		description: "Simulate a key press event on a specific element.",
		parameters: {
			type: "object",
			properties: {
				selector: {
					type: "string",
					description:
						"CSS selector for the element to trigger the key press on.",
				},
				key: {
					type: "string",
					description: "The key to press (e.g., 'Enter', 'Escape').",
				},
			},
			required: ["selector", "key"],
		},
	},
};
