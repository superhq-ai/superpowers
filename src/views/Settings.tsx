import { useState, useEffect } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { useAppSettings } from "../hooks/useAppSettings";
import { useTestLlm } from "../hooks/useTestLlm";
import type { LLMProvider } from "../types";

const Settings = () => {
    const { settings, setSettings, saveSettings } = useAppSettings();
    const [showApiKey, setShowApiKey] = useState(false);
    const { testConnection, isTesting, isSuccess, testResponse, testError } = useTestLlm();
    const [isSaved, setIsSaved] = useState(false);

    const handleProviderChange = (provider: LLMProvider) => {
        setSettings({ selectedProvider: provider });
    };

    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({
            apiKeys: {
                ...settings.apiKeys,
                [settings.selectedProvider]: e.target.value
            }
        });
    };

    const handleSave = () => {
        saveSettings();
        setIsSaved(true);
    };

    const providerOptions = [
        { value: "gemini", label: "Gemini" },
        { value: "openai", label: "OpenAI" },
    ];

    useEffect(() => {
        if (isSaved) {
            const timer = setTimeout(() => {
                setIsSaved(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isSaved]);

    return (
        <div className="px-4">
            <h1 className="text-lg font-bold mb-4">Settings</h1>

            <div className="mb-4">
                <Select
                    label="Select Provider"
                    options={providerOptions}
                    value={settings.selectedProvider}
                    onChange={(value) => handleProviderChange(value as LLMProvider)}
                    defaultProvider={settings.defaultProvider}
                />
                {settings.selectedProvider !== settings.defaultProvider && (
                    <button
                        onClick={() => setSettings({ defaultProvider: settings.selectedProvider })}
                        className="text-blue-600 cursor-pointer text-sm mt-1"
                    >
                        Make Default
                    </button>
                )}
            </div>

            <div>
                <div className="relative">
                    <Input
                        id="api-key"
                        name="api-key"
                        label={`${settings.selectedProvider.charAt(0).toUpperCase() + settings.selectedProvider.slice(1)
                            } API Key`}
                        type={showApiKey ? "text" : "password"}
                        value={settings.apiKeys?.[settings.selectedProvider] || ""}
                        onChange={handleApiKeyChange}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center top-6">
                        <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            type="button"
                            className="text-gray-400 hover:text-gray-500"
                        >
                            {showApiKey ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center space-x-2">
                <Button type="button" onClick={handleSave} disabled={isSaved}>
                    {isSaved ? "Saved!" : "Save Settings"}
                </Button>
                <Button
                    type="button"
                    onClick={() => testConnection(settings.selectedProvider, settings)}
                    disabled={isTesting}
                    variant="secondary"
                >
                    {isTesting ? "Testing..." : "Test Connection"}
                </Button>
            </div>

            {(testResponse || testError || isSuccess) && (
                <div className="mt-4 p-2 border rounded-md bg-gray-800 text-white">
                    <div className="flex items-center">
                        {isSuccess ? (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                                <h3 className="font-semibold">Successfully Connected</h3>
                            </>
                        ) : (
                            <h3 className="font-semibold">Test Result:</h3>
                        )}
                    </div>
                    {testResponse && <p className="text-sm whitespace-pre-wrap">{testResponse}</p>}
                    {testError && <p className="text-sm text-red-500">{testError}</p>}
                </div>
            )}
        </div>
    );
};

export default Settings;
