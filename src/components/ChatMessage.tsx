import type { Message } from "../types";
import MarkdownRenderer from "./MarkdownRenderer";
import ToolCallView from "./ToolCallView";

const ChatMessage = ({ message }: { message: Message }) => {
	return (
		<div
			className={`mb-8 flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
		>
			<div
				className={`
                ${message.type === "user" ? "bg-blue-100 px-4 py-2 rounded-sm max-w-[78%]" : "text-gray-900 min-w-0"}
            `}
			>
				<div
					className={`${message.type === "user" ? "whitespace-pre-wrap" : ""} leading-relaxed text-base break-words`}
				>
					{message.toolCalls && message.toolCalls.length > 0 && (
						<ToolCallView toolCalls={message.toolCalls} />
					)}
					{message.type === "user" ? (
						message.content
					) : (
						<MarkdownRenderer>{message.content}</MarkdownRenderer>
					)}
					{message.attachments && message.attachments.length > 0 && (
						<div className="flex gap-2 mt-2">
							{message.attachments.map((att) => (
								<img
									key={att.id}
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
