import type { AppSettings } from "../types";

// Chrome storage limits
const SYNC_QUOTA_BYTES = 102400; // 100KB

interface StorageStats {
	totalBytes: number;
	itemCount: number;
	largestItem: { key: string; size: number };
	quotaUsage: number;
}

export class StorageOptimizer {
	/**
	 * Get storage usage statistics
	 */
	static async getStorageStats(): Promise<StorageStats> {
		const data = await chrome.storage.sync.get(null);
		const items = Object.entries(data);

		let totalBytes = 0;
		let largestItem = { key: "", size: 0 };

		for (const [key, value] of items) {
			const size = new Blob([JSON.stringify(value)]).size;
			totalBytes += size;

			if (size > largestItem.size) {
				largestItem = { key, size };
			}
		}

		return {
			totalBytes,
			itemCount: items.length,
			largestItem,
			quotaUsage: totalBytes / SYNC_QUOTA_BYTES,
		};
	}

	/**
	 * Optimize settings to fit within Chrome storage limits
	 */
	static optimizeSettings(settings: AppSettings): AppSettings {
		const optimized = { ...settings };

		// Limit model cache entries
		if (optimized.modelCache) {
			const cacheEntries = Object.entries(optimized.modelCache);

			// Keep only the 10 most recent cache entries
			const sortedEntries = cacheEntries
				.sort(([, a], [, b]) => b.timestamp - a.timestamp)
				.slice(0, 10);

			optimized.modelCache = Object.fromEntries(sortedEntries);
		}

		// Limit custom models per provider
		if (optimized.customModels) {
			for (const [provider, models] of Object.entries(optimized.customModels)) {
				if (models && models.length > 20) {
					// Keep only the 20 most recently added custom models
					optimized.customModels[
						provider as keyof typeof optimized.customModels
					] = models.slice(-20);
				}
			}
		}

		return optimized;
	}

	/**
	 * Save settings with automatic optimization
	 */
	static async saveSettings(settings: AppSettings): Promise<void> {
		const optimized = StorageOptimizer.optimizeSettings(settings);

		try {
			await chrome.storage.sync.set({ settings: optimized });
		} catch (error) {
			if (error instanceof Error && error.message.includes("quota")) {
				console.warn(
					"Storage quota exceeded, applying aggressive optimization",
				);

				// Aggressive optimization
				const aggressivelyOptimized = {
					...optimized,
					modelCache: {}, // Clear all cache
					customModels: Object.fromEntries(
						Object.entries(optimized.customModels || {}).map(
							([provider, models]) => [
								provider,
								models?.slice(-5) || [], // Keep only 5 custom models per provider
							],
						),
					),
				};

				await chrome.storage.sync.set({ settings: aggressivelyOptimized });
			} else {
				throw error;
			}
		}
	}

	/**
	 * Move large data to local storage if needed
	 */
	static async migrateToLocalStorage(): Promise<void> {
		const stats = await StorageOptimizer.getStorageStats();

		if (stats.quotaUsage > 0.8) {
			// If using more than 80% of quota
			console.log("Migrating large data to local storage");

			const syncData = await chrome.storage.sync.get(null);

			// Move model cache to local storage
			if (syncData.settings?.modelCache) {
				await chrome.storage.local.set({
					modelCache: syncData.settings.modelCache,
				});

				// Remove from sync storage
				const updatedSettings = { ...syncData.settings };
				delete updatedSettings.modelCache;
				await chrome.storage.sync.set({ settings: updatedSettings });
			}
		}
	}

	/**
	 * Get model cache from appropriate storage
	 */
	static async getModelCache(): Promise<
		Record<string, { models: string[]; timestamp: number }>
	> {
		// Try local storage first
		const localData = await chrome.storage.local.get(["modelCache"]);
		if (localData.modelCache) {
			return localData.modelCache;
		}

		// Fallback to sync storage
		const syncData = await chrome.storage.sync.get(["settings"]);
		return syncData.settings?.modelCache || {};
	}

	/**
	 * Save model cache to appropriate storage
	 */
	static async saveModelCache(
		cache: Record<string, { models: string[]; timestamp: number }>,
	): Promise<void> {
		// Always save to local storage to avoid quota issues
		await chrome.storage.local.set({ modelCache: cache });

		// Also update sync storage settings to remove cache if it exists
		const syncData = await chrome.storage.sync.get(["settings"]);
		if (syncData.settings?.modelCache) {
			const updatedSettings = { ...syncData.settings };
			delete updatedSettings.modelCache;
			await chrome.storage.sync.set({ settings: updatedSettings });
		}
	}

	/**
	 * Clean up old data
	 */
	static async cleanup(): Promise<void> {
		const now = Date.now();
		const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

		// Clean up old model cache entries
		const cache = await StorageOptimizer.getModelCache();
		const cleanedCache = Object.fromEntries(
			Object.entries(cache).filter(([, data]) => data.timestamp > oneWeekAgo),
		);

		if (Object.keys(cleanedCache).length !== Object.keys(cache).length) {
			await StorageOptimizer.saveModelCache(cleanedCache);
		}
	}

	/**
	 * Get storage usage warning
	 */
	static async getStorageWarning(): Promise<string | null> {
		const stats = await StorageOptimizer.getStorageStats();

		if (stats.quotaUsage > 0.9) {
			return "Storage almost full! Some features may not work properly.";
		} else if (stats.quotaUsage > 0.8) {
			return "Storage usage is high. Consider clearing some data.";
		}

		return null;
	}

	/**
	 * Initialize storage optimization
	 */
	static async initialize(): Promise<void> {
		// Run cleanup
		await StorageOptimizer.cleanup();

		// Migrate if needed
		await StorageOptimizer.migrateToLocalStorage();

		// Set up periodic cleanup (every hour)
		if (typeof setInterval !== "undefined") {
			setInterval(
				() => {
					StorageOptimizer.cleanup().catch(console.error);
				},
				60 * 60 * 1000,
			);
		}
	}
}

// Helper function to estimate object size in bytes
export function getObjectSize(obj: any): number {
	return new Blob([JSON.stringify(obj)]).size;
}

// Helper function to compress model list for storage
export function compressModelList(models: string[]): string {
	// Simple compression: join with a delimiter
	return models.join("|");
}

// Helper function to decompress model list from storage
export function decompressModelList(compressed: string): string[] {
	return compressed ? compressed.split("|") : [];
}
