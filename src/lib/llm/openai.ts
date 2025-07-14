import OpenAI from "openai";
import type { LLMMessage, UseLLMOptions } from "../../types";
import { ProviderApiError } from "../errors";
import type { LLM } from "./index";

export class OpenAIProvider implements LLM {
    static async listModels(apiKey?: string): Promise<string[]> {
        if (!apiKey) {
            return [
                "gpt-4o",
                "gpt-4o-mini",
                "gpt-4-turbo",
                "gpt-4",
                "gpt-3.5-turbo",
                "gpt-3.5-turbo-16k"
            ];
        }

        try {
            const openai = new OpenAI({ apiKey });
            const models = await openai.models.list();
            return models.data
                .filter(model => model.id.startsWith('gpt-'))
                .map(model => model.id)
                .sort();
        } catch (error) {
            console.warn("Failed to fetch OpenAI models:", error);
            return [
                "gpt-4o",
                "gpt-4o-mini",
                "gpt-4-turbo",
                "gpt-4",
                "gpt-3.5-turbo",
                "gpt-3.5-turbo-16k"
            ];
        }
    }

    async *generate(
        messages: LLMMessage[],
        options: UseLLMOptions,
        apiKey: string,
        signal?: AbortSignal
    ): AsyncGenerator<string> {
        const openai = new OpenAI({ apiKey });

        const formattedMessages = this.formatMessages(messages);

        const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
            options.systemPrompt
                ? [{ role: "system", content: options.systemPrompt }, ...formattedMessages]
                : formattedMessages;

        try {
            const stream = await openai.chat.completions.create({
                model: options.model,
                messages: chatMessages,
                temperature: options.temperature,
                max_tokens: options.maxTokens || 4096,
                top_p: options.topP,
                stream: true,
            }, { signal });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    yield content;
                }
            }
        } catch (err) {
            const error = err as Error;
            throw new ProviderApiError(error.message);
        }
    }

    private formatMessages(messages: LLMMessage[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
        const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

        const systemMessages = messages.filter(msg => msg.role === "system");
        const nonSystemMessages = messages.filter(msg => msg.role !== "system");

        for (const message of systemMessages) {
            formattedMessages.push({
                role: "system",
                content: message.content,
            });
        }

        for (const message of nonSystemMessages) {
            let formattedMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam;

            if (message.role === "tool" && message.tool_call_id) {
                formattedMessage = {
                    role: "tool",
                    content: message.content,
                    tool_call_id: message.tool_call_id
                };
            } else {
                formattedMessage = {
                    role: message.role === "assistant" ? "assistant" : "user",
                    content: message.content,
                };

                // Handle images for vision models
                if (message.images && message.images.length > 0) {
                    formattedMessage.content = [
                        { type: "text", text: message.content },
                        ...message.images.map(img => ({
                            type: "image_url" as const,
                            image_url: {
                                url: `data:image/jpeg;base64,${img}`
                            }
                        }))
                    ];
                }

                // Handle tool calls
                if (message.tool_calls && message.tool_calls.length > 0) {
                    formattedMessage = {
                        ...formattedMessage,
                        tool_calls: message.tool_calls.map(tc => ({
                            id: tc.id,
                            type: "function" as const,
                            function: {
                                name: tc.name,
                                arguments: typeof tc.arguments === "string" ? tc.arguments : JSON.stringify(tc.arguments)
                            }
                        }))
                    } as any;
                }
            }

            formattedMessages.push(formattedMessage);
        }

        return formattedMessages;
    }
}