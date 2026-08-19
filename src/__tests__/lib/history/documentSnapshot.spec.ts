import { describe, expect, it } from 'vitest';
import {
	captureDocument,
	pagesFromDocument,
} from '@/lib/history/documentSnapshot';
import { createImageAssetStore } from '@/lib/history/imageAssets';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import { TextBlock } from '@/models/TextBlock';
import { Page } from '@/models/Page';

describe('documentSnapshot', () => {
	it('round-trips pages with texts, images, white fill and layer ids', () => {
		const assets = createImageAssetStore();
		const page = Page.createBlank(1);
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 12, y: 0 },
				{ x: 12, y: 12 },
			],
			4,
		);

		shape.setWhiteFill(true);
		shape.setImage(
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 3,
				top: 4,
				scaleX: 1,
				scaleY: 1,
			}),
		);

		const text = TextBlock.create(8, 9);

		text.applyPatch({ content: 'Hello', angle: 12 });
		page.addShape(shape);
		page.addText(text);
		page.addLayer();

		const snapshot = captureDocument({
			title: 'Demo',
			activePageId: page.id,
			pages: [page],
			intern: assets.intern,
		});
		const [restored] = pagesFromDocument(snapshot, assets.resolve);

		expect(snapshot.title).toBe('Demo');
		expect(snapshot.pages[0]?.layers[0]?.shapes[0]?.image?.src).toBeUndefined();
		expect(
			snapshot.pages[0]?.layers[0]?.shapes[0]?.image?.assetId,
		).toBeTruthy();
		expect(restored?.id).toBe(page.id);
		expect(restored?.layers).toHaveLength(2);
		expect(restored?.activeLayerId).toBe(page.activeLayerId);
		expect(restored?.layers[0]?.shapes[0]?.whiteFill).toBe(true);
		expect(restored?.layers[0]?.shapes[0]?.image?.src).toBe(
			'data:image/png;base64,xx',
		);
		expect(restored?.layers[0]?.texts[0]?.content).toBe('Hello');
		expect(restored?.layers[0]?.texts[0]?.angle).toBe(12);
		expect(restored?.layers[0]?.id).toBe(page.layers[0]?.id);
	});

	it('reuses the same asset id for duplicate image sources', () => {
		const assets = createImageAssetStore();
		const page = Page.createBlank(1);
		const src = 'data:image/png;base64,same';
		const shapeA = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 4, y: 0 },
				{ x: 4, y: 4 },
			],
			2,
		);
		const shapeB = Shape.create(
			[
				{ x: 8, y: 0 },
				{ x: 12, y: 0 },
				{ x: 12, y: 4 },
			],
			2,
		);

		shapeA.setImage(
			new ShapeImage({
				src,
				left: 0,
				top: 0,
				scaleX: 1,
				scaleY: 1,
			}),
		);
		shapeB.setImage(
			new ShapeImage({
				src,
				left: 1,
				top: 1,
				scaleX: 1,
				scaleY: 1,
			}),
		);
		page.addShape(shapeA);
		page.addShape(shapeB);

		const snapshot = captureDocument({
			title: 'Demo',
			activePageId: page.id,
			pages: [page],
			intern: assets.intern,
		});
		const firstId = snapshot.pages[0]?.layers[0]?.shapes[0]?.image?.assetId;
		const secondId = snapshot.pages[0]?.layers[0]?.shapes[1]?.image?.assetId;

		expect(firstId).toBe(secondId);
		expect(Object.keys(assets.exportAll())).toHaveLength(1);
	});

	it('treats cloned captures as the same document', () => {
		const assets = createImageAssetStore();
		const page = Page.createBlank(1);
		const snapshot = captureDocument({
			title: 'Demo',
			activePageId: page.id,
			pages: [page],
			intern: assets.intern,
		});
		const clone = captureDocument({
			title: 'Demo',
			activePageId: page.id,
			pages: [page],
			intern: assets.intern,
		});

		expect(snapshot).toEqual(clone);

		page.name = 'Cover';

		expect(
			snapshot,
		).not.toEqual(
			captureDocument({
				title: 'Demo',
				activePageId: page.id,
				pages: [page],
				intern: assets.intern,
			}),
		);
	});

	it('throws when restoring an unknown image asset', () => {
		const assets = createImageAssetStore();
		const page = Page.createBlank(1);
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 4, y: 0 },
				{ x: 4, y: 4 },
			],
			2,
		);

		shape.setImage(
			new ShapeImage({
				src: 'data:image/png;base64,xx',
				left: 0,
				top: 0,
				scaleX: 1,
				scaleY: 1,
			}),
		);
		page.addShape(shape);

		const snapshot = captureDocument({
			title: 'Demo',
			activePageId: page.id,
			pages: [page],
			intern: assets.intern,
		});
		const empty = createImageAssetStore();

		expect(() => {
			pagesFromDocument(snapshot, empty.resolve);
		}).toThrow(/Missing image asset/);
	});
});
