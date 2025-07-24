import type { FC } from "react";
import { version } from "../../package.json";
import Logo from "./icons/Logo";

const EmptyState: FC = () => {
	return (
		<div className="flex flex-col items-center justify-center h-full p-4">
			<Logo className="w-16 h-16 text-gray-400" />
			<span className="text-xs text-gray-400 mt-2">Superpowers v{version}</span>
		</div>
	);
};

export default EmptyState;
