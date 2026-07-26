import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import { useMangaStore } from '@/stores/manga';

describe('useMangaStore config layout', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('changing page size clears shapes and bumps contentResetEpoch', () => {
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

		const epoch = store.contentResetEpoch;

		store.setActivePageSize(900, 1300);

		expect(store.shapes).toHaveLength(0);
		expect(store.activePage.width).toBe(900);
		expect(store.activePage.height).toBe(1300);
		expect(store.contentResetEpoch).toBe(epoch + 1);
	});

	it('changing stroke width updates all shapes without clearing them', () => {
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

		store.setActivePageStrokeWidth(8);

		expect(store.shapes).toHaveLength(1);
		expect(store.strokeWidth).toBe(8);
		expect(store.shapes[0]?.strokeWidth).toBe(8);
		expect(store.contentResetEpoch).toBe(epoch);
	});

	it('removeShape mutates the active page', () => {
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

	it('applyActivePageLayout replaces shapes and keeps the page name', () => {
		const store = useMangaStore();
		const originalName = store.activePage.name;
		const originalId = store.activePage.id;
		const epoch = store.contentResetEpoch;

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
		expect(store.shapes).toHaveLength(1);
		expect(store.shapes[0]?.strokeWidth).toBe(5);
		expect(store.contentResetEpoch).toBe(epoch + 1);

		store.applyActivePageLayout({
			width: 800,
			height: 1200,
			shapes: [],
		});

		expect(store.activePage.name).toBe(originalName);
		expect(store.shapes).toHaveLength(0);
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
			}),
		);

		expect(store.shapes).toHaveLength(1);
		expect(store.shapes[0]?.image?.src).toBe('data:image/png;base64,xx');

		store.setShapeImage(shape.id, null);

		expect(store.shapes).toHaveLength(1);
		expect(store.shapes[0]?.image).toBeNull();
	});

	it('shape image mutations replace the shapes array reference', () => {
		const store = useMangaStore();
		const page = store.activePage;
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			3,
		);

		store.addShape(shape);

		const afterAdd = page.shapes;

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

		expect(page.shapes).not.toBe(afterAdd);
		expect(page.shapes[0]?.image?.src).toBe('data:image/png;base64,xx');
	});
});
