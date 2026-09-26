import type { Serializer } from '@vueuse/core';
import type { EditorFontFamily } from '@/types/fonts';

export const FAVORITE_FONTS_STORAGE_KEY = 'manga-editor-favorite-fonts';

const parseFavoriteFontIds = (raw: string): string[] => {
	try {
		const parsed: unknown = JSON.parse(raw);

		if (!Array.isArray(parsed)) {
			return [];
		}

		const ids = parsed.filter((value): value is string => {
			return typeof value === 'string' && value.length > 0;
		});

		return [...new Set(ids)];
	} catch {
		return [];
	}
};

export const favoriteFontsSerializer: Serializer<string[]> = {
	read: (raw) => {
		return parseFavoriteFontIds(raw);
	},
	write: (value) => {
		return JSON.stringify(value);
	},
};

/** Devuelve la lista con el id añadido o quitado, sin mutar la original. */
export const toggleFavoriteFontId = (
	ids: readonly string[],
	fontId: string,
): string[] => {
	if (ids.includes(fontId)) {
		return ids.filter((id) => {
			return id !== fontId;
		});
	}

	return [...ids, fontId];
};

/** Favoritas presentes en el catálogo, en el orden en que se marcaron. */
export const pinnedFavoriteFonts = (
	catalog: readonly EditorFontFamily[],
	favoriteIds: readonly string[],
): EditorFontFamily[] => {
	const byId = new Map(
		catalog.map((font) => {
			return [font.id, font] as const;
		}),
	);

	return favoriteIds.flatMap((id) => {
		const font = byId.get(id);

		return font ? [font] : [];
	});
};
