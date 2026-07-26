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

	it('applies layout JSON and exports geometry without images', () => {
		const page = Page.createBlank(1);

		page.setStrokeWidth(4);

		const shape = Shape.create(
			[
				{ x: 10, y: 10 },
				{ x: 50, y: 10 },
				{ x: 50, y: 40 },
			],
			4,
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
		page.addShape(shape);

		const layout = page.toLayoutJSON();

		expect(layout.strokeWidth).toBe(4);
		expect(layout.shapes).toHaveLength(1);
		expect(layout.shapes[0]?.strokeWidth).toBe(4);
		expect(layout.shapes[0]?.image).toBeNull();
		expect(layout).not.toHaveProperty('id');
		expect(layout).not.toHaveProperty('name');

		const other = Page.createBlank(2);

		other.applyLayout({
			...layout,
			shapes: layout.shapes ?? [],
		});

		expect(other.shapes).toHaveLength(1);
		expect(other.strokeWidth).toBe(4);
		expect(other.shapes[0]?.strokeWidth).toBe(4);
		expect(other.shapes[0]?.points).toEqual(shape.points);
		expect(other.shapes[0]?.image).toBeNull();
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

	it('setStrokeWidth applies to all shapes and setShapeImage refreshes the shapes array ref', () => {
		const page = Page.createBlank(1);
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 20, y: 0 },
				{ x: 10, y: 20 },
			],
			2,
		);

		page.addShape(shape);

		const afterAdd = page.shapes;

		page.setStrokeWidth(8);
		expect(page.shapes).not.toBe(afterAdd);
		expect(page.strokeWidth).toBe(8);
		expect(page.shapes[0]?.strokeWidth).toBe(8);

		const afterStroke = page.shapes;
		const image = new ShapeImage({
			src: 'data:image/png;base64,xx',
			left: 5,
			top: 5,
			scaleX: 1,
			scaleY: 1,
		});

		expect(page.setShapeImage(shape.id, image)).toBe(true);
		expect(page.shapes).not.toBe(afterStroke);
		expect(page.shapes[0]?.image?.src).toBe(image.src);
	});

	it('applyLayout forces page stroke on every shape', () => {
		const page = Page.createBlank(1);

		page.applyLayout({
			width: 800,
			height: 1200,
			shapes: [
				{
					id: 'a',
					points: [
						{ x: 0, y: 0 },
						{ x: 10, y: 0 },
						{ x: 10, y: 10 },
					],
					strokeWidth: 2,
					image: null,
				},
			],
			strokeWidth: 12,
		});

		expect(page.strokeWidth).toBe(12);
		expect(page.shapes[0]?.strokeWidth).toBe(12);
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
