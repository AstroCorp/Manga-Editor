import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetGoogleFontsCatalogForTests } from '@/lib/fonts/googleFontsCatalog';

const injectGoogleFontStylesheet = vi.hoisted(() => {
	return vi.fn(async () => undefined);
});

vi.mock('@/lib/fonts/googleFontsCss2', async () => {
	const actual = await vi.importActual<typeof import('@/lib/fonts/googleFontsCss2')>(
		'@/lib/fonts/googleFontsCss2',
	);

	return {
		...actual,
		injectGoogleFontStylesheet,
	};
});

const {
	ensureFontFamilyLoaded,
	resetLoadedFontFamiliesForTests,
} = await import('@/lib/fonts/loadGoogleFont');

describe('loadGoogleFont', () => {
	beforeEach(() => {
		injectGoogleFontStylesheet.mockClear();
		resetLoadedFontFamiliesForTests();
		resetGoogleFontsCatalogForTests();
	});

	it('skips empty family names', async () => {
		await ensureFontFamilyLoaded('   ');

		expect(injectGoogleFontStylesheet).not.toHaveBeenCalled();
	});

	it('loads google fonts through the local css2 module', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				return {
					ok: true,
					json: async () => {
						return [
							{
								id: 'roboto',
								family: 'Roboto',
								weights: [400, 700],
								styles: ['normal', 'italic'],
								variable: false,
								category: 'sans-serif',
							},
						];
					},
				};
			}),
		);

		await ensureFontFamilyLoaded('Roboto');

		expect(injectGoogleFontStylesheet).toHaveBeenCalledTimes(1);
		expect(injectGoogleFontStylesheet.mock.calls[0]?.[0]).toMatchObject({
			family: 'Roboto',
		});

		await ensureFontFamilyLoaded('Roboto');

		expect(injectGoogleFontStylesheet).toHaveBeenCalledTimes(1);

		vi.unstubAllGlobals();
	});

	it('ignores unknown families without injecting stylesheets', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				return {
					ok: true,
					json: async () => {
						return [];
					},
				};
			}),
		);

		await ensureFontFamilyLoaded('MissingFont');

		expect(injectGoogleFontStylesheet).not.toHaveBeenCalled();

		vi.unstubAllGlobals();
	});
});
