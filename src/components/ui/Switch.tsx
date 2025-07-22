interface SwitchProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
}

const Switch = ({ checked, onChange, label }: SwitchProps) => {
	const handleToggle = () => {
		onChange(!checked);
	};

	return (
		<div className="flex items-center">
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				onClick={handleToggle}
				className={`${
					checked ? "bg-primary" : "bg-surface"
				} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
			>
				<span
					aria-hidden="true"
					className={`${
						checked ? "translate-x-5" : "translate-x-0"
					} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
				/>
			</button>
			<span className="ml-3 text-sm font-medium text-dark">{label}</span>
		</div>
	);
};

export default Switch;
