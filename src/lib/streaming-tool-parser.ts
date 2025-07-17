import type { ToolCall } from "../types/agent";

export interface ToolParseResult {
	toolCalls: ToolCall[];
	isComplete: boolean;
	hasToolBlock: boolean;
	plannerMessage?: string;
	displayMessage?: string;
}

export interface PlannerStep {
	id: string;
	content: string;
	type: "thinking" | "tool_execution" | "tool_result";
	timestamp: number;
	toolName?: string;
	toolResult?: any;
	isCompleted: boolean;
}

export class StreamingToolParser {
	private buffer: string = "";
	private inToolBlock: boolean = false;
	private toolCodeContent: string = "";
	private completedToolCalls: ToolCall[] = [];
	private blockStartPattern = /```tool_code\s*\n/;
	private blockEndPattern = /\n```/;

	// New: Track planning steps
	private plannerSteps: PlannerStep[] = [];
	private currentStepId: string = "";
	private contentBeforeToolBlock: string = "";
	private contentAfterToolBlocks: string = "";
	private processedContentLength: number = 0;

	/**
	 * Parse streaming content and extract tool calls
	 * @param chunk - New chunk of streaming content
	 * @returns Parse result with tool calls and completion status
	 */
	parse(chunk: string): ToolParseResult {
		this.buffer += chunk;

		// If we are not in a tool block, look for the start
		if (!this.inToolBlock) {
			return this.findToolBlockStart();
		}

		// If we are in a tool block, the new chunk is part of the tool code
		this.toolCodeContent += chunk;

		// If we are in a tool block, look for the end
		return this.findToolBlockEnd();
	}

	/**
	 * Reset the parser state
	 */
	reset(): void {
		this.buffer = "";
		this.inToolBlock = false;
		this.toolCodeContent = "";
		this.completedToolCalls = [];
		this.plannerSteps = [];
		this.currentStepId = "";
		this.contentBeforeToolBlock = "";
		this.contentAfterToolBlocks = "";
		this.processedContentLength = 0;
	}

	/**
	 * Get the current buffer content
	 */
	getBuffer(): string {
		return this.buffer;
	}

	/**
	 * Check if currently parsing a tool block
	 */
	isInToolBlock(): boolean {
		return this.inToolBlock;
	}

	private findToolBlockStart(): ToolParseResult {
		const match = this.buffer.match(this.blockStartPattern);

		if (!match || match.index === undefined) {
			// No tool block found, this is regular content
			const newContent = this.buffer.slice(this.processedContentLength);
			if (newContent) {
				this.updateCurrentPlannerStep(newContent, "thinking");
				this.processedContentLength = this.buffer.length;
			}

			return {
				toolCalls: [],
				isComplete: false,
				hasToolBlock: false,
				plannerMessage: newContent,
				displayMessage: "", // Don't show in main chat yet
			};
		}

		// Found the start of a tool block
		this.contentBeforeToolBlock = this.buffer.slice(
			this.processedContentLength,
			match.index,
		);

		// Add thinking step if there's content before the tool block
		if (this.contentBeforeToolBlock.trim()) {
			this.addPlannerStep(this.contentBeforeToolBlock.trim(), "thinking");
		}

		this.inToolBlock = true;
		const startIndex = match.index + match[0].length;

		// Extract content after the opening block
		this.toolCodeContent = this.buffer.slice(startIndex);

		// Check if the block is already complete in the buffer
		return this.findToolBlockEnd();
	}

	private findToolBlockEnd(): ToolParseResult {
		const endMatch = this.toolCodeContent.match(this.blockEndPattern);

		if (!endMatch || endMatch.index === undefined) {
			// Block not yet complete
			return {
				toolCalls: [],
				isComplete: false,
				hasToolBlock: true,
				plannerMessage: "", // Don't show incomplete tool blocks
				displayMessage: "",
			};
		}

		// Found the end of the tool block
		const jsonContent = this.toolCodeContent.slice(0, endMatch.index);
		this.inToolBlock = false;

		// Parse the JSON content
		const toolCalls = this.parseToolCalls(jsonContent);
		this.completedToolCalls.push(...toolCalls);

		// Add tool execution step to planner
		if (toolCalls.length > 0) {
			for (const toolCall of toolCalls) {
				this.addPlannerStep(
					`Executing ${toolCall.name}`,
					"tool_execution",
					toolCall.name,
				);
			}
		}

		// Get content after the tool block
		const fullToolBlockPattern = /```tool_code.*?\n```/s;
		const afterToolBlockMatch = this.buffer.match(fullToolBlockPattern);
		if (afterToolBlockMatch && afterToolBlockMatch.index !== undefined) {
			const endIndex =
				afterToolBlockMatch.index + afterToolBlockMatch[0].length;
			this.contentAfterToolBlocks = this.buffer.slice(endIndex);
		}

		return {
			toolCalls,
			isComplete: true,
			hasToolBlock: true,
			plannerMessage: "", // Tool execution doesn't show in planner message
			displayMessage: "",
		};
	}

	private parseToolCalls(jsonContent: string): ToolCall[] {
		try {
			const trimmedContent = jsonContent.trim();
			if (!trimmedContent) {
				return [];
			}

			const parsed = JSON.parse(trimmedContent);

			if (!parsed.tool_calls || !Array.isArray(parsed.tool_calls)) {
				return [];
			}

			return parsed.tool_calls.map((tc: Partial<ToolCall>) => ({
				id: crypto.randomUUID(),
				name: tc.name || "",
				arguments: tc.arguments || {},
			}));
		} catch (error) {
			console.warn("Failed to parse tool calls JSON:", error);
			return [];
		}
	}

	private addPlannerStep(
		content: string,
		type: PlannerStep["type"],
		toolName?: string,
	): void {
		const step: PlannerStep = {
			id: crypto.randomUUID(),
			content,
			type,
			timestamp: Date.now(),
			toolName,
			isCompleted: type === "thinking", // Thinking steps are immediately completed
		};

		this.plannerSteps.push(step);
		this.currentStepId = step.id;
	}

	private updateCurrentPlannerStep(
		content: string,
		type: PlannerStep["type"],
	): void {
		if (this.currentStepId) {
			const currentStep = this.plannerSteps.find(
				(s) => s.id === this.currentStepId,
			);
			if (currentStep && currentStep.type === type) {
				currentStep.content += content;
				return;
			}
		}

		// No current step or type changed, create new step
		this.addPlannerStep(content, type);
	}

	/**
	 * Add tool result to planner
	 */
	addToolResult(toolName: string, result: any, error?: string): void {
		const content = error ? `Error: ${error}` : `Completed ${toolName}`;
		this.addPlannerStep(content, "tool_result", toolName);

		// Mark corresponding tool execution step as completed
		const executionStep = this.plannerSteps
			.reverse()
			.find(
				(s) =>
					s.type === "tool_execution" &&
					s.toolName === toolName &&
					!s.isCompleted,
			);

		if (executionStep) {
			executionStep.isCompleted = true;
			executionStep.toolResult = result;
		}

		this.plannerSteps.reverse(); // Restore original order
	}

	/**
	 * Finalize parsing after the stream has ended.
	 * This will attempt to parse any remaining content in the buffer.
	 * @returns The final parse result
	 */
	finalize(): ToolParseResult {
		if (this.inToolBlock) {
			// The stream ended while inside a tool block.
			// Attempt to parse the content we have, assuming it's the complete JSON.
			this.inToolBlock = false;
			const toolCalls = this.parseToolCalls(this.toolCodeContent);
			this.completedToolCalls.push(...toolCalls);

			if (toolCalls.length > 0) {
				for (const toolCall of toolCalls) {
					this.addPlannerStep(
						`Executing ${toolCall.name}`,
						"tool_execution",
						toolCall.name,
					);
				}
			}

			return {
				toolCalls,
				isComplete: true,
				hasToolBlock: true,
				displayMessage: this.getDisplayMessage(),
			};
		}

		// Add any remaining content as thinking step
		const remainingContent = this.contentAfterToolBlocks || this.buffer;
		if (remainingContent.trim()) {
			this.addPlannerStep(remainingContent.trim(), "thinking");
		}

		return {
			toolCalls: this.completedToolCalls,
			isComplete: true,
			hasToolBlock: this.completedToolCalls.length > 0,
			displayMessage: this.getDisplayMessage(),
		};
	}

	/**
	 * Get diagnostic information about the current parser state
	 */
	getDiagnostics(): {
		inToolBlock: boolean;
		bufferLength: number;
		toolContentLength: number;
		hasPartialContent: boolean;
		plannerStepsCount: number;
	} {
		return {
			inToolBlock: this.inToolBlock,
			bufferLength: this.buffer.length,
			toolContentLength: this.toolCodeContent.length,
			hasPartialContent: this.inToolBlock && this.toolCodeContent.length > 0,
			plannerStepsCount: this.plannerSteps.length,
		};
	}

	/**
	 * Extract content with tool blocks removed
	 */
	getContentWithoutToolBlocks(): string {
		return this.buffer.replace(/```tool_code.*?\n```/gs, "").trim();
	}

	/**
	 * Extract all content that comes after a completed tool block
	 */
	getContentAfterToolBlock(): string {
		if (!this.inToolBlock && this.buffer.includes("```tool_code")) {
			const toolBlockMatch = this.buffer.match(/```tool_code.*?\n```/s);
			if (toolBlockMatch && toolBlockMatch.index !== undefined) {
				const endIndex = toolBlockMatch.index + toolBlockMatch[0].length;
				return this.buffer.slice(endIndex);
			}
		}
		return this.buffer;
	}

	/**
	 * Get the complete message content (useful for final response)
	 */
	getCompleteMessage(): string {
		return this.buffer;
	}

	/**
	 * Get display message (content without tool blocks)
	 */
	getDisplayMessage(): string {
		return this.getContentWithoutToolBlocks();
	}

	/**
	 * Get already completed tool calls
	 */
	getCompletedToolCalls(): ToolCall[] {
		return this.completedToolCalls;
	}

	/**
	 * Get all planner steps
	 */
	getPlannerSteps(): PlannerStep[] {
		return this.plannerSteps;
	}

	/**
	 * Get current planner step
	 */
	getCurrentPlannerStep(): PlannerStep | null {
		return this.plannerSteps.find((s) => s.id === this.currentStepId) || null;
	}

	/**
	 * Check if there are any incomplete tool executions
	 */
	hasIncompleteToolExecutions(): boolean {
		return this.plannerSteps.some(
			(s) => s.type === "tool_execution" && !s.isCompleted,
		);
	}
}
