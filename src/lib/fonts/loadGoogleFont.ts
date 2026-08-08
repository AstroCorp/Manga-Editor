import {
	findEditorFontFamily,
	getEditorFontCatalog,
} from '@/lib/fonts/googleFontsCatalog';
import { injectGoogleFontStylesheet } from '@/lib/fonts/googleFontsCss2';
import type { TextFontSource } from '@/types/fonts';

const loadingByFamily = new Map<string, Promise<void>>();
const loadedFamilies = new Set<string>();

export const collectFontFamiliesFromText = (text: TextFontSource): string[] => {
	const families = new Set<string>();
	const base = text.fontFamily?.trim();

	if (base) {
		families.add(base);
	}

	if (!text.styles) {
		return [...families];
	}

	for (const line of Object.values(text.styles)) {
		for (const style of Object.values(line)) {
			const family = style.fontFamily?.trim();

			if (family) {
				families.add(family);
			}
		}
	}

	return [...families];
};

export const ensureFontFamilyLoaded = async (family: string): Promise<void> => {
	const name = family.trim();

	if (!name || loadedFamilies.has(name)) {
		return;
	}

	const pending = loadingByFamily.get(name);

	if (pending) {
		await pending;

		return;
	}

	const task = (async () => {
		const catalog = await getEditorFontCatalog();
		const font = findEditorFontFamily(name, catalog);

		if (!font) {
			loadedFamilies.add(name);

			return;
		}

		await injectGoogleFontStylesheet(font);
		loadedFamilies.add(name);
	})().finally(() => {
		loadingByFamily.delete(name);
	});

	loadingByFamily.set(name, task);
	await task;
};

export const ensureTextFontsLoaded = async (
	text: TextFontSource,
): Promise<void> => {
	await Promise.all(
		collectFontFamiliesFromText(text).map((family) => {
			return ensureFontFamilyLoaded(family);
		}),
	);
};

export const resetLoadedFontFamiliesForTests = () => {
	loadingByFamily.clear();
	loadedFamilies.clear();
};
