import { describe, expect, it } from 'vitest';
import {
	favoriteFontsSerializer,
	pinnedFavoriteFonts,
	toggleFavoriteFontId,
} from '@/lib/fonts/favoriteFonts';
import type { EditorFontFamily } from '@/types/fonts';

const font = (id: string): EditorFontFamily => {
	return {
		id,
		family: id.toUpperCase(),
		weights: [400],
		styles: ['normal'],
		variable: false,
	};
};

describe('favoriteFonts', () => {
	it('serializer reads only unique non-empty string ids', () => {
		expect(
			favoriteFontsSerializer.read('["inter","roboto","inter","",3,null]'),
		).toEqual(['inter', 'roboto']);
		expect(favoriteFontsSerializer.read('{"a":1}')).toEqual([]);
		expect(favoriteFontsSerializer.read('{not json')).toEqual([]);
		expect(favoriteFontsSerializer.write(['inter'])).toBe('["inter"]');
	});

	it('toggleFavoriteFontId appends or removes without mutating', () => {
		const ids = ['inter'];

		expect(toggleFavoriteFontId(ids, 'roboto')).toEqual(['inter', 'roboto']);
		expect(toggleFavoriteFontId(ids, 'inter')).toEqual([]);
		expect(ids).toEqual(['inter']);
	});

	it('pinnedFavoriteFonts keeps favorite order and skips unknown ids', () => {
		const catalog = [font('inter'), font('roboto'), font('lato')];

		expect(
			pinnedFavoriteFonts(catalog, ['lato', 'missing', 'inter']).map((item) => {
				return item.id;
			}),
		).toEqual(['lato', 'inter']);
		expect(pinnedFavoriteFonts(catalog, [])).toEqual([]);
	});
});
