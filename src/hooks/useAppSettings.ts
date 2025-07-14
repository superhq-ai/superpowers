import { useCallback, useEffect, useState } from "react";
import { deepEqual } from "../lib/utils";
import type { AppSettings, LLMProvider } from "../types";

const defaultModels: Record<LLMProvider, string> = {
	gemini: "gemini-2.0-flash",
};

const defaults: AppSettings = {
	apiKeys: {},
	selectedProvider: "gemini",
	model: defaultModels.gemini,
	defaultProvider: "gemini",
};

export function useAppSettings() {
	const [settings, setSettings] = useState<AppSettings>(defaults);

	useEffect(() => {
		chrome.storage.sync.get(["settings"], (result) => {
			if (result.settings) {
				const loadedSettings = result.settings as AppSettings;
				const provider =
					loadedSettings.selectedProvider || defaults.selectedProvider;
				const allValidModels = Object.values(defaultModels);
				if (!allValidModels.includes(loadedSettings.model)) {
					loadedSettings.model = defaultModels[provider];
				}
				setSettings((prevSettings) => ({ ...prevSettings, ...loadedSettings }));
			}
		});
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

	const saveSettings = useCallback(() => {
		chrome.storage.sync.set({ settings });
	}, [settings]);

	useEffect(() => {
		if (!deepEqual(settings, defaults)) {
			chrome.storage.sync.set({ settings });
		}
	}, [settings]);

	return {
		settings,
		setSettings: handleSetSettings,
		saveSettings,
	};
}
