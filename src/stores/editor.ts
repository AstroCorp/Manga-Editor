import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
	DEFAULT_GRID_COLS,
	DEFAULT_GRID_ROWS,
	DEFAULT_MARGIN,
	DEFAULT_PAGE_HEIGHT,
	DEFAULT_PAGE_WIDTH,
	DEFAULT_STROKE_WIDTH,
} from '@/lib/page/pageLimits';
import type { PageLayoutMetrics } from '@/types/geometry';
import type { PageMargins } from '@/types/page';
import type { PanelShape } from '@/types/fabric';

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
	const strokeWidth = ref(DEFAULT_STROKE_WIDTH);

	const pageWidth = ref(DEFAULT_PAGE_WIDTH);
	const pageHeight = ref(DEFAULT_PAGE_HEIGHT);
	const gridCols = ref(DEFAULT_GRID_COLS);
	const gridRows = ref(DEFAULT_GRID_ROWS);
	const margins = ref<PageMargins>(defaultMargins());

	/** Paneles ya cerrados en la página activa (coords absolutas). */
	const panels = ref<PanelShape[]>([]);

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

	const addPanel = (panel: PanelShape) => {
		panels.value = [...panels.value, panel];
	};

	return {
		showGridGuides,
		toggleGridGuides,
		strokeWidth,
		pageWidth,
		pageHeight,
		gridCols,
		gridRows,
		margins,
		layout,
		panels,
		addPanel,
	};
});
