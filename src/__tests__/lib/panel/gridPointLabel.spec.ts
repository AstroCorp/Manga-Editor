import { describe, it, expect } from 'vitest';
import { formatGridPointLabel } from '@/composables/panel/useGridPointHover';

describe('formatGridPointLabel', () => {
	it('formats col/row as (Nx, My)', () => {
		expect(formatGridPointLabel({ col: 4, row: 5 })).toBe('(4x, 5y)');
		expect(formatGridPointLabel({ col: 0, row: 0 })).toBe('(0x, 0y)');
	});
});
