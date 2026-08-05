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

		const polygon = shapeToPolygon(shape, {
			layerId: 'layer-1',
			interactive: true,
		});

		expect(isPanel(polygon)).toBe(true);
		expect(getPanelId(polygon)).toBe(shape.id);
		expect(polygon.lockMovementX).toBe(true);
		expect(polygon.hasControls).toBe(false);
		expect(polygon.strokeWidth).toBe(3);
		expect(polygon.perPixelTargetFind).toBe(true);
		expect(polygon.selectable).toBe(true);
		expect(polygon.evented).toBe(true);
		expect(polygon.fill).toBe('rgba(255,255,255,0.01)');
		expect(polygon.get('layerId')).toBe('layer-1');
	});

	it('applies white fill from the shape', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 20, y: 0 },
				{ x: 20, y: 20 },
			],
			2,
		);

		shape.setWhiteFill(true);

		const polygon = shapeToPolygon(shape, {
			layerId: 'layer-1',
			interactive: true,
		});

		expect(polygon.fill).toBe('#ffffff');
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
				left: 1,
				top: 1,
				scaleX: 1,
				scaleY: 1,
			}),
		);

		const polygon = shapeToPolygon(shape, {
			layerId: 'layer-1',
			interactive: true,
		});

		expect(polygon.selectable).toBe(false);
		expect(polygon.evented).toBe(false);
	});

	it('locks inactive layer panels', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			2,
		);
		const polygon = shapeToPolygon(shape, {
			layerId: 'other',
			interactive: false,
		});

		expect(polygon.selectable).toBe(false);
		expect(polygon.evented).toBe(false);
	});
});
