import type { FC } from "react";

const Logo: FC<{ className?: string }> = ({ className }) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="64"
			height="64"
			fill="none"
			viewBox="0 0 64 64"
			className={className}
		>
			<title>Superpowers Logo</title>
			<rect width="64" height="64" rx="17.934" fill="#f0f0f0" />
			<g
				transform="matrix(.77217 .445813 -.445813 .77217 22.688118 -7.489737)"
				fill="currentColor"
			>
				<use href="#B" />
				<use href="#B" x="13.718" y="18.319" />
			</g>
			<defs>
				<path
					id="B"
					d="M32.092 9.654c4.419 2.395 6.048 7.88 3.653 12.299l-6.878 12.689c-2.395 4.419-7.88 6.048-12.299 3.653s-6.048-7.88-3.653-12.299l6.878-12.689c2.395-4.419 7.88-6.048 12.299-3.653z"
				/>
			</defs>
		</svg>
	);
};

export default Logo;
