export type ExportImageFormat = 'png' | 'jpeg';

export type LayerElementFocusPayload = {
	layerId: string;
	kind: 'shape' | 'text';
	id: string;
};

export type CanvasActions = {
	cancelStroke: () => void;
	exportDataUrl: (format: ExportImageFormat) => string | null;
	resetZoomView: () => void;
	syncCanvasOffset: () => void;
	addSimpleText: () => void;
	addBoxedText: () => void;
	addRoundedBoxedText: () => void;
	focusLayerElement: (payload: LayerElementFocusPayload) => void;
	deleteLayerElement: (payload: LayerElementFocusPayload) => void;
};

export type ApplyActivePageOptions = {
	/** Devuelve el scroll del stage al origen; por defecto se conserva. */
	resetView?: boolean;
};

export type ThemePreference = 'auto' | 'light' | 'dark';

export type ZipDataUrlEntry = {
	filename: string;
	dataUrl: string;
};

export type WebpEncodeRequest = {
	id: number;
	file: File;
};

export type WebpEncodeSuccess = {
	id: number;
	buffer: ArrayBuffer;
};

export type WebpEncodeFailure = {
	id: number;
	error: string;
};

export type WebpEncodeResponse = WebpEncodeSuccess | WebpEncodeFailure;
