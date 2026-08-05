import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import { useMangaStore } from '@/stores/manga';

describe('useMangaStore config layout', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('changing page size clears layers to default and bumps contentResetEpoch', () => {
		const store = useMangaStore();
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			3,
		);

		store.addShape(shape);
		store.addLayer();

		const epoch = store.contentResetEpoch;

		store.setActivePageSize(900, 1300);

		expect(store.layers).toHaveLength(1);
		expect(store.shapes).toHaveLength(0);
		expect(store.activePage.width).toBe(900);
		expect(store.activePage.height).toBe(1300);
		expect(store.contentResetEpoch).toBe(epoch + 1);
	});

	it('rotateActivePage swaps orientation and resets to default layer', () => {
		const store = useMangaStore();

		store.setActivePageSize(800, 1200);
		store.setActiveLayerGrid(10, 20);
		store.setActiveLayerMargins({
			marginTop: 10,
			marginRight: 20,
			marginBottom: 30,
			marginLeft: 40,
		});
		store.addShape(
			Shape.create(
				[
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				3,
			),
		);
		store.addLayer();

		const epoch = store.contentResetEpoch;

		store.rotateActivePage('clockwise');

		expect(store.activePage.width).toBe(1200);
		expect(store.activePage.height).toBe(800);
		expect(store.layers).toHaveLength(1);
		expect(store.activeLayer.gridCols).toBe(20);
		expect(store.activeLayer.gridRows).toBe(10);
		expect(store.activeLayer.marginTop).toBe(40);
		expect(store.activeLayer.marginRight).toBe(10);
		expect(store.activeLayer.marginBottom).toBe(20);
		expect(store.activeLayer.marginLeft).toBe(30);
		expect(store.shapes).toHaveLength(0);
		expect(store.contentResetEpoch).toBe(epoch + 1);
	});

	it('changing stroke width updates active layer shapes without clearing them', () => {
		const store = useMangaStore();

		store.addShape(
			Shape.create(
				[
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				3,
			),
		);

		const epoch = store.contentResetEpoch;

		store.setActiveLayerStrokeWidth(8);

		expect(store.shapes).toHaveLength(1);
		expect(store.strokeWidth).toBe(8);
		expect(store.shapes[0]?.strokeWidth).toBe(8);
		expect(store.contentResetEpoch).toBe(epoch);
	});

	it('removeShape mutates the active layer', () => {
		const store = useMangaStore();
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			3,
		);

		store.addShape(shape);
		store.removeShape(shape.id);

		expect(store.shapes).toHaveLength(0);
	});

	it('applyActivePageLayout replaces all layers and keeps the page name', () => {
		const store = useMangaStore();
		const originalName = store.activePage.name;
		const originalId = store.activePage.id;

		store.addLayer();
		store.addShape(
			Shape.create(
				[
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				3,
			),
		);

		expect(store.layers.length).toBeGreaterThan(1);

		const epochBeforeApply = store.contentResetEpoch;

		store.applyActivePageLayout({
			width: 800,
			height: 1200,
			shapes: [
				{
					id: 'panel-1',
					points: [
						{ x: 0, y: 0 },
						{ x: 40, y: 0 },
						{ x: 40, y: 40 },
					],
					strokeWidth: 5,
					image: null,
				},
			],
			gridCols: 10,
			gridRows: 20,
			marginTop: 5,
			marginRight: 5,
			marginBottom: 5,
			marginLeft: 5,
			strokeWidth: 5,
		});

		expect(store.activePage.name).toBe(originalName);
		expect(store.activePage.id).toBe(originalId);
		expect(store.activePage.width).toBe(800);
		expect(store.activePage.height).toBe(1200);
		expect(store.layers).toHaveLength(1);
		expect(store.layers[0]?.name).toBe('Layer 1');
		expect(store.shapes).toHaveLength(1);
		expect(store.shapes[0]?.strokeWidth).toBe(5);
		expect(store.contentResetEpoch).toBe(epochBeforeApply + 1);
	});

	it('getActivePageLayout exports geometry without id or name', () => {
		const store = useMangaStore();
		const layout = store.getActivePageLayout();

		expect(layout.shapes).toEqual([]);
		expect(layout).not.toHaveProperty('id');
		expect(layout).not.toHaveProperty('name');
	});

	it('addPage / selectPage / removePage manage the document', () => {
		const store = useMangaStore();
		const firstId = store.activePageId;

		store.addPage();

		expect(store.pages).toHaveLength(2);
		expect(store.activePageId).not.toBe(firstId);

		const secondId = store.activePageId;

		store.selectPage(firstId);

		expect(store.activePageId).toBe(firstId);

		store.removePage(secondId);

		expect(store.pages).toHaveLength(1);
		expect(store.activePageId).toBe(firstId);

		store.removePage(firstId);

		expect(store.pages).toHaveLength(1);
	});

	it('reorderPages and renamePage update the strip', () => {
		const store = useMangaStore();

		store.addPage();
		store.addPage();

		const [first, second, third] = store.pages;

		store.reorderPages(2, 0);

		expect(store.pages[0]?.id).toBe(third!.id);
		expect(store.pages[1]?.id).toBe(first!.id);
		expect(store.pages[2]?.id).toBe(second!.id);

		store.renamePage(first!.id, 'Cover');

		expect(store.pages.find((page) => page.id === first!.id)?.name).toBe(
			'Cover',
		);
	});

	it('rejects duplicate page names (case-insensitive)', () => {
		const store = useMangaStore();

		store.addPage();
		store.renamePage(store.pages[0]!.id, 'Cover');
		store.renamePage(store.pages[1]!.id, 'cover');

		expect(store.pages[1]?.name).not.toBe('cover');
		expect(store.pages[1]?.name).not.toBe('Cover');
	});

	it('addPage picks a unique default name', () => {
		const store = useMangaStore();

		store.renamePage(store.pages[0]!.id, 'Page 2');
		store.addPage();

		expect(store.pages[1]?.name).toBe('Page 2 (2)');
	});

	it('rejects duplicate layer names and uniquifies new layers', () => {
		const store = useMangaStore();

		store.renameLayer(store.activeLayer.id, 'Ink');
		store.addLayer();
		store.renameLayer(store.activeLayer.id, 'ink');

		expect(store.activeLayer.name).not.toBe('ink');
		expect(store.activeLayer.name).not.toBe('Ink');

		store.renameLayer(store.activeLayer.id, 'Tone');
		store.renameLayer(store.layers[0]!.id, 'Tone');

		expect(store.layers[0]?.name).toBe('Ink');
	});

	it('setShapeImage attaches and clears an image without removing the shape', () => {
		const store = useMangaStore();
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 20, y: 0 },
				{ x: 20, y: 20 },
			],
			3,
		);

		store.addShape(shape);
		store.setShapeImage(
			shape.id,
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 10,
				top: 10,
				scaleX: 1,
				scaleY: 1,
				grayscale: true,
			}),
		);

		expect(store.shapes).toHaveLength(1);
		expect(store.shapes[0]?.image?.src).toBe('data:image/png;base64,xx');
		expect(store.shapes[0]?.image?.grayscale).toBe(true);

		store.setShapeImage(shape.id, null);

		expect(store.shapes).toHaveLength(1);
		expect(store.shapes[0]?.image).toBeNull();
	});

	it('clearActivePage resets to default layer and bumps contentResetEpoch', () => {
		const store = useMangaStore();

		store.addShape(
			Shape.create(
				[
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				3,
			),
		);
		store.addLayer();

		const epoch = store.contentResetEpoch;

		store.clearActivePage();

		expect(store.layers).toHaveLength(1);
		expect(store.shapes).toHaveLength(0);
		expect(store.contentResetEpoch).toBe(epoch + 1);
	});

	it('shape image mutations replace the active layer shapes array reference', () => {
		const store = useMangaStore();
		const layer = store.activeLayer;
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			3,
		);

		store.addShape(shape);

		const afterAdd = layer.shapes;

		store.setShapeImage(
			shape.id,
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 1,
				top: 1,
				scaleX: 1,
				scaleY: 1,
			}),
		);

		expect(layer.shapes).not.toBe(afterAdd);
		expect(layer.shapes[0]?.image?.src).toBe('data:image/png;base64,xx');
	});

	it('addLayer / selectLayer / hide layer work', () => {
		const store = useMangaStore();
		const firstId = store.activeLayer.id;

		store.addLayer();

		expect(store.layers).toHaveLength(2);
		expect(store.activeLayer.id).not.toBe(firstId);

		store.selectLayer(firstId);
		expect(store.activeLayer.id).toBe(firstId);

		store.setLayerVisible(store.layers[1]!.id, false);
		expect(store.activePage.hasHiddenLayers()).toBe(true);
	});
});
