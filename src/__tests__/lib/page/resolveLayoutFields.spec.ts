import { describe, it, expect } from 'vitest';
import {
	DEFAULT_GRID_COLS,
	DEFAULT_GRID_ROWS,
	DEFAULT_MARGIN,
	DEFAULT_STROKE_WIDTH,
} from '@/lib/page/pageLimits';
import {
	isMultiLayerLayout,
	isSingleLayerLayout,
	layoutLayerCount,
	resolveLayoutFields,
	resolveLayoutLayerSources,
} from '@/lib/page/resolveLayoutFields';

describe('resolveLayoutFields', () => {
	it('fills missing fields with page defaults', () => {
		expect(resolveLayoutFields({})).toEqual({
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

describe('resolveLayoutLayerSources', () => {
	it('returns layers as-is', () => {
		const layout = {
			width: 600,
			height: 900,
			layers: [{ shapes: [], strokeWidth: 3 }],
		};

		expect(resolveLayoutLayerSources(layout)).toHaveLength(1);
		expect(resolveLayoutLayerSources(layout)[0]?.strokeWidth).toBe(3);
		expect(isSingleLayerLayout(layout)).toBe(true);
		expect(isMultiLayerLayout(layout)).toBe(false);
	});

	it('reports multi-layer layouts', () => {
		const layout = {
			width: 600,
			height: 900,
			layers: [{ name: 'A', shapes: [] }, { name: 'B', shapes: [] }],
		};

		expect(resolveLayoutLayerSources(layout)).toHaveLength(2);
		expect(layoutLayerCount(layout)).toBe(2);
		expect(isSingleLayerLayout(layout)).toBe(false);
		expect(isMultiLayerLayout(layout)).toBe(true);
	});
});
