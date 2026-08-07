import type { EditorFontFamily, EditorFontStyle } from '@/types/fonts';

const GOOGLE_FONTS_CSS2 = 'https://fonts.googleapis.com/css2';

const italicsFor = (styles: ReadonlyArray<EditorFontStyle>): Array<0 | 1> => {
	return styles.includes('italic') ? [0, 1] : [0];
};

export const buildGoogleFontsCss2Url = (font: EditorFontFamily): string => {
	const family = encodeURIComponent(font.family).replace(/%20/g, '+');
	const italics = italicsFor(font.styles);
	const pairs: string[] = [];

	if (font.variable && font.weights.length > 0) {
		const min = Math.min(...font.weights);
		const max = Math.max(...font.weights);

		for (const ital of italics) {
			pairs.push(`${ital},${min}..${max}`);
		}
	} else {
		for (const ital of italics) {
			for (const weight of font.weights) {
				pairs.push(`${ital},${weight}`);
			}
		}
	}

	const axis =
		pairs.length > 0 ? `:ital,wght@${pairs.join(';')}` : ':wght@400';

	return `${GOOGLE_FONTS_CSS2}?family=${family}${axis}&display=swap`;
};

const findExistingLink = (family: string): HTMLLinkElement | null => {
	const links = document.head.querySelectorAll('link[data-manga-font]');

	for (const node of links) {
		if (
			node instanceof HTMLLinkElement &&
			node.dataset.mangaFont === family
		) {
			return node;
		}
	}

	return null;
};

const waitForStylesheet = (link: HTMLLinkElement): Promise<void> => {
	if (link.sheet) {
		return Promise.resolve();
	}

	return new Promise((resolve, reject) => {
		const onLoad = () => {
			cleanup();
			resolve();
		};
		const onError = () => {
			cleanup();
			reject(new Error(`Failed to load stylesheet: ${link.href}`));
		};
		const cleanup = () => {
			link.removeEventListener('load', onLoad);
			link.removeEventListener('error', onError);
		};

		link.addEventListener('load', onLoad);
		link.addEventListener('error', onError);
	});
};

const waitForFontFaces = async (font: EditorFontFamily): Promise<void> => {
	const fontsApi = document.fonts;

	if (!fontsApi?.load) {
		return;
	}

	const italics = italicsFor(font.styles);
	const weights =
		font.variable && font.weights.length > 0
			? [Math.min(...font.weights), Math.max(...font.weights)]
			: font.weights;
	const uniqueWeights = [...new Set(weights)];

	await Promise.all(
		italics.flatMap((ital) => {
			const style = ital === 1 ? 'italic' : 'normal';

			return uniqueWeights.map((weight) => {
				return fontsApi.load(`${style} ${weight} 16px "${font.family}"`);
			});
		}),
	);
};

export const injectGoogleFontStylesheet = async (
	font: EditorFontFamily,
): Promise<void> => {
	if (typeof document === 'undefined') {
		return;
	}

	const existing = findExistingLink(font.family);

	if (existing) {
		await waitForStylesheet(existing);
		await waitForFontFaces(font);

		return;
	}

	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = buildGoogleFontsCss2Url(font);
	link.dataset.mangaFont = font.family;
	document.head.appendChild(link);

	await waitForStylesheet(link);
	await waitForFontFaces(font);
};
