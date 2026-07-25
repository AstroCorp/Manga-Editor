import type { PageMargins } from '@/types/page';

export interface GridPoint {
	col: number;
	row: number;
}

export interface CanvasPoint {
	x: number;
	y: number;
}

export type PageLayoutMetrics = {
	width: number;
	height: number;
	cols: number;
	rows: number;
	margins: PageMargins;
}
