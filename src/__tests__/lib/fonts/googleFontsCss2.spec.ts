import { describe, expect, it } from 'vitest';
import { buildGoogleFontsCss2Url } from '@/lib/fonts/googleFontsCss2';
import type { EditorFontFamily } from '@/types/fonts';

describe('googleFontsCss2', () => {
	it('builds a static ital,wght URL with every variant', () => {
		const font: EditorFontFamily = {
			id: 'roboto',
			family: 'Roboto',
			weights: [400, 700],
			styles: ['normal', 'italic'],
			variable: false,
		};

		expect(buildGoogleFontsCss2Url(font)).toBe(
			'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap',
		);
	});

	it('builds a variable weight-range URL', () => {
		const font: EditorFontFamily = {
			id: 'inter',
			family: 'Inter',
			weights: [100, 900],
			styles: ['normal', 'italic'],
			variable: true,
		};

		expect(buildGoogleFontsCss2Url(font)).toBe(
			'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap',
		);
	});

	it('encodes spaces in family names', () => {
		const font: EditorFontFamily = {
			id: 'open-sans',
			family: 'Open Sans',
			weights: [400],
			styles: ['normal'],
			variable: false,
		};

		expect(buildGoogleFontsCss2Url(font)).toBe(
			'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400&display=swap',
		);
	});
});
