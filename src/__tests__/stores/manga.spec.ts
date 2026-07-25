import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { Shape } from '@/models/Shape';
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
		expect(store.pageWidth).toBe(900);
		expect(store.pageHeight).toBe(1300);
		expect(store.contentResetEpoch).toBe(epoch + 1);
	});

	it('changing stroke width does not clear shapes', () => {
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
		expect(store.contentResetEpoch).toBe(epoch);
	});
});
