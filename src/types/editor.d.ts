export type CanvasActions = {
	cancelStroke: () => void;
	removeActive: () => boolean;
	setSelectionStrokeWidth: (width: number) => boolean;
	resetZoomView: () => void;
};

export type ThemePreference = 'auto' | 'light' | 'dark';

export type ResolvedTheme = 'light' | 'dark';
