import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSettings } from "../contexts/AppSettingsContext";
import { useModels } from "../hooks/useModels";
import type { LLMProvider } from "../types";
import { PROVIDERS } from "../utils/providers";
import Portal from "./Portal";

interface ModelSelectProps {
	value: string;
	onChange: (value: string) => void;
}

export function ModelSelect({ value, onChange }: ModelSelectProps) {
	const { settings, setSettings } = useAppSettings();
	const { models, isLoading } = useModels(
		settings.selectedProvider,
		settings,
		setSettings,
	);
	const [isOpen, setIsOpen] = useState(false);
	const [showProviders, setShowProviders] = useState(false);
	const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;

			// Check if click is on the button
			if (buttonRef.current?.contains(target)) {
				return;
			}

			// Check if click is on any dropdown content
			const dropdownElements = document.querySelectorAll(
				"[data-dropdown-content]",
			);
			for (const element of dropdownElements) {
				if (element.contains(target)) {
					return;
				}
			}

			// Close dropdowns if click is outside
			setIsOpen(false);
			setShowProviders(false);
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleProviderChange = useCallback(
		(newProvider: LLMProvider) => {
			setSettings({
				selectedProvider: newProvider,
				// Model will be auto-set to default for the new provider
			});
			setShowProviders(false);
		},
		[setSettings],
	);

	const handleModelChange = useCallback(
		(model: string) => {
			// Call the parent onChange first
			onChange(model);

			// Only update settings if the model is actually different
			if (model !== settings.model) {
				setSettings({ model });
			}

			setIsOpen(false);
		},
		[onChange, settings.model, setSettings],
	);

	const handleRightClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		if (buttonRef.current) {
			setButtonRect(buttonRef.current.getBoundingClientRect());
		}
		setIsOpen(false);
		setShowProviders(true);
	}, []);

	const handleLeftClick = useCallback(() => {
		if (buttonRef.current) {
			setButtonRect(buttonRef.current.getBoundingClientRect());
		}
		setShowProviders(false);
		setIsOpen(!isOpen);
	}, [isOpen]);

	const providerOptions = Object.entries(PROVIDERS).map(([key, info]) => ({
		value: key as LLMProvider,
		label: info.label,
	}));

	const currentProvider = settings.selectedProvider;

	return (
		<div className="relative" ref={dropdownRef}>
			{/* Pill-shaped selector */}
			<button
				ref={buttonRef}
				type="button"
				onClick={handleLeftClick}
				onContextMenu={handleRightClick}
				className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
				disabled={isLoading}
				title="Left-click for models, right-click for providers"
			>
				<span className="truncate max-w-32">
					{isLoading ? "Loading..." : value || "Select model"}
				</span>
				<ChevronDown
					className={`w-3 h-3 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			{/* Model dropdown */}
			{isOpen && buttonRect && (
				<Portal>
					<div
						data-dropdown-content
						className="fixed w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-[99999] max-h-60 overflow-y-auto"
						style={{
							left: buttonRect.left,
							top: buttonRect.top - 8,
							transform: "translateY(-100%)",
							boxShadow:
								"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
						}}
					>
						<div className="p-2">
							<div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
								Available Models
							</div>
							{models.length === 0 ? (
								<div className="px-2 py-2 text-sm text-gray-500">
									No models available
								</div>
							) : (
								models.map((model) => (
									<button
										key={model}
										type="button"
										onClick={() => handleModelChange(model)}
										className={`w-full text-left px-2 py-2 text-sm rounded-lg transition-colors duration-150 ${
											model === value
												? "bg-blue-50 text-blue-700 font-medium"
												: "text-gray-700 hover:bg-gray-50"
										}`}
									>
										<div className="truncate">{model}</div>
									</button>
								))
							)}
						</div>
					</div>
				</Portal>
			)}

			{/* Provider dropdown */}
			{showProviders && buttonRect && (
				<Portal>
					<div
						data-dropdown-content
						className="fixed w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-[99999]"
						style={{
							left: buttonRect.left,
							top: buttonRect.top - 8,
							transform: "translateY(-100%)",
							boxShadow:
								"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
						}}
					>
						<div className="p-2">
							<div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
								Switch Provider
							</div>
							{providerOptions.map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() => handleProviderChange(option.value)}
									className={`w-full text-left px-2 py-2 text-sm rounded-lg transition-colors duration-150 ${
										option.value === currentProvider
											? "bg-blue-50 text-blue-700 font-medium"
											: "text-gray-700 hover:bg-gray-50"
									}`}
								>
									{option.label}
								</button>
							))}
						</div>
					</div>
				</Portal>
			)}
		</div>
	);
}
