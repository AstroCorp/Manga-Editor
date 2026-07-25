import { describe, it, expect } from 'vitest';
import {
	DEFAULT_ZOOM_PERCENT,
	MAX_ZOOM_PERCENT,
	MIN_ZOOM_PERCENT,
	clampZoomPercent,
	zoomFactorFromPercent,
} from '@/lib/zoom';

describe('zoom', () => {
	it('clamps percent between 5 and 500', () => {
		expect(clampZoomPercent(1)).toBe(MIN_ZOOM_PERCENT);
		expect(clampZoomPercent(999)).toBe(MAX_ZOOM_PERCENT);
		expect(clampZoomPercent(100.4)).toBe(100);
		expect(clampZoomPercent(Number.NaN)).toBe(DEFAULT_ZOOM_PERCENT);
	});

	it('converts percent to factor', () => {
		expect(zoomFactorFromPercent(100)).toBe(1);
		expect(zoomFactorFromPercent(50)).toBe(0.5);
		expect(zoomFactorFromPercent(200)).toBe(2);
		expect(zoomFactorFromPercent(DEFAULT_ZOOM_PERCENT)).toBe(0.75);
	});
});
