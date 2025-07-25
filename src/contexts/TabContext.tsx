import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { RUNTIME_MESSAGES } from "../constants";

interface TabContextType {
	contextUrl: string | null;
	contextTitle: string | null;
	contextTabId: number | null;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabContextProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [contextUrl, setContextUrl] = useState<string | null>(null);
	const [contextTitle, setContextTitle] = useState<string | null>(null);
	const [contextTabId, setContextTabId] = useState<number | null>(null);

	useEffect(() => {
		const handleMessage = (request: { type: string; data?: unknown }) => {
			if (request.type === RUNTIME_MESSAGES.SET_CONTEXT) {
				setContextUrl(request.data.url);
				setContextTitle(request.data.title);
				setContextTabId(request.data.tabId);
			}
		};

		chrome.runtime.onMessage.addListener(handleMessage);

		// Get the current tab on load
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const tab = tabs[0];
			if (tab?.url) {
				setContextUrl(tab.url);
				setContextTitle(tab.title || null);
				setContextTabId(tab.id || null);
			}
		});

		return () => {
			chrome.runtime.onMessage.removeListener(handleMessage);
		};
	}, []);

	return (
		<TabContext.Provider value={{ contextUrl, contextTitle, contextTabId }}>
			{children}
		</TabContext.Provider>
	);
};

export const useTabContext = () => {
	const context = useContext(TabContext);
	if (context === undefined) {
		throw new Error("useTabContext must be used within a TabContextProvider");
	}
	return context;
};
