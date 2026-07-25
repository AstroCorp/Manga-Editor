export type ExportImageFormat = 'png' | 'jpeg';

export type CanvasActions = {
	cancelStroke: () => void;
	removeActive: () => boolean;
	setSelectionStrokeWidth: (width: number) => boolean;
	exportDataUrl: (format: ExportImageFormat) => string | null;
	resetZoomView: () => void;
};

export type ThemePreference = 'auto' | 'light' | 'dark';

export type ResolvedTheme = 'light' | 'dark';
