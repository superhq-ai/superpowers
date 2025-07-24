import { type RefObject, useEffect, useMemo, useState } from "react";
import { PROMPTS } from "../lib/prompts";

const SlashCommands = ({
	onSelect,
	query,
	selectedIndex,
	onSelectedIndexChange,
	target,
}: {
	onSelect: (command: string) => void;
	query: string;
	selectedIndex: number;
	onSelectedIndexChange: (index: number) => void;
	target: RefObject<HTMLElement | null>;
}) => {
	const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

	const filteredCommands = useMemo(() => {
		if (!query) {
			return PROMPTS;
		}
		return PROMPTS.filter((p) =>
			p.name.toLowerCase().startsWith(query.toLowerCase()),
		);
	}, [query]);

	// Reset selected index when filtered commands change
	useEffect(() => {
		if (selectedIndex >= filteredCommands.length) {
			onSelectedIndexChange(Math.max(0, filteredCommands.length - 1));
		}
	}, [filteredCommands.length, selectedIndex, onSelectedIndexChange]);

	useEffect(() => {
		const calculatePosition = () => {
			if (target.current) {
				const rect = target.current.getBoundingClientRect();
				setPosition({
					top: rect.top,
					left: rect.left,
					width: rect.width,
				});
			}
		};

		calculatePosition();

		const handleResize = () => calculatePosition();
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, [target]);

	if (filteredCommands.length === 0) {
		return null;
	}

	return (
		<div
			className="bg-white border border-gray-200 rounded-lg shadow-sm p-1"
			style={{
				position: "fixed",
				top: position.top,
				left: position.left,
				width: position.width,
				transform: "translateY(-100%)",
				marginBottom: "0.25rem",
				zIndex: 100,
			}}
		>
			<div className="flex flex-col">
				{filteredCommands.map(
					(cmd, index) =>
						cmd && (
							<button
								type="button"
								key={cmd.name}
								className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-left transition-colors border ${
									index === selectedIndex
										? "bg-blue-100 border-blue-200"
										: "border-transparent hover:bg-gray-100"
								}`}
								onClick={() => onSelect(cmd.name)}
							>
								<div className="text-sm font-medium">{cmd.name}</div>
								<div className="text-xs text-gray-500">{cmd.description}</div>
							</button>
						),
				)}
			</div>
		</div>
	);
};

export default SlashCommands;
