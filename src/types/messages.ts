export type MessageType =
	| "getPageContent"
	| "clickElement"
	| "fillInput"
	| "getCurrentTab"
	| "navigateToUrl"
	| "searchGoogle"
	| "tabTitleUpdated";

export interface BaseMessage<T = unknown> {
	type: MessageType | string;
	id: string;
	data?: T;
}

export interface ResponseMessage<T = unknown> {
	type: "response";
	id: string;
	result: T;
}

export interface SelectorArgs {
	selector: string;
}

export interface FillInputArgs extends SelectorArgs {
	value: string;
}

export interface NavigateToUrlArgs {
	url: string;
}

export interface SearchGoogleArgs {
	query: string;
}

export type PageContentResult =
	| {
			content: string;
			selector?: string;
			url?: string;
			title?: string;
	  }
	| { error: string };

export type ClickElementResult =
	| {
			success: true;
			message: string;
			elementTag: string;
			elementText: string;
	  }
	| { error: string };

export type FillInputResult =
	| {
			success: true;
			message: string;
			selector: string;
	  }
	| { error: string };

export type CurrentTabResult = {
	url: string;
	title: string;
	domain: string;
};

export type NavigateToUrlResult =
	| {
			success: true;
			message: string;
	  }
	| { error: string };

export type SearchGoogleResult =
	| {
			success: true;
			message: string;
	  }
	| { error: string };
