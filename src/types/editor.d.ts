export type ExportImageFormat = 'png' | 'jpeg';

export type CanvasActions = {
	cancelStroke: () => void;
	exportDataUrl: (format: ExportImageFormat) => string | null;
	resetZoomView: () => void;
	addSimpleText: () => void;
	addBoxedText: () => void;
	addRoundedBoxedText: () => void;
};

export type ThemePreference = 'auto' | 'light' | 'dark';
