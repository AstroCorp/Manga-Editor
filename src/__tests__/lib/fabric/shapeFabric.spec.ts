import { describe, it, expect } from 'vitest';
import { shapeToPolygon } from '@/lib/fabric/shapeFabric';
import { getPanelId, isPanel } from '@/lib/fabric/isGuide';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';

describe('shapeToPolygon', () => {
	it('creates a locked panel polygon with custom props', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 100, y: 0 },
				{ x: 100, y: 80 },
				{ x: 0, y: 80 },
			],
			3,
		);

		const polygon = shapeToPolygon(shape);

		expect(isPanel(polygon)).toBe(true);
		expect(getPanelId(polygon)).toBe(shape.id);
		expect(polygon.lockMovementX).toBe(true);
		expect(polygon.hasControls).toBe(false);
		expect(polygon.strokeWidth).toBe(3);
		expect(polygon.perPixelTargetFind).toBe(true);
		expect(polygon.selectable).toBe(true);
		expect(polygon.evented).toBe(true);
	});

	it('disables selection when the shape already has an image', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 40, y: 0 },
				{ x: 40, y: 40 },
			],
			2,
		);

		shape.setImage(
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 20,
				top: 20,
				scaleX: 1,
				scaleY: 1,
			}),
		);

		const polygon = shapeToPolygon(shape);

		expect(polygon.selectable).toBe(false);
		expect(polygon.evented).toBe(false);
		expect(getPanelId(polygon)).toBe(shape.id);
	});
});
