import {
	DEFAULT_GRID_COLS,
	DEFAULT_GRID_ROWS,
	DEFAULT_MARGIN,
	DEFAULT_STROKE_WIDTH,
} from '@/lib/page/pageLimits';
import type { LayoutJSON, LayoutLayerJSON } from '@/types/layouts';

export const resolveLayoutFields = (data: LayoutLayerJSON) => {
	return {
		gridCols: data.gridCols ?? DEFAULT_GRID_COLS,
		gridRows: data.gridRows ?? DEFAULT_GRID_ROWS,
		marginTop: data.marginTop ?? DEFAULT_MARGIN,
		marginRight: data.marginRight ?? DEFAULT_MARGIN,
		marginBottom: data.marginBottom ?? DEFAULT_MARGIN,
		marginLeft: data.marginLeft ?? DEFAULT_MARGIN,
		strokeWidth: data.strokeWidth ?? DEFAULT_STROKE_WIDTH,
	};
};

export const resolveLayoutLayerSources = (
	data: LayoutJSON,
): LayoutLayerJSON[] => {
	return data.layers;
};

export const layoutLayerCount = (data: LayoutJSON): number => {
	return data.layers.length;
};

export const isSingleLayerLayout = (data: LayoutJSON): boolean => {
	return data.layers.length === 1;
};

export const isMultiLayerLayout = (data: LayoutJSON): boolean => {
	return data.layers.length > 1;
};
