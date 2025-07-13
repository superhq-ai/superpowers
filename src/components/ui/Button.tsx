import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "default" | "secondary" | "destructive" | "ghost";
}

const Button = ({ children, variant = "default", ...props }: ButtonProps) => {
    const baseClasses = "inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";

    const variants = {
        default: "border-transparent shadow-sm text-white bg-indigo-600 hover:bg-indigo-700",
        secondary: "border-transparent text-indigo-700 bg-indigo-100 hover:bg-indigo-200",
        destructive: "border-transparent text-red-700 bg-red-100 hover:bg-red-200",
        ghost: "border-transparent text-gray-700 hover:text-indigo-700"
    };

    return (
        <button
            {...props}
            className={`${baseClasses} ${variants[variant]}`}
        >
            {children}
        </button>
    );
};

export default Button;
