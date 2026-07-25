import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import {
	DEFAULT_GRID_COLS,
	DEFAULT_GRID_ROWS,
	DEFAULT_MARGIN,
	DEFAULT_PAGE_HEIGHT,
	DEFAULT_PAGE_WIDTH,
	DEFAULT_STROKE_WIDTH,
} from '@/lib/page/pageLimits';
import { useMangaStore } from '@/stores/manga';
import type { PageMargins } from '@/types/page';

export const useActivePageLayout = () => {
	const { activePage } = storeToRefs(useMangaStore());

	const pageSize = computed(() => {
		return {
			width: activePage.value?.width ?? DEFAULT_PAGE_WIDTH,
			height: activePage.value?.height ?? DEFAULT_PAGE_HEIGHT,
		};
	});

	const gridSize = computed(() => {
		return {
			cols: activePage.value?.gridCols ?? DEFAULT_GRID_COLS,
			rows: activePage.value?.gridRows ?? DEFAULT_GRID_ROWS,
		};
	});

	const margins = computed((): PageMargins => {
		return {
			marginTop: activePage.value?.marginTop ?? DEFAULT_MARGIN,
			marginRight: activePage.value?.marginRight ?? DEFAULT_MARGIN,
			marginBottom: activePage.value?.marginBottom ?? DEFAULT_MARGIN,
			marginLeft: activePage.value?.marginLeft ?? DEFAULT_MARGIN,
		};
	});

	const strokeWidth = computed(() => {
		return activePage.value?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
	});

	return {
		activePage,
		pageSize,
		gridSize,
		margins,
		strokeWidth,
	};
};
