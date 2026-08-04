import { describe, it, expect } from 'vitest';
import {
	DEFAULT_GRID_COLS,
	DEFAULT_GRID_ROWS,
	DEFAULT_MARGIN,
	DEFAULT_STROKE_WIDTH,
} from '@/lib/page/pageLimits';
import { resolveLayoutFields } from '@/lib/page/resolveLayoutFields';

describe('resolveLayoutFields', () => {
	it('fills missing fields with page defaults', () => {
		expect(
			resolveLayoutFields({
				width: 800,
				height: 1200,
			}),
		).toEqual({
			gridCols: DEFAULT_GRID_COLS,
			gridRows: DEFAULT_GRID_ROWS,
			marginTop: DEFAULT_MARGIN,
			marginRight: DEFAULT_MARGIN,
			marginBottom: DEFAULT_MARGIN,
			marginLeft: DEFAULT_MARGIN,
			strokeWidth: DEFAULT_STROKE_WIDTH,
		});
	});

	it('keeps provided layout fields', () => {
		expect(
			resolveLayoutFields({
				width: 800,
				height: 1200,
				gridCols: 10,
				gridRows: 20,
				marginTop: 1,
				marginRight: 2,
				marginBottom: 3,
				marginLeft: 4,
				strokeWidth: 8,
			}),
		).toEqual({
			gridCols: 10,
			gridRows: 20,
			marginTop: 1,
			marginRight: 2,
			marginBottom: 3,
			marginLeft: 4,
			strokeWidth: 8,
		});
	});
});
