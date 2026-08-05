import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLayersPanelActions } from '@/composables/page/useLayersPanelActions';
import { useMangaStore } from '@/stores/manga';

vi.mock('vue3-toastify', () => {
	return {
		toast: {
			warn: vi.fn(),
		},
	};
});

describe('useLayersPanelActions', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
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

	it('warns when renaming to a duplicate layer name', async () => {
		const { toast } = await import('vue3-toastify');
		const mangaStore = useMangaStore();
		const { renameLayer } = useLayersPanelActions();

		mangaStore.renameLayer(mangaStore.activeLayer.id, 'Ink');
		mangaStore.addLayer();
		renameLayer(mangaStore.activeLayer.id, 'ink');

		expect(toast.warn).toHaveBeenCalledExactlyOnceWith(
			'A layer with that name already exists.',
		);
		expect(mangaStore.activeLayer.name).not.toBe('ink');
	});

	it('ignores empty or case-equivalent rename without toast', async () => {
		const { toast } = await import('vue3-toastify');
		const mangaStore = useMangaStore();
		const { renameLayer } = useLayersPanelActions();
		const id = mangaStore.activeLayer.id;

		mangaStore.renameLayer(id, 'Tone');
		renameLayer(id, '   ');
		renameLayer(id, 'tone');

		expect(toast.warn).not.toHaveBeenCalled();
		expect(mangaStore.activeLayer.name).toBe('Tone');
	});
});
