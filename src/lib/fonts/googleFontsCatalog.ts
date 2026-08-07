import { getGoogleFontPreviewUrl } from '@/lib/fonts/googleFontPreview';
import type {
	EditorFontFamily,
	EditorFontStyle,
	FontsourceGoogleFont,
} from '@/types/fonts';

export const DEFAULT_TEXT_FONT_FAMILY = 'Roboto';

const FONTSOURCE_GOOGLE_URL = 'https://api.fontsource.org/v1/fonts?type=google';

let catalogPromise: Promise<EditorFontFamily[]> | null = null;
let googleCatalog: EditorFontFamily[] | null = null;

const toEditorStyles = (styles: string[]): EditorFontStyle[] => {
	const next: EditorFontStyle[] = [];

	if (styles.includes('normal')) {
		next.push('normal');
	}

	if (styles.includes('italic')) {
		next.push('italic');
	}

	return next.length > 0 ? next : ['normal'];
};

const mapFontsourceItem = (item: FontsourceGoogleFont): EditorFontFamily => {
	return {
		id: item.id,
		family: item.family,
		weights: item.weights.length > 0 ? item.weights : [400],
		styles: toEditorStyles(item.styles),
		variable: Boolean(item.variable),
		category: item.category,
		previewUrl: getGoogleFontPreviewUrl(item.id),
	};
};

export const normalizeFontFamilyName = (value: unknown): string | null => {
	if (typeof value !== 'string') {
		return null;
	}

	const trimmed = value.trim();

	return trimmed.length > 0 ? trimmed : null;
};

export const findEditorFontFamily = (
	family: string,
	catalog: ReadonlyArray<EditorFontFamily>,
): EditorFontFamily | null => {
	return (
		catalog.find((font) => {
			return font.family === family;
		}) ?? null
	);
};

const loadGoogleFontsCatalog = async (): Promise<EditorFontFamily[]> => {
	if (googleCatalog) {
		return googleCatalog;
	}

	if (!catalogPromise) {
		catalogPromise = fetch(FONTSOURCE_GOOGLE_URL)
			.then(async (response) => {
				if (!response.ok) {
					throw new Error(`Google fonts catalog failed (${response.status})`);
				}

				return (await response.json()) as FontsourceGoogleFont[];
			})
			.then((items) => {
				googleCatalog = items
					.filter((item) => {
						return typeof item.family === 'string' && item.family.length > 0;
					})
					.map(mapFontsourceItem)
					.sort((left, right) => {
						return left.family.localeCompare(right.family);
					});

				return googleCatalog;
			})
			.catch((error) => {
				catalogPromise = null;
				throw error;
			});
	}

	return catalogPromise;
};

export const getEditorFontCatalog = async (): Promise<EditorFontFamily[]> => {
	return loadGoogleFontsCatalog();
};

export const resetGoogleFontsCatalogForTests = () => {
	catalogPromise = null;
	googleCatalog = null;
};
