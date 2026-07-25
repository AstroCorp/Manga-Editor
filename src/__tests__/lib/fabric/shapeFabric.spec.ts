import { describe, it, expect } from 'vitest';
import { shapeToPolygon } from '@/lib/fabric/shapeFabric';
import { getPanelId, isPanel } from '@/lib/fabric/isGuide';
import { Shape } from '@/models/Shape';

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
	});
});
