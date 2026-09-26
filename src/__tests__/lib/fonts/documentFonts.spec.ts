import { describe, expect, it } from 'vitest';
import {
	collectDocumentFontFamilies,
	fontsInUse,
} from '@/lib/fonts/documentFonts';
import { Page } from '@/models/Page';
import { TextBlock } from '@/models/TextBlock';
import type { EditorFontFamily } from '@/types/fonts';

const font = (family: string): EditorFontFamily => {
	return {
		id: family.toLowerCase(),
		family,
		weights: [400],
		styles: ['normal'],
		variable: false,
	};
};

const textWithFamily = (family: string, styledFamily?: string) => {
	const text = TextBlock.create(0, 0);

	text.applyPatch({
		fontFamily: family,
		...(styledFamily
			? { styles: { 0: { 0: { fontFamily: styledFamily } } } }
			: {}),
	});

	return text;
};

describe('documentFonts', () => {
	it('collects families from every page, layer and char style, sorted and unique', () => {
		const first = Page.createBlank(1);
		const second = Page.createBlank(2);

		first.addText(textWithFamily('Roboto', 'Oswald'));
		first.addLayer();
		first.addText(textWithFamily('Lato'));
		second.addText(textWithFamily('Roboto'));

		expect(collectDocumentFontFamilies([first, second])).toEqual([
			'Lato',
			'Oswald',
			'Roboto',
		]);
		expect(collectDocumentFontFamilies([])).toEqual([]);
	});

	it('fontsInUse maps families to catalog entries and skips unknown ones', () => {
		const catalog = [font('Inter'), font('Roboto'), font('Lato')];

		expect(
			fontsInUse(catalog, ['Roboto', 'Arial', 'Inter']).map((item) => {
				return item.id;
			}),
		).toEqual(['roboto', 'inter']);
	});
});
