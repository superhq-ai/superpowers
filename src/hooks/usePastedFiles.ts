import { useCallback, useRef, useState } from "react";

export const AcceptedFileType = {
	Image: "image/",
	PDF: "application/pdf",
	Video: "video/",
	Audio: "audio/",
	Text: "text/",
} as const;

export type AcceptedFileType =
	(typeof AcceptedFileType)[keyof typeof AcceptedFileType];

export type PastedFile = {
	id: string;
	file: File;
};

type UsePastedFilesOptions = {
	maxFiles?: number;
	acceptTypes?: AcceptedFileType[];
};

export default function usePastedFiles({
	maxFiles = 5,
	acceptTypes = [AcceptedFileType.Image],
}: UsePastedFilesOptions = {}) {
	const [files, setFiles] = useState<PastedFile[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const isAcceptedType = useCallback(
		(type: string) =>
			acceptTypes.some((accept) =>
				accept.endsWith("/") ? type.startsWith(accept) : type === accept,
			),
		[acceptTypes],
	);

	const handlePaste = useCallback(
		(e: React.ClipboardEvent) => {
			if (files.length >= maxFiles) return;
			const items = e.clipboardData.items;
			const newFiles: PastedFile[] = [];
			for (const item of items) {
				if (isAcceptedType(item.type)) {
					const file = item.getAsFile();
					if (file) {
						newFiles.push({ id: crypto.randomUUID(), file });
					}
				}
			}
			if (newFiles.length) {
				const remainingSlots = maxFiles - files.length;
				setFiles((prev) => [...prev, ...newFiles.slice(0, remainingSlots)]);
			}
		},
		[files, maxFiles, isAcceptedType],
	);

	const handleRemoveFile = useCallback((id: string) => {
		setFiles((f) => f.filter((file) => file.id !== id));
	}, []);

	const handleFileAttachment = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const inputFiles = Array.from(e.target.files || [])
				.filter((file) => isAcceptedType(file.type))
				.map((file) => ({ id: crypto.randomUUID(), file }));

			setFiles((prev) => {
				const remainingSlots = maxFiles - prev.length;
				return [...prev, ...inputFiles.slice(0, remainingSlots)].slice(
					0,
					maxFiles,
				);
			});
			if (fileInputRef.current) fileInputRef.current.value = "";
		},
		[maxFiles, isAcceptedType],
	);

	const reset = useCallback(() => setFiles([]), []);

	return {
		files,
		setFiles,
		fileInputRef,
		handlePaste,
		handleFileChange,
		handleRemoveFile,
		handleFileAttachment,
		reset,
		isLimitReached: files.length >= maxFiles,
		acceptTypes,
	};
}
