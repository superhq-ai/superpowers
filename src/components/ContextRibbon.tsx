import type React from "react";

interface ContextRibbonProps {
	url: string | null;
	title: string | null;
}

const ContextRibbon: React.FC<ContextRibbonProps> = ({ url, title }) => {
	if (!url) return null;

	const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;

	return (
		<div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-t-2xl">
			<img src={faviconUrl} alt="favicon" className="w-5 h-5" />
			<span className="text-sm text-gray-500 truncate whitespace-nowrap">
				{title || url}
			</span>
		</div>
	);
};

export default ContextRibbon;
