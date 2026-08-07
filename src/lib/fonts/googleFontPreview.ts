/** Pre-rendered family-name SVGs hosted for the WordPress Font Library. */
const GOOGLE_FONT_PREVIEW_BASE =
	'https://s.w.org/images/fonts/wp-7.0/previews';

export const getGoogleFontPreviewUrl = (fontId: string): string => {
	const id = fontId.trim().toLowerCase();

	return `${GOOGLE_FONT_PREVIEW_BASE}/${id}/${id}.svg`;
};
