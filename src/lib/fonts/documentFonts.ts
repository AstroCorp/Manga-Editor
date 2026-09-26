import { collectFontFamiliesFromText } from '@/lib/fonts/loadGoogleFont';
import type { Page } from '@/models/Page';
import type { EditorFontFamily } from '@/types/fonts';

/** Familias usadas en cualquier texto de cualquier página/capa, ordenadas alfabéticamente. */
export const collectDocumentFontFamilies = (
	pages: readonly Page[],
): string[] => {
	const families = new Set<string>();

	for (const page of pages) {
		for (const layer of page.layers) {
			for (const text of layer.texts) {
				for (const family of collectFontFamiliesFromText(text)) {
					families.add(family);
				}
			}
		}
	}

	return [...families].sort((left, right) => {
		return left.localeCompare(right);
	});
};

/** Fuentes del catálogo cuyo nombre de familia está en uso, en el orden dado. */
export const fontsInUse = (
	catalog: readonly EditorFontFamily[],
	families: readonly string[],
): EditorFontFamily[] => {
	const byFamily = new Map(
		catalog.map((font) => {
			return [font.family, font] as const;
		}),
	);

	return families.flatMap((family) => {
		const font = byFamily.get(family);

		return font ? [font] : [];
	});
};
