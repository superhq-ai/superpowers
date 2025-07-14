export class ProviderApiError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ProviderApiError";
	}
}

export class ConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ConfigError";
	}
}
