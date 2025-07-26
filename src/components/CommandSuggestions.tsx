import { useCallback, useEffect, useState } from "react";
import { listModels } from "../services/llm";
import type { AppSettings, LLMProvider } from "../types";
import Portal from "./Portal";

interface ModelSuggestion {
	id: string;
	name: string;
	badge?: string;
	badgeColor?: string;
}

interface CommandSuggestionsProps {
	inputValue: string;
	inputRef: React.RefObject<HTMLTextAreaElement | null>;
	onSuggestionSelect: (suggestion: string) => void;
	settings: AppSettings;
	isVisible: boolean;
}

export function CommandSuggestions({
	inputValue,
	inputRef,
	onSuggestionSelect,
	settings,
	isVisible,
}: CommandSuggestionsProps) {
	const [suggestions, setSuggestions] = useState<ModelSuggestion[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [isLoading, setIsLoading] = useState(false);

	// Parse the command and search term
	const parseCommand = useCallback((value: string) => {
		if (!value.startsWith("/model ")) return null;

		const searchTerm = value.slice(7); // Remove "/model "
		return searchTerm;
	}, []);

	// Get model badge info
	const getModelBadge = useCallback(
		(model: string, provider: LLMProvider) => {
			const customModels = settings.customModels?.[provider] || [];

			if (customModels.includes(model)) {
				return { badge: "Custom", badgeColor: "purple" };
			}

			if (provider === "openrouter") {
				if (model.includes(":free") || model.includes("free")) {
					return { badge: "Free", badgeColor: "green" };
				} else {
					return { badge: "Paid", badgeColor: "blue" };
				}
			}

			return {};
		},
		[settings.customModels],
	);

	// Fetch and filter models
	useEffect(() => {
		const searchTerm = parseCommand(inputValue);
		if (!searchTerm && searchTerm !== "") return;

		const fetchSuggestions = async () => {
			setIsLoading(true);
			try {
				const provider = settings.selectedProvider;
				const apiKey = settings.apiKeys[provider];
				const customUrl = settings.customUrls?.[provider];

				// Get all available models
				const models = await listModels(provider, apiKey, customUrl);

				// Filter models based on search term
				const filteredModels = models
					.filter((model) => {
						if (!searchTerm) return true; // Show all if no search term
						return model.toLowerCase().includes(searchTerm.toLowerCase());
					})
					.slice(0, 8) // Limit to 8 suggestions
					.map((model) => ({
						id: model,
						name: model,
						...getModelBadge(model, provider),
					}));

				setSuggestions(filteredModels);
				setSelectedIndex(0);
			} catch (error) {
				console.error("Failed to fetch model suggestions:", error);
				setSuggestions([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchSuggestions();
	}, [inputValue, settings, parseCommand, getModelBadge]);

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isVisible || suggestions.length === 0) return;

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) => (prev + 1) % suggestions.length);
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex(
						(prev) => (prev - 1 + suggestions.length) % suggestions.length,
					);
					break;
				case "Enter":
				case "Tab":
					e.preventDefault();
					if (suggestions[selectedIndex]) {
						onSuggestionSelect(`/model ${suggestions[selectedIndex].id}`);
					}
					break;
				case "Escape":
					onSuggestionSelect(""); // Close suggestions
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isVisible, suggestions, selectedIndex, onSuggestionSelect]);

	// Don't render if not visible or no input ref
	if (!isVisible || !inputRef.current || suggestions.length === 0) {
		return null;
	}

	// Calculate position
	const inputRect = inputRef.current.getBoundingClientRect();
	const suggestionHeight = Math.min(suggestions.length * 48 + 16, 400); // Max height

	return (
		<Portal>
			<div
				className="fixed bg-white border border-gray-200 rounded-xl shadow-xl z-[99999] overflow-hidden"
				style={{
					left: inputRect.left,
					top: inputRect.top - suggestionHeight - 8,
					width: Math.min(inputRect.width, 400),
					maxHeight: 400,
					boxShadow:
						"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
				}}
			>
				{/* Header */}
				<div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
					<div className="text-xs font-medium text-gray-700">
						Model Suggestions {isLoading && "(Loading...)"}
					</div>
					<div className="text-xs text-gray-500">
						Use ↑↓ to navigate, Enter to select, Esc to close
					</div>
				</div>

				{/* Suggestions */}
				<div className="max-h-80 overflow-y-auto">
					{suggestions.map((suggestion, index) => (
						<button
							key={suggestion.id}
							type="button"
							onClick={() => onSuggestionSelect(`/model ${suggestion.id}`)}
							className={`w-full text-left px-3 py-2 transition-colors duration-150 flex items-center justify-between ${
								index === selectedIndex
									? "bg-blue-50 text-blue-700"
									: "text-gray-700 hover:bg-gray-50"
							}`}
						>
							<div className="flex-1 min-w-0">
								<div className="truncate font-medium text-sm">
									{suggestion.name}
								</div>
								{suggestion.name.includes("/") && (
									<div className="text-xs text-gray-500 truncate">
										{suggestion.name.split("/")[0]} •{" "}
										{suggestion.name.split("/")[1]}
									</div>
								)}
							</div>

							{suggestion.badge && (
								<span
									className={`ml-2 px-1.5 py-0.5 text-xs rounded-full font-medium ${
										suggestion.badgeColor === "green"
											? "bg-green-100 text-green-700"
											: suggestion.badgeColor === "blue"
												? "bg-blue-100 text-blue-700"
												: suggestion.badgeColor === "purple"
													? "bg-purple-100 text-purple-700"
													: "bg-gray-100 text-gray-700"
									}`}
								>
									{suggestion.badge}
								</span>
							)}
						</button>
					))}
				</div>

				{/* Footer */}
				{suggestions.length === 8 && (
					<div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
						<div className="text-xs text-gray-500">
							Showing first 8 results. Type more to filter further.
						</div>
					</div>
				)}
			</div>
		</Portal>
	);
}
