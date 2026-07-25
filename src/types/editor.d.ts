export type CanvasActions = {
	cancelStroke: () => void;
	removeActive: () => boolean;
	setSelectionStrokeWidth: (width: number) => boolean;
};
