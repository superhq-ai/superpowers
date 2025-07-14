import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Option {
	value: string;
	label: string;
}

interface SelectProps {
	options: Option[];
	value: string;
	onChange: (value: string) => void;
	label: string;
	defaultProvider?: string;
}

const Select = ({
	options,
	value,
	onChange,
	label,
	defaultProvider,
}: SelectProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const selectRef = useRef<HTMLDivElement>(null);
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const listboxRef = useRef<HTMLDivElement>(null);

	const handleSelect = (value: string) => {
		onChange(value);
		setIsOpen(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!options) return;
		
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (isOpen && focusedIndex >= 0) {
				handleSelect(options[focusedIndex].value);
			} else {
				setIsOpen(!isOpen);
			}
		} else if (e.key === "Escape") {
			setIsOpen(false);
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
			}
			setFocusedIndex((prevIndex) => (prevIndex + 1) % options.length);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
			}
			setFocusedIndex(
				(prevIndex) => (prevIndex - 1 + options.length) % options.length,
			);
		}
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				selectRef.current &&
				!selectRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Reset focused index when closing
	useEffect(() => {
		if (!isOpen) {
			setFocusedIndex(-1);
		}
	}, [isOpen]);

	const selectedOption = options
		? options.find((option) => option.value === value)
		: undefined;

	const selectedIndex = selectedOption 
		? options.findIndex((option) => option.value === value)
		: -1;

	return (
		<div className="relative" ref={selectRef}>
			<label
				className="block text-sm font-medium text-gray-700"
				htmlFor="select-button"
			>
				{label}
			</label>
			{/** biome-ignore lint/a11y/useAriaPropsSupportedByRole: Custom select component requires ARIA listbox pattern to ensure proper accessibility and keyboard navigation. */}
			<button
				id="select-button"
				type="button"
				className="mt-1 w-full px-3 py-2 bg-white/80 backdrop-blur-md border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm text-gray-900 flex justify-between items-center cursor-pointer"
				onClick={() => setIsOpen(!isOpen)}
				onKeyDown={handleKeyDown}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				aria-labelledby="select-button"
				aria-activedescendant={
					isOpen && focusedIndex >= 0 ? `option-${focusedIndex}` : undefined
				}
			>
				<div className="flex items-center">
					<span>{selectedOption ? selectedOption.label : "Select..."}</span>
					{selectedOption && selectedOption.value === defaultProvider && (
						<span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
							Default
						</span>
					)}
				</div>
				<ChevronDown
					className={`h-5 w-5 transition-transform ${isOpen ? "transform rotate-180" : ""}`}
				/>
			</button>
			{isOpen && (
				// biome-ignore lint/a11y/useSemanticElements: Custom select component requires ARIA listbox pattern
				<div
					ref={listboxRef}
					className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
					role="listbox"
					aria-labelledby="select-button"
				>
					{options?.map((option, index) => (
						// biome-ignore lint/a11y/useSemanticElements: Custom select component requires ARIA listbox pattern
						<div
							key={option.value}
							id={`option-${index}`}
							className={`w-full text-left px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center select-none ${
								index === focusedIndex ? "bg-gray-100" : ""
							} ${
								index === selectedIndex ? "bg-blue-50" : ""
							}`}
							onClick={() => handleSelect(option.value)}
							onMouseEnter={() => setFocusedIndex(index)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleSelect(option.value);
								}
							}}
							role="option"
							aria-selected={index === selectedIndex}
							tabIndex={index === focusedIndex ? 0 : -1}
						>
							<span>{option.label}</span>
							{option.value === defaultProvider && (
								<span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
									Default
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default Select;
