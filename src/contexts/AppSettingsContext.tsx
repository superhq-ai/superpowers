import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { useChromeStorage } from "../hooks/useChromeStorage";
import type { AppSettings, LLMProvider } from "../types";

const defaultModels: Record<LLMProvider, string> = {
	gemini: "gemini-2.0-flash",
	ollama: "llama3.2:latest",
};

const defaults: AppSettings = {
	apiKeys: {},
	selectedProvider: "gemini",
	model: defaultModels.gemini,
	defaultProvider: "gemini",
	developerMode: false,
	customUrls: {
		ollama: "http://localhost:11434",
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
	const { value: settings, setValue: setStoredSettings } =
		useChromeStorage<AppSettings>("settings", defaults);
	const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);

	useEffect(() => {
		setDraftSettings(settings);
	}, [settings]);

	const handleSetSettings = useCallback(
		(newSettings: Partial<AppSettings>) => {
			const updatedSettings = { ...settings, ...newSettings };

			if (
				newSettings.selectedProvider &&
				newSettings.selectedProvider !== settings.selectedProvider
			) {
				updatedSettings.model = defaultModels[newSettings.selectedProvider];
			}
			setStoredSettings(updatedSettings);
			setDraftSettings(updatedSettings);
		},
		[settings, setStoredSettings],
	);

	const handleSetDraftSettings = useCallback(
		(newSettings: Partial<AppSettings>) => {
			setDraftSettings((prev) => {
				const updatedSettings = { ...prev, ...newSettings };
				if (
					newSettings.selectedProvider &&
					newSettings.selectedProvider !== prev.selectedProvider
				) {
					updatedSettings.model = defaultModels[newSettings.selectedProvider];
				}
				return updatedSettings;
			});
		},
		[],
	);

	const saveSettings = useCallback(() => {
		setStoredSettings(draftSettings);
	}, [draftSettings, setStoredSettings]);

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
