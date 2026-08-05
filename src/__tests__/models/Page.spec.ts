import { describe, it, expect } from 'vitest';
import { Page } from '@/models/Page';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import {
	DEFAULT_GRID_COLS,
	DEFAULT_PAGE_HEIGHT,
	DEFAULT_PAGE_WIDTH,
} from '@/lib/page/pageLimits';

describe('Page / Layer / Shape / ShapeImage', () => {
	it('creates a blank page with a default layer', () => {
		const page = Page.createBlank(1);

		expect(page.name).toBe('Page 1');
		expect(page.width).toBe(DEFAULT_PAGE_WIDTH);
		expect(page.height).toBe(DEFAULT_PAGE_HEIGHT);
		expect(page.layers).toHaveLength(1);
		expect(page.getActiveLayer().gridCols).toBe(DEFAULT_GRID_COLS);
		expect(page.getActiveLayer().shapes).toEqual([]);
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

		shape.setWhiteFill(true);
		expect(shape.whiteFill).toBe(true);
		expect(shape.toJSON()).not.toHaveProperty('whiteFill');
		expect(shape.toLayoutJSON()).not.toHaveProperty('whiteFill');
		expect(Shape.fromJSON(shape.toJSON()).whiteFill).toBe(false);
	});

	it('ShapeImage persists grayscale through JSON round-trip', () => {
		const image = new ShapeImage({
			src: 'data:image/png;base64,xx',
			left: 1,
			top: 2,
			scaleX: 1.5,
			scaleY: 1.5,
			grayscale: true,
		});
		const restored = ShapeImage.fromJSON(image.toJSON());

		expect(restored.grayscale).toBe(true);
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
			}).image?.grayscale,
		).toBe(true);
	});

	it('setStrokeWidth applies to layer shapes and setShapeImage refreshes refs', () => {
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
		expect(layer.shapes).not.toBe(afterAdd);
		expect(layer.strokeWidth).toBe(8);
		expect(layer.shapes[0]?.strokeWidth).toBe(8);

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

	it('applyLayout forces layer stroke on every shape', () => {
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

		expect(page.getActiveLayer().strokeWidth).toBe(12);
		expect(page.getActiveLayer().shapes[0]?.strokeWidth).toBe(12);
	});

	it('applyLayout replaces every existing layer', () => {
		const page = Page.createBlank(1);

		page.addLayer();
		page.addLayer();
		expect(page.layers).toHaveLength(3);

		page.applyLayout({
			width: 600,
			height: 900,
			shapes: [
				{
					id: 'p1',
					points: [
						{ x: 0, y: 0 },
						{ x: 10, y: 0 },
						{ x: 10, y: 10 },
					],
					strokeWidth: 2,
					image: null,
				},
			],
		});

		expect(page.layers).toHaveLength(1);
		expect(page.getActiveLayer().shapes).toHaveLength(1);
	});

	it('applyLayout supports multi-layer payloads', () => {
		const page = Page.createBlank(1);

		page.applyLayout({
			width: 600,
			height: 900,
			shapes: [],
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
							strokeWidth: 2,
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
							strokeWidth: 2,
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
