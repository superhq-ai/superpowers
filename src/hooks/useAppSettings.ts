import { useEffect, useState } from "react";
import type { AppSettings, LLMProvider } from "../types";
import { deepEqual } from "../lib/utils";

const defaultModels: Record<LLMProvider, string> = {
    gemini: "gemini-2.0-flash",
    openai: "gpt-4o"
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
                const provider = loadedSettings.selectedProvider || defaults.selectedProvider;
                const allValidModels = Object.values(defaultModels);
                if (!allValidModels.includes(loadedSettings.model)) {
                    loadedSettings.model = defaultModels[provider];
                }
                setSettings(prevSettings => ({ ...prevSettings, ...loadedSettings }));
            }
        });

    }, []);

    const handleSetSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(prevSettings => {
            const updatedSettings = { ...prevSettings, ...newSettings };

            if (newSettings.selectedProvider && newSettings.selectedProvider !== prevSettings.selectedProvider) {
                updatedSettings.model = defaultModels[newSettings.selectedProvider];
            }

            return updatedSettings;
        });
    };

    const saveSettings = () => {
        chrome.storage.sync.set({ settings });
    };

    useEffect(() => {
        if (!deepEqual(settings, defaults)) {
            saveSettings();
        }
    }, [settings]);

    return {
        settings,
        setSettings: handleSetSettings,
        saveSettings,
    };
}
