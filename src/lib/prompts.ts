import type { AgentMessage } from "../types/agent";

export interface Prompt {
	name: string;
	description: string;
	llmTrigger: boolean;
	arguments?: {
		name: string;
		description?: string;
		required?: boolean;
	}[];
	getMessages: (args: Record<string, unknown>) => Promise<AgentMessage[]>;
}

export const PROMPTS: Prompt[] = [
	{
		name: "help",
		description: "Show available commands",
		llmTrigger: false,
		getMessages: async () => {
			const helpText = PROMPTS.map(
				(p) => `**/${p.name}**: ${p.description}`,
			).join("\n");
			return [
				{
					id: crypto.randomUUID(),
					role: "assistant",
					content: `**Available commands**:\n${helpText}`,
				},
			];
		},
	},
	{
		name: "summarize",
		description: "Summarize the provided text",
		llmTrigger: true,
		arguments: [
			{
				name: "text",
				description: "The text to summarize",
				required: true,
			},
		],
		getMessages: async (args: { text: string }) => {
			return [
				{
					id: crypto.randomUUID(),
					role: "user",
					content: args.text
						? `Please summarize the following text:\n\n${args.text}`
						: `Summarize the page content using the \`getPageContent\` tool.`,
				},
			];
		},
	},
	{
		name: "test",
		description: "Test the AI connection",
		llmTrigger: true,
		getMessages: async () => {
			return [
				{
					id: crypto.randomUUID(),
					role: "user",
					content:
						"Hello! Please introduce yourself briefly and confirm you're working correctly.",
				},
			];
		},
	},
	{
		name: "model",
		description: "Switch AI model or show available models",
		llmTrigger: false,
		arguments: [
			{
				name: "action",
				description:
					"Model name to switch to, or 'list' to show available models",
				required: false,
			},
		],
		getMessages: async () => {
			// This command doesn't generate LLM messages - it's handled in the UI
			return [];
		},
	},
];
