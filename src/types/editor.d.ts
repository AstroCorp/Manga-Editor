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
	addSimpleText: () => void;
	addBoxedText: () => void;
	addRoundedBoxedText: () => void;
	focusLayerElement: (payload: LayerElementFocusPayload) => void;
	deleteLayerElement: (payload: LayerElementFocusPayload) => void;
};

export type ThemePreference = 'auto' | 'light' | 'dark';
