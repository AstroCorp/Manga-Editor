import { describe, expect, it, vi } from 'vitest';
import { FabricObject } from 'fabric';
import {
	PanelPolygonShape,
	asPanelPolygonShape,
} from '@/lib/fabric/PanelPolygon';

const triangle = [
	{ x: 0, y: 0 },
	{ x: 40, y: 0 },
	{ x: 0, y: 30 },
];

describe('PanelPolygonShape', () => {
	it('syncs the native stroke with the thickest edge and identifies instances', () => {
		const polygon = new PanelPolygonShape(triangle, { objectCaching: false });

		polygon.setEdgeStrokes([
			{ width: 2, color: '#111111' },
			{ width: 6, color: '#222222' },
			{ width: 6, color: '#222222' },
		]);

		expect(polygon.edgeStrokes).toHaveLength(3);
		expect(polygon.strokeWidth).toBe(6);
		expect(polygon.stroke).toBe('#111111');
		expect(asPanelPolygonShape(polygon)).toBe(polygon);
		expect(asPanelPolygonShape(new FabricObject())).toBeNull();
		expect(asPanelPolygonShape(null)).toBeNull();
	});

	it('paints each edge when strokes differ and delegates when they match', () => {
		const polygon = new PanelPolygonShape(triangle, { objectCaching: false });
		const fill = vi
			.spyOn(PanelPolygonShape.prototype, '_renderFill')
			.mockImplementation(() => undefined);
		const stroke = vi
			.spyOn(PanelPolygonShape.prototype, '_renderStroke')
			.mockImplementation(() => undefined);
		const ctx = {
			save: vi.fn(),
			restore: vi.fn(),
			beginPath: vi.fn(),
			moveTo: vi.fn(),
			lineTo: vi.fn(),
			closePath: vi.fn(),
			stroke: vi.fn(),
			lineWidth: 0,
			strokeStyle: '',
			lineCap: '',
		} as unknown as CanvasRenderingContext2D;

		polygon.setEdgeStrokes([
			{ width: 2, color: '#111111' },
			{ width: 0, color: '#222222' },
			{ width: 4, color: '#333333' },
		]);
		polygon._render(ctx);

		expect(fill).toHaveBeenCalled();
		expect(stroke).not.toHaveBeenCalled();
		expect(ctx.stroke).toHaveBeenCalledTimes(2);

		polygon.setEdgeStrokes([
			{ width: 3, color: '#111111' },
			{ width: 3, color: '#111111' },
			{ width: 3, color: '#111111' },
		]);
		polygon._render(ctx);
		expect(stroke).toHaveBeenCalled();

		fill.mockRestore();
		stroke.mockRestore();
	});
});
