import type { ToolCall } from "../types/agent";

export interface ToolParseResult {
	toolCalls: ToolCall[];
	isComplete: boolean;
	hasToolBlock: boolean;
}

export class StreamingToolParser {
	private buffer: string = "";
	private inToolBlock: boolean = false;
	private toolCodeContent: string = "";
	private completedToolCalls: ToolCall[] = [];
	private blockStartPattern = /```tool_code\s*\n/;
	private blockEndPattern = /\n```/;

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

		if (!match) {
			return {
				toolCalls: [],
				isComplete: false,
				hasToolBlock: false,
			};
		}

		// Found the start of a tool block
		this.inToolBlock = true;
		const startIndex = match.index! + match[0].length;

		// Extract content after the opening block
		this.toolCodeContent = this.buffer.slice(startIndex);

		// Check if the block is already complete in the buffer
		return this.findToolBlockEnd();
	}

	private findToolBlockEnd(): ToolParseResult {
		const endMatch = this.toolCodeContent.match(this.blockEndPattern);

		if (!endMatch) {
			// Block not yet complete
			return {
				toolCalls: [],
				isComplete: false,
				hasToolBlock: true,
			};
		}

		// Found the end of the tool block
		const jsonContent = this.toolCodeContent.slice(0, endMatch.index!);
		this.inToolBlock = false;

		// Parse the JSON content
		const toolCalls = this.parseToolCalls(jsonContent);
		this.completedToolCalls = toolCalls;

		return {
			toolCalls,
			isComplete: true,
			hasToolBlock: true,
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
			this.completedToolCalls = toolCalls;
			return {
				toolCalls,
				isComplete: true,
				hasToolBlock: true,
			};
		}

		// If not in a tool block, it means either no tool block was found,
		// or it was already completed and parsed.
		// In either case, the completed calls are what we have.
		return {
			toolCalls: this.completedToolCalls,
			isComplete: true,
			hasToolBlock: this.completedToolCalls.length > 0,
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
	} {
		return {
			inToolBlock: this.inToolBlock,
			bufferLength: this.buffer.length,
			toolContentLength: this.toolCodeContent.length,
			hasPartialContent: this.inToolBlock && this.toolCodeContent.length > 0,
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
			if (toolBlockMatch) {
				const endIndex = toolBlockMatch.index! + toolBlockMatch[0].length;
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
	 * Get already completed tool calls
	 */
	getCompletedToolCalls(): ToolCall[] {
		return this.completedToolCalls;
	}
}
