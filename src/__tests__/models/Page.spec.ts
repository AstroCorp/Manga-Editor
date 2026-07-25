import { describe, it, expect } from 'vitest';
import { Page } from '@/models/Page';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import {
	DEFAULT_GRID_COLS,
	DEFAULT_PAGE_HEIGHT,
	DEFAULT_PAGE_WIDTH,
} from '@/lib/page/pageLimits';

describe('Page / Shape / ShapeImage', () => {
	it('creates a blank page with defaults', () => {
		const page = Page.createBlank(1);

		expect(page.name).toBe('Page 1');
		expect(page.width).toBe(DEFAULT_PAGE_WIDTH);
		expect(page.height).toBe(DEFAULT_PAGE_HEIGHT);
		expect(page.gridCols).toBe(DEFAULT_GRID_COLS);
		expect(page.shapes).toEqual([]);
	});

	it('adds and serializes shapes round-trip', () => {
		const page = Page.createBlank(1);
		const shape = Shape.create(
			[
				{ x: 10, y: 10 },
				{ x: 50, y: 10 },
				{ x: 50, y: 40 },
			],
			4,
		);

		page.addShape(shape);

		const json = page.toJSON();
		const restored = Page.fromJSON(json);

		expect(restored.shapes).toHaveLength(1);
		expect(restored.shapes[0]?.id).toBe(shape.id);
		expect(restored.shapes[0]?.strokeWidth).toBe(4);
		expect(restored.shapes[0]?.points).toEqual(shape.points);
	});

	it('layout JSON strips images from shapes', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 20, y: 0 },
				{ x: 10, y: 20 },
			],
			2,
		);

		shape.setImage(
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 5,
				top: 5,
				scaleX: 1,
				scaleY: 1,
			}),
		);

		expect(shape.toJSON().image).not.toBeNull();
		expect(shape.toLayoutJSON().image).toBeNull();
	});

	it('clamps page size and margins', () => {
		const page = Page.createBlank(1);
		
		page.setSize(50, 50);
		page.setMargins({
			marginTop: 9999,
			marginRight: 9999,
			marginBottom: 9999,
			marginLeft: 9999,
		});

		expect(page.width).toBe(100);
		expect(page.marginTop).toBeLessThanOrEqual(20);
	});
});
