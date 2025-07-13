import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

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

const Select = ({ options, value, onChange, label, defaultProvider }: SelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);
    const [focusedIndex, setFocusedIndex] = useState(-1);

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
            setFocusedIndex((prevIndex) => (prevIndex + 1) % options.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedIndex((prevIndex) => (prevIndex - 1 + options.length) % options.length);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const selectedOption = options ? options.find((option) => option.value === value) : undefined;

    return (
        <div className="relative" ref={selectRef}>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div
                className="mt-1 w-full px-3 py-2 bg-white/80 backdrop-blur-md border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm text-gray-900 flex justify-between items-center cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                <div className="flex items-center">
                    <span>{selectedOption ? selectedOption.label : "Select..."}</span>
                    {selectedOption && selectedOption.value === defaultProvider && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                            Default
                        </span>
                    )}
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "transform rotate-180" : ""}`} />
            </div>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                    {options && options.map((option, index) => (
                        <div
                            key={option.value}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center select-none ${index === focusedIndex ? "bg-gray-100" : ""
                                }`}
                            onClick={() => handleSelect(option.value)}
                            onMouseEnter={() => setFocusedIndex(index)}
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
