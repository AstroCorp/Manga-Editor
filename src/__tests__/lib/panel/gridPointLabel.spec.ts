import { describe, it, expect } from 'vitest';
import {
	formatGridLineDelta,
	gridLineDelta,
} from '@/composables/panel/useGridPointHover';

describe('gridLineDelta', () => {
	it('counts inclusive grid points on each axis', () => {
		expect(gridLineDelta({ col: 0, row: 0 }, { col: 0, row: 0 })).toEqual({
			x: 1,
			y: 1,
		});
		expect(gridLineDelta({ col: 0, row: 0 }, { col: 3, row: 0 })).toEqual({
			x: 4,
			y: 1,
		});
		expect(gridLineDelta({ col: 2, row: 5 }, { col: 4, row: 8 })).toEqual({
			x: 3,
			y: 4,
		});
	});

	it('formats as Nx, My', () => {
		expect(formatGridLineDelta({ x: 4, y: 1 })).toBe('4x, 1y');
		expect(formatGridLineDelta({ x: 3, y: 4 })).toBe('3x, 4y');
	});
});
