import type React from "react";
import { useEffect, useRef } from "react";
import Button from "./Button";

interface PopupProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	children: React.ReactNode;
}

const Popup = ({ isOpen, onClose, onConfirm, title, children }: PopupProps) => {
	const popupRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		if (isOpen) {
			popupRef.current?.showModal();
		} else {
			popupRef.current?.close();
		}
	}, [isOpen]);

	return (
		<dialog
			ref={popupRef}
			className="bg-white border border-white/30 rounded-lg p-4 shadow-lg max-w-sm w-full fixed inset-0 m-auto h-fit"
		>
			<h2 className="text-lg font-bold mb-4">{title}</h2>
			<div className="mb-6">{children}</div>
			<div className="flex justify-end gap-4">
				<Button onClick={onClose} variant="secondary">
					Cancel
				</Button>
				<Button onClick={onConfirm} variant="destructive">
					Confirm
				</Button>
			</div>
		</dialog>
	);
};

export default Popup;
