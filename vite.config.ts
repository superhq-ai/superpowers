import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
	],
	build: {
		outDir: "dist",
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: "./sidebar.html",
				background: "./src/lib/background.ts",
				content: "./src/lib/content.ts",
			},
			output: {
				entryFileNames: (chunkInfo) => {
					if (chunkInfo.name === "background") {
						return "background.js";
					}
					if (chunkInfo.name === "content") {
						return "content.js";
					}
					return "[name].js";
				},
				format: "es",
				manualChunks: undefined,
			},
			external: () => false,
			plugins: [
				{
					name: "wrap-content-script",
					generateBundle(_options, bundle) {
						// Find the content script and wrap it in IIFE
						const contentScript = bundle["content.js"];
						if (contentScript && contentScript.type === "chunk") {
							contentScript.code = `(function() {\n'use strict';\n${contentScript.code}\n})();`;
						}
					},
				},
			],
		},
	},
});
