import { useCallback, useEffect, useState } from "react";

interface ChromeStorageOptions {
	storageArea?: "sync" | "local";
	onError?: (error: string) => void;
}

export function useChromeStorage<T>(
	key: string,
	defaultValue: T,
	options: ChromeStorageOptions = {},
) {
	const { storageArea = "sync", onError } = options;
	const [value, setValue] = useState<T>(defaultValue);
	const [isLoading, setIsLoading] = useState(true);

	// Load initial value from Chrome storage
	useEffect(() => {
		const loadFromStorage = async () => {
			try {
				if (
					typeof chrome !== "undefined" &&
					chrome.storage &&
					chrome.storage[storageArea]
				) {
					chrome.storage[storageArea].get([key], (result) => {
						if (chrome.runtime.lastError) {
							const errorMsg = `Chrome storage error: ${chrome.runtime.lastError.message}`;
							console.warn(errorMsg);
							onError?.(errorMsg);
						} else if (result[key] !== undefined) {
							setValue(result[key]);
						}
						setIsLoading(false);
					});
				} else {
					const errorMsg = `Chrome storage.${storageArea} is not available.`;
					console.warn(errorMsg);
					onError?.(errorMsg);
					setIsLoading(false);
				}
			} catch (error) {
				const errorMsg = `Failed to load from Chrome storage: ${error}`;
				console.warn(errorMsg);
				onError?.(errorMsg);
				setIsLoading(false);
			}
		};

		loadFromStorage();
	}, [key, storageArea, onError]);

	// Save value to Chrome storage
	const saveValue = useCallback(
		(newValue: T) => {
			try {
				if (
					typeof chrome !== "undefined" &&
					chrome.storage &&
					chrome.storage[storageArea]
				) {
					chrome.storage[storageArea].set({ [key]: newValue }, () => {
						if (chrome.runtime.lastError) {
							const errorMsg = `Chrome storage save error: ${chrome.runtime.lastError.message}`;
							console.warn(errorMsg);
							onError?.(errorMsg);
						}
					});
				}
			} catch (error) {
				const errorMsg = `Failed to save to Chrome storage: ${error}`;
				console.warn(errorMsg);
				onError?.(errorMsg);
			}
		},
		[key, storageArea, onError],
	);

	// Update value and save to storage
	const updateValue = useCallback(
		(newValue: T | ((prev: T) => T)) => {
			setValue((prevValue) => {
				const updatedValue =
					typeof newValue === "function"
						? (newValue as (prev: T) => T)(prevValue)
						: newValue;
				saveValue(updatedValue);
				return updatedValue;
			});
		},
		[saveValue],
	);

	// Check if Chrome storage is available
	const isStorageAvailable = useCallback(() => {
		return (
			typeof chrome !== "undefined" &&
			chrome.storage &&
			chrome.storage[storageArea]
		);
	}, [storageArea]);

	return {
		value,
		setValue: updateValue,
		saveValue,
		isLoading,
		isStorageAvailable: isStorageAvailable(),
	};
}
