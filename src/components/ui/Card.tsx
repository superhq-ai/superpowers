import type React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

const Card = ({ children, className, ...props }: CardProps) => {
	return (
		<div
			className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
			{...props}
		>
			{children}
		</div>
	);
};

const CardHeader = ({ children, className, ...props }: CardProps) => {
	return (
		<div
			className={`px-4 py-3 border-b border-gray-200 ${className}`}
			{...props}
		>
			{children}
		</div>
	);
};

const CardContent = ({ children, className, ...props }: CardProps) => {
	return (
		<div className={`p-4 ${className}`} {...props}>
			{children}
		</div>
	);
};

const CardFooter = ({ children, className, ...props }: CardProps) => {
	return (
		<div
			className={`px-4 py-3 border-t border-gray-200 ${className}`}
			{...props}
		>
			{children}
		</div>
	);
};

export { Card, CardHeader, CardContent, CardFooter };
