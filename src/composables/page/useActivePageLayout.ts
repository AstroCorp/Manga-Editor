import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useMangaStore } from '@/stores/manga';
import type { PageMargins } from '@/types/page';

/** Lectura derivada de la página activa (sin mutaciones). */
export const useActivePageLayout = () => {
	const { activePage } = storeToRefs(useMangaStore());

	const pageSize = computed(() => {
		return {
			width: activePage.value.width,
			height: activePage.value.height,
		};
	});

	const gridSize = computed(() => {
		return {
			cols: activePage.value.gridCols,
			rows: activePage.value.gridRows,
		};
	});

	const margins = computed((): PageMargins => {
		return {
			marginTop: activePage.value.marginTop,
			marginRight: activePage.value.marginRight,
			marginBottom: activePage.value.marginBottom,
			marginLeft: activePage.value.marginLeft,
		};
	});

	const strokeWidth = computed(() => {
		return activePage.value.strokeWidth;
	});

	const pageHasDrawing = computed(() => {
		return activePage.value.shapes.length > 0;
	});

	return {
		activePage,
		pageSize,
		gridSize,
		margins,
		strokeWidth,
		pageHasDrawing,
	};
};
