import { describe, it, expect } from 'vitest';
import { Point } from 'fabric';
import { shapeToPolygon } from '@/lib/fabric/shapeFabric';
import {
	getPanelScenePoints,
	panelContainsScenePoint,
} from '@/lib/fabric/panelHitTest';
import { Shape } from '@/models/Shape';

describe('panelHitTest', () => {
	it('detects points inside the real polygon, not only the bbox', () => {
		// Rombo: el bbox es 0..100, pero (10,10) queda fuera del polígono.
		const shape = Shape.create(
			[
				{ x: 50, y: 0 },
				{ x: 100, y: 50 },
				{ x: 50, y: 100 },
				{ x: 0, y: 50 },
			],
			2,
		);
		const panel = shapeToPolygon(shape);

		expect(panelContainsScenePoint(panel, new Point(50, 40))).toBe(true);
		expect(panelContainsScenePoint(panel, new Point(10, 10))).toBe(false);
		expect(panelContainsScenePoint(panel, new Point(50, 10))).toBe(true);
	});

	it('returns at least 3 scene points for a triangle panel', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 40, y: 0 },
				{ x: 20, y: 30 },
			],
			2,
		);
		const panel = shapeToPolygon(shape);

		expect(getPanelScenePoints(panel).length).toBe(3);
	});
});
