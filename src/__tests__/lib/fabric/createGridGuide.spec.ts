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

type MockContext = {
	clearRect: ReturnType<typeof vi.fn>;
	beginPath: ReturnType<typeof vi.fn>;
	arc: ReturnType<typeof vi.fn>;
	fill: ReturnType<typeof vi.fn>;
	fillStyle: string;
};

describe('createGridGuideImage', () => {
	const originalGetContext = HTMLCanvasElement.prototype.getContext;
	const contexts: MockContext[] = [];

	beforeEach(() => {
		contexts.length = 0;
		HTMLCanvasElement.prototype.getContext = vi.fn(() => {
			const context: MockContext = {
				clearRect: vi.fn(),
				beginPath: vi.fn(),
				arc: vi.fn(),
				fill: vi.fn(),
				fillStyle: '',
			};

			contexts.push(context);

			return context;
		}) as unknown as typeof HTMLCanvasElement.prototype.getContext;
	});

	afterEach(() => {
		HTMLCanvasElement.prototype.getContext = originalGetContext;
	});

	it('builds a non-interactive guide image sized to the page', () => {
		const guide = createGridGuideImage(layout, '#000000');

		expect(isGuide(guide)).toBe(true);
		expect(guide.isGridGuide).toBe(true);
		expect(guide.selectable).toBe(false);
		expect(guide.evented).toBe(false);
		expect(guide.excludeFromExport).toBe(true);
		expect(guide.width).toBe(100);
		expect(guide.height).toBe(80);
	});

	it('paints the dots with the given color and re-rasterizes when it changes', () => {
		createGridGuideImage(layout, '#112233');

		const first = contexts.at(-1);

		expect(first?.fillStyle).toBe('#112233');
		expect(first?.arc).toHaveBeenCalledTimes(layout.cols * layout.rows);

		createGridGuideImage(layout, '#112233');

		expect(contexts.at(-1)).toBe(first);

		createGridGuideImage(layout, '#eeddcc');

		expect(contexts.at(-1)).not.toBe(first);
		expect(contexts.at(-1)?.fillStyle).toBe('#eeddcc');
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
