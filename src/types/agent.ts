export interface Tool {
    name: string;
    description: string;
    parameters: {
        type: "object";
        properties: Record<string, {
            type: string;
            description: string;
            required?: boolean;
        }>;
        required?: string[];
    };
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, any>;
}

export interface ToolResult {
    id: string;
    name: string;
    result: any;
    error?: string;
}

export interface Attachment {
    type: 'image';
    mediaType: string;
    data: string;
}

export interface AgentMessage {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    toolCallId?: string;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
    attachments?: Attachment[];
}

export interface AgentOptions {
    systemPrompt?: string;
    maxIterations?: number;
    tools?: Tool[];
    toolHandlers?: Record<string, (args: any) => Promise<any>>;
}

export interface AgentResponse {
    message: string;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
    iterations: number;
    finished: boolean;
}
