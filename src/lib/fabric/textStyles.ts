import type { TextStyle } from 'fabric';
import {
	DEFAULT_TEXT_FILL,
	DEFAULT_TEXT_FONT_SIZE,
} from '@/models/TextBlock';
import type {
	TextCharStyle,
	TextFontStyle,
	TextFontWeight,
	TextStylesJSON,
} from '@/types/page';

export const MIN_TEXT_FONT_SIZE = 8;
export const MAX_TEXT_FONT_SIZE = 200;

type FabricStyleSample = {
	fill?: unknown;
	fontSize?: unknown;
	fontWeight?: unknown;
	fontStyle?: unknown;
	underline?: unknown;
	linethrough?: unknown;
};

export type TextStyleSource = {
	text?: string;
	fill?: unknown;
	fontSize?: unknown;
	fontWeight?: unknown;
	fontStyle?: unknown;
	underline?: unknown;
	linethrough?: unknown;
	isEditing?: boolean;
	selectionStart?: number;
	selectionEnd?: number;
	getSelectionStyles: (
		startIndex?: number,
		endIndex?: number,
		complete?: boolean,
	) => FabricStyleSample[];
};

type TextStyleMutable = TextStyleSource & {
	set: {
		(key: string, value: unknown): unknown;
		(props: Record<string, unknown>): unknown;
	};
	setSelectionStyles: (
		styles: Record<string, unknown>,
		startIndex?: number,
		endIndex?: number,
	) => unknown;
	removeStyle: (property: keyof TextCharStyle) => unknown;
	initDimensions?: () => unknown;
	setCoords?: () => unknown;
	dirty?: boolean;
};

const LAYOUT_STYLE_KEYS: Array<keyof TextCharStyle> = [
	'fontSize',
	'fontWeight',
	'fontStyle',
];

/** null en fontSize = mezcla; dominantFontSize = el más frecuente. */
export type TextFormatFlags = {
	bold: boolean;
	italic: boolean;
	underline: boolean;
	linethrough: boolean;
	fontSize: number | null;
	dominantFontSize: number;
};

const toCharStyle = (style: Record<string, unknown>): TextCharStyle | null => {
	const next: TextCharStyle = {};

	if (typeof style.fill === 'string' && style.fill.length > 0) {
		next.fill = style.fill;
	}

	const fontSize = normalizeFontSize(style.fontSize);

	if (fontSize !== null) {
		next.fontSize = fontSize;
	}

	const fontWeight = normalizeFontWeight(style.fontWeight);

	if (fontWeight) {
		next.fontWeight = fontWeight;
	}

	const fontStyle = normalizeFontStyle(style.fontStyle);

	if (fontStyle) {
		next.fontStyle = fontStyle;
	}

	if (typeof style.underline === 'boolean') {
		next.underline = style.underline;
	}

	if (typeof style.linethrough === 'boolean') {
		next.linethrough = style.linethrough;
	}

	return Object.keys(next).length > 0 ? next : null;
};

export const normalizeFontSize = (value: unknown): number | null => {
	const size = typeof value === 'number' ? value : Number(value);

	if (!Number.isFinite(size)) {
		return null;
	}

	return Math.min(MAX_TEXT_FONT_SIZE, Math.max(MIN_TEXT_FONT_SIZE, Math.round(size)));
};

export const isBoldWeight = (value: unknown): boolean => {
	if (value === 'bold') {
		return true;
	}

	const numeric = typeof value === 'number' ? value : Number(value);

	return Number.isFinite(numeric) && numeric >= 600;
};

export const normalizeFontWeight = (value: unknown): TextFontWeight | null => {
	if (isBoldWeight(value)) {
		return 'bold';
	}

	if (value === 'normal' || value === '400' || value === 400) {
		return 'normal';
	}

	return null;
};

export const normalizeFontStyle = (value: unknown): TextFontStyle | null => {
	if (value === 'italic' || value === 'oblique') {
		return 'italic';
	}

	if (value === 'normal' || value === '') {
		return 'normal';
	}

	return null;
};

/** Parsea el valor tipado en el input; null si vacío o fuera de rango. */
export const parseFontSizeInput = (raw: string): number | null => {
	if (raw.trim() === '') {
		return null;
	}

	const size = Number(raw);

	if (!Number.isFinite(size)) {
		return null;
	}

	if (size < MIN_TEXT_FONT_SIZE || size > MAX_TEXT_FONT_SIZE) {
		return null;
	}

	return Math.round(size);
};

/** Compacta styles de Fabric a props de formato (JSON estable). */
export const stylesFromFabric = (
	styles: TextStyle | null | undefined,
): TextStylesJSON | undefined => {
	if (!styles) {
		return undefined;
	}

	const next: TextStylesJSON = {};
	let hasStyles = false;

	for (const [lineKey, lineStyles] of Object.entries(styles)) {
		if (!lineStyles || typeof lineStyles !== 'object') {
			continue;
		}

		const nextLine: TextStylesJSON[string] = {};

		for (const [charKey, charStyle] of Object.entries(lineStyles)) {
			if (!charStyle || typeof charStyle !== 'object') {
				continue;
			}

			const mapped = toCharStyle(charStyle as Record<string, unknown>);

			if (!mapped) {
				continue;
			}

			nextLine[charKey] = mapped;
			hasStyles = true;
		}

		if (Object.keys(nextLine).length > 0) {
			next[lineKey] = nextLine;
		}
	}

	return hasStyles ? next : undefined;
};

/** Restaura styles de dominio a la forma que espera Fabric. */
export const stylesToFabric = (
	styles: TextStylesJSON | null | undefined,
): TextStyle | undefined => {
	if (!styles) {
		return undefined;
	}

	const next: TextStyle = {};

	for (const [lineKey, lineStyles] of Object.entries(styles)) {
		const lineIndex = Number(lineKey);

		if (!Number.isFinite(lineIndex) || !lineStyles) {
			continue;
		}

		const nextLine: TextStyle[number] = {};

		for (const [charKey, charStyle] of Object.entries(lineStyles)) {
			const charIndex = Number(charKey);

			if (!Number.isFinite(charIndex) || !charStyle) {
				continue;
			}

			const mapped = toCharStyle(charStyle as Record<string, unknown>);

			if (!mapped) {
				continue;
			}

			nextLine[charIndex] = mapped;
		}

		if (Object.keys(nextLine).length > 0) {
			next[lineIndex] = nextLine;
		}
	}

	return Object.keys(next).length > 0 ? next : undefined;
};

/** Normaliza color a #rrggbb para `<input type="color">`. */
export const toHexColor = (
	value: unknown,
	fallback = DEFAULT_TEXT_FILL,
): string => {
	if (typeof value !== 'string' || value.length === 0) {
		return fallback;
	}

	const trimmed = value.trim();

	if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
		return trimmed.toLowerCase();
	}

	if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
		const [, r, g, b] = trimmed;
		return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
	}

	const rgb = trimmed.match(
		/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i,
	);

	if (!rgb) {
		return fallback;
	}

	const toByte = (part: string) => {
		return Math.min(255, Math.max(0, Number(part)))
			.toString(16)
			.padStart(2, '0');
	};

	return `#${toByte(rgb[1]!)}${toByte(rgb[2]!)}${toByte(rgb[3]!)}`;
};

export const hasTextSelectionRange = (textbox: TextStyleSource): boolean => {
	return Boolean(
		textbox.isEditing &&
			typeof textbox.selectionStart === 'number' &&
			typeof textbox.selectionEnd === 'number' &&
			textbox.selectionStart !== textbox.selectionEnd,
	);
};

const getSelectionRange = (
	textbox: TextStyleSource,
): { start: number; end: number } | null => {
	const text = textbox.text ?? '';

	if (text.length === 0) {
		return null;
	}

	if (hasTextSelectionRange(textbox)) {
		return {
			start: textbox.selectionStart!,
			end: textbox.selectionEnd!,
		};
	}

	return { start: 0, end: text.length };
};

const getStyleSamples = (textbox: TextStyleSource): FabricStyleSample[] => {
	const range = getSelectionRange(textbox);

	if (!range) {
		return [{}];
	}

	return textbox.getSelectionStyles(range.start, range.end, true);
};

const resolveUnique = <T>(values: T[]): T | null => {
	if (values.length === 0) {
		return null;
	}

	const first = values[0]!;

	return values.every((value) => value === first) ? first : null;
};

const mostFrequent = <T extends string | number | boolean>(values: T[]): T => {
	const counts = new Map<T, number>();

	for (const value of values) {
		counts.set(value, (counts.get(value) ?? 0) + 1);
	}

	let best = values[0]!;
	let bestCount = 0;

	for (const [value, count] of counts) {
		if (count > bestCount) {
			best = value;
			bestCount = count;
		}
	}

	return best;
};

const sampleFlag = <T>(
	samples: FabricStyleSample[],
	read: (style: FabricStyleSample) => T | undefined,
	fallback: T,
): T[] => {
	return samples.map((style) => {
		const value = read(style);

		return value === undefined ? fallback : value;
	});
};

/** Colores únicos (en orden) del rango seleccionado o de todo el texto. */
export const collectTextColors = (textbox: TextStyleSource): string[] => {
	const base = toHexColor(textbox.fill);
	const samples = getStyleSamples(textbox);
	const unique: string[] = [];
	const seen = new Set<string>();

	for (const style of samples) {
		const hex = toHexColor(
			typeof style.fill === 'string' && style.fill.length > 0
				? style.fill
				: base,
			base,
		);

		if (seen.has(hex)) {
			continue;
		}

		seen.add(hex);
		unique.push(hex);
	}

	return unique.length > 0 ? unique : [base];
};

/** Estado de formato del rango o de todo el texto. */
export const collectTextFormat = (textbox: TextStyleSource): TextFormatFlags => {
	const samples = getStyleSamples(textbox);
	const baseSize = normalizeFontSize(textbox.fontSize) ?? DEFAULT_TEXT_FONT_SIZE;
	const baseBold = isBoldWeight(textbox.fontWeight);
	const baseItalic = normalizeFontStyle(textbox.fontStyle) === 'italic';
	const baseUnderline = Boolean(textbox.underline);
	const baseLinethrough = Boolean(textbox.linethrough);

	const bolds = sampleFlag(
		samples,
		(style) => {
			return style.fontWeight === undefined
				? undefined
				: isBoldWeight(style.fontWeight);
		},
		baseBold,
	);
	const italics = sampleFlag(
		samples,
		(style) => {
			return style.fontStyle === undefined
				? undefined
				: normalizeFontStyle(style.fontStyle) === 'italic';
		},
		baseItalic,
	);
	const underlines = sampleFlag(
		samples,
		(style) => {
			return style.underline === undefined
				? undefined
				: Boolean(style.underline);
		},
		baseUnderline,
	);
	const linethroughs = sampleFlag(
		samples,
		(style) => {
			return style.linethrough === undefined
				? undefined
				: Boolean(style.linethrough);
		},
		baseLinethrough,
	);
	const fontSizes = sampleFlag(
		samples,
		(style) => normalizeFontSize(style.fontSize) ?? undefined,
		baseSize,
	);
	const dominantFontSize =
		fontSizes.length === 0 ? baseSize : mostFrequent(fontSizes);

	return {
		bold: bolds.some(Boolean),
		italic: italics.some(Boolean),
		underline: underlines.some(Boolean),
		linethrough: linethroughs.some(Boolean),
		fontSize: fontSizes.length === 0 ? null : resolveUnique(fontSizes),
		dominantFontSize,
	};
};

const applyStylesToRangeOrWhole = (
	textbox: TextStyleMutable,
	styles: Partial<TextCharStyle>,
	applyWhole: () => void,
) => {
	if (hasTextSelectionRange(textbox)) {
		const start = textbox.selectionStart ?? 0;
		const end = textbox.selectionEnd ?? start;

		textbox.setSelectionStyles(styles, start, end);
	} else {
		applyWhole();
	}

	refreshTextLayout(textbox, styles);
};

/** Aplica un estilo al rango o al texto completo (mismo patrón que el color). */
export const applyTextStyle = (
	textbox: TextStyleMutable,
	styles: Partial<TextCharStyle>,
) => {
	applyStylesToRangeOrWhole(textbox, styles, () => {
		textbox.set(styles);

		for (const property of Object.keys(styles) as Array<keyof TextCharStyle>) {
			textbox.removeStyle(property);
		}
	});
};

/**
 * fontSize necesita el set(key, value) de Fabric para recalcular medidas;
 * el set por objeto a veces no refresca el dibujo del Textbox.
 */
export const applyTextFontSize = (textbox: TextStyleMutable, size: number) => {
	applyStylesToRangeOrWhole(textbox, { fontSize: size }, () => {
		textbox.removeStyle('fontSize');
		textbox.set('fontSize', size);
	});
};

const refreshTextLayout = (
	textbox: TextStyleMutable,
	styles: Partial<TextCharStyle>,
) => {
	const needsLayout = LAYOUT_STYLE_KEYS.some((key) => {
		return styles[key] !== undefined;
	});

	if (!needsLayout) {
		return;
	}

	(textbox as TextStyleMutable & { _forceClearCache?: boolean })._forceClearCache =
		true;
	textbox.dirty = true;
	textbox.initDimensions?.();
	textbox.setCoords?.();
};

/** Fondo circular con uno o varios colores (conic-gradient). */
export const colorSwatchBackground = (colors: string[]): string => {
	if (colors.length <= 1) {
		return colors[0] ?? DEFAULT_TEXT_FILL;
	}

	const step = 360 / colors.length;
	const stops = colors.map((color, index) => {
		return `${color} ${index * step}deg ${(index + 1) * step}deg`;
	});

	return `conic-gradient(${stops.join(', ')})`;
};
