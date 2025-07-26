import { Plus, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { useModels } from "../hooks/useModels";
import type { AppSettings, LLMProvider } from "../types";
import { PROVIDERS } from "../utils/providers";
import Button from "./ui/Button";
import Input from "./ui/Input";
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
	onSettingsChange: _onSettingsChange,
}: ModelSelectorProps) {
	const {
		models,
		isLoading,
		error,
		refreshModels,
		addCustomModel,
		removeCustomModel,
	} = useModels(provider, settings);
	const [showCustomInput, setShowCustomInput] = useState(false);
	const [customModelInput, setCustomModelInput] = useState("");
	const [searchTerm, setSearchTerm] = useState("");

	// Helper function to check if a model is custom
	const isCustomModel = (model: string) => {
		const customModels = settings.customModels?.[provider] || [];
		return customModels.includes(model);
	};

	// Filter models based on search term
	const filteredModels = models.filter((model) => {
		if (!searchTerm) return true;
		return model.toLowerCase().includes(searchTerm.toLowerCase());
	});

	const modelOptions = filteredModels.map((model) => {
		const isCustom = isCustomModel(model);
		let badge: string | undefined;
		let badgeColor: string | undefined;

		if (isCustom) {
			badge = "Custom";
			badgeColor = "purple";
		} else if (provider === "openrouter") {
			if (model.includes(":free") || model.includes("free")) {
				badge = "Free";
				badgeColor = "green";
			} else {
				badge = "Paid";
				badgeColor = "blue";
			}
		}

		return {
			value: model,
			label: model,
			badge,
			badgeColor,
		};
	});

	const handleAddCustomModel = async () => {
		if (!customModelInput.trim()) return;

		await addCustomModel(customModelInput.trim());
		onModelChange(customModelInput.trim());
		setCustomModelInput("");
		setShowCustomInput(false);
	};

	const handleRemoveCustomModel = async (model: string) => {
		await removeCustomModel(model);
		if (selectedModel === model && models.length > 0) {
			onModelChange(models[0]);
		}
	};

	const providerInfo = PROVIDERS[provider];
	const showRefreshButton = providerInfo?.supportsModelRefresh;
	const showAddCustomButton = providerInfo?.supportsCustomModels;

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
					{showAddCustomButton && (
						<button
							type="button"
							onClick={() => setShowCustomInput(!showCustomInput)}
							className="p-1 text-gray-400 hover:text-gray-600"
							title="Add custom model"
						>
							<Plus className="w-4 h-4" />
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
				{/* Search bar for OpenRouter models */}
				{provider === "openrouter" && models.length > 0 && (
					<Input
						label=""
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search models... (e.g., 'gpt', 'claude', 'free')"
						className="text-sm"
					/>
				)}

				<Select
					options={modelOptions}
					value={selectedModel}
					onChange={onModelChange}
					disabled={isLoading}
					placeholder={isLoading ? "Loading models..." : "Select a model"}
				/>

				{/* Show filtered count for OpenRouter */}
				{provider === "openrouter" && searchTerm && (
					<div className="text-xs text-gray-500">
						Showing {filteredModels.length} of {models.length} models
					</div>
				)}

				{showAddCustomButton && showCustomInput && (
					<div className="flex gap-2">
						<Input
							label=""
							value={customModelInput}
							onChange={(e) => setCustomModelInput(e.target.value)}
							placeholder="Enter custom model name (e.g., llama3.2:7b)"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleAddCustomModel();
								}
								if (e.key === "Escape") {
									setShowCustomInput(false);
									setCustomModelInput("");
								}
							}}
						/>
						<Button
							onClick={handleAddCustomModel}
							disabled={!customModelInput.trim()}
							size="sm"
						>
							Add
						</Button>
						<Button
							onClick={() => {
								setShowCustomInput(false);
								setCustomModelInput("");
							}}
							variant="outline"
							size="sm"
						>
							Cancel
						</Button>
					</div>
				)}
			</div>

			{/* Show custom models with remove option - only for providers that support custom models */}
			{showAddCustomButton && models.some((model) => isCustomModel(model)) && (
				<div className="space-y-1">
					<div className="text-xs text-gray-500">Custom Models:</div>
					<div className="flex flex-wrap gap-1">
						{models
							.filter((model) => isCustomModel(model))
							.map((model) => (
								<div
									key={model}
									className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
								>
									<span>{model}</span>
									<button
										type="button"
										onClick={() => handleRemoveCustomModel(model)}
										className="text-blue-500 hover:text-blue-700"
										title="Remove custom model"
									>
										<X className="w-3 h-3" />
									</button>
								</div>
							))}
					</div>
				</div>
			)}

			{models.length === 0 && !isLoading && (
				<div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
					No models available. Try refreshing or add a custom model.
				</div>
			)}
		</div>
	);
}
