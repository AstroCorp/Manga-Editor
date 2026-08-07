import { ref } from 'vue';
import { defineStore } from 'pinia';

export type LayerElementKind = 'shape' | 'text';

export type FocusedLayerElement = {
	kind: LayerElementKind;
	id: string;
	layerId: string;
};

/**
 * Espejo de la selección Fabric para el panel Layers
 * (highlight + focus pendiente tras cambiar de capa).
 */
export const useSelectionStore = defineStore('selection', () => {
	const focused = ref<FocusedLayerElement | null>(null);
	const pendingFocus = ref<Omit<FocusedLayerElement, 'layerId'> | null>(null);

	const setFocused = (next: FocusedLayerElement | null) => {
		focused.value = next;
	};

	const clearFocused = () => {
		focused.value = null;
	};

	const queuePendingFocus = (next: Omit<FocusedLayerElement, 'layerId'>) => {
		pendingFocus.value = next;
	};

	const takePendingFocus = (): Omit<FocusedLayerElement, 'layerId'> | null => {
		const next = pendingFocus.value;
		pendingFocus.value = null;

		return next;
	};

	const clearPendingFocus = () => {
		pendingFocus.value = null;
	};

	return {
		focused,
		pendingFocus,
		setFocused,
		clearFocused,
		queuePendingFocus,
		takePendingFocus,
		clearPendingFocus,
	};
});
