import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { StorageOptimizer } from "../lib/storageOptimizer";
import type { AppSettings, LLMProvider } from "../types";

const defaultModels: Record<LLMProvider, string> = {
	gemini: "gemini-2.0-flash",
	ollama: "llama3.2:latest",
	openrouter: "qwen/qwen-2.5-72b-instruct:free",
};

const defaults: AppSettings = {
	apiKeys: {},
	selectedProvider: "gemini",
	model: defaultModels.gemini,
	defaultProvider: "gemini",
	developerMode: false,
	customUrls: {
		ollama: "http://localhost:11434",
		// Gemini doesn't need a custom URL - uses native SDK
	},
};

interface AppSettingsContextType {
	settings: AppSettings;
	draftSettings: AppSettings;
	setSettings: (newSettings: Partial<AppSettings>) => void;
	setDraftSettings: (newSettings: Partial<AppSettings>) => void;
	saveSettings: () => void;
	resetDraftSettings: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(
	undefined,
);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState<AppSettings>(defaults);
	const [draftSettings, setDraftSettings] = useState<AppSettings>(defaults);

	useEffect(() => {
		if (
			typeof chrome !== "undefined" &&
			chrome.storage &&
			chrome.storage.sync
		) {
			chrome.storage.sync.get(["settings"], (result) => {
				if (result.settings) {
					const loadedSettings = result.settings as AppSettings;
					const provider =
						loadedSettings.selectedProvider || defaults.selectedProvider;
					const allValidModels = Object.values(defaultModels);
					if (!allValidModels.includes(loadedSettings.model)) {
						loadedSettings.model = defaultModels[provider];
					}
					setSettings((prevSettings) => ({
						...prevSettings,
						...loadedSettings,
					}));
					setDraftSettings((prevSettings) => ({
						...prevSettings,
						...loadedSettings,
					}));
				}
			});
		} else {
			console.warn("Chrome storage.sync is not available.");
		}
	}, []);

	const handleSetSettings = useCallback((newSettings: Partial<AppSettings>) => {
		setSettings((prevSettings) => {
			const updatedSettings = { ...prevSettings, ...newSettings };

			if (
				newSettings.selectedProvider &&
				newSettings.selectedProvider !== prevSettings.selectedProvider
			) {
				updatedSettings.model = defaultModels[newSettings.selectedProvider];
			}

			// Auto-save to Chrome storage with optimization
			StorageOptimizer.saveSettings(updatedSettings).catch(console.error);

			return updatedSettings;
		});

		// Also update draft settings to keep them in sync
		setDraftSettings((prevDraftSettings) => {
			const updatedDraftSettings = { ...prevDraftSettings, ...newSettings };

			if (
				newSettings.selectedProvider &&
				newSettings.selectedProvider !== prevDraftSettings.selectedProvider
			) {
				updatedDraftSettings.model =
					defaultModels[newSettings.selectedProvider];
			}

			return updatedDraftSettings;
		});
	}, []);

	const handleSetDraftSettings = useCallback(
		(newSettings: Partial<AppSettings>) => {
			setDraftSettings((prevSettings) => {
				const updatedSettings = { ...prevSettings, ...newSettings };

				if (
					newSettings.selectedProvider &&
					newSettings.selectedProvider !== prevSettings.selectedProvider
				) {
					updatedSettings.model = defaultModels[newSettings.selectedProvider];
				}

				return updatedSettings;
			});
		},
		[],
	);

	const saveSettings = useCallback(() => {
		setSettings(draftSettings);
		chrome.storage.sync.set({ settings: draftSettings });
	}, [draftSettings]);

	const resetDraftSettings = useCallback(() => {
		setDraftSettings(settings);
	}, [settings]);

	return (
		<AppSettingsContext.Provider
			value={{
				settings,
				draftSettings,
				setSettings: handleSetSettings,
				setDraftSettings: handleSetDraftSettings,
				saveSettings,
				resetDraftSettings,
			}}
		>
			{children}
		</AppSettingsContext.Provider>
	);
}

export function useAppSettings() {
	const context = useContext(AppSettingsContext);
	if (!context) {
		throw new Error(
			"useAppSettings must be used within an AppSettingsProvider",
		);
	}
	return context;
}
