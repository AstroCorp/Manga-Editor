import {
	DEFAULT_GRID_COLS,
	DEFAULT_GRID_ROWS,
	DEFAULT_MARGIN,
	DEFAULT_STROKE_WIDTH,
} from '@/lib/page/pageLimits';
import type { LayoutJSON, LayoutLayerJSON } from '@/types/layouts';

export const resolveLayoutFields = (data: LayoutLayerJSON | LayoutJSON) => {
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
