import { useState } from "react";

const useScreenshot = () => {
	const [isScreenshotting, setIsScreenshotting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const takeScreenshot = async (): Promise<File | null> => {
		setIsScreenshotting(true);
		setError(null);
		try {
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: true,
			});
			const track = stream.getVideoTracks()[0];
			const imageCapture = new ImageCapture(track);
			const bitmap = await imageCapture.grabFrame();
			track.stop();

			const canvas = document.createElement("canvas");
			canvas.width = bitmap.width;
			canvas.height = bitmap.height;
			const context = canvas.getContext("2d");
			context?.drawImage(bitmap, 0, 0);

			return new Promise((resolve) => {
				canvas.toBlob((blob) => {
					if (blob) {
						const file = new File([blob], "screenshot.png", {
							type: "image/png",
						});
						resolve(file);
					} else {
						resolve(null);
					}
				});
			});
		} catch (err) {
			console.error("Error taking screenshot:", err);
			setError("Error taking screenshot.");
			return null;
		} finally {
			setIsScreenshotting(false);
		}
	};

	return { takeScreenshot, isScreenshotting, error };
};

export default useScreenshot;
