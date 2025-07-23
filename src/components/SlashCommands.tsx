import { useEffect, useMemo } from "react";
import { SLASH_COMMANDS } from "../lib/slash-commands";

const SlashCommands = ({
	onSelect,
	query,
	selectedIndex,
	onSelectedIndexChange,
}: {
	onSelect: (command: string) => void;
	query: string;
	selectedIndex: number;
	onSelectedIndexChange: (index: number) => void;
}) => {
	const filteredCommands = useMemo(() => {
		if (!query) {
			return SLASH_COMMANDS;
		}
		return SLASH_COMMANDS.filter((cmd) =>
			cmd.command.toLowerCase().startsWith(query.toLowerCase()),
		);
	}, [query]);

	// Reset selected index when filtered commands change
	useEffect(() => {
		if (selectedIndex >= filteredCommands.length) {
			onSelectedIndexChange(Math.max(0, filteredCommands.length - 1));
		}
	}, [filteredCommands.length, selectedIndex, onSelectedIndexChange]);

	if (filteredCommands.length === 0) {
		return null;
	}

	return (
		<div className="bg-white border border-gray-200 rounded-lg shadow-sm p-1 absolute bottom-full left-0 mb-1 w-full">
			<div className="flex flex-col">
				{filteredCommands.map(
					(cmd, index) =>
						cmd && (
							<button
								type="button"
								key={cmd.command}
								className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-left transition-colors ${
									index === selectedIndex
										? "bg-blue-100 border border-blue-200"
										: "hover:bg-gray-100"
								}`}
								onClick={() => onSelect(cmd.command)}
							>
								<div className="text-sm font-medium">{cmd.command}</div>
								<div className="text-xs text-gray-500">{cmd.description}</div>
							</button>
						),
				)}
			</div>
		</div>
	);
};

export default SlashCommands;
