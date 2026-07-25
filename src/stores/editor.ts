import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
	DEFAULT_GRID_COLS,
	DEFAULT_GRID_ROWS,
	DEFAULT_MARGIN,
	DEFAULT_PAGE_HEIGHT,
	DEFAULT_PAGE_WIDTH,
} from '@/lib/page/pageLimits';
import type { PageLayoutMetrics } from '@/types/geometry';
import type { PageMargins } from '@/types/page';

const defaultMargins = (): PageMargins => {
	return {
		marginTop: DEFAULT_MARGIN,
		marginRight: DEFAULT_MARGIN,
		marginBottom: DEFAULT_MARGIN,
		marginLeft: DEFAULT_MARGIN,
	};
};

export const useEditorStore = defineStore('editor', () => {
	const showGridGuides = ref(true);

	const pageWidth = ref(DEFAULT_PAGE_WIDTH);
	const pageHeight = ref(DEFAULT_PAGE_HEIGHT);
	const gridCols = ref(DEFAULT_GRID_COLS);
	const gridRows = ref(DEFAULT_GRID_ROWS);
	const margins = ref<PageMargins>(defaultMargins());

	const layout = computed((): PageLayoutMetrics => {
		return {
			width: pageWidth.value,
			height: pageHeight.value,
			cols: gridCols.value,
			rows: gridRows.value,
			margins: margins.value,
		};
	});

	const toggleGridGuides = () => {
		showGridGuides.value = !showGridGuides.value;
	};

	return {
		showGridGuides,
		toggleGridGuides,
		pageWidth,
		pageHeight,
		gridCols,
		gridRows,
		margins,
		layout,
	};
});
