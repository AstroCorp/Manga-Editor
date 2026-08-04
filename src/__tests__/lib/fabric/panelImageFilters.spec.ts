import { describe, expect, it, vi } from 'vitest';
import {
	hasGrayscaleFilter,
	setGrayscaleFilter,
} from '@/lib/fabric/panelImageFilters';
import type { FabricImage } from 'fabric';

describe('panelImageFilters', () => {
	it('detects an existing Grayscale filter', () => {
		const image = {
			filters: [{ type: 'Grayscale' }],
		} as unknown as FabricImage;

		expect(hasGrayscaleFilter(image)).toBe(true);
		expect(hasGrayscaleFilter({ filters: [] } as unknown as FabricImage)).toBe(
			false,
		);
	});

	it('toggles Grayscale via applyFilters', () => {
		const applyFilters = vi.fn();
		const image = {
			filters: [] as Array<{ type?: string }>,
			applyFilters,
		} as unknown as FabricImage;

		setGrayscaleFilter(image, true);
		expect(hasGrayscaleFilter(image)).toBe(true);
		expect(applyFilters).toHaveBeenCalledOnce();

		setGrayscaleFilter(image, false);
		expect(hasGrayscaleFilter(image)).toBe(false);
		expect(applyFilters).toHaveBeenCalledTimes(2);
	});
});
