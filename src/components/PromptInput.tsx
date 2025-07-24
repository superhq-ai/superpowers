import { ArrowUp, Image, Scan, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { MAX_IMAGES } from "../constants";
import { useAppSettings } from "../contexts/AppSettingsContext";
import usePastedFiles, { AcceptedFileType } from "../hooks/usePastedFiles";
import useScreenshot from "../hooks/useScreenshot";
import { PROMPTS } from "../lib/prompts";
import { ModelSelect } from "./ModelSelect";
import SlashCommands from "./SlashCommands";

const PromptBox = ({
	prompt,
	isLoading,
	setPrompt,
	onSubmit,
	onStop,
}: {
	prompt: string;
	isLoading: boolean;
	setPrompt: (prompt: string) => void;
	onSubmit: (images?: File[]) => void;
	onStop?: () => void;
}) => {
	const { settings, setSettings } = useAppSettings();
	const [showSlashCommands, setShowSlashCommands] = useState(false);
	const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
	const {
		files: images,
		fileInputRef,
		handlePaste,
		handleFileChange,
		handleRemoveFile,
		handleFileAttachment,
		reset: resetImages,
		isLimitReached: isMaxImagesLimitReached,
	} = usePastedFiles({
		maxFiles: MAX_IMAGES,
		acceptTypes: [AcceptedFileType.Image],
	});

	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const { takeScreenshot } = useScreenshot();

	// Get filtered commands for navigation
	const filteredCommands = useMemo(() => {
		const query = prompt.startsWith("/") ? prompt.slice(1) : "";
		if (!query) {
			return PROMPTS;
		}
		return PROMPTS.filter((p) =>
			p.name.toLowerCase().startsWith(query.toLowerCase()),
		);
	}, [prompt]);

	const submit = () => {
		if (!prompt.trim() && images.length === 0) return;
		onSubmit(images.map((img) => img.file));
		resetImages();
		setShowSlashCommands(false);
	};

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value;
		setPrompt(value);

		if (value.startsWith("/")) {
			setShowSlashCommands(true);
			setSelectedCommandIndex(0); // Reset selection when showing commands
		} else {
			setShowSlashCommands(false);
		}

		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	};

	const handleUpdatePrompt = (command: string) => {
		setPrompt(command);
		setShowSlashCommands(false);
		setSelectedCommandIndex(0);
	};

	const handleSelectCommand = (command: string) => {
		setPrompt(`/${command} `);
		setShowSlashCommands(false);
		setSelectedCommandIndex(0);
		textareaRef.current?.focus();
	};

	const handleScreenshot = async () => {
		const file = await takeScreenshot();
		if (file) {
			handleFileChange({
				target: {
					files: [file],
				},
			} as unknown as React.ChangeEvent<HTMLInputElement>);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (showSlashCommands && filteredCommands.length > 0) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedCommandIndex((prev) =>
					prev < filteredCommands.length - 1 ? prev + 1 : 0,
				);
				return;
			}

			if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedCommandIndex((prev) =>
					prev > 0 ? prev - 1 : filteredCommands.length - 1,
				);
				return;
			}

			if (e.key === "Tab") {
				e.preventDefault();
				const selectedCommand = filteredCommands[selectedCommandIndex];
				if (selectedCommand) {
					handleUpdatePrompt(`/${selectedCommand.name}`);
				}
				return;
			}

			if (e.key === "Escape") {
				e.preventDefault();
				setShowSlashCommands(false);
				setSelectedCommandIndex(0);
				return;
			}
		}

		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();

			// If slash commands are showing, select the highlighted command
			if (showSlashCommands && filteredCommands.length > 0) {
				const selectedCommand = filteredCommands[selectedCommandIndex];
				if (selectedCommand) {
					handleSelectCommand(selectedCommand.name);
					return;
				}
			}

			submit();
		}
	};

	return (
		<div className="relative z-10">
			<div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-3 relative">
				{showSlashCommands && (
					<SlashCommands
						onSelect={handleSelectCommand}
						query={prompt.slice(1)}
						selectedIndex={selectedCommandIndex}
						onSelectedIndexChange={setSelectedCommandIndex}
					/>
				)}
				{images.length > 0 && (
					<div className="flex gap-2 mb-2 pt-2 overflow-x-auto">
						{images.map((img) => (
							<div key={img.id} className="relative group">
								<img
									src={URL.createObjectURL(img.file)}
									alt="preview"
									className="w-14 h-14 object-cover rounded-xl border border-gray-200 shadow"
								/>
								<button
									type="button"
									className="
                                        absolute top-0 right-0
                                        w-5 h-5 p-0.5 z-10
                                        bg-white/90 hover:bg-gray-200 text-gray-500
                                        rounded-full
                                        flex items-center justify-center
                                        transition
                                        shadow
                                        outline-none
                                        border-none
                                        focus:outline-none
                                    "
									style={{
										transform: "translate(40%, -40%)",
									}}
									onClick={() => handleRemoveFile(img.id)}
									title="Remove image"
									tabIndex={0}
								>
									<X className="w-3 h-3" />
								</button>
							</div>
						))}
					</div>
				)}
				<textarea
					ref={textareaRef}
					value={prompt}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					onPaste={handlePaste}
					placeholder="Ask me anything or give me a task to work on."
					className="w-full min-h-6 max-h-24 bg-transparent border-none focus:outline-none resize-none placeholder-gray-500 text-base leading-normal"
					style={{ lineHeight: "1.5" }}
				/>
				<div className="flex gap-2 justify-between mt-2">
					<div className="flex gap-2 items-center">
						<button
							type="button"
							onClick={handleFileAttachment}
							className="w-8 h-8 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors flex items-center justify-center flex-shrink-0"
							title={
								images.length >= MAX_IMAGES
									? "Image limit reached"
									: "Attach file"
							}
							disabled={images.length >= MAX_IMAGES}
						>
							<Image className="w-4 h-4" />
							<input
								type="file"
								accept="image/*"
								multiple
								ref={fileInputRef}
								onChange={handleFileChange}
								className="hidden"
							/>
						</button>
						<button
							type="button"
							onClick={handleScreenshot}
							className="w-8 h-8 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors flex items-center justify-center flex-shrink-0"
							title="Take screenshot"
						>
							<Scan className="w-4 h-4" />
						</button>
						{settings.selectedProvider && (
							<ModelSelect
								provider={settings.selectedProvider}
								apiKey={settings.apiKeys[settings.selectedProvider]}
								value={settings.model}
								onChange={(model) => setSettings({ model })}
							/>
						)}
					</div>
					{isLoading ? (
						<button
							type="button"
							onClick={onStop}
							className="w-8 h-8 bg-slate-200 text-slate-700 rounded-full hover:bg-slate-300 transition-colors flex items-center justify-center flex-shrink-0"
							title="Stop generation"
						>
							<div className="w-3 h-3 bg-slate-700 rounded-sm"></div>
						</button>
					) : (
						<button
							type="button"
							onClick={submit}
							disabled={!prompt.trim() && images.length === 0}
							className="w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
						>
							<ArrowUp className="w-4 h-4" />
						</button>
					)}
				</div>
				{isMaxImagesLimitReached && (
					<div className="text-xs text-red-500 mt-1 text-right">
						Maximum 5 images allowed.
					</div>
				)}
			</div>
		</div>
	);
};

export default PromptBox;
