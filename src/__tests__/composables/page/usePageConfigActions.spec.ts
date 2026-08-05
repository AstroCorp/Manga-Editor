import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useActivePageLayout } from '@/composables/page/useActivePageLayout';
import { useLayerConfigActions } from '@/composables/page/useLayerConfigActions';
import { usePageConfigActions } from '@/composables/page/usePageConfigActions';
import { Shape } from '@/models/Shape';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';

describe('usePageConfigActions', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('updates page size', () => {
		const { pageSize } = useActivePageLayout();
		const { setWidth, setHeight } = usePageConfigActions();

		setWidth(900);
		setHeight(1100);

		expect(pageSize.value).toEqual({ width: 900, height: 1100 });
	});

	it('rotates immediately when the page is empty with one layer', () => {
		const mangaStore = useMangaStore();
		const editorStore = useEditorStore();
		const cancelStroke = vi.spyOn(editorStore, 'cancelStroke');
		const { pageSize } = useActivePageLayout();
		const { pendingRotate, requestRotate } = usePageConfigActions();

		mangaStore.setActivePageSize(800, 1200);
		requestRotate('clockwise');

		expect(pendingRotate.value).toBeNull();
		expect(pageSize.value).toEqual({ width: 1200, height: 800 });
		expect(cancelStroke).toHaveBeenCalledOnce();
	});

	it('asks for confirmation when the page has drawings', () => {
		const mangaStore = useMangaStore();
		const { pageSize } = useActivePageLayout();
		const {
			pendingRotate,
			requestRotate,
			confirmRotate,
			cancelRotate,
		} = usePageConfigActions();

		mangaStore.setActivePageSize(800, 1200);
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

		requestRotate('counterclockwise');
		expect(pendingRotate.value).toBe('counterclockwise');
		expect(pageSize.value).toEqual({ width: 800, height: 1200 });

		cancelRotate();
		expect(pendingRotate.value).toBeNull();
		expect(mangaStore.shapes).toHaveLength(1);

		requestRotate('clockwise');
		confirmRotate();

		expect(pendingRotate.value).toBeNull();
		expect(pageSize.value).toEqual({ width: 1200, height: 800 });
		expect(mangaStore.shapes).toHaveLength(0);
		expect(mangaStore.layers).toHaveLength(1);
	});
});

describe('useLayerConfigActions', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('updates grid, margin and stroke on the active layer', () => {
		const mangaStore = useMangaStore();
		const { gridSize, margins, strokeWidth } = useActivePageLayout();
		const { setCols, setRows, setMargin, setStrokeWidth } =
			useLayerConfigActions();

		setCols(12);
		setRows(18);
		setMargin('marginTop', 15);
		setStrokeWidth(6);

		expect(gridSize.value).toEqual({ cols: 12, rows: 18 });
		expect(margins.value.marginTop).toBe(15);
		expect(strokeWidth.value).toBe(6);
		expect(mangaStore.shapes).toHaveLength(0);
	});

	it('ignores non-finite stroke width', () => {
		const { strokeWidth } = useActivePageLayout();
		const { setStrokeWidth } = useLayerConfigActions();

		setStrokeWidth(4);
		setStrokeWidth(Number.NaN);

		expect(strokeWidth.value).toBe(4);
	});
});
