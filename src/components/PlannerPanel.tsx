import { Brain, CheckCircle, Circle, Loader2, Search } from "lucide-react";
import type { PlannerStep } from "../lib/streaming-tool-parser";
import { formatTime } from "../lib/utils";

interface PlannerPanelProps {
	steps: PlannerStep[];
	isVisible: boolean;
	onToggle: () => void;
}

const PlannerPanel: React.FC<PlannerPanelProps> = ({
	steps,
	isVisible,
	onToggle,
}) => {
	const getStepIcon = (step: PlannerStep) => {
		switch (step.type) {
			case "thinking":
				return <Brain className="w-4 h-4 text-blue-500" />;
			case "tool_execution":
				if (step.isCompleted) {
					return <CheckCircle className="w-4 h-4 text-green-500" />;
				}
				return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
			case "tool_result":
				return <CheckCircle className="w-4 h-4 text-green-500" />;
			default:
				return <Circle className="w-4 h-4 text-gray-400" />;
		}
	};

	const getStepColor = (step: PlannerStep) => {
		switch (step.type) {
			case "thinking":
				return "text-blue-500";
			case "tool_execution":
				return step.isCompleted ? "text-green-500" : "text-yellow-500";
			case "tool_result":
				return "text-gray-500";
			default:
				return "text-gray-400";
		}
	};

	const getTruncatedToolResult = (toolResult: unknown) => {
		const resultString =
			typeof toolResult === "string"
				? toolResult
				: JSON.stringify(toolResult, null, 2);

		if (resultString.length > 200) {
			return `${resultString.slice(0, 200)}...`;
		}

		return resultString;
	};

	if (steps.length === 0) {
		return null;
	}

	return (
		<div className="mb-4">
			<button
				type="button"
				onClick={onToggle}
				className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700 mb-2"
			>
				<Search className="w-3.5 h-3.5" />
				<span>{steps.length} steps</span>
				<div className="flex-1 border-b border-gray-200" />
				<span className="text-xs text-gray-400 hover:text-gray-600">
					{isVisible ? "Hide" : "Show"}
				</span>
			</button>

			{isVisible && (
				<div className="bg-gray-50/50 rounded-lg">
					<div className="space-y-1">
						{steps.map((step) => (
							<div
								key={step.id}
								className={`flex items-start gap-3 p-2.5 rounded-lg transition-all duration-200`}
							>
								<div className={`flex-shrink-0 mt-0.5 ${getStepColor(step)}`}>
									{getStepIcon(step)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<span className="text-sm font-medium text-gray-800">
											{step.type === "thinking" && "Thinking"}
											{step.type === "tool_execution" &&
												`Using ${step.toolName}`}
											{step.type === "tool_result" &&
												`Result from ${step.toolName}`}
										</span>
										{step.type === "tool_execution" && !step.isCompleted && (
											<span className="text-xs text-yellow-500">
												Running...
											</span>
										)}
									</div>
									<div className="text-sm text-gray-600 whitespace-pre-wrap">
										{step.content}
									</div>
									{step.toolResult && (
										<div className="mt-2 p-2 bg-white rounded border text-xs text-gray-500">
											<pre className="whitespace-pre-wrap">
												{getTruncatedToolResult(step.toolResult)}
											</pre>
										</div>
									)}
								</div>
								<div className="flex-shrink-0 text-xs text-gray-400">
									{formatTime(new Date(step.timestamp))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default PlannerPanel;
