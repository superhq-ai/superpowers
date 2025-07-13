import { Agent } from './agent';
import { browserTools } from './browser-tools';
import { browserHandlers } from './browser-handlers';
import { SUPERPOWERS_SYSTEM_PROMPT } from './system-prompts';

export const agent = new Agent({
    systemPrompt: SUPERPOWERS_SYSTEM_PROMPT,
    maxIterations: 10,
    tools: Object.values(browserTools),
    toolHandlers: browserHandlers,
});
