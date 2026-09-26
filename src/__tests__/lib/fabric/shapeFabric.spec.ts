import { describe, it, expect, vi } from 'vitest';
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
		expect(polygon.stroke).toBe('#111111');
		expect(polygon.edgeStrokes).toEqual(shape.strokes);
		expect(polygon.edgeStrokes).not.toBe(shape.strokes);
	});

	it('syncs strokeWidth with the widest edge and marks the cache dirty', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 100, y: 0 },
				{ x: 100, y: 80 },
			],
			3,
		);
		const polygon = shapeToPolygon(shape, {
			layerId: 'layer-1',
			interactive: true,
		});

		polygon.dirty = false;
		polygon.setEdgeStrokes([
			{ width: 1, color: '#111111' },
			{ width: 12, color: '#ff0000' },
			{ width: 0, color: '#111111' },
		]);

		expect(polygon.strokeWidth).toBe(12);
		expect(polygon.dirty).toBe(true);
		expect(polygon.edgeStrokes?.[1]).toEqual({ width: 12, color: '#ff0000' });
	});

	it('strokes each edge separately when they differ', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 100, y: 0 },
				{ x: 100, y: 80 },
			],
			3,
		);

		shape.setEdgeStroke(1, { width: 8, color: '#00ff00' });
		shape.setEdgeStroke(2, { width: 0 });

		const polygon = shapeToPolygon(shape, {
			layerId: 'layer-1',
			interactive: true,
		});
		const calls: Array<{ lineWidth: number; strokeStyle: string }> = [];
		const ctx = {
			lineWidth: 0,
			strokeStyle: '',
			lineCap: 'butt',
			beginPath: vi.fn(),
			moveTo: vi.fn(),
			lineTo: vi.fn(),
			closePath: vi.fn(),
			save: vi.fn(),
			restore: vi.fn(),
			stroke: vi.fn(function (this: {
				lineWidth: number;
				strokeStyle: string;
			}) {
				calls.push({ lineWidth: this.lineWidth, strokeStyle: this.strokeStyle });
			}),
		};

		polygon._renderFill = vi.fn();
		polygon._renderStroke = vi.fn();
		polygon._render(ctx as unknown as CanvasRenderingContext2D);

		expect(polygon._renderFill).toHaveBeenCalledTimes(1);
		expect(polygon._renderStroke).not.toHaveBeenCalled();
		expect(calls).toEqual([
			{ lineWidth: 3, strokeStyle: '#111111' },
			{ lineWidth: 8, strokeStyle: '#00ff00' },
		]);
	});

	it('uses the native stroke when every edge matches', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 100, y: 0 },
				{ x: 100, y: 80 },
			],
			3,
		);
		const polygon = shapeToPolygon(shape, {
			layerId: 'layer-1',
			interactive: true,
		});
		const ctx = {
			beginPath: vi.fn(),
			moveTo: vi.fn(),
			lineTo: vi.fn(),
			closePath: vi.fn(),
			stroke: vi.fn(),
		};

		polygon._renderFill = vi.fn();
		polygon._renderStroke = vi.fn();
		polygon._render(ctx as unknown as CanvasRenderingContext2D);

		expect(polygon._renderStroke).toHaveBeenCalledTimes(1);
		expect(ctx.stroke).not.toHaveBeenCalled();
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
