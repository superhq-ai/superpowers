import type React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	variant?: "default" | "secondary" | "destructive" | "ghost";
}

const Button = ({ children, variant = "default", ...props }: ButtonProps) => {
	const baseClasses =
		"inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md focus:outline-none transition-colors duration-150";

	const variants = {
		default:
			"border-transparent shadow-sm text-light bg-primary hover:bg-primary/80",
		secondary:
			"border-transparent text-primary bg-surface hover:bg-primary/10 hover:text-primary",
		destructive: "border-transparent text-red-700 bg-red-100 hover:bg-red-200",
		ghost: "border-transparent text-dark hover:text-primary bg-transparent",
	};

	return (
		<button {...props} className={`${baseClasses} ${variants[variant]}`}>
			{children}
		</button>
	);
};

export default Button;
