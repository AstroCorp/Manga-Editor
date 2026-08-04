import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useActivePageLayout } from '@/composables/page/useActivePageLayout';
import { Shape } from '@/models/Shape';
import { useMangaStore } from '@/stores/manga';

describe('useActivePageLayout', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('exposes derived size, grid, margins and stroke', () => {
		const mangaStore = useMangaStore();
		const { pageSize, gridSize, margins, strokeWidth, pageHasDrawing } =
			useActivePageLayout();

		mangaStore.setActivePageSize(900, 1100);
		mangaStore.setActivePageGrid(12, 18);
		mangaStore.setActivePageMargins({
			marginTop: 10,
			marginRight: 20,
			marginBottom: 30,
			marginLeft: 40,
		});
		mangaStore.setActivePageStrokeWidth(6);

		expect(pageSize.value).toEqual({ width: 900, height: 1100 });
		expect(gridSize.value).toEqual({ cols: 12, rows: 18 });
		expect(margins.value.marginTop).toBe(10);
		expect(strokeWidth.value).toBe(6);
		expect(pageHasDrawing.value).toBe(false);

		mangaStore.addShape(
			Shape.create(
				[
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				2,
			),
		);

		expect(pageHasDrawing.value).toBe(true);
	});
});
