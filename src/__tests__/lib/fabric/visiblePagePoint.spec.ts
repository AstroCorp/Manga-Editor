import { describe, expect, it } from 'vitest';
import { getVisiblePageCenter } from '@/lib/fabric/visiblePagePoint';

describe('getVisiblePageCenter', () => {
	it('falls back to page center without a stage child', () => {
		const root = {
			firstElementChild: null,
			getBoundingClientRect: () => {
				return { left: 0, top: 0, width: 400, height: 300 };
			},
			clientWidth: 400,
			clientHeight: 300,
		} as unknown as HTMLElement;

		expect(getVisiblePageCenter(root, 800, 1200, 1)).toEqual({
			x: 400,
			y: 600,
		});
	});

	it('maps the viewport center into page coordinates with zoom', () => {
		const stage = {
			getBoundingClientRect: () => {
				return { left: 100, top: 50, width: 400, height: 600 };
			},
		};
		const root = {
			firstElementChild: stage,
			getBoundingClientRect: () => {
				return { left: 0, top: 0, width: 500, height: 400 };
			},
			clientWidth: 500,
			clientHeight: 400,
		} as unknown as HTMLElement;

		// Viewport center (250, 200) → relative to stage (150, 150) → / zoom 2
		expect(getVisiblePageCenter(root, 1000, 1000, 2)).toEqual({
			x: 75,
			y: 75,
		});
	});

	it('clamps the center to the page bounds', () => {
		const stage = {
			getBoundingClientRect: () => {
				return { left: -200, top: -200, width: 100, height: 100 };
			},
		};
		const root = {
			firstElementChild: stage,
			getBoundingClientRect: () => {
				return { left: 0, top: 0, width: 100, height: 100 };
			},
			clientWidth: 100,
			clientHeight: 100,
		} as unknown as HTMLElement;

		expect(getVisiblePageCenter(root, 50, 50, 1)).toEqual({
			x: 50,
			y: 50,
		});
	});
});
