import { describe, expect, it } from 'vitest';
import {
	captureDocument,
	isSameDocument,
	pagesFromDocument,
} from '@/lib/history/documentSnapshot';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import { TextBlock } from '@/models/TextBlock';
import { Page } from '@/models/Page';

describe('documentSnapshot', () => {
	it('round-trips pages with texts, images, white fill and layer ids', () => {
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
		});
		const [restored] = pagesFromDocument(snapshot);

		expect(snapshot.title).toBe('Demo');
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

	it('treats cloned captures as the same document', () => {
		const page = Page.createBlank(1);
		const snapshot = captureDocument({
			title: 'Demo',
			activePageId: page.id,
			pages: [page],
		});
		const clone = captureDocument({
			title: 'Demo',
			activePageId: page.id,
			pages: [page],
		});

		expect(isSameDocument(snapshot, clone)).toBe(true);

		page.name = 'Cover';

		expect(
			isSameDocument(
				snapshot,
				captureDocument({
					title: 'Demo',
					activePageId: page.id,
					pages: [page],
				}),
			),
		).toBe(false);
	});
});
