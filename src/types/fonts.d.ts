import type { TextStylesJSON } from '@/types/page';

export type EditorFontStyle = 'normal' | 'italic';

export type EditorFontFamily = {
	id: string;
	family: string;
	weights: number[];
	styles: EditorFontStyle[];
	variable: boolean;
	category?: string;
	/** SVG preview of the family name (Google fonts via WordPress CDN). */
	previewUrl?: string;
};

export type FontsourceGoogleFont = {
	id: string;
	family: string;
	weights: number[];
	styles: string[];
	variable: boolean;
	category?: string;
	type?: string;
};

/** Texto (modelo o parcial) del que se pueden extraer familias tipográficas. */
export type TextFontSource = {
	fontFamily?: string | null;
	styles?: TextStylesJSON | null;
};
