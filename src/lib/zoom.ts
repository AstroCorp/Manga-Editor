export const MIN_ZOOM_PERCENT = 5;
export const MAX_ZOOM_PERCENT = 500;
export const DEFAULT_ZOOM_PERCENT = 75;
export const ZOOM_STEP_PERCENT = 10;
export const ZOOM_WHEEL_FACTOR = 1.1;

export const clampZoomPercent = (value: number): number => {
	if (!Number.isFinite(value)) {
		return DEFAULT_ZOOM_PERCENT;
	}

	return Math.min(
		MAX_ZOOM_PERCENT,
		Math.max(MIN_ZOOM_PERCENT, Math.round(value)),
	);
};

export const zoomFactorFromPercent = (percent: number): number => {
	return clampZoomPercent(percent) / 100;
};
