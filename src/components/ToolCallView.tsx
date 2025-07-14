import { ChevronDown, ChevronRight, FunctionSquare } from "lucide-react";
import { useState } from "react";
import type { ToolCall } from "../types/agent";

interface ToolCallViewProps {
	toolCalls: ToolCall[];
}

const ToolCallView = ({ toolCalls }: ToolCallViewProps) => {
	const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());

	if (!toolCalls || toolCalls.length === 0) return null;

	const toggleExpanded = (toolCallId: string) => {
		setExpandedCalls((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(toolCallId)) {
				newSet.delete(toolCallId);
			} else {
				newSet.add(toolCallId);
			}
			return newSet;
		});
	};

	const formatArguments = (args: any) => {
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
		<div className="my-3 border border-gray-200 rounded-md bg-gray-50/50 overflow-hidden">
			<div className="px-3 py-2 border-b border-gray-200 bg-white">
				<span className="text-sm font-medium text-gray-700">
					Tool Usage ({toolCalls.length})
				</span>
			</div>
			<div className="p-2 space-y-1">
				{toolCalls.map((toolCall) => {
					const isExpanded = expandedCalls.has(toolCall.id);

					return (
						<div
							key={toolCall.id}
							className="border border-gray-200 rounded overflow-hidden bg-white"
						>
							<button
								type="button"
								onClick={() => toggleExpanded(toolCall.id)}
								className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50 transition-colors text-sm"
							>
								{isExpanded ? (
									<ChevronDown className="w-3 h-3 text-gray-400" />
								) : (
									<ChevronRight className="w-3 h-3 text-gray-400" />
								)}
								<FunctionSquare className="w-3 h-3 text-blue-600" />
								<span className="font-medium text-gray-900">
									{toolCall.name}
								</span>
								{!isExpanded && (
									<span className="text-xs text-gray-500 ml-auto truncate">
										{Object.keys(toolCall.arguments || {}).length > 0
											? `${Object.keys(toolCall.arguments).length} param${Object.keys(toolCall.arguments).length === 1 ? "" : "s"}`
											: "No params"}
									</span>
								)}
							</button>

							{isExpanded && (
								<div className="border-t bg-gray-50 p-2">
									<div className="bg-white rounded border p-2">
										{Object.keys(toolCall.arguments || {}).length > 0 ? (
											<pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto">
												{formatArguments(toolCall.arguments)}
											</pre>
										) : (
											<span className="text-xs text-gray-500 italic">
												No parameters
											</span>
										)}
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default ToolCallView;
