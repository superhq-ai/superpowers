import {
    GoogleGenerativeAI,
} from "@google/generative-ai";
import type {
    GenerateContentStreamResult,
    Content,
    Part
} from "@google/generative-ai";
import type { LLMMessage, UseLLMOptions } from "../../types";
import { ProviderApiError } from "../errors";
import type { LLM } from "./index";

export class GeminiProvider implements LLM {
    // TODO: Replace this with an actual API call to list available models
    static async listModels(): Promise<string[]> {
        return Promise.resolve([
            "gemini-2.0-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest",
            "gemini-2.5-pro",
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-1.0-pro"
        ]);
    }

    async *generate(
        messages: LLMMessage[],
        options: UseLLMOptions,
        apiKey: string,
        signal?: AbortSignal
    ): AsyncGenerator<string> {
        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
            model: options.model,
            systemInstruction: options.systemPrompt
        });

        const contents = this.formatMessages(messages);

        try {
            const result: GenerateContentStreamResult =
                await model.generateContentStream({ contents }, { signal });

            for await (const chunk of result.stream) {
                yield chunk.text();
            }
        } catch (err) {
            const error = err as Error;
            throw new ProviderApiError(error.message);
        }
    }

    private formatMessages(messages: LLMMessage[]): Content[] {
        const contents: Content[] = [];
        const filteredMessages = messages.filter(msg => msg.role !== "system");

        let i = 0;
        while (i < filteredMessages.length) {
            const message = filteredMessages[i];
            let role = message.role === "assistant" ? "model" : "user";
            const parts: Part[] = [];

            if (message.content && message.role !== "tool") {
                parts.push({ text: message.content });
            }

            if (message.images) {
                parts.push(...message.images.map(img => ({
                    inlineData: { mimeType: "image/jpeg", data: img }
                })));
            }

            if (message.tool_calls) {
                parts.push(...message.tool_calls.map(tc => ({
                    functionCall: { name: tc.name, args: tc.arguments }
                })));
            }

            if (message.role === "tool") {
                // Gemini expects all tool responses for a given turn to be in a single message.
                role = "function";
                const toolMessages = [message];
                // Group consecutive tool messages
                while (i + 1 < filteredMessages.length && filteredMessages[i + 1].role === "tool") {
                    toolMessages.push(filteredMessages[i + 1]);
                    i++;
                }

                for (const toolMessage of toolMessages) {
                    if (toolMessage.tool_call_id) {
                        const originalCall = messages
                            .flatMap(m => m.tool_calls || [])
                            .find(tc => tc.id === toolMessage.tool_call_id);

                        if (originalCall) {
                            let responsePayload: any;
                            try {
                                responsePayload = JSON.parse(toolMessage.content);
                            } catch (e) {
                                responsePayload = { content: toolMessage.content };
                            }

                            if (typeof responsePayload !== 'object' || responsePayload === null || Array.isArray(responsePayload)) {
                                responsePayload = { content: responsePayload };
                            }

                            parts.push({
                                functionResponse: {
                                    name: originalCall.name,
                                    response: responsePayload
                                }
                            });
                        }
                    }
                }
            }

            if (parts.length > 0) {
                contents.push({ role, parts });
            }
            i++;
        }

        return contents;
    }
}
