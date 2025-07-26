import { Agent } from "./agent";
import { browserHandlers } from "./browser-handlers";
import { browserTools } from "./browser-tools";
import { SUPERPOWERS_SYSTEM_PROMPT } from "./system-prompts";

export const agent = new Agent({
	systemPrompt: SUPERPOWERS_SYSTEM_PROMPT,
	maxIterations: 100,
	tools: [...Object.values(browserTools)],
	toolHandlers: {
		...browserHandlers,
	},
});
