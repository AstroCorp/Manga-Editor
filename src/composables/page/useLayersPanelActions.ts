import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { toast } from 'vue3-toastify';
import { createConfirmPayload } from '@/lib/ui/createConfirmPayload';
import { setDragMoveEffect } from '@/lib/ui/setDragMoveEffect';
import { normalizeNameKey } from '@/lib/ui/uniqueName';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';

/**
 * Listado de capas: CRUD, visibilidad, rename y reorder por drag.
 * La UI muestra arriba = encima (índice de dominio invertido).
 */
export const useLayersPanelActions = () => {
	const mangaStore = useMangaStore();
	const editorStore = useEditorStore();
	const { layers, activeLayer } = storeToRefs(mangaStore);

	const dragFromVisualIndex = ref<number | null>(null);
	const dropTargetVisualIndex = ref<number | null>(null);

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

	const selectLayer = (layerId: string) => {
		if (layerId === activeLayer.value.id) {
			return;
		}

		editorStore.cancelStroke();
		mangaStore.selectLayer(layerId);
	};

	const addLayer = () => {
		editorStore.cancelStroke();
		mangaStore.addLayer();
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
		pendingRemoveId,
		removeMessage,
		canRemove,
		dragFromVisualIndex,
		dropTargetVisualIndex,
		selectLayer,
		addLayer,
		requestRemove,
		cancelRemove,
		confirmRemove,
		toggleVisible,
		renameLayer,
		onDragStart,
		onDragOver,
		onDrop,
		clearDragState,
	};
};
