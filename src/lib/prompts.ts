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
	getMessages: (args: any) => Promise<AgentMessage[]>;
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
					content: `Please summarize the following text:\n\n${args.text}`,
				},
			];
		},
	},
];
