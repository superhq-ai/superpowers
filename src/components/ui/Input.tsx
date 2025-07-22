import type React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
}

const Input = ({ label, ...props }: InputProps) => {
	return (
		<div>
			<label htmlFor={props.id} className="block text-sm font-medium text-dark">
				{label}
			</label>
			<div className="mt-1">
				<input
					{...props}
					className="block w-full px-3 py-2 bg-surface backdrop-blur-md border border-primary/20 rounded-lg focus:outline-none sm:text-sm text-dark placeholder:text-dark/40"
				/>
			</div>
		</div>
	);
};

export default Input;
