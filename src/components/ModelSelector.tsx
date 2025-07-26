import { RefreshCw } from "lucide-react";
import { useModels } from "../hooks/useModels";
import type { AppSettings, LLMProvider } from "../types";
import { PROVIDERS } from "../utils/providers";
import Select from "./ui/Select";

interface ModelSelectorProps {
	provider: LLMProvider;
	selectedModel: string;
	settings: AppSettings;
	onModelChange: (model: string) => void;
	onSettingsChange: (settings: Partial<AppSettings>) => void;
}

export default function ModelSelector({
	provider,
	selectedModel,
	settings,
	onModelChange,
	onSettingsChange,
}: ModelSelectorProps) {
	const { models, isLoading, error, refreshModels } = useModels(
		provider,
		settings,
		onSettingsChange,
	);

	const modelOptions = models.map((model) => ({
		value: model,
		label: model,
	}));

	const providerInfo = PROVIDERS[provider];
	const showRefreshButton = providerInfo?.supportsModelRefresh;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="block text-sm font-medium text-gray-700">
					Model
					{selectedModel && (
						<span className="text-xs text-gray-500 ml-1">
							(Current: {selectedModel})
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					{showRefreshButton && (
						<button
							type="button"
							onClick={refreshModels}
							disabled={isLoading}
							className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
							title="Refresh models"
						>
							<RefreshCw
								className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
							/>
						</button>
					)}
				</div>
			</div>

			{error && (
				<div className="text-xs text-red-600 bg-red-50 p-2 rounded">
					{error}
				</div>
			)}

			<div className="space-y-2">
				<Select
					options={modelOptions}
					value={selectedModel}
					onChange={(model) => {
						onModelChange(model);
						onSettingsChange({ model });
					}}
					disabled={isLoading}
					placeholder={isLoading ? "Loading models..." : "Select a model"}
				/>
			</div>

			{models.length === 0 && !isLoading && (
				<div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
					No models available. Try refreshing the list.
				</div>
			)}
		</div>
	);
}
