import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useMangaStore } from '@/stores/manga';
import type { PageMargins } from '@/types/page';

/**
 * Lecturas: tamaño de página + config de la capa activa.
 */
export const useActivePageLayout = () => {
	const mangaStore = useMangaStore();
	const { activePage, activeLayer } = storeToRefs(mangaStore);

	const pageSize = computed(() => {
		return {
			width: activePage.value.width,
			height: activePage.value.height,
		};
	});

	const gridSize = computed(() => {
		return {
			cols: activeLayer.value.gridCols,
			rows: activeLayer.value.gridRows,
		};
	});

	const margins = computed((): PageMargins => {
		return {
			marginTop: activeLayer.value.marginTop,
			marginRight: activeLayer.value.marginRight,
			marginBottom: activeLayer.value.marginBottom,
			marginLeft: activeLayer.value.marginLeft,
		};
	});

	const strokeWidth = computed(() => {
		return activeLayer.value.strokeWidth;
	});

	const pageHasDrawing = computed(() => {
		return activePage.value.hasDrawing();
	});

	const activeLayerHasDrawing = computed(() => {
		return (
			activeLayer.value.shapes.length > 0 ||
			activeLayer.value.texts.length > 0
		);
	});

	return {
		activePage,
		activeLayer,
		pageSize,
		gridSize,
		margins,
		strokeWidth,
		pageHasDrawing,
		activeLayerHasDrawing,
	};
};
