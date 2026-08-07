import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { useLayersPanelActions } from '@/composables/page/useLayersPanelActions';
import { useEditorStore } from '@/stores/editor';
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

	it('toggles layer expansion and expands the active layer', async () => {
		const mangaStore = useMangaStore();
		const { isLayerExpanded, toggleExpand, selectLayer } =
			useLayersPanelActions();
		const firstId = mangaStore.activeLayer.id;

		expect(isLayerExpanded(firstId)).toBe(true);

		toggleExpand(firstId);
		expect(isLayerExpanded(firstId)).toBe(false);

		mangaStore.addLayer();
		const secondId = mangaStore.activeLayer.id;

		await nextTick();

		expect(isLayerExpanded(secondId)).toBe(true);

		selectLayer(firstId);
		await nextTick();

		expect(mangaStore.activeLayer.id).toBe(firstId);
		expect(isLayerExpanded(firstId)).toBe(true);
	});

	it('forwards focusElement and deleteElement to the editor store', () => {
		const mangaStore = useMangaStore();
		const editorStore = useEditorStore();
		const focusLayerElement = vi.fn();
		const deleteLayerElement = vi.fn();
		const {
			focusElement,
			deleteElement,
			isLayerExpanded,
			toggleExpand,
		} = useLayersPanelActions();
		const layerId = mangaStore.activeLayer.id;

		editorStore.registerCanvas({
			cancelStroke: vi.fn(),
			exportDataUrl: vi.fn(() => null),
			resetZoomView: vi.fn(),
			addSimpleText: vi.fn(),
			addBoxedText: vi.fn(),
			addRoundedBoxedText: vi.fn(),
			focusLayerElement,
			deleteLayerElement,
		});

		toggleExpand(layerId);
		expect(isLayerExpanded(layerId)).toBe(false);

		focusElement(layerId, 'shape', 'panel-1');

		expect(focusLayerElement).toHaveBeenCalledExactlyOnceWith({
			layerId,
			kind: 'shape',
			id: 'panel-1',
		});
		expect(isLayerExpanded(layerId)).toBe(true);

		deleteElement(layerId, 'text', 'text-1');

		expect(deleteLayerElement).toHaveBeenCalledExactlyOnceWith({
			layerId,
			kind: 'text',
			id: 'text-1',
		});
	});
});
