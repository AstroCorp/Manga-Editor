import { describe, it, expect } from 'vitest';
import { listLayerElements } from '@/lib/page/layerElements';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import { TextBlock } from '@/models/TextBlock';

describe('listLayerElements', () => {
	it('lists shapes and texts with top-of-list on top', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			2,
		);
		const text = TextBlock.create(0, 0);
		text.content = 'Hello world';

		const items = listLayerElements({
			shapes: [shape],
			texts: [text],
		});

		expect(items.map((item) => item.kind)).toEqual(['text', 'shape']);
		expect(items[0]?.label).toBe('Hello world');
		expect(items[1]?.label).toBe('Panel 1');
		expect(items[1]?.icon).toBe('fluent:hexagon-24-regular');
	});

	it('marks panels that have an image', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			2,
		);

		shape.setImage(
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 0,
				top: 0,
				scaleX: 1,
				scaleY: 1,
			}),
		);

		const items = listLayerElements({
			shapes: [shape],
			texts: [],
		});

		expect(items[0]?.label).toBe('Panel 1 (with image)');
		expect(items[0]?.icon).toBe('fluent:image-24-regular');
	});

	it('truncates long text labels', () => {
		const text = TextBlock.create(0, 0);
		text.content = 'abcdefghijklmnopqrstuvwxyz0123456789';

		const items = listLayerElements({
			shapes: [],
			texts: [text],
		});

		expect(items[0]?.label.endsWith('…')).toBe(true);
		expect(items[0]?.label.length).toBe(28);
	});
});
