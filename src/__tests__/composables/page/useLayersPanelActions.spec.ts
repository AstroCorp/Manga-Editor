import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLayersPanelActions } from '@/composables/page/useLayersPanelActions';
import { useMangaStore } from '@/stores/manga';

describe('useLayersPanelActions', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('allows removing any layer while keeping at least one', () => {
		const mangaStore = useMangaStore();
		const { canRemove, requestRemove, confirmRemove } =
			useLayersPanelActions();
		const firstId = mangaStore.activeLayer.id;

		mangaStore.addLayer();
		const secondId = mangaStore.activeLayer.id;

		expect(canRemove.value).toBe(true);

		requestRemove(firstId);
		confirmRemove();

		expect(mangaStore.layers).toHaveLength(1);
		expect(mangaStore.layers[0]?.id).toBe(secondId);
		expect(canRemove.value).toBe(false);
	});

	it('reorders layers from visual drag indices (top of list = top layer)', () => {
		const mangaStore = useMangaStore();
		const { onDragStart, onDrop, clearDragState, displayLayers } =
			useLayersPanelActions();

		mangaStore.addLayer();
		mangaStore.addLayer();

		const [bottom, middle, top] = mangaStore.layers;

		expect(displayLayers.value.map((layer) => layer.id)).toEqual([
			top!.id,
			middle!.id,
			bottom!.id,
		]);

		const event = {
			preventDefault: () => undefined,
			dataTransfer: { setData: () => undefined, effectAllowed: '' },
		} as unknown as DragEvent;

		// Visual 0 (top) → visual 2 (bottom of list)
		onDragStart(0, event);
		onDrop(2, event);
		clearDragState();

		expect(mangaStore.layers.map((layer) => layer.id)).toEqual([
			top!.id,
			bottom!.id,
			middle!.id,
		]);
	});
});
