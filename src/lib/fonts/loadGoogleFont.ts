import {
	findEditorFontFamily,
	getEditorFontCatalog,
} from '@/lib/fonts/googleFontsCatalog';
import { injectGoogleFontStylesheet } from '@/lib/fonts/googleFontsCss2';

const loadingByFamily = new Map<string, Promise<void>>();
const loadedFamilies = new Set<string>();

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

export const resetLoadedFontFamiliesForTests = () => {
	loadingByFamily.clear();
	loadedFamilies.clear();
};
