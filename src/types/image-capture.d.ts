interface ImageCapture {
	grabFrame(): Promise<ImageBitmap>;
	getPhotoCapabilities(): Promise<any>;
	getPhotoSettings(): Promise<any>;
	takePhoto(photoSettings?: any): Promise<Blob>;
	readonly track: MediaStreamTrack;
}

declare var ImageCapture: {
	prototype: ImageCapture;
	new(videoTrack: MediaStreamTrack): ImageCapture;
};
