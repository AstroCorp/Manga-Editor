import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { createConfirmPayload } from '@/lib/ui/createConfirmPayload';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';
import type { PageRotateDirection } from '@/types/page';

/**
 * Mutaciones de tamaño/rotación de página.
 * Grid/márgenes/stroke viven en la capa (ver useLayerConfigActions).
 */
export const usePageConfigActions = () => {
	const mangaStore = useMangaStore();
	const editorStore = useEditorStore();
	const { activePage } = storeToRefs(mangaStore);
	const {
		pending: pendingRotate,
		request,
		cancel: cancelRotate,
		confirm,
	} = createConfirmPayload<PageRotateDirection>();

	const rotateMessage = computed(() => {
		return `Rotate '${activePage.value.name}'? Layers reset to default and panels are removed.`;
	});

	const setWidth = (width: number) => {
		mangaStore.setActivePageSize(width, activePage.value.height);
	};

	const setHeight = (height: number) => {
		mangaStore.setActivePageSize(activePage.value.width, height);
	};

	const applyRotate = (direction: PageRotateDirection) => {
		editorStore.cancelStroke();
		mangaStore.rotateActivePage(direction);
	};

	const requestRotate = (direction: PageRotateDirection) => {
		if (activePage.value.hasDrawing() || activePage.value.layers.length > 1) {
			request(direction);

			return;
		}

		applyRotate(direction);
	};

	const confirmRotate = () => {
		confirm(applyRotate);
	};

	return {
		pendingRotate,
		rotateMessage,
		setWidth,
		setHeight,
		requestRotate,
		cancelRotate,
		confirmRotate,
	};
};
