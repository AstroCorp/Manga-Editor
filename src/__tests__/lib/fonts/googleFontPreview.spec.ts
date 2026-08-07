import { describe, expect, it } from 'vitest';
import { getGoogleFontPreviewUrl } from '@/lib/fonts/googleFontPreview';

describe('googleFontPreview', () => {
	it('builds the WordPress CDN SVG URL from the font id', () => {
		expect(getGoogleFontPreviewUrl('Roboto')).toBe(
			'https://s.w.org/images/fonts/wp-7.0/previews/roboto/roboto.svg',
		);
		expect(getGoogleFontPreviewUrl('open-sans')).toBe(
			'https://s.w.org/images/fonts/wp-7.0/previews/open-sans/open-sans.svg',
		);
	});
});
