import { useEffect, useState } from "react";
import { listModels } from "../services/llm";
import type { LLMProvider } from "../types";

interface ModelSelectProps {
	provider: LLMProvider;
	apiKey?: string;
	value: string;
	onChange: (value: string) => void;
}

export function ModelSelect({
	provider,
	apiKey,
	value,
	onChange,
}: ModelSelectProps) {
	const [models, setModels] = useState<string[]>([]);

	useEffect(() => {
		if (provider) {
			listModels(provider, apiKey)
				.then(setModels)
				.catch((err) => {
					console.error(err);
					setModels([]);
				});
		} else {
			setModels([]);
		}
	}, [provider, apiKey]);

	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className="bg-transparent focus:outline-none"
		>
			{models.map((model) => (
				<option key={model} value={model}>
					{model}
				</option>
			))}
		</select>
	);
}
