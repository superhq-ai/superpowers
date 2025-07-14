import type React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
}

const Input = ({ label, ...props }: InputProps) => {
	return (
		<div>
			<label
				htmlFor={props.id}
				className="block text-sm font-medium text-gray-700"
			>
				{label}
			</label>
			<div className="mt-1">
				<input
					{...props}
					className="block w-full px-3 py-2 bg-white/80 backdrop-blur-md border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm text-gray-900 placeholder:text-gray-400"
				/>
			</div>
		</div>
	);
};

export default Input;
