import type { TextStyle } from 'fabric';
import {
	DEFAULT_TEXT_ALIGN,
	DEFAULT_TEXT_FILL,
	DEFAULT_TEXT_FONT_SIZE,
	DEFAULT_TEXT_LINE_HEIGHT,
	DEFAULT_TEXT_STROKE,
	DEFAULT_TEXT_STROKE_WIDTH,
} from '@/models/TextBlock';
import type {
	TextCharStyle,
	TextFontStyle,
	TextFontWeight,
	TextStylesJSON,
	TextTextAlign,
} from '@/types/page';

export const MIN_TEXT_FONT_SIZE = 8;
export const MAX_TEXT_FONT_SIZE = 200;
export const MIN_TEXT_STROKE_WIDTH = 0;
export const MIN_TEXT_LINE_HEIGHT = 0.5;
export const MAX_TEXT_LINE_HEIGHT = 5;
export const TEXT_LINE_HEIGHT_STEP = 0.1;

export const TEXT_ALIGN_VALUES = [
	'left',
	'center',
	'right',
	'justify',
	'justify-left',
	'justify-center',
	'justify-right',
] as const satisfies ReadonlyArray<TextTextAlign>;

export const TEXT_ALIGN_OPTIONS: ReadonlyArray<{
	value: TextTextAlign;
	label: string;
}> = [
	{ value: 'left', label: 'Left' },
	{ value: 'center', label: 'Center' },
	{ value: 'right', label: 'Right' },
	{ value: 'justify', label: 'Justify' },
	{ value: 'justify-left', label: 'Justify left' },
	{ value: 'justify-center', label: 'Justify center' },
	{ value: 'justify-right', label: 'Justify right' },
];

const TEXT_ALIGN_VALUE_SET: ReadonlySet<TextTextAlign> = new Set(
	TEXT_ALIGN_VALUES,
);

type FabricStyleSample = {
	fill?: unknown;
	fontSize?: unknown;
	fontWeight?: unknown;
	fontStyle?: unknown;
	underline?: unknown;
	linethrough?: unknown;
	stroke?: unknown;
	strokeWidth?: unknown;
	lineHeight?: unknown;
};

export type TextStyleSource = {
	text?: string;
	fill?: unknown;
	fontSize?: unknown;
	fontWeight?: unknown;
	fontStyle?: unknown;
	underline?: unknown;
	linethrough?: unknown;
	stroke?: unknown;
	strokeWidth?: unknown;
	lineHeight?: unknown;
	textAlign?: unknown;
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
	width?: number;
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
	calcTextWidth?: () => number;
	dirty?: boolean;
};

const LAYOUT_STYLE_KEYS: Array<keyof TextCharStyle> = [
	'fontSize',
	'fontWeight',
	'fontStyle',
	'strokeWidth',
	'lineHeight',
];

/** Ancho temporal para medir el texto sin soft-wrap de Textbox. */
const UNBOUNDED_TEXT_WIDTH = 1_000_000;
const MIN_TEXTBOX_WIDTH = 20;
/** null en fontSize/strokeWidth/lineHeight = mezcla; dominant* = el más frecuente. */
export type TextFormatFlags = {
	bold: boolean;
	italic: boolean;
	underline: boolean;
	linethrough: boolean;
	fontSize: number | null;
	dominantFontSize: number;
	strokeWidth: number | null;
	dominantStrokeWidth: number;
	lineHeight: number | null;
	dominantLineHeight: number;
	textAlign: TextTextAlign;
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

	if (typeof style.stroke === 'string' && style.stroke.length > 0) {
		next.stroke = toHexColor(style.stroke);
	}

	const strokeWidth = normalizeStrokeWidth(style.strokeWidth);

	if (strokeWidth !== null) {
		next.strokeWidth = strokeWidth;
	}

	const lineHeight = normalizeLineHeight(style.lineHeight);

	if (lineHeight !== null) {
		next.lineHeight = lineHeight;
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

export const normalizeStrokeWidth = (value: unknown): number | null => {
	const width = typeof value === 'number' ? value : Number(value);

	if (!Number.isFinite(width)) {
		return null;
	}

	return Math.max(MIN_TEXT_STROKE_WIDTH, Math.round(width));
};

export const normalizeLineHeight = (value: unknown): number | null => {
	const height = typeof value === 'number' ? value : Number(value);

	if (!Number.isFinite(height)) {
		return null;
	}

	const clamped = Math.min(
		MAX_TEXT_LINE_HEIGHT,
		Math.max(MIN_TEXT_LINE_HEIGHT, height),
	);

	return Math.round(clamped * 100) / 100;
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

export const normalizeTextAlign = (value: unknown): TextTextAlign | null => {
	if (typeof value !== 'string') {
		return null;
	}

	return TEXT_ALIGN_VALUE_SET.has(value as TextTextAlign)
		? (value as TextTextAlign)
		: null;
};

/** Icono Fluent que representa el textAlign actual (solo UI). */
export const textAlignIconName = (textAlign: TextTextAlign): string => {
	switch (textAlign) {
		case 'center':
			return 'fluent:text-align-center-24-regular';
		case 'right':
			return 'fluent:text-align-right-24-regular';
		case 'justify':
		case 'justify-left':
		case 'justify-center':
		case 'justify-right':
			return 'fluent:text-align-justify-24-regular';
		case 'left':
		default:
			return 'fluent:text-align-left-24-regular';
	}
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

/** Parsea stroke width tipado; null si vacío o inválido. */
export const parseStrokeWidthInput = (raw: string): number | null => {
	if (raw.trim() === '') {
		return null;
	}

	const width = Number(raw);

	if (!Number.isFinite(width) || width < MIN_TEXT_STROKE_WIDTH) {
		return null;
	}

	return Math.round(width);
};

/** Parsea lineHeight tipado; null si vacío o fuera de rango. */
export const parseLineHeightInput = (raw: string): number | null => {
	if (raw.trim() === '') {
		return null;
	}

	const height = Number(raw);

	if (!Number.isFinite(height)) {
		return null;
	}

	if (height < MIN_TEXT_LINE_HEIGHT || height > MAX_TEXT_LINE_HEIGHT) {
		return null;
	}

	return Math.round(height * 100) / 100;
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

/** Stroke de dominio: null si vacío / transparente. */
export const toStrokeColor = (value: unknown): string | null => {
	if (value === null || value === undefined || value === '') {
		return null;
	}

	if (typeof value !== 'string') {
		return null;
	}

	const trimmed = value.trim().toLowerCase();

	if (trimmed === 'transparent' || trimmed === 'none') {
		return null;
	}

	return toHexColor(value, DEFAULT_TEXT_STROKE);
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

const resolveStrokeHex = (value: unknown, fallback: string): string => {
	const stroke = toStrokeColor(value);

	return stroke ?? fallback;
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

/** Colores de stroke únicos del rango o de todo el texto. */
export const collectTextStrokeColors = (textbox: TextStyleSource): string[] => {
	const base = resolveStrokeHex(textbox.stroke, DEFAULT_TEXT_STROKE);
	const samples = getStyleSamples(textbox);
	const unique: string[] = [];
	const seen = new Set<string>();

	for (const style of samples) {
		const hex =
			style.stroke === undefined
				? base
				: resolveStrokeHex(style.stroke, base);

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
	const baseStrokeWidth =
		normalizeStrokeWidth(textbox.strokeWidth) ?? DEFAULT_TEXT_STROKE_WIDTH;
	const baseLineHeight =
		normalizeLineHeight(textbox.lineHeight) ?? DEFAULT_TEXT_LINE_HEIGHT;
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
	const strokeWidths = sampleFlag(
		samples,
		(style) => normalizeStrokeWidth(style.strokeWidth) ?? undefined,
		baseStrokeWidth,
	);
	const lineHeights = sampleFlag(
		samples,
		(style) => normalizeLineHeight(style.lineHeight) ?? undefined,
		baseLineHeight,
	);
	const dominantFontSize =
		fontSizes.length === 0 ? baseSize : mostFrequent(fontSizes);
	const dominantStrokeWidth =
		strokeWidths.length === 0 ? baseStrokeWidth : mostFrequent(strokeWidths);
	const dominantLineHeight =
		lineHeights.length === 0 ? baseLineHeight : mostFrequent(lineHeights);

	return {
		bold: bolds.some(Boolean),
		italic: italics.some(Boolean),
		underline: underlines.some(Boolean),
		linethrough: linethroughs.some(Boolean),
		fontSize: fontSizes.length === 0 ? null : resolveUnique(fontSizes),
		dominantFontSize,
		strokeWidth:
			strokeWidths.length === 0 ? null : resolveUnique(strokeWidths),
		dominantStrokeWidth,
		lineHeight:
			lineHeights.length === 0 ? null : resolveUnique(lineHeights),
		dominantLineHeight,
		textAlign: normalizeTextAlign(textbox.textAlign) ?? DEFAULT_TEXT_ALIGN,
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

	if (styles.stroke !== undefined || styles.strokeWidth !== undefined) {
		ensureSmoothTextStroke(textbox);
	}
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

/** strokeWidth también refresca medidas del Textbox. */
export const applyTextStrokeWidth = (
	textbox: TextStyleMutable,
	width: number,
) => {
	const stroke =
		toStrokeColor(textbox.stroke) ??
		(width > 0 ? DEFAULT_TEXT_STROKE : null);
	const styles: Partial<TextCharStyle> = {
		strokeWidth: width,
		...(stroke ? { stroke } : {}),
	};

	applyStylesToRangeOrWhole(textbox, styles, () => {
		textbox.removeStyle('strokeWidth');

		if (stroke) {
			textbox.removeStyle('stroke');
			textbox.set({ stroke, strokeWidth: width });
		} else {
			textbox.set('strokeWidth', width);
		}
	});

	ensureSmoothTextStroke(textbox);
};

/** textAlign es propiedad de objeto (no por carácter). */
export const applyTextAlign = (
	textbox: TextStyleMutable,
	textAlign: TextTextAlign,
) => {
	textbox.set('textAlign', textAlign);
	(textbox as TextStyleMutable & { _forceClearCache?: boolean })._forceClearCache =
		true;
	textbox.dirty = true;
	textbox.initDimensions?.();
	textbox.setCoords?.();
};

/**
 * lineHeight se guarda por carácter (como fontSize); el layout de Fabric
 * lo aplica por línea vía el patch en `lineHeightLayout`.
 */
export const applyTextLineHeight = (
	textbox: TextStyleMutable,
	lineHeight: number,
) => {
	applyStylesToRangeOrWhole(textbox, { lineHeight }, () => {
		textbox.removeStyle('lineHeight');
		textbox.set('lineHeight', lineHeight);
	});
};

/** Evita picos de miter en contornos gruesos del texto. */
const ensureSmoothTextStroke = (textbox: TextStyleMutable) => {
	textbox.set({
		strokeLineJoin: 'round',
		strokeLineCap: 'round',
		paintFirst: 'stroke',
	});
};
/**
 * Amplía el width solo si el contenido (sin soft-wrap) no cabe.
 * Si la caja ya tiene espacio, se respeta el ancho actual.
 */
export const fitTextboxWidthToContent = (textbox: TextStyleMutable) => {
	const currentWidth =
		typeof textbox.width === 'number' && Number.isFinite(textbox.width)
			? textbox.width
			: MIN_TEXTBOX_WIDTH;

	textbox.set('width', UNBOUNDED_TEXT_WIDTH);
	textbox.initDimensions?.();

	const measured = Math.ceil(textbox.calcTextWidth?.() ?? 0);
	const nextWidth = Math.max(currentWidth, measured, MIN_TEXTBOX_WIDTH);

	textbox.set('width', nextWidth);
	textbox.initDimensions?.();
	textbox.setCoords?.();
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

	if (styles.fontSize !== undefined) {
		fitTextboxWidthToContent(textbox);

		return;
	}

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
