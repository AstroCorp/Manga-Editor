import { describe, expect, it } from 'vitest';
import {
	gridGuideDotColor,
	invertHexColor,
	panelFillColor,
} from '@/lib/fabric/fabricColors';

describe('invertHexColor', () => {
	it('inverts each channel of a hex color', () => {
		expect(invertHexColor('#ffffff')).toBe('#000000');
		expect(invertHexColor('#000000')).toBe('#ffffff');
		expect(invertHexColor('#123456')).toBe('#edcba9');
		expect(invertHexColor('#ABC')).toBe('#554433');
	});

	it('falls back to inverting white for invalid colors', () => {
		expect(invertHexColor('nope')).toBe('#000000');
	});

	it('grid dots use the inverse of the page background', () => {
		expect(gridGuideDotColor('#ffe4c4')).toBe('#001b3b');
	});
});

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
