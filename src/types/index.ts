import type { ToolCall, ToolResult, Attachment } from "./agent";

export type Message = {
	id: number | string;
	type: "user" | "assistant";
	content: string;
	toolCalls?: ToolCall[];
	toolResults?: ToolResult[];
	attachments?: Attachment[];
};

export type LLMProvider = "gemini";

export type LLMMessage = {
	role: "user" | "assistant" | "system" | "tool";
	content: string;
	images?: string[]; // base64 encoded images
	tool_calls?: ToolCall[];
	tool_call_id?: string;
};

export interface UseLLMOptions {
	provider: LLMProvider;
	model: string;
	systemPrompt?: string;
	attachments?: Attachment[];
	temperature?: number;
	maxTokens?: number;
	topP?: number;
	apiKey?: string;
}

export type LLMApiKeys = { [key in LLMProvider]?: string };

export interface BackgroundRequest {
	messages: LLMMessage[];
	options: UseLLMOptions;
}

export type BackgroundResponse =
	| {
			type: "stream";
			content: string;
	  }
	| {
			type: "error";
			error: string;
	  }
	| {
			type: "done";
	  };

export interface AppSettings {
	apiKeys: LLMApiKeys;
	selectedProvider: LLMProvider;
	model: string;
	defaultProvider?: LLMProvider;
}
