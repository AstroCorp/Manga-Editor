import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { createConfirmPayload } from '@/lib/ui/createConfirmPayload';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';

/**
 * Aplica el stroke por defecto de la capa activa a todas las aristas de todos
 * los paneles de la página, previa confirmación.
 */
export const useApplyPageStroke = () => {
	const mangaStore = useMangaStore();
	const editorStore = useEditorStore();
	const { activePage, strokeWidth, strokeColor } = storeToRefs(mangaStore);
	const { pending, request, cancel, confirm } = createConfirmPayload<true>();

	const panelCount = computed(() => {
		return activePage.value.layers.reduce((total, layer) => {
			return total + layer.shapes.length;
		}, 0);
	});

	const canApply = computed(() => {
		return panelCount.value > 0;
	});

	const applyMessage = computed(() => {
		const panels =
			panelCount.value === 1 ? '1 panel' : `${panelCount.value} panels`;

		return `Every edge of the ${panels} on "${activePage.value.name}" (all layers) will be set to ${strokeWidth.value}px ${strokeColor.value}. Individual edge strokes will be lost.`;
	});

	const requestApply = () => {
		if (!canApply.value) {
			return;
		}

		request(true);
	};

	const confirmApply = () => {
		confirm(() => {
			editorStore.cancelStroke();
			mangaStore.applyPageStroke();
		});
	};

	return {
		pendingApply: pending,
		canApply,
		applyMessage,
		requestApply,
		cancelApply: cancel,
		confirmApply,
	};
};
