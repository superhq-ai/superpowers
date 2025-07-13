import type { Message } from "../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ToolCallView from "./ToolCallView";

const ChatMessage = ({ message }: { message: Message }) => {
    const components = {
        h1: ({ ...props }) => <h1 className="text-2xl font-bold my-4" {...props} />,
        h2: ({ ...props }) => <h2 className="text-xl font-bold my-3" {...props} />,
        h3: ({ ...props }) => <h3 className="text-lg font-bold my-2" {...props} />,
        p: ({ ...props }) => <p className="mb-4" {...props} />,
        a: ({ ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
        ul: ({ ...props }) => <ul className="list-disc list-inside my-4" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal list-inside my-4" {...props} />,
        li: ({ ...props }) => <li className="mb-2" {...props} />,
        blockquote: ({ ...props }) => <blockquote className="border-l-4 border-gray-300 pl-4 my-4" {...props} />,
        code: ({ ...props }) => <code className="bg-gray-800 text-white px-2 py-1 rounded" {...props} />,
        pre: ({ ...props }) => <pre className="bg-gray-100 p-2 rounded my-4 overflow-x-auto" {...props} />,
        table: ({ ...props }) => <table className="table-auto w-full my-4 border-collapse border border-gray-300" {...props} />,
        thead: ({ ...props }) => <thead className="bg-gray-100" {...props} />,
        th: ({ ...props }) => <th className="border border-gray-300 px-4 py-2" {...props} />,
        td: ({ ...props }) => <td className="border border-gray-300 px-4 py-2" {...props} />,
    };

    return (
        <div className={`mb-8 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
                ${message.type === 'user' ? 'bg-blue-100 px-4 py-2 rounded-sm max-w-[78%]' : 'text-gray-900 min-w-0'}
            `}>
                <div className={`${message.type === 'user' ? 'whitespace-pre-wrap' : ''} leading-relaxed text-base break-words`}>
                    {message.toolCalls && message.toolCalls.length > 0 && (
                        <ToolCallView toolCalls={message.toolCalls} />
                    )}
                    {message.type === "user"
                        ? message.content
                        : (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={components}
                            >
                                {message.content}
                            </ReactMarkdown>
                        )
                    }
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="flex gap-2 mt-2">
                            {message.attachments.map((att, idx) => (
                                <img
                                    key={idx}
                                    src={`data:${att.mediaType};base64,${att.data}`}
                                    alt="attachment"
                                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
