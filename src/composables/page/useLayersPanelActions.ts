import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { toast } from 'vue3-toastify';
import { createConfirmPayload } from '@/lib/ui/createConfirmPayload';
import { setDragMoveEffect } from '@/lib/ui/setDragMoveEffect';
import { normalizeNameKey } from '@/lib/ui/uniqueName';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';
import { useSelectionStore } from '@/stores/selection';
import type { LayerElementKind } from '@/stores/selection';

/**
 * Listado de capas: CRUD, visibilidad, rename, reorder y elementos.
 * La UI muestra arriba = encima (índice de dominio invertido).
 */
export const useLayersPanelActions = () => {
	const mangaStore = useMangaStore();
	const editorStore = useEditorStore();
	const selectionStore = useSelectionStore();
	const { layers, activeLayer } = storeToRefs(mangaStore);
	const { focused } = storeToRefs(selectionStore);

	const dragFromVisualIndex = ref<number | null>(null);
	const dropTargetVisualIndex = ref<number | null>(null);
	const expandedLayerIds = ref<Set<string>>(new Set([activeLayer.value.id]));

	const {
		pending: pendingRemoveId,
		request,
		cancel: cancelRemove,
		confirm,
	} = createConfirmPayload<string>();

	/** Lista visual: última capa del dominio arriba. */
	const displayLayers = computed(() => {
		return [...layers.value].reverse();
	});

	const canRemove = computed(() => {
		return layers.value.length > 1;
	});

	const removeMessage = computed(() => {
		const id = pendingRemoveId.value;
		const name =
			layers.value.find((layer) => {
				return layer.id === id;
			})?.name ?? 'this layer';

		return `Delete '${name}'? Panels on this layer will be removed.`;
	});

	const toDomainIndex = (visualIndex: number) => {
		return layers.value.length - 1 - visualIndex;
	};

	const isLayerExpanded = (layerId: string) => {
		return expandedLayerIds.value.has(layerId);
	};

	const toggleExpand = (layerId: string) => {
		const next = new Set(expandedLayerIds.value);

		if (next.has(layerId)) {
			next.delete(layerId);
		} else {
			next.add(layerId);
		}

		expandedLayerIds.value = next;
	};

	const expandLayer = (layerId: string) => {
		if (expandedLayerIds.value.has(layerId)) {
			return;
		}

		const next = new Set(expandedLayerIds.value);
		next.add(layerId);
		expandedLayerIds.value = next;
	};

	watch(
		() => activeLayer.value.id,
		(layerId) => {
			expandLayer(layerId);
		},
	);

	const selectLayer = (layerId: string) => {
		if (layerId === activeLayer.value.id) {
			return;
		}

		editorStore.cancelStroke();
		mangaStore.selectLayer(layerId);
		expandLayer(layerId);
	};

	const addLayer = () => {
		editorStore.cancelStroke();
		mangaStore.addLayer();
		expandLayer(mangaStore.activeLayer.id);
	};

	const requestRemove = (layerId: string) => {
		if (!canRemove.value) {
			return;
		}

		request(layerId);
	};

	const confirmRemove = () => {
		confirm((layerId) => {
			editorStore.cancelStroke();
			mangaStore.removeLayer(layerId);
		});
	};

	const toggleVisible = (layerId: string) => {
		const layer = layers.value.find((item) => {
			return item.id === layerId;
		});

		if (!layer) {
			return;
		}

		const nextVisible = !layer.visible;

		if (!nextVisible && layer.id === activeLayer.value.id) {
			const fallback = layers.value.find((item) => {
				return item.id !== layerId && item.visible;
			});

			if (!fallback) {
				return;
			}

			editorStore.cancelStroke();
			mangaStore.setLayerVisible(layerId, false);
			mangaStore.selectLayer(fallback.id);

			return;
		}

		editorStore.cancelStroke();
		mangaStore.setLayerVisible(layerId, nextVisible);
	};

	const renameLayer = (layerId: string, name: string) => {
		const layer = layers.value.find((item) => {
			return item.id === layerId;
		});
		const trimmed = name.trim();

		if (!layer || !trimmed) {
			return;
		}

		if (normalizeNameKey(trimmed) === normalizeNameKey(layer.name)) {
			return;
		}

		if (!mangaStore.renameLayer(layerId, name)) {
			toast.warn('A layer with that name already exists.');
		}
	};

	const focusElement = (
		layerId: string,
		kind: LayerElementKind,
		id: string,
	) => {
		expandLayer(layerId);
		editorStore.focusLayerElement({ layerId, kind, id });
	};

	const deleteElement = (
		layerId: string,
		kind: LayerElementKind,
		id: string,
	) => {
		editorStore.deleteLayerElement({ layerId, kind, id });
	};

	const clearDragState = () => {
		dragFromVisualIndex.value = null;
		dropTargetVisualIndex.value = null;
	};

	const onDragStart = (visualIndex: number, event: DragEvent) => {
		dragFromVisualIndex.value = visualIndex;
		dropTargetVisualIndex.value = visualIndex;
		event.dataTransfer?.setData('text/plain', String(visualIndex));

		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
		}
	};

	const onDragOver = (visualIndex: number, event: DragEvent) => {
		event.preventDefault();
		setDragMoveEffect(event);
		dropTargetVisualIndex.value = visualIndex;
	};

	const onDrop = (visualIndex: number, event: DragEvent) => {
		event.preventDefault();

		const fromVisual = dragFromVisualIndex.value;

		clearDragState();

		if (fromVisual === null || fromVisual === visualIndex) {
			return;
		}

		editorStore.cancelStroke();
		mangaStore.reorderLayers(
			toDomainIndex(fromVisual),
			toDomainIndex(visualIndex),
		);
	};

	return {
		displayLayers,
		activeLayer,
		focused,
		pendingRemoveId,
		removeMessage,
		canRemove,
		dragFromVisualIndex,
		dropTargetVisualIndex,
		isLayerExpanded,
		toggleExpand,
		selectLayer,
		addLayer,
		requestRemove,
		cancelRemove,
		confirmRemove,
		toggleVisible,
		renameLayer,
		focusElement,
		deleteElement,
		onDragStart,
		onDragOver,
		onDrop,
		clearDragState,
	};
};
