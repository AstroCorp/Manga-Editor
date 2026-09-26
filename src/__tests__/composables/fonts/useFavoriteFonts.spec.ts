import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { useFavoriteFonts } from '@/composables/fonts/useFavoriteFonts';
import { FAVORITE_FONTS_STORAGE_KEY } from '@/lib/fonts/favoriteFonts';

describe('useFavoriteFonts', () => {
	beforeEach(() => {
		useFavoriteFonts().favoriteFontIds.value = [];
	});

	it('toggles favorites and persists them to localStorage', async () => {
		const { favoriteFontIds, isFavorite, toggleFavorite } = useFavoriteFonts();

		toggleFavorite('inter');
		toggleFavorite('roboto');
		await nextTick();

		expect(favoriteFontIds.value).toEqual(['inter', 'roboto']);
		expect(isFavorite('inter')).toBe(true);
		expect(localStorage.getItem(FAVORITE_FONTS_STORAGE_KEY)).toBe(
			'["inter","roboto"]',
		);

		toggleFavorite('inter');
		await nextTick();

		expect(isFavorite('inter')).toBe(false);
		expect(favoriteFontIds.value).toEqual(['roboto']);
	});

	it('shares the same state between callers', () => {
		useFavoriteFonts().toggleFavorite('lato');

		expect(useFavoriteFonts().isFavorite('lato')).toBe(true);
	});
});
