import { describe, it, expect } from 'vitest';
import {
	formatGridLineDelta,
	gridLineDelta,
} from '@/composables/panel/useGridPointHover';

describe('gridLineDelta', () => {
	it('returns horizontal and vertical steps separately', () => {
		expect(gridLineDelta({ col: 0, row: 0 }, { col: 0, row: 0 })).toEqual({
			x: 0,
			y: 0,
		});
		expect(gridLineDelta({ col: 0, row: 0 }, { col: 3, row: 0 })).toEqual({
			x: 3,
			y: 0,
		});
		expect(gridLineDelta({ col: 2, row: 5 }, { col: 4, row: 8 })).toEqual({
			x: 2,
			y: 3,
		});
	});

	it('formats as Nx, My', () => {
		expect(formatGridLineDelta({ x: 3, y: 0 })).toBe('3x, 0y');
		expect(formatGridLineDelta({ x: 2, y: 3 })).toBe('2x, 3y');
	});
});
