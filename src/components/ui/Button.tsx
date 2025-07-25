import type React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	variant?: "default" | "secondary" | "destructive" | "ghost" | "outline";
	size?: "sm" | "md" | "lg";
}

const Button = ({
	children,
	variant = "default",
	size = "md",
	...props
}: ButtonProps) => {
	const baseClasses =
		"inline-flex items-center border font-medium rounded-md focus:outline-none transition-colors duration-150";

	const sizes = {
		sm: "px-2 py-1 text-xs",
		md: "px-3 py-1.5 text-xs",
		lg: "px-4 py-2 text-sm",
	};

	const variants = {
		default:
			"border-transparent shadow-sm text-white bg-primary hover:bg-primary/80",
		secondary:
			"border-transparent text-primary bg-surface hover:bg-primary/10 hover:text-primary",
		destructive: "border-transparent text-red-700 bg-red-100 hover:bg-red-200",
		ghost: "border-transparent text-dark hover:text-primary bg-transparent",
		outline: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
	};

	return (
		<button
			{...props}
			className={`${baseClasses} ${sizes[size]} ${variants[variant]}`}
		>
			{children}
		</button>
	);
};

export default Button;
