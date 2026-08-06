import { describe, expect, it } from 'vitest';
import {
	getVisiblePageCenter,
	scrollPageRectIntoView,
} from '@/lib/fabric/visiblePagePoint';

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

describe('scrollPageRectIntoView', () => {
	it('centers the page rect in the stage viewport', () => {
		const stage = {
			getBoundingClientRect: () => {
				return { left: 0, top: 0, width: 1000, height: 2000 };
			},
		};
		const root = {
			firstElementChild: stage,
			clientWidth: 400,
			clientHeight: 300,
			scrollWidth: 1000,
			scrollHeight: 2000,
			scrollLeft: 0,
			scrollTop: 0,
			getBoundingClientRect: () => {
				return { left: 0, top: 0, width: 400, height: 300 };
			},
			scrollTo(options: ScrollToOptions) {
				this.scrollLeft = options.left ?? this.scrollLeft;
				this.scrollTop = options.top ?? this.scrollTop;
			},
		} as unknown as HTMLElement;

		scrollPageRectIntoView(
			root,
			{ left: 800, top: 1920, width: 200, height: 80 },
			1,
		);

		expect(root.scrollLeft).toBe(600);
		expect(root.scrollTop).toBe(1700);
	});

	it('respects zoom when computing the scroll target', () => {
		const stage = {
			getBoundingClientRect: () => {
				return { left: 0, top: 0, width: 2000, height: 4000 };
			},
		};
		const root = {
			firstElementChild: stage,
			clientWidth: 400,
			clientHeight: 300,
			scrollWidth: 2000,
			scrollHeight: 4000,
			scrollLeft: 0,
			scrollTop: 0,
			getBoundingClientRect: () => {
				return { left: 0, top: 0, width: 400, height: 300 };
			},
			scrollTo(options: ScrollToOptions) {
				this.scrollLeft = options.left ?? this.scrollLeft;
				this.scrollTop = options.top ?? this.scrollTop;
			},
		} as unknown as HTMLElement;

		scrollPageRectIntoView(
			root,
			{ left: 100, top: 100, width: 100, height: 100 },
			2,
		);

		// Centro página (150,150) * zoom 2 = (300,300); viewport center (200,150)
		expect(root.scrollLeft).toBe(100);
		expect(root.scrollTop).toBe(150);
	});
});
