import { describe, expect, it } from 'vitest';
import { panelFillColor } from '@/lib/fabric/fabricColors';

describe('panelFillColor', () => {
	it('returns white when whiteFill is enabled without image', () => {
		expect(panelFillColor(true)).toBe('#ffffff');
		expect(panelFillColor(true, { hasImage: false })).toBe('#ffffff');
	});

	it('returns near-transparent fill when whiteFill is off', () => {
		expect(panelFillColor(false)).toMatch(/^rgba\(255,255,255,/);
	});

	it('forces transparent fill when the panel has an image', () => {
		expect(panelFillColor(true, { hasImage: true })).toMatch(
			/^rgba\(255,255,255,/,
		);
		expect(panelFillColor(false, { hasImage: true })).toMatch(
			/^rgba\(255,255,255,/,
		);
	});
});
