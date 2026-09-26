import { describe, it, expect } from 'vitest';
import { Page } from '@/models/Page';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import { TextBlock } from '@/models/TextBlock';
import {
	DEFAULT_GRID_COLS,
	DEFAULT_PAGE_BACKGROUND,
	DEFAULT_PAGE_HEIGHT,
	DEFAULT_PAGE_WIDTH,
} from '@/lib/page/pageLimits';

describe('Page / Layer / Shape / ShapeImage', () => {
	it('creates a blank page with a default layer', () => {
		const page = Page.createBlank(1);

		expect(page.name).toBe('Page 1');
		expect(page.width).toBe(DEFAULT_PAGE_WIDTH);
		expect(page.height).toBe(DEFAULT_PAGE_HEIGHT);
		expect(page.backgroundColor).toBe(DEFAULT_PAGE_BACKGROUND);
		expect(page.layers).toHaveLength(1);
		expect(page.getActiveLayer().gridCols).toBe(DEFAULT_GRID_COLS);
		expect(page.getActiveLayer().shapes).toEqual([]);
	});

	it('keeps the background color per page and survives size/rotation resets', () => {
		const page = Page.createBlank(1);
		const other = Page.createBlank(2);

		expect(page.setBackgroundColor('#ABC')).toBe(true);
		expect(page.backgroundColor).toBe('#aabbcc');
		expect(other.backgroundColor).toBe(DEFAULT_PAGE_BACKGROUND);

		expect(page.setBackgroundColor('#aabbcc')).toBe(false);
		expect(page.setBackgroundColor('not-a-color')).toBe(false);
		expect(page.backgroundColor).toBe('#aabbcc');

		page.setSize(900, 1200);
		page.rotateOrientation('clockwise');

		expect(page.backgroundColor).toBe('#aabbcc');
		expect(page.toLayoutJSON().backgroundColor).toBe('#aabbcc');
	});

	it('applyLayout only overrides the background when the layout defines it', () => {
		const page = Page.createBlank(1);

		page.setBackgroundColor('#aabbcc');
		page.applyLayout({ width: 800, height: 1200, layers: [{}] });

		expect(page.backgroundColor).toBe('#aabbcc');

		page.applyLayout({
			width: 800,
			height: 1200,
			backgroundColor: '#112233',
			layers: [{}],
		});

		expect(page.backgroundColor).toBe('#112233');
	});

	it('applies layout JSON to the active layer and exports without images', () => {
		const page = Page.createBlank(1);

		page.setActiveLayerStrokeWidth(4);

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

		expect(layout.layers).toHaveLength(1);
		expect(layout.layers[0]?.strokeWidth).toBe(4);
		expect(layout.layers[0]?.strokeColor).toBe('#111111');
		expect(layout.layers[0]?.shapes).toHaveLength(1);
		expect(layout.layers[0]?.shapes?.[0]).not.toHaveProperty('strokeWidth');
		expect(layout.layers[0]?.shapes?.[0]?.strokes).toEqual([
			{ width: 4, color: '#111111' },
			{ width: 4, color: '#111111' },
			{ width: 4, color: '#111111' },
		]);
		expect(layout.layers[0]?.shapes?.[0]?.image).toBeNull();
		expect(layout).not.toHaveProperty('shapes');
		expect(layout).not.toHaveProperty('id');
		expect(layout).not.toHaveProperty('name');

		const other = Page.createBlank(2);

		other.applyLayout(layout);

		expect(other.getActiveLayer().shapes).toHaveLength(1);
		expect(other.getActiveLayer().strokeWidth).toBe(4);
		expect(other.getActiveLayer().shapes[0]?.image).toBeNull();
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

		expect(shape.setFill('#ABC')).toBe(true);
		expect(shape.fill).toBe('#aabbcc');
		expect(shape.toJSON()).not.toHaveProperty('fill');
		expect(shape.toLayoutJSON()).not.toHaveProperty('fill');
		expect(Shape.fromJSON(shape.toJSON()).fill).toBeNull();
	});

	it('Shape.setFill normalizes colors and rejects invalid or unchanged values', () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			2,
		);

		expect(shape.fill).toBeNull();
		expect(shape.setFill(null)).toBe(false);
		expect(shape.setFill('not-a-color')).toBe(false);
		expect(shape.fill).toBeNull();

		expect(shape.setFill('#FFCC00')).toBe(true);
		expect(shape.fill).toBe('#ffcc00');
		expect(shape.setFill('#ffcc00')).toBe(false);
		expect(shape.setFill('nope')).toBe(false);
		expect(shape.fill).toBe('#ffcc00');

		expect(shape.setFill(null)).toBe(true);
		expect(shape.fill).toBeNull();
		expect(new Shape({ ...shape.toJSON(), fill: 'bad' }).fill).toBeNull();
	});

	it('ShapeImage persists grayscale and flips through JSON round-trip', () => {
		const image = new ShapeImage({
			src: 'data:image/png;base64,xx',
			left: 1,
			top: 2,
			scaleX: 1.5,
			scaleY: 1.5,
			grayscale: true,
			flipX: true,
			flipY: true,
		});
		const restored = ShapeImage.fromJSON(image.toJSON());

		expect(restored.grayscale).toBe(true);
		expect(restored.flipX).toBe(true);
		expect(restored.flipY).toBe(true);
		expect(
			Shape.fromJSON({
				id: 's1',
				points: [
					{ x: 0, y: 0 },
					{ x: 1, y: 0 },
					{ x: 1, y: 1 },
				],
				strokeWidth: 2,
				image: image.toJSON(),
			}).image,
		).toMatchObject({ grayscale: true, flipX: true, flipY: true });
	});

	it('layer stroke defaults do not touch existing shapes; setShapeImage refreshes refs', () => {
		const page = Page.createBlank(1);
		const layer = page.getActiveLayer();
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 20, y: 0 },
				{ x: 10, y: 20 },
			],
			2,
		);

		page.addShape(shape);

		const afterAdd = layer.shapes;

		page.setActiveLayerStrokeWidth(8);
		page.setActiveLayerStrokeColor('#ff0000');
		expect(layer.shapes).toBe(afterAdd);
		expect(layer.strokeWidth).toBe(8);
		expect(layer.strokeColor).toBe('#ff0000');
		expect(layer.shapes[0]?.strokes).toEqual([
			{ width: 2, color: '#111111' },
			{ width: 2, color: '#111111' },
			{ width: 2, color: '#111111' },
		]);

		const afterStroke = layer.shapes;
		const image = new ShapeImage({
			src: 'data:image/png;base64,xx',
			left: 5,
			top: 5,
			scaleX: 1,
			scaleY: 1,
		});

		expect(page.setShapeImage(shape.id, image)).toBe(true);
		expect(layer.shapes).not.toBe(afterStroke);
		expect(layer.shapes[0]?.image?.src).toBe(image.src);
	});

	it('applyLayout falls back to the layer stroke for shapes without strokes', () => {
		const page = Page.createBlank(1);

		page.applyLayout({
			width: 800,
			height: 1200,
			layers: [
				{
					shapes: [
						{
							id: 'a',
							points: [
								{ x: 0, y: 0 },
								{ x: 10, y: 0 },
								{ x: 10, y: 10 },
							],
							image: null,
						},
						{
							id: 'b',
							points: [
								{ x: 20, y: 0 },
								{ x: 30, y: 0 },
								{ x: 30, y: 10 },
							],
							strokes: [{ width: 1, color: '#00ff00' }],
							image: null,
						},
					],
					strokeWidth: 12,
					strokeColor: '#0000ff',
				},
			],
		});

		const layer = page.getActiveLayer();

		expect(layer.strokeWidth).toBe(12);
		expect(layer.strokeColor).toBe('#0000ff');
		expect(layer.shapes[0]?.strokes).toEqual([
			{ width: 12, color: '#0000ff' },
			{ width: 12, color: '#0000ff' },
			{ width: 12, color: '#0000ff' },
		]);
		expect(layer.shapes[1]?.strokes).toEqual([
			{ width: 1, color: '#00ff00' },
			{ width: 12, color: '#0000ff' },
			{ width: 12, color: '#0000ff' },
		]);
	});

	it('applyStrokeToAllShapes overrides every edge on every layer', () => {
		const page = Page.createBlank(1);
		const first = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			2,
		);

		page.addShape(first);
		page.addLayer();

		const second = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
				{ x: 0, y: 10 },
			],
			9,
			'#00ff00',
		);

		page.addShape(second);
		second.setEdgeStroke(2, { width: 1 });
		page.applyStrokeToAllShapes({ width: 4, color: '#ff0000' });

		for (const layer of page.layers) {
			expect(layer.strokeWidth).toBe(4);
			expect(layer.strokeColor).toBe('#ff0000');

			for (const shape of layer.shapes) {
				expect(shape.strokes).toHaveLength(shape.points.length);
				expect(
					shape.strokes.every((stroke) => {
						return stroke.width === 4 && stroke.color === '#ff0000';
					}),
				).toBe(true);
			}
		}
	});

	it('setShapeEdgeStroke patches a single edge and refreshes the shapes ref', () => {
		const page = Page.createBlank(1);
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			3,
		);

		page.addShape(shape);

		const before = page.getActiveLayer().shapes;

		expect(page.setShapeEdgeStroke(shape.id, 1, { color: '#ff0000' })).toBe(
			true,
		);
		expect(page.getActiveLayer().shapes).not.toBe(before);
		expect(shape.strokes[1]).toEqual({ width: 3, color: '#ff0000' });
		expect(shape.strokes[0]).toEqual({ width: 3, color: '#111111' });
		expect(page.setShapeEdgeStroke(shape.id, 7, { width: 1 })).toBe(false);
		expect(page.setShapeEdgeStroke('missing', 0, { width: 1 })).toBe(false);
	});

	it('Shape.fromJSON migrates legacy strokeWidth and clamps invalid strokes', () => {
		const legacy = Shape.fromJSON({
			id: 'legacy',
			points: [
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			strokeWidth: 7,
			image: null,
		});

		expect(legacy.strokes).toEqual([
			{ width: 7, color: '#111111' },
			{ width: 7, color: '#111111' },
			{ width: 7, color: '#111111' },
		]);

		const partial = Shape.fromJSON({
			id: 'partial',
			points: [
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			strokes: [{ width: 999, color: 'not-a-color' }],
			image: null,
		});

		expect(partial.strokes[0]?.width).toBe(40);
		expect(partial.strokes[0]?.color).toBe('#111111');
		expect(partial.strokes).toHaveLength(3);
	});

	it('applyLayout with a single layer updates only the active layer', () => {
		const page = Page.createBlank(1);
		const bottomId = page.activeLayerId;

		page.addLayer();
		page.addLayer();
		expect(page.layers).toHaveLength(3);
		expect(page.activeLayerId).not.toBe(bottomId);

		const activeId = page.activeLayerId;

		page.applyLayout({
			width: 600,
			height: 900,
			layers: [
				{
					shapes: [
						{
							id: 'p1',
							points: [
								{ x: 0, y: 0 },
								{ x: 10, y: 0 },
								{ x: 10, y: 10 },
							],
							image: null,
						},
					],
				},
			],
		});

		expect(page.layers).toHaveLength(3);
		expect(page.activeLayerId).toBe(activeId);
		expect(page.getActiveLayer().shapes).toHaveLength(1);
		expect(page.layers[0]?.shapes).toHaveLength(0);
	});

	it('applyLayout supports multi-layer payloads', () => {
		const page = Page.createBlank(1);

		page.applyLayout({
			width: 600,
			height: 900,
			layers: [
				{
					name: 'Base',
					shapes: [
						{
							id: 'a',
							points: [
								{ x: 0, y: 0 },
								{ x: 5, y: 0 },
								{ x: 5, y: 5 },
							],
							image: null,
						},
					],
				},
				{
					name: 'Ink',
					visible: false,
					shapes: [
						{
							id: 'b',
							points: [
								{ x: 0, y: 0 },
								{ x: 8, y: 0 },
								{ x: 8, y: 8 },
							],
							image: null,
						},
					],
					strokeWidth: 4,
				},
			],
		});

		expect(page.layers).toHaveLength(2);
		expect(page.layers[0]?.name).toBe('Base');
		expect(page.layers[1]?.name).toBe('Ink');
		expect(page.layers[1]?.visible).toBe(false);
		expect(page.layers[1]?.strokeWidth).toBe(4);
		expect(page.activeLayerId).toBe(page.layers[0]?.id);
		expect(page.toLayoutJSON().layers).toHaveLength(2);
		expect(page.toLayoutJSON().layers[1]?.strokeWidth).toBe(4);
		expect(page.toLayoutJSON().layers[0]?.shapes?.[0]).not.toHaveProperty(
			'strokeWidth',
		);
	});

	it('toLayoutJSON keeps grid, margins and stroke independent per layer', () => {
		const page = Page.createBlank(1);
		const bottom = page.getActiveLayer();

		bottom.setGrid(10, 12);
		bottom.setMargins(
			{
				marginTop: 5,
				marginRight: 6,
				marginBottom: 7,
				marginLeft: 8,
			},
			page.width,
			page.height,
		);
		bottom.setStrokeWidth(3);

		page.addLayer();
		const top = page.getActiveLayer();

		top.setGrid(20, 24);
		top.setMargins(
			{
				marginTop: 15,
				marginRight: 16,
				marginBottom: 17,
				marginLeft: 18,
			},
			page.width,
			page.height,
		);
		top.setStrokeWidth(9);

		const layout = page.toLayoutJSON();

		expect(layout.layers).toHaveLength(2);
		expect(layout.layers[0]).toMatchObject({
			gridCols: 10,
			gridRows: 12,
			marginTop: 5,
			marginRight: 6,
			marginBottom: 7,
			marginLeft: 8,
			strokeWidth: 3,
		});
		expect(layout.layers[1]).toMatchObject({
			gridCols: 20,
			gridRows: 24,
			marginTop: 15,
			marginRight: 16,
			marginBottom: 17,
			marginLeft: 18,
			strokeWidth: 9,
		});
		expect(layout).not.toHaveProperty('strokeWidth');
		expect(layout).not.toHaveProperty('gridCols');
	});

	it('applyLayout uniquifies duplicate layer names', () => {
		const page = Page.createBlank(1);

		page.applyLayout({
			width: 600,
			height: 900,
			layers: [
				{ name: 'Ink', shapes: [] },
				{ name: 'Ink', shapes: [] },
			],
		});

		expect(page.layers.map((layer) => layer.name)).toEqual([
			'Ink',
			'Ink (2)',
		]);
	});

	it('setShapeFill changes the view fill without touching other layers', () => {
		const page = Page.createBlank(1);
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			2,
		);

		page.addShape(shape);
		page.addLayer();

		const otherShape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 5, y: 0 },
				{ x: 5, y: 5 },
			],
			2,
		);

		page.addShape(otherShape);

		const before = page.getActiveLayer().shapes;

		expect(page.setShapeFill(otherShape.id, '#ffcc00')).toBe(true);
		expect(page.getActiveLayer().shapes).not.toBe(before);
		expect(otherShape.fill).toBe('#ffcc00');
		expect(shape.fill).toBeNull();
		expect(page.setShapeFill(otherShape.id, '#ffcc00')).toBe(false);
		expect(page.setShapeFill('missing', '#ffcc00')).toBe(false);
	});

	it('setSize resets to default layer and reclamps margins', () => {
		const page = Page.createBlank(1);

		page.addLayer();
		page.setActiveLayerMargins({
			marginTop: 9999,
			marginRight: 9999,
			marginBottom: 9999,
			marginLeft: 9999,
		});
		page.setSize(50, 50);

		expect(page.width).toBe(100);
		expect(page.layers).toHaveLength(1);
		expect(page.defaultLayer.marginTop).toBeLessThanOrEqual(20);
		expect(page.defaultLayer.shapes).toEqual([]);
	});

	it('rotateOrientation cycles default layer margins and keeps one layer', () => {
		const page = Page.createBlank(1);

		page.width = 800;
		page.height = 1200;
		page.defaultLayer.setGrid(10, 20);
		page.defaultLayer.setMargins(
			{
				marginTop: 10,
				marginRight: 20,
				marginBottom: 30,
				marginLeft: 40,
			},
			800,
			1200,
		);
		page.addLayer();

		page.rotateOrientation('clockwise');

		expect(page.width).toBe(1200);
		expect(page.height).toBe(800);
		expect(page.layers).toHaveLength(1);
		expect(page.defaultLayer.gridCols).toBe(20);
		expect(page.defaultLayer.gridRows).toBe(10);
		expect(page.defaultLayer.marginTop).toBe(40);
		expect(page.defaultLayer.marginRight).toBe(10);
		expect(page.defaultLayer.marginBottom).toBe(20);
		expect(page.defaultLayer.marginLeft).toBe(30);

		page.rotateOrientation('counterclockwise');

		expect(page.width).toBe(800);
		expect(page.height).toBe(1200);
		expect(page.defaultLayer.gridCols).toBe(10);
		expect(page.defaultLayer.gridRows).toBe(20);
		expect(page.defaultLayer.marginTop).toBe(10);
		expect(page.defaultLayer.marginRight).toBe(20);
		expect(page.defaultLayer.marginBottom).toBe(30);
		expect(page.defaultLayer.marginLeft).toBe(40);
	});

	it('getVisibleShapes flattens visible layers only', () => {
		const page = Page.createBlank(1);

		page.addShape(
			Shape.create(
				[
					{ x: 0, y: 0 },
					{ x: 1, y: 0 },
					{ x: 1, y: 1 },
				],
				2,
			),
		);
		page.addLayer();
		page.addShape(
			Shape.create(
				[
					{ x: 2, y: 2 },
					{ x: 3, y: 2 },
					{ x: 3, y: 3 },
				],
				2,
			),
		);

		expect(page.getVisibleShapes()).toHaveLength(2);

		page.setLayerVisible(page.layers[1]!.id, false);

		expect(page.getVisibleShapes()).toHaveLength(1);
		expect(page.hasHiddenLayers()).toBe(true);
	});

	it('adds updates and clears texts on the active layer', () => {
		const page = Page.createBlank(1);
		const text = TextBlock.create(10, 20);

		page.addText(text);

		expect(page.getActiveLayer().texts).toHaveLength(1);
		expect(page.hasDrawing()).toBe(true);
		expect(page.getVisibleTexts()).toHaveLength(1);

		expect(
			page.updateText(text.id, { content: 'Edited', angle: 18 }),
		).toBe(true);
		expect(page.getActiveLayer().texts[0]?.content).toBe('Edited');
		expect(page.getActiveLayer().texts[0]?.angle).toBe(18);

		expect(page.removeText(text.id)).toBe(true);
		expect(page.getActiveLayer().texts).toHaveLength(0);
		expect(page.hasDrawing()).toBe(false);
	});

	it('removeShape and removeText work on inactive layers', () => {
		const page = Page.createBlank(1);
		const bottomShape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			2,
		);
		const bottomText = TextBlock.create(1, 1);

		page.addShape(bottomShape);
		page.addText(bottomText);

		const bottomId = page.activeLayerId;

		page.addLayer();

		expect(page.activeLayerId).not.toBe(bottomId);
		expect(page.removeShape(bottomShape.id)).toBe(true);
		expect(page.removeText(bottomText.id)).toBe(true);
		expect(
			page.layers.find((layer) => {
				return layer.id === bottomId;
			})?.shapes,
		).toHaveLength(0);
		expect(
			page.layers.find((layer) => {
				return layer.id === bottomId;
			})?.texts,
		).toHaveLength(0);
	});

	it('getVisibleTexts flattens visible layers only', () => {
		const page = Page.createBlank(1);

		page.addText(TextBlock.create(0, 0));
		page.addLayer();
		page.addText(TextBlock.create(5, 5));

		expect(page.getVisibleTexts()).toHaveLength(2);

		page.setLayerVisible(page.layers[1]!.id, false);

		expect(page.getVisibleTexts()).toHaveLength(1);
	});

	it('resetToDefaultLayer clears texts', () => {
		const page = Page.createBlank(1);

		page.addText(TextBlock.create(1, 1));
		page.resetToDefaultLayer();

		expect(page.getActiveLayer().texts).toHaveLength(0);
	});

	it('can remove the original layer when more than one exists', () => {
		const page = Page.createBlank(1);
		const firstId = page.layers[0]!.id;

		page.addLayer();
		expect(page.removeLayer(firstId)).toBe(true);
		expect(page.layers).toHaveLength(1);
		expect(page.layers[0]!.id).not.toBe(firstId);
		expect(page.removeLayer(page.layers[0]!.id)).toBe(false);
	});
});
