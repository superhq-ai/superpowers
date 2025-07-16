import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { AppSettings, LLMProvider } from "../types";

const defaultModels: Record<LLMProvider, string> = {
	gemini: "gemini-2.0-flash",
};

const defaults: AppSettings = {
	apiKeys: {},
	selectedProvider: "gemini",
	model: defaultModels.gemini,
	defaultProvider: "gemini",
	developerMode: false,
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

			return updatedSettings;
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
