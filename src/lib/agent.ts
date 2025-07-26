import { RUNTIME_MESSAGES } from "../constants";
import { streamLlm } from "../services/llm";
import type { LLMMessage, UseLLMOptions } from "../types";
import type {
	AgentMessage,
	AgentOptions,
	AgentResponse,
	Tool,
	ToolCall,
	ToolResult,
} from "../types/agent";
import { type PlannerStep, StreamingToolParser } from "./streaming-tool-parser";

export interface ExtendedAgentResponse extends AgentResponse {
	plannerSteps: PlannerStep[];
}

export class Agent {
	private tools: Tool[] = [];
	private toolHandlers: Record<string, (args: any) => Promise<any>> = {};
	private systemPrompt: string;
	private maxIterations: number;
	private stream: ReadableStream<string> | null = null;
	private isStopped = false;

	constructor(options: AgentOptions = {}) {
		this.systemPrompt =
			options.systemPrompt ||
			"You are an AI assistant. Answer the user's questions to the best of your ability.";
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
			const toolDefinitions = this.tools.map((tool) => ({
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

Before using tools, explain your reasoning and approach. When tool calls are needed, make them, and then continue with your response based on the results.
`;
		}

		return prompt;
	}

	private convertToLLMMessages(messages: AgentMessage[]): LLMMessage[] {
		return messages.map((msg) => {
			const llmMessage: LLMMessage = {
				role: msg.role,
				content: msg.content,
			};

			if (msg.attachments) {
				llmMessage.images = msg.attachments
					.filter((att) => att.type === "image")
					.map((att) => att.data);
			}

			if (msg.toolCalls) {
				llmMessage.tool_calls = msg.toolCalls;
			}

			if (msg.role === "tool" && msg.toolCallId) {
				llmMessage.tool_call_id = msg.toolCallId;
			}

			return llmMessage;
		});
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
						error: `Tool "${toolCall.name}" not found`,
					});
					continue;
				}

				const result = await handler(toolCall.arguments);
				results.push({
					id: toolCall.id,
					name: toolCall.name,
					result,
				});
			} catch (error) {
				results.push({
					id: toolCall.id,
					name: toolCall.name,
					result: null,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		return results;
	}

	async run(
		history: AgentMessage[],
		llmOptions: UseLLMOptions,
		onProgress?: (response: Partial<ExtendedAgentResponse>) => void,
		context?: any,
	): Promise<ExtendedAgentResponse> {
		if (context?.url) {
			this.systemPrompt += `\n\n## CURRENT PAGE CONTEXT\n\nYou are currently on tab ID ${context.id}, titled "${context.title}" (${context.url})\n`;
		}

		this.isStopped = false;
		const messages = [...history];

		let iterations = 0;
		let lastResponse = "";
		const allToolCalls: ToolCall[] = [];
		const allToolResults: ToolResult[] = [];
		const parser = new StreamingToolParser();

		const finalSystemPrompt = this.buildSystemPrompt();

		while (iterations < this.maxIterations) {
			if (this.isStopped) {
				return {
					message: "Operation stopped by user.",
					finished: true,
					iterations,
					toolCalls: allToolCalls,
					toolResults: allToolResults,
					plannerSteps: parser.getPlannerSteps(),
				};
			}
			iterations++;

			// Reset parser for new iteration
			parser.reset();

			// Convert messages to LLM format
			const llmMessages = this.convertToLLMMessages(messages);
			const finalLlmOptions = {
				...llmOptions,
				systemPrompt: finalSystemPrompt,
			};

			// Get LLM response
			this.stream = streamLlm(llmMessages, finalLlmOptions);
			const reader = this.stream.getReader();
			let done = false;

			while (!done) {
				if (this.isStopped) {
					reader.cancel();
					break;
				}

				const { value, done: readerDone } = await reader.read();
				done = readerDone;

				if (value) {
					const chunk = value;
					parser.parse(chunk);

					// Send progress update with planner information
					onProgress?.({
						message: chunk,
						iterations,
						finished: false,
						plannerSteps: parser.getPlannerSteps(),
					});
				}
			}

			if (this.isStopped) {
				return {
					message: "Operation stopped by user.",
					finished: true,
					iterations,
					toolCalls: allToolCalls,
					toolResults: allToolResults,
					plannerSteps: parser.getPlannerSteps(),
				};
			}

			const finalParseResult = parser.finalize();
			lastResponse = parser.getDisplayMessage();
			const toolCalls = finalParseResult.toolCalls;

			if (toolCalls.length === 0) {
				// No tool calls, we are done
				return {
					message: lastResponse,
					toolCalls: allToolCalls,
					toolResults: allToolResults,
					iterations,
					finished: true,
					plannerSteps: parser.getPlannerSteps(),
				};
			}

			// Execute tool calls
			allToolCalls.push(...toolCalls);
			const toolResults = await this.executeToolCalls(toolCalls);
			allToolResults.push(...toolResults);

			// Update planner with tool results
			for (const result of toolResults) {
				parser.addToolResult(result.name, result.result, result.error);
			}

			// Add assistant message with tool calls
			messages.push({
				id: crypto.randomUUID(),
				role: "assistant",
				content: parser.getCompleteMessage(),
				toolCalls,
			});

			// Add tool results to messages
			for (const result of toolResults) {
				const toolMessage: AgentMessage = {
					id: crypto.randomUUID(),
					role: "tool",
					toolCallId: result.id,
					content: result.error
						? `Tool "${result.name}" failed: ${result.error}`
						: JSON.stringify(result.result),
				};
				messages.push(toolMessage);
			}

			// Notify progress with updated planner steps
			onProgress?.({
				toolCalls: allToolCalls,
				toolResults: allToolResults,
				iterations,
				finished: false,
				plannerSteps: parser.getPlannerSteps(),
			});
		}

		// Max iterations reached
		return {
			message: lastResponse,
			toolCalls: allToolCalls,
			toolResults: allToolResults,
			iterations,
			finished: false,
			plannerSteps: parser.getPlannerSteps(),
		};
	}

	stop() {
		this.isStopped = true;
		if (this.stream) {
			this.stream.cancel();
		}
	}
}
