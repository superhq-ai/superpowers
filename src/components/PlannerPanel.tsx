import {
	Brain,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Circle,
	Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PlannerStep } from "../lib/streaming-tool-parser";
import { formatTime } from "../lib/utils";
import MarkdownRenderer from "./MarkdownRenderer";

interface PlannerPanelProps {
	steps: PlannerStep[];
}

const PlannerPanel: React.FC<PlannerPanelProps> = ({ steps }) => {
	const [isCollapsed, setIsCollapsed] = useState(true);

	const getStepIcon = (step: PlannerStep) => {
		switch (step.type) {
			case "thinking":
				return <Brain className="w-4 h-4 text-gray-500" />;
			case "tool_execution":
				if (step.isCompleted) {
					return <CheckCircle className="w-4 h-4 text-gray-500" />;
				}
				return <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />;
			case "tool_result":
				return <CheckCircle className="w-4 h-4 text-gray-500" />;
			default:
				return <Circle className="w-4 h-4 text-gray-400" />;
		}
	};

	const formatToolResult = (toolResult: unknown) => {
		return typeof toolResult === "string"
			? toolResult
			: JSON.stringify(toolResult, null, 2);
	};

	if (steps.length === 0) {
		return null;
	}

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
				<span>Planner</span>
			</button>

			{!isCollapsed && (
				<div className="mt-2 pl-5 space-y-4">
					{steps.map((step) => (
						<div key={step.id} className="flex items-start gap-3">
							<div className="flex-shrink-0 mt-0.5">{getStepIcon(step)}</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium text-gray-800">
											{step.type === "thinking" && "Thinking"}
											{step.type === "tool_execution" &&
												`Using ${step.toolName}`}
											{step.type === "tool_result" &&
												`Result from ${step.toolName}`}
										</span>
										{step.type === "tool_execution" && !step.isCompleted && (
											<span className="text-xs text-gray-500">Running...</span>
										)}
									</div>
									<div className="flex-shrink-0 text-xs text-gray-400">
										{formatTime(new Date(step.timestamp))}
									</div>
								</div>

								<ThinkingContent
									content={step.content}
									isThinking={step.type === "thinking"}
								/>

								{step.toolResult && (
									<div className="mt-2 text-xs text-gray-500">
										<pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded-md border max-h-40 overflow-y-auto">
											{formatToolResult(step.toolResult)}
										</pre>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

const ThinkingContent = ({
	content,
	isThinking,
}: {
	content: string;
	isThinking: boolean;
}) => {
	const ref = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scrollHeight depends on content
	useEffect(() => {
		if (ref.current) {
			ref.current.scrollTop = ref.current.scrollHeight;
		}
	}, [content]);

	return (
		<div
			ref={ref}
			className={`mt-1 text-sm text-gray-600 whitespace-pre-wrap ${
				isThinking
					? "max-h-40 overflow-y-auto bg-gray-50 p-2 rounded-md border"
					: ""
			}`}
		>
			<MarkdownRenderer>{content}</MarkdownRenderer>
		</div>
	);
};

export default PlannerPanel;
