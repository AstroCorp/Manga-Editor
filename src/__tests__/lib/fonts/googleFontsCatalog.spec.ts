import { describe, expect, it } from 'vitest';
import {
	DEFAULT_TEXT_FONT_FAMILY,
	normalizeFontFamilyName,
} from '@/lib/fonts/googleFontsCatalog';

describe('googleFontsCatalog', () => {
	it('normalizeFontFamilyName trims names and rejects empty values', () => {
		expect(normalizeFontFamilyName('  Roboto  ')).toBe('Roboto');
		expect(normalizeFontFamilyName('Arial')).toBe('Arial');
		expect(normalizeFontFamilyName('')).toBeNull();
		expect(normalizeFontFamilyName('   ')).toBeNull();
		expect(normalizeFontFamilyName(null)).toBeNull();
		expect(normalizeFontFamilyName(12)).toBeNull();
	});

	it('defaults new text to Roboto', () => {
		expect(DEFAULT_TEXT_FONT_FAMILY).toBe('Roboto');
	});
});
