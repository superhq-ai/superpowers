import type {
	ClickElementResult,
	CurrentTabResult,
	FillInputArgs,
	FillInputResult,
	PageContentResult,
	SelectorArgs,
	SimulateKeyPressArgs,
	SimulateKeyPressResult,
} from "../types/browser";

import domToMarkdown from "./dom-to-markdown";

const getPageContent = (args?: SelectorArgs): PageContentResult => {
	try {
		const element = args?.selector
			? document.querySelector(args.selector)
			: document.body;
		if (!element) {
			return { error: `Element not found: ${args?.selector}` };
		}
		return { markdown: domToMarkdown(element) };
	} catch (error) {
		return { error: error instanceof Error ? error.message : String(error) };
	}
};

const clickElement = (args: SelectorArgs): ClickElementResult => {
	try {
		const element = document.querySelector(args.selector) as HTMLElement | null;
		if (!element) {
			return { error: `Element not found: ${args.selector}` };
		}
		element.scrollIntoView({ behavior: "smooth", block: "center" });
		element.click();
		return {
			success: true,
			message: `Clicked element: ${args.selector}`,
			elementTag: element.tagName.toLowerCase(),
			elementText: (element.textContent || "").substring(0, 100),
		};
	} catch (error) {
		return { error: error instanceof Error ? error.message : String(error) };
	}
};

const fillInput = (args: FillInputArgs): FillInputResult => {
	try {
		const element = document.querySelector(args.selector) as
			| HTMLInputElement
			| HTMLTextAreaElement
			| null;
		if (!element) {
			return { error: `Element not found: ${args.selector}` };
		}
		if (!["INPUT", "TEXTAREA"].includes(element.tagName)) {
			return { error: `Element is not an input or textarea: ${args.selector}` };
		}
		element.focus();
		element.value = args.value;
		element.dispatchEvent(new Event("input", { bubbles: true }));
		element.dispatchEvent(new Event("change", { bubbles: true }));
		return {
			success: true,
			message: `Filled ${element.tagName.toLowerCase()} with: ${args.value}`,
			selector: args.selector,
		};
	} catch (error) {
		return { error: error instanceof Error ? error.message : String(error) };
	}
};

const getCurrentTab = (): CurrentTabResult => {
	return {
		url: window.location.href,
		title: document.title,
		domain: window.location.hostname,
	};
};

const scrollToElement = (
	args: SelectorArgs,
): { success: boolean; message: string } | { error: string } => {
	try {
		const element = document.querySelector(args.selector) as HTMLElement | null;
		if (!element) {
			return { error: `Element not found: ${args.selector}` };
		}
		element.scrollIntoView({ behavior: "smooth", block: "center" });
		return { success: true, message: `Scrolled to element: ${args.selector}` };
	} catch (error) {
		return { error: error instanceof Error ? error.message : String(error) };
	}
};

const simulateKeyPress = (
	args: SimulateKeyPressArgs,
): SimulateKeyPressResult => {
	try {
		const element = document.querySelector(args.selector) as HTMLElement | null;
		if (!element) {
			return { error: `Element not found: ${args.selector}` };
		}

		// Focus the element first
		element.focus();

		// Create a keydown event
		const keydownEvent = new KeyboardEvent("keydown", {
			key: args.key,
			code: args.key === "Enter" ? "Enter" : args.key,
			keyCode: args.key === "Enter" ? 13 : args.key.charCodeAt(0),
			which: args.key === "Enter" ? 13 : args.key.charCodeAt(0),
			bubbles: true,
			cancelable: true,
			composed: true, // Important for shadow DOM
		});

		// Dispatch both events
		element.dispatchEvent(keydownEvent);

		return {
			success: true,
			message: `Simulated key press "${args.key}" on element: ${args.selector}`,
		};
	} catch (error) {
		return { error: error instanceof Error ? error.message : String(error) };
	}
};

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
	const { type, data } = request;
	let result: unknown;

	switch (type) {
		case "getPageContent":
			result = getPageContent(data);
			break;
		case "clickElement":
			result = clickElement(data);
			break;
		case "fillInput":
			result = fillInput(data);
			break;
		case "getCurrentTab":
			result = getCurrentTab();
			break;
		case "scrollToElement":
			result = scrollToElement(data);
			break;
		case "simulateKeyPress":
			result = simulateKeyPress(data);
			break;
		default:
			result = { error: `Unknown action: ${type}` };
	}

	sendResponse(result);
	return true;
});
