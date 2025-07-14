export type MessageType = 'getPageContent' | 'clickElement' | 'fillInput' | 'getCurrentTab' | 'navigateToUrl' | 'searchGoogle' | 'createReferences' | 'queryTabs' | 'switchToTab' | 'listTabs' | 'scrollToElement' | 'historyNav';

export interface BaseMessage<T = unknown> {
    type: MessageType | string;
    id: string;
    data?: T;
}

export interface ResponseMessage<T = unknown> {
    type: 'response';
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


export interface HistoryNavArgs {
    action: 'back' | 'forward';
}

export type PageContentResult = {
    markdown: string;
} | { error: string };

export type ClickElementResult = {
    success: true;
    message: string;
    elementTag: string;
    elementText: string;
} | { error: string };

export type FillInputResult = {
    success: true;
    message: string;
    selector: string;
} | { error: string };

export type CurrentTabResult = {
    url: string;
    title: string;
    domain: string;
};

export type NavigateToUrlResult = {
    success: true;
    message: string;
} | { error: string };

export type SearchGoogleResult = {
    success: true;
    message: string;
} | { error: string };

export interface TabInfo {
    id: number;
    title: string;
    url: string;
}

export type ScrollToElementResult = {
    success: true;
    message: string;
} | { error: string };

export type BrowserActionResult = string | chrome.tabs.Tab[] | TabInfo[] | PageContentResult | ClickElementResult | FillInputResult | CurrentTabResult | ScrollToElementResult;
