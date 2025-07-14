import { RUNTIME_MESSAGES } from "../constants";
import type { LLMMessage, UseLLMOptions } from "../types";
import type {
    Tool,
    ToolCall,
    ToolResult,
    AgentMessage,
    AgentOptions,
    AgentResponse
} from "../types/agent";
import { streamLlm } from "../services/llm";
import { readStream } from "./utils";
import { TOOL_CALL_JSON_CODE_BLOCK_REGEX } from "./regex";

export class Agent {
    private tools: Tool[] = [];
    private toolHandlers: Record<string, (args: any) => Promise<any>> = {};
    private systemPrompt: string;
    private maxIterations: number;
    private stream: ReadableStream<string> | null = null;
    private isStopped = false;
    private llmsNotFoundCache: Set<string> = new Set();

    constructor(options: AgentOptions = {}) {
        this.systemPrompt = options.systemPrompt || "You are an AI assistant. Answer the user's questions to the best of your ability.";
        this.maxIterations = options.maxIterations || 10;
        this.tools = options.tools || [];
        this.toolHandlers = options.toolHandlers || {};
    }

    addTool(tool: Tool, handler: (args: any) => Promise<any>) {
        this.tools.push(tool);
        this.toolHandlers[tool.name] = handler;
    }

    private buildSystemPrompt(): string {
        let prompt = this.systemPrompt;

        if (this.tools.length > 0) {
            const toolDefinitions = this.tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
            }));

            prompt += `
You have access to the following tools. Use them to answer the user's questions.

<tools>
${JSON.stringify(toolDefinitions, null, 2)}
</tools>

To use a tool, respond with a JSON object inside a markdown code block with the language set to "tool_code". The JSON object must contain a "tool_calls" array with each tool call having a "name" and "arguments".

For example, to use a tool named "search" with a "query" argument, you would respond with:
\`\`\`tool_code
{
  "tool_calls": [
    {
      "name": "search",
      "arguments": {
        "query": "latest AI news"
      }
    }
  ]
}
\`\`\`
`;
        }

        return prompt;
    }

    private convertToLLMMessages(messages: AgentMessage[]): LLMMessage[] {
        return messages.map(msg => {
            const llmMessage: LLMMessage = {
                role: msg.role,
                content: msg.content,
            };

            if (msg.attachments) {
                llmMessage.images = msg.attachments
                    .filter(att => att.type === 'image')
                    .map(att => att.data);
            }

            if (msg.toolCalls) {
                llmMessage.tool_calls = msg.toolCalls;
            }

            if (msg.role === 'tool' && msg.toolCallId) {
                llmMessage.tool_call_id = msg.toolCallId;
            }

            return llmMessage;
        });
    }

    private parseLlmOutput(content: string): { toolCalls: ToolCall[] } {
        try {
            const jsonMatch = content.match(TOOL_CALL_JSON_CODE_BLOCK_REGEX);
            if (!jsonMatch) return { toolCalls: [] };

            const parsed = JSON.parse(jsonMatch[1]);
            const toolCalls = parsed.tool_calls && Array.isArray(parsed.tool_calls)
                ? parsed.tool_calls.map((tc: Partial<ToolCall>) => ({
                    id: crypto.randomUUID(),
                    name: tc.name,
                    arguments: tc.arguments || {}
                }))
                : [];

            return { toolCalls };
        } catch (error) {
            console.warn("Failed to parse LLM output:", error);
        }
        return { toolCalls: [] };
    }

    private async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
        const results: ToolResult[] = [];

        for (const toolCall of toolCalls) {
            try {
                const handler = this.toolHandlers[toolCall.name];
                if (!handler) {
                    results.push({
                        id: toolCall.id,
                        name: toolCall.name,
                        result: null,
                        error: `Tool "${toolCall.name}" not found`
                    });
                    continue;
                }

                const result = await handler(toolCall.arguments);
                results.push({
                    id: toolCall.id,
                    name: toolCall.name,
                    result
                });
            } catch (error) {
                results.push({
                    id: toolCall.id,
                    name: toolCall.name,
                    result: null,
                    error: error instanceof Error ? error.message : "Unknown error"
                });
            }
        }

        return results;
    }

    async run(
        history: AgentMessage[],
        llmOptions: UseLLMOptions,
        onProgress?: (response: Partial<AgentResponse>) => void,
        context?: any
    ): Promise<AgentResponse> {
        if (context && context.url) {
            this.systemPrompt += `\n\n## CURRENT PAGE CONTEXT\n\nYou are currently on tab ID ${context.id}, titled "${context.title}" (${context.url})\n`;
            const baseUrl = new URL(context.url).hostname;
            if (!this.llmsNotFoundCache.has(baseUrl)) {
                const llmsData = await chrome.runtime.sendMessage({ type: RUNTIME_MESSAGES.FETCH_LLMS, data: { url: context.url } });
                if (llmsData && llmsData.llms) {
                    this.systemPrompt += `\n\n## CONTEXT FROM WEBSITE\n\n${llmsData.llms}`;
                } else {
                    this.llmsNotFoundCache.add(baseUrl);
                }
            }
        }
        this.isStopped = false;
        const messages = [...history];

        let iterations = 0;
        let lastResponse = "";
        let allToolCalls: ToolCall[] = [];
        let allToolResults: ToolResult[] = [];

        const finalSystemPrompt = this.buildSystemPrompt();

        while (iterations < this.maxIterations) {
            if (this.isStopped) {
                return {
                    message: "Operation stopped by user.",
                    finished: true,
                    iterations,
                    toolCalls: allToolCalls,
                    toolResults: allToolResults
                };
            }
            iterations++;

            // Convert messages to LLM format
            const llmMessages = this.convertToLLMMessages(messages);
            const finalLlmOptions = {
                ...llmOptions,
                systemPrompt: finalSystemPrompt
            };

            // Get LLM response
            this.stream = streamLlm(llmMessages, finalLlmOptions);
            let response = "";
            try {
                response = await readStream(this.stream, (chunk) => {
                    if (this.isStopped) {
                        this.stream?.cancel();
                        return;
                    }
                    onProgress?.({
                        message: chunk,
                        iterations,
                        finished: false
                    });
                });
            } catch (error) {
                if (this.isStopped) {
                    return {
                        message: "Operation stopped by user.",
                        finished: true,
                        iterations,
                        toolCalls: allToolCalls,
                        toolResults: allToolResults
                    };
                }
                throw error;
            }


            if (this.isStopped) {
                return {
                    message: "Operation stopped by user.",
                    finished: true,
                    iterations,
                    toolCalls: allToolCalls,
                    toolResults: allToolResults
                };
            }

            lastResponse = response;

            // Check for tool calls
            const { toolCalls } = this.parseLlmOutput(response);

            if (toolCalls.length === 0) {
                // No tool calls, we're done
                return {
                    message: response,
                    toolCalls: allToolCalls,
                    toolResults: allToolResults,
                    iterations,
                    finished: true
                };
            }

            // Execute tool calls
            allToolCalls.push(...toolCalls);
            const toolResults = await this.executeToolCalls(toolCalls);
            allToolResults.push(...toolResults);

            // Add assistant message with tool calls
            messages.push({
                role: "assistant",
                content: response,
                toolCalls
            });

            // Add tool results to messages
            for (const result of toolResults) {
                const toolMessage: AgentMessage = {
                    role: "tool",
                    toolCallId: result.id,
                    content: result.error
                        ? `Tool "${result.name}" failed: ${result.error}`
                        : JSON.stringify(result.result)
                };
                messages.push(toolMessage);
            }

            // Notify progress
            onProgress?.({
                message: response,
                toolCalls: allToolCalls,
                toolResults: allToolResults,
                iterations,
                finished: false
            });

        }

        // Max iterations reached
        return {
            message: lastResponse,
            toolCalls: allToolCalls,
            toolResults: allToolResults,
            iterations,
            finished: false
        };
    }

    stop() {
        this.isStopped = true;
        if (this.stream) {
            this.stream.cancel();
        }
    }

}
