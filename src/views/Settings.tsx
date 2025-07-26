import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import ModelSelector from "../components/ModelSelector";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Switch from "../components/ui/Switch";
import { useAppSettings } from "../contexts/AppSettingsContext";
import { useTestLlm } from "../hooks/useTestLlm";
import type { LLMProvider } from "../types";
import { PROVIDERS } from "../utils/providers.ts";

const Settings = () => {
	const {
		settings,
		draftSettings,
		setDraftSettings,
		saveSettings,
		resetDraftSettings,
	} = useAppSettings();
	const [showApiKey, setShowApiKey] = useState(false);
	const { testConnection, isTesting, isSuccess, testResponse, testError } =
		useTestLlm();
	const [isSaved, setIsSaved] = useState(false);

	const handleProviderChange = (provider: LLMProvider) => {
		setDraftSettings({ selectedProvider: provider });
	};

	const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDraftSettings({
			apiKeys: {
				...draftSettings.apiKeys,
				[draftSettings.selectedProvider]: e.target.value,
			},
		});
	};

	const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDraftSettings({
			customUrls: {
				...draftSettings.customUrls,
				[draftSettings.selectedProvider]: e.target.value,
			},
		});
	};

	const handleModelChange = (model: string) => {
		setDraftSettings({ model });
	};

	const handleSave = () => {
		saveSettings();
		setIsSaved(true);
	};

	const providerOptions = Object.entries(PROVIDERS).map(
		([value, { label }]) => ({
			value: value as LLMProvider,
			label,
		}),
	);

	useEffect(() => {
		if (isSaved) {
			const timer = setTimeout(() => {
				setIsSaved(false);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [isSaved]);

	useEffect(() => {
		setDraftSettings(settings);
	}, [settings, setDraftSettings]);

	useEffect(() => {
		return () => {
			resetDraftSettings();
		};
	}, [resetDraftSettings]);

	return (
		<div className="px-4">
			<h1 className="text-lg font-bold mb-4">Settings</h1>

			<div className="mb-4">
				<Select
					label="Select Provider"
					options={providerOptions}
					value={draftSettings.selectedProvider}
					onChange={(value) => handleProviderChange(value as LLMProvider)}
					defaultProvider={draftSettings.defaultProvider}
				/>
				{draftSettings.selectedProvider !== draftSettings.defaultProvider && (
					<button
						type="button"
						onClick={() =>
							setDraftSettings({
								defaultProvider: draftSettings.selectedProvider,
							})
						}
						className="text-blue-600 cursor-pointer text-sm mt-1"
					>
						Make Default
					</button>
				)}
			</div>

			{/* API URL - only for providers that have a defaultUrl (like Ollama) */}
			{PROVIDERS[draftSettings.selectedProvider]?.defaultUrl && (
				<div className="mb-4">
					<Input
						id="api-url"
						name="api-url"
						label={`${PROVIDERS[draftSettings.selectedProvider].label} URL`}
						type="text"
						value={
							draftSettings.customUrls?.[draftSettings.selectedProvider] ||
							PROVIDERS[draftSettings.selectedProvider].defaultUrl ||
							""
						}
						onChange={handleCustomUrlChange}
						placeholder={PROVIDERS[draftSettings.selectedProvider].defaultUrl}
					/>
					<p className="text-xs text-gray-500 mt-1">
						{PROVIDERS[draftSettings.selectedProvider]?.isLocal
							? `Make sure ${PROVIDERS[draftSettings.selectedProvider].label} is running on this URL`
							: "Custom API endpoint URL"}
					</p>
				</div>
			)}

			{/* Model Selection */}
			<div className="mb-4">
				<ModelSelector
					provider={draftSettings.selectedProvider}
					selectedModel={draftSettings.model}
					settings={draftSettings}
					onModelChange={handleModelChange}
					onSettingsChange={setDraftSettings}
				/>
			</div>

			{/* API Key section - only show for providers that require it */}
			{PROVIDERS[draftSettings.selectedProvider]?.requiresApiKey && (
				<div>
					<div className="relative">
						<Input
							id="api-key"
							name="api-key"
							label={`${PROVIDERS[draftSettings.selectedProvider].label} API Key`}
							type={showApiKey ? "text" : "password"}
							value={
								draftSettings.apiKeys?.[draftSettings.selectedProvider] || ""
							}
							onChange={handleApiKeyChange}
						/>
						<div className="absolute inset-y-0 right-0 pr-3 flex items-center top-6">
							<div className="flex items-center gap-x-2">
								{!draftSettings.apiKeys?.[draftSettings.selectedProvider] &&
									PROVIDERS[draftSettings.selectedProvider].apiKeyUrl && (
										<button
											type="button"
											title="API key generation page"
											onClick={() => {
												const url =
													PROVIDERS[draftSettings.selectedProvider].apiKeyUrl;
												if (url) window.open(url, "_blank");
											}}
											className="bg-transparent font-medium text-blue-600 cursor-pointer text-xs py-1 px-2 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
										>
											Get Key
										</button>
									)}
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
				</div>
			)}

			<div className="mt-6 border-t border-gray-300 pt-4">
				<h2 className="text-md font-bold mb-2">Advanced Settings</h2>
				<div className="flex items-center justify-between">
					<Switch
						label="Developer Mode"
						checked={draftSettings.developerMode || false}
						onChange={(checked: boolean) =>
							setDraftSettings({ developerMode: checked })
						}
					/>
				</div>
			</div>

			<div className="mt-6 flex items-center space-x-2">
				<Button type="button" onClick={handleSave} disabled={isSaved}>
					{isSaved ? "Saved!" : "Save Settings"}
				</Button>
				<Button
					type="button"
					onClick={() =>
						testConnection(draftSettings.selectedProvider, draftSettings)
					}
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
					{testResponse && (
						<p className="text-sm whitespace-pre-wrap">{testResponse}</p>
					)}
					{testError && <p className="text-sm text-red-500">{testError}</p>}
				</div>
			)}
		</div>
	);
};

export default Settings;
