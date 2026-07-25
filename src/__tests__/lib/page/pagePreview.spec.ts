import { describe, expect, it } from 'vitest';
import { buildPagePreview } from '@/lib/page/pagePreview';

describe('pagePreview', () => {
	it('returns empty panels for blank shapes', () => {
		const preview = buildPagePreview(100, 200, []);

		expect(preview.panels).toEqual([]);
		expect(preview.images).toEqual([]);
		expect(preview.height).toBe(200);
	});

	it('builds svg points from shape polygons', () => {
		const preview = buildPagePreview(200, 200, [
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				strokeWidth: 2,
				image: null,
			},
		]);

		expect(preview.panels).toHaveLength(1);
		expect(preview.panels[0]?.points).toBe('0,0 10,0 10,10');
		expect(preview.panels[0]?.strokeWidth).toBe(2);
	});

	it('places images with center origin', () => {
		const preview = buildPagePreview(200, 200, [
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				strokeWidth: 2,
				image: {
					src: 'https://example.com/cover.png',
					left: 100,
					top: 80,
					scaleX: 2,
					scaleY: 2,
					originX: 'center',
					originY: 'center',
					width: 50,
					height: 40,
				},
			},
		]);

		expect(preview.images).toHaveLength(1);
		expect(preview.images[0]).toEqual({
			href: 'https://example.com/cover.png',
			x: 50,
			y: 40,
			width: 100,
			height: 80,
		});
	});
});
