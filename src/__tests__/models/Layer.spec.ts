import { describe, expect, it } from 'vitest';
import {
	DEFAULT_GRID_COLS,
	DEFAULT_GRID_ROWS,
	DEFAULT_MARGIN,
	DEFAULT_STROKE_COLOR,
	DEFAULT_STROKE_WIDTH,
	MAX_GRID_POINTS,
	MAX_STROKE_WIDTH,
	MIN_GRID_POINTS,
} from '@/lib/page/pageLimits';
import { Layer } from '@/models/Layer';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import { TextBlock } from '@/models/TextBlock';

const triangle = [
	{ x: 0, y: 0 },
	{ x: 20, y: 0 },
	{ x: 20, y: 20 },
];

describe('Layer', () => {
	it('creates a named layer with clamped defaults', () => {
		const first = Layer.createDefault();
		const second = Layer.createDefault(2);
		const clamped = new Layer({
			id: 'layer-1',
			name: 'Ink',
			gridCols: 1,
			gridRows: 999,
			strokeWidth: 80,
			strokeColor: 'nope',
		});

		expect(first.name).toBe('Layer 1');
		expect(second.name).toBe('Layer 2');
		expect(first.visible).toBe(true);
		expect(clamped.gridCols).toBe(MIN_GRID_POINTS);
		expect(clamped.gridRows).toBe(MAX_GRID_POINTS);
		expect(clamped.strokeWidth).toBe(MAX_STROKE_WIDTH);
		expect(clamped.strokeColor).toBe(DEFAULT_STROKE_COLOR);
		expect(clamped.getDefaultStroke()).toEqual({
			width: MAX_STROKE_WIDTH,
			color: DEFAULT_STROKE_COLOR,
		});
	});

	it('clamps margins to the page and applies the default margin', () => {
		const layer = Layer.createDefault();

		layer.setMargins(
			{
				marginTop: 5000,
				marginRight: -4,
				marginBottom: Number.NaN,
				marginLeft: 10.4,
			},
			1000,
			800,
		);

		expect(layer.marginTop).toBe(160);
		expect(layer.marginRight).toBe(0);
		expect(layer.marginBottom).toBe(0);
		expect(layer.marginLeft).toBe(10);

		layer.applyDefaultMargins(1000, 800);
		expect(layer.marginTop).toBe(DEFAULT_MARGIN);
	});

	it('adds, updates and removes shapes and texts', () => {
		const layer = Layer.createDefault();
		const shape = Shape.create(triangle, 2);
		const text = TextBlock.create(0, 0);
		const image = new ShapeImage({
			src: 'asset://photo',
			left: 0,
			top: 0,
			scaleX: 1,
			scaleY: 1,
		});

		expect(layer.removeShape('missing')).toBe(false);
		expect(layer.removeText('missing')).toBe(false);
		expect(layer.updateText('missing', { content: 'Hi' })).toBe(false);
		expect(layer.setShapeImage('missing', image)).toBe(false);
		expect(layer.setShapeFill('missing', '#ffffff')).toBe(false);
		expect(layer.setShapeEdgeStroke('missing', 0, { width: 1 })).toBe(false);

		layer.addShape(shape);
		layer.addText(text);
		expect(layer.setShapeImage(shape.id, image)).toBe(true);
		expect(layer.setShapeFill(shape.id, '#ffffff')).toBe(true);
		expect(layer.setShapeFill(shape.id, 'nope')).toBe(false);
		expect(layer.setShapeEdgeStroke(shape.id, 0, { width: 9 })).toBe(true);
		expect(layer.updateText(text.id, { content: 'Hi' })).toBe(true);
		expect(text.content).toBe('Hi');
		expect(shape.image?.src).toBe('asset://photo');

		expect(layer.removeShape(shape.id)).toBe(true);
		expect(layer.removeText(text.id)).toBe(true);
		expect(layer.shapes).toEqual([]);
		expect(layer.texts).toEqual([]);
	});

	it('applies one stroke to every edge and replaces content from a layout', () => {
		const layer = Layer.createDefault();
		const shape = Shape.create(triangle, DEFAULT_STROKE_WIDTH);
		const text = TextBlock.create(0, 0);

		layer.addShape(shape);
		layer.addText(text);
		layer.applyStrokeToShapes({ width: 7, color: '#abcdef' });

		expect(layer.strokeWidth).toBe(7);
		expect(layer.strokeColor).toBe('#abcdef');
		expect(shape.strokes.every((stroke) => stroke.width === 7)).toBe(true);

		layer.applyLayoutContent(
			{
				gridCols: 4,
				gridRows: 6,
				marginTop: 12,
				shapes: [
					{
						id: 'panel-1',
						points: triangle,
						image: null,
					},
				],
			},
			1000,
			800,
		);

		expect(layer.gridCols).toBe(4);
		expect(layer.gridRows).toBe(6);
		expect(layer.marginTop).toBe(12);
		expect(layer.texts).toEqual([]);
		expect(layer.shapes.map((item) => item.id)).toEqual(['panel-1']);
		expect(layer.toLayoutFields().shapes[0]?.image).toBeNull();
		expect(layer.toLayoutFields().gridCols).toBe(4);

		layer.setGrid(DEFAULT_GRID_COLS, DEFAULT_GRID_ROWS);
		layer.clearShapes();
		layer.clearTexts();
		expect(layer.shapes).toEqual([]);
		expect(layer.gridCols).toBe(DEFAULT_GRID_COLS);
	});
});
