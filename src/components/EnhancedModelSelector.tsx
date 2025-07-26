import { Filter, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { AppSettings, LLMProvider } from "../types";
import { PROVIDERS } from "../utils/providers";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Select from "./ui/Select";

interface ModelWithMetadata {
	id: string;
	name: string;
	description?: string;
	pricing?: {
		prompt: string;
		completion: string;
	};
	context_length?: number;
	isFree?: boolean;
	isPaid?: boolean;
}

interface EnhancedModelSelectorProps {
	provider: LLMProvider;
	selectedModel: string;
	onModelChange: (model: string) => void;
	settings: AppSettings;
}

export function EnhancedModelSelector({
	provider,
	selectedModel,
	onModelChange,
	settings,
}: EnhancedModelSelectorProps) {
	const [models, setModels] = useState<ModelWithMetadata[]>([]);
	const [filteredModels, setFilteredModels] = useState<ModelWithMetadata[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showCustomInput, setShowCustomInput] = useState(false);
	const [customModelInput, setCustomModelInput] = useState("");
	const [showFilters, setShowFilters] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">(
		"all",
	);
	const [sortBy, setSortBy] = useState<"name" | "price" | "context">("name");

	const providerInfo = PROVIDERS[provider];
	const showRefreshButton = providerInfo?.supportsModelRefresh;
	const showAddCustomButton = providerInfo?.supportsCustomModels;
	const showEnhancedFilters = provider === "openrouter";

	const fetchModels = useCallback(async () => {
		if (!providerInfo) return;

		setIsLoading(true);
		setError(null);

		try {
			const apiKey = settings.apiKeys[provider];
			const customUrl = settings.customUrls?.[provider];

			let modelList: ModelWithMetadata[] = [];

			// Use the unified API system for all providers
			try {
				const { listModels } = await import("../services/llm");
				const basicModels = await listModels(provider, apiKey, customUrl);

				console.log(`${provider} models fetched:`, {
					count: basicModels.length,
					sample: basicModels.slice(0, 5),
				});

				modelList = basicModels.map((id) => {
					const baseModel = { id, name: id };

					// Add provider-specific metadata
					if (provider === "openrouter") {
						return {
							...baseModel,
							isFree: id.includes(":free") || id.includes("free"),
							isPaid: !id.includes(":free") && !id.includes("free"),
							description: id.includes(":free") ? "Free model" : "Paid model",
						};
					}

					return baseModel;
				});
			} catch (error) {
				console.error(`Failed to fetch models for ${provider}:`, error);
				setError(
					`Failed to fetch models: ${error instanceof Error ? error.message : "Unknown error"}`,
				);

				// Fallback to empty list
				modelList = [];
			}

			// Add custom models
			const customModels = settings.customModels?.[provider] || [];
			const customModelList = customModels.map((id) => ({
				id,
				name: id,
				isCustom: true,
			}));

			const allModels = [...modelList, ...customModelList];
			setModels(allModels);
			setFilteredModels(allModels);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to fetch models";
			setError(errorMessage);

			// Fallback to custom models if available
			const customModels = settings.customModels?.[provider] || [];
			if (customModels.length > 0) {
				const fallbackModels = customModels.map((id) => ({
					id,
					name: id,
					isCustom: true,
				}));
				setModels(fallbackModels);
				setFilteredModels(fallbackModels);
			}
		} finally {
			setIsLoading(false);
		}
	}, [provider, settings, providerInfo]);

	// Filter and sort models
	useEffect(() => {
		let filtered = [...models];

		// Search filter
		if (searchTerm) {
			filtered = filtered.filter(
				(model) =>
					model.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
					model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					model.description?.toLowerCase().includes(searchTerm.toLowerCase()),
			);
		}

		// Price filter
		if (priceFilter === "free") {
			filtered = filtered.filter((model) => model.isFree);
		} else if (priceFilter === "paid") {
			filtered = filtered.filter((model) => model.isPaid);
		}

		// Sort
		filtered.sort((a, b) => {
			switch (sortBy) {
				case "price":
					// Free models first, then by price
					if (a.isFree && !b.isFree) return -1;
					if (!a.isFree && b.isFree) return 1;
					return a.id.localeCompare(b.id);
				case "context":
					return (b.context_length || 0) - (a.context_length || 0);
				default:
					return a.id.localeCompare(b.id);
			}
		});

		setFilteredModels(filtered);
	}, [models, searchTerm, priceFilter, sortBy]);

	// Auto-fetch on mount and provider change
	useEffect(() => {
		fetchModels();
	}, [fetchModels]);

	const handleAddCustomModel = async () => {
		if (!customModelInput.trim()) return;

		const newModel = {
			id: customModelInput.trim(),
			name: customModelInput.trim(),
			isCustom: true,
		};
		setModels((prev) => [...prev, newModel]);
		onModelChange(customModelInput.trim());
		setCustomModelInput("");
		setShowCustomInput(false);

		// Save to settings
		const customModels = settings.customModels?.[provider] || [];
		const newCustomModels = [...customModels, customModelInput.trim()].sort();
		const newSettings = {
			...settings,
			customModels: {
				...settings.customModels,
				[provider]: newCustomModels,
			},
		};
		await chrome.storage.sync.set({ settings: newSettings });
	};

	const isCustomModel = (modelId: string) => {
		const customModels = settings.customModels?.[provider] || [];
		return customModels.includes(modelId);
	};

	const formatPrice = (price: string) => {
		const num = parseFloat(price);
		if (num === 0) return "Free";
		if (num < 0.001) return `$${(num * 1000000).toFixed(2)}/1M`;
		return `$${num.toFixed(4)}/1K`;
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="block text-sm font-medium text-gray-700">
					Model
					{selectedModel && (
						<span className="text-xs text-gray-500 ml-1">
							({selectedModel})
						</span>
					)}
				</div>
				<div className="flex items-center gap-1">
					{showRefreshButton && (
						<button
							type="button"
							onClick={fetchModels}
							disabled={isLoading}
							className="p-1 text-gray-400 hover:text-gray-600"
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
					{showEnhancedFilters && (
						<button
							type="button"
							onClick={() => setShowFilters(!showFilters)}
							className={`p-1 ${showFilters ? "text-blue-600" : "text-gray-400"} hover:text-gray-600`}
							title="Filter models"
						>
							<Filter className="w-4 h-4" />
						</button>
					)}
				</div>
			</div>

			{/* Enhanced Filters for OpenRouter */}
			{showEnhancedFilters && showFilters && (
				<div className="space-y-2 p-3 bg-gray-50 rounded-lg">
					<Input
						label=""
						value={searchTerm}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setSearchTerm(e.target.value)
						}
						placeholder="Search models..."
						className="text-sm"
					/>
					<div className="flex gap-2">
						<Select
							label=""
							value={priceFilter}
							onChange={(value: string) =>
								setPriceFilter(value as "all" | "free" | "paid")
							}
							options={[
								{ value: "all", label: "All Models" },
								{ value: "free", label: "Free Only" },
								{ value: "paid", label: "Paid Only" },
							]}
						/>
						<Select
							label=""
							value={sortBy}
							onChange={(value: string) =>
								setSortBy(value as "name" | "price" | "context")
							}
							options={[
								{ value: "name", label: "Sort by Name" },
								{ value: "price", label: "Sort by Price" },
								{ value: "context", label: "Sort by Context" },
							]}
						/>
					</div>
				</div>
			)}

			{/* Model Selection */}
			<Select
				label=""
				value={selectedModel}
				options={filteredModels.map((model) => {
					const isCustom = isCustomModel(model.id);
					let badge: string | undefined;
					let badgeColor = "";

					if (isCustom) {
						badge = "Custom";
						badgeColor = "purple";
					} else if (model.isFree) {
						badge = "Free";
						badgeColor = "green";
					} else if (model.isPaid) {
						badge = "Paid";
						badgeColor = "blue";
					}

					return {
						value: model.id,
						label: model.id,
						description:
							showEnhancedFilters && model.pricing
								? `${formatPrice(model.pricing.prompt)} prompt, ${formatPrice(model.pricing.completion)} completion`
								: model.description || undefined,
						badge,
						badgeColor,
					};
				})}
				onChange={onModelChange}
				disabled={isLoading}
				placeholder={isLoading ? "Loading models..." : "Select a model"}
			/>

			{/* Custom Model Input */}
			{showAddCustomButton && showCustomInput && (
				<div className="flex gap-2">
					<Input
						label=""
						value={customModelInput}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setCustomModelInput(e.target.value)
						}
						placeholder="Enter custom model name"
						onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
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

			{/* Error Display */}
			{error && (
				<div className="text-xs text-red-600 bg-red-50 p-2 rounded">
					{error}
				</div>
			)}

			{/* Model Count */}
			{filteredModels.length > 0 && (
				<div className="text-xs text-gray-500">
					{filteredModels.length} model{filteredModels.length !== 1 ? "s" : ""}{" "}
					available
					{searchTerm || priceFilter !== "all"
						? ` (filtered from ${models.length})`
						: ""}
				</div>
			)}
		</div>
	);
}
