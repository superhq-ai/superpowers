import { ChevronDown, ChevronRight, WrenchIcon } from "lucide-react";
import { useState } from "react";
import type { ToolCall } from "../types/agent";

interface ToolCallViewProps {
	toolCalls: ToolCall[];
}

const ToolCallView = ({ toolCalls }: ToolCallViewProps) => {
	const [isCollapsed, setIsCollapsed] = useState(true);

	if (!toolCalls || toolCalls.length === 0) return null;

	const formatArguments = (args: Record<string, unknown>) => {
		if (!args) return "No arguments";

		// If it's a simple object with few properties, format it inline
		const entries = Object.entries(args);
		if (
			entries.length <= 2 &&
			entries.every(
				([_, value]) =>
					typeof value === "string" ||
					typeof value === "number" ||
					typeof value === "boolean",
			)
		) {
			return entries
				.map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
				.join(", ");
		}

		// Otherwise, show as formatted JSON
		return JSON.stringify(args, null, 2);
	};

	return (
		<div className="my-3">
			<button
				type="button"
				onClick={() => setIsCollapsed(!isCollapsed)}
				className="w-full flex items-center gap-1 text-left text-sm font-medium text-gray-500 hover:text-gray-800"
			>
				{isCollapsed ? (
					<ChevronRight className="w-4 h-4" />
				) : (
					<ChevronDown className="w-4 h-4" />
				)}
				<span>Tool usage</span>
			</button>

			{!isCollapsed && (
				<div className="mt-2 pl-5 space-y-2">
					{toolCalls.map((toolCall) => (
						<div key={toolCall.id}>
							<div className="flex items-center gap-2 text-sm">
								<WrenchIcon className="w-4 h-4 text-gray-500" />
								<span className="font-medium text-gray-900">
									{toolCall.name}
								</span>
							</div>
							<div className="mt-1 pl-6">
								{Object.keys(toolCall.arguments || {}).length > 0 ? (
									<pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto bg-gray-50 p-2 rounded-md border">
										{formatArguments(toolCall.arguments)}
									</pre>
								) : (
									<span className="text-xs text-gray-500 italic">
										No parameters
									</span>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default ToolCallView;
