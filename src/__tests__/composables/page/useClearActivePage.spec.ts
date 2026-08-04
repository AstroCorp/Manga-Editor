import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useClearActivePage } from '@/composables/page/useClearActivePage';
import { Shape } from '@/models/Shape';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';

describe('useClearActivePage', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('opens confirmation and clears on confirm', () => {
		const mangaStore = useMangaStore();
		const editorStore = useEditorStore();
		const cancelStroke = vi.spyOn(editorStore, 'cancelStroke');

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

		const { pendingClear, requestClear, confirmClear } = useClearActivePage();

		requestClear();
		expect(pendingClear.value).toBe(true);

		confirmClear();

		expect(pendingClear.value).toBeNull();
		expect(cancelStroke).toHaveBeenCalledOnce();
		expect(mangaStore.shapes).toHaveLength(0);
	});

	it('cancel leaves the page untouched', () => {
		const mangaStore = useMangaStore();

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

		const { pendingClear, requestClear, cancelClear } = useClearActivePage();

		requestClear();
		cancelClear();

		expect(pendingClear.value).toBeNull();
		expect(mangaStore.shapes).toHaveLength(1);
	});
});
