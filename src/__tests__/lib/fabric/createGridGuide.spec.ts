import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGridGuideImage } from '@/lib/fabric/createGridGuide';
import { isGuide } from '@/lib/fabric/isGuide';
import { ZERO_MARGINS } from '@/lib/panel/panelGeometry';
import type { PageLayoutMetrics } from '@/types/geometry';

const layout: PageLayoutMetrics = {
	width: 100,
	height: 80,
	cols: 3,
	rows: 2,
	margins: ZERO_MARGINS,
};

describe('createGridGuideImage', () => {
	const originalGetContext = HTMLCanvasElement.prototype.getContext;

	beforeEach(() => {
		HTMLCanvasElement.prototype.getContext = vi.fn(() => {
			return {
				clearRect: vi.fn(),
				beginPath: vi.fn(),
				arc: vi.fn(),
				fill: vi.fn(),
				fillStyle: '',
			};
		}) as unknown as typeof HTMLCanvasElement.prototype.getContext;
	});

	afterEach(() => {
		HTMLCanvasElement.prototype.getContext = originalGetContext;
	});

	it('builds a non-interactive guide image sized to the page', () => {
		const guide = createGridGuideImage(layout);

		expect(isGuide(guide)).toBe(true);
		expect(guide.isGridGuide).toBe(true);
		expect(guide.selectable).toBe(false);
		expect(guide.evented).toBe(false);
		expect(guide.excludeFromExport).toBe(true);
		expect(guide.width).toBe(100);
		expect(guide.height).toBe(80);
	});
});

describe('isGuide', () => {
	it('detects the isGuide flag on fabric-like objects', () => {
		expect(isGuide({ isGuide: true, get: () => undefined } as never)).toBe(
			true,
		);
		expect(
			isGuide({
				get: (key: string) => {
					return key === 'isGuide' ? true : undefined;
				},
			} as never),
		).toBe(true);
		expect(isGuide({ get: () => undefined } as never)).toBe(false);
	});
});
