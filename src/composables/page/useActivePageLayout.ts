import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useMangaStore } from '@/stores/manga';
import type { PageMargins } from '@/types/page';

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

	return {
		activePage,
		pageSize,
		gridSize,
		margins,
		strokeWidth,
	};
};
