import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents = {
	h1: ({ ...props }) => <h1 className="text-2xl font-bold my-4" {...props} />,
	h2: ({ ...props }) => <h2 className="text-xl font-bold my-3" {...props} />,
	h3: ({ ...props }) => <h3 className="text-lg font-bold my-2" {...props} />,
	strong: ({ ...props }) => <strong className="font-bold" {...props} />,
	p: ({ ...props }) => <p className="mb-4" {...props} />,
	a: ({ ...props }) => (
		<a className="text-blue-600 hover:underline" {...props} />
	),
	ul: ({ ...props }) => (
		<ul className="list-disc list-inside my-4" {...props} />
	),
	ol: ({ ...props }) => (
		<ol className="list-decimal list-inside my-4" {...props} />
	),
	li: ({ ...props }) => <li className="mb-2" {...props} />,
	blockquote: ({ ...props }) => (
		<blockquote className="border-l-4 border-gray-300 pl-4 my-4" {...props} />
	),
	code: ({ ...props }) => (
		<code className="bg-gray-800 text-white px-2 py-1 rounded" {...props} />
	),
	pre: ({ ...props }) => (
		<pre className="bg-gray-100 p-2 rounded my-4 overflow-x-auto" {...props} />
	),
	table: ({ ...props }) => (
		<table
			className="table-auto w-full my-4 border-collapse border border-gray-300"
			{...props}
		/>
	),
	thead: ({ ...props }) => <thead className="bg-gray-100" {...props} />,
	th: ({ ...props }) => (
		<th className="border border-gray-300 px-4 py-2" {...props} />
	),
	td: ({ ...props }) => (
		<td className="border border-gray-300 px-4 py-2" {...props} />
	),
};

interface MarkdownRendererProps {
	children: string;
}

const MarkdownRenderer = ({ children }: MarkdownRendererProps) => {
	return (
		<ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
			{children}
		</ReactMarkdown>
	);
};

export default MarkdownRenderer;
