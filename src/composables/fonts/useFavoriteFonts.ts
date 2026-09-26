import { createSharedComposable, useLocalStorage } from '@vueuse/core';
import {
	FAVORITE_FONTS_STORAGE_KEY,
	favoriteFontsSerializer,
	toggleFavoriteFontId,
} from '@/lib/fonts/favoriteFonts';

/** Preferencia de usuario (como el tema): no forma parte del documento ni del historial. */
export const useFavoriteFonts = createSharedComposable(() => {
	const favoriteFontIds = useLocalStorage<string[]>(
		FAVORITE_FONTS_STORAGE_KEY,
		[],
		{ serializer: favoriteFontsSerializer },
	);

	const isFavorite = (fontId: string): boolean => {
		return favoriteFontIds.value.includes(fontId);
	};

	const toggleFavorite = (fontId: string) => {
		favoriteFontIds.value = toggleFavoriteFontId(
			favoriteFontIds.value,
			fontId,
		);
	};

	return {
		favoriteFontIds,
		isFavorite,
		toggleFavorite,
	};
});
