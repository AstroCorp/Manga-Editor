import { ShapeImage } from '@/models/ShapeImage';
import {
	DEFAULT_TEXT_LINE_HEIGHT,
	type TextBlock,
} from '@/models/TextBlock';
import type {
	PagePoint,
	PagePreviewImage,
	PagePreviewModel,
	PagePreviewPanel,
	PagePreviewText,
	ShapeImageJSON,
	ShapeLike,
} from '@/types/page';

const toSvgPoints = (points: PagePoint[]): string => {
	return points
		.map((point) => {
			return `${point.x},${point.y}`;
		})
		.join(' ');
};

const imagePlacement = (
	image: ShapeImageJSON,
	clipPoints: string,
): PagePreviewImage | null => {
	if (!image.src || !clipPoints) {
		return null;
	}

	const imgWidth = Math.max(1, image.width * image.scaleX);
	const imgHeight = Math.max(1, image.height * image.scaleY);
	const x = image.originX === 'center' ? image.left - imgWidth / 2 : image.left;
	const y = image.originY === 'center' ? image.top - imgHeight / 2 : image.top;

	return {
		href: image.src,
		x,
		y,
		width: imgWidth,
		height: imgHeight,
		angle: image.angle ?? 0,
		originX: image.originX === 'center' ? image.left : x,
		originY: image.originY === 'center' ? image.top : y,
		clipPoints,
		grayscale: Boolean(image.grayscale),
	};
};

const toImageJson = (image: ShapeLike['image']): ShapeImageJSON | null => {
	if (!image) {
		return null;
	}

	if (image instanceof ShapeImage) {
		return image.toJSON();
	}

	return image;
};

const PREVIEW_FONT_FAMILY = 'Arial, sans-serif';
/**
 * Fallback solo si measureText no está disponible (p. ej. jsdom).
 * Ratio bajo a propósito: mejor sub-wrap que inventar líneas de más.
 */
const FALLBACK_LATIN_CHAR_WIDTH_RATIO = 0.42;
/** Holgura vs width del Textbox para no partir líneas que Fabric deja en una. */
const WRAP_WIDTH_SLACK = 1;

export type PreviewTextMeasureStyle = {
	fontSize: number;
	fontWeight?: string;
	fontStyle?: string;
};

let measureContext: CanvasRenderingContext2D | null | undefined;

const getMeasureContext = (): CanvasRenderingContext2D | null => {
	if (measureContext !== undefined) {
		return measureContext;
	}

	if (typeof document === 'undefined') {
		measureContext = null;

		return null;
	}

	try {
		const canvas = document.createElement('canvas');
		measureContext = canvas.getContext('2d');
	} catch {
		measureContext = null;
	}

	return measureContext;
};

const isWideChar = (char: string): boolean => {
	const code = char.codePointAt(0) ?? 0;

	return (
		(code >= 0x3000 && code <= 0x9fff) ||
		(code >= 0xff00 && code <= 0xffef) ||
		(code >= 0xac00 && code <= 0xd7af)
	);
};

const fallbackPreviewTextWidth = (value: string, fontSize: number): number => {
	let width = 0;

	for (const char of value) {
		width += isWideChar(char)
			? fontSize
			: fontSize * FALLBACK_LATIN_CHAR_WIDTH_RATIO;
	}

	return width;
};

const toCssFont = (style: PreviewTextMeasureStyle): string => {
	const fontStyle = style.fontStyle === 'italic' ? 'italic' : 'normal';
	const fontWeight = style.fontWeight === 'bold' ? 'bold' : 'normal';

	return `${fontStyle} ${fontWeight} ${style.fontSize}px ${PREVIEW_FONT_FAMILY}`;
};

/** Ancho de cadena: canvas measureText (mismo font que Fabric/preview). */
export const estimatePreviewTextWidth = (
	value: string,
	style: PreviewTextMeasureStyle | number,
): number => {
	const measureStyle: PreviewTextMeasureStyle =
		typeof style === 'number' ? { fontSize: style } : style;

	if (value.length === 0) {
		return 0;
	}

	const ctx = getMeasureContext();

	if (ctx) {
		ctx.font = toCssFont(measureStyle);
		const measured = ctx.measureText(value).width;

		// jsdom suele devolver 0; no usarlo para decidir wraps.
		if (measured > 0) {
			return measured;
		}
	}

	return fallbackPreviewTextWidth(value, measureStyle.fontSize);
};

const fitsInWidth = (
	value: string,
	maxWidth: number,
	style: PreviewTextMeasureStyle,
): boolean => {
	return estimatePreviewTextWidth(value, style) <= maxWidth + WRAP_WIDTH_SLACK;
};

const breakOversizedToken = (
	token: string,
	maxWidth: number,
	style: PreviewTextMeasureStyle,
): string[] => {
	const parts: string[] = [];
	let current = '';

	for (const char of token) {
		const next = current + char;

		if (current.length > 0 && !fitsInWidth(next, maxWidth, style)) {
			parts.push(current);
			current = char;
		} else {
			current = next;
		}
	}

	if (current.length > 0) {
		parts.push(current);
	}

	return parts.length > 0 ? parts : [''];
};

/** Soft-wrap de una línea dura según width del TextBlock. */
export const wrapPreviewLine = (
	line: string,
	maxWidth: number,
	style: PreviewTextMeasureStyle | number,
): string[] => {
	const measureStyle: PreviewTextMeasureStyle =
		typeof style === 'number' ? { fontSize: style } : style;

	if (line.length === 0) {
		return [''];
	}

	if (!(maxWidth > 0) || fitsInWidth(line, maxWidth, measureStyle)) {
		return [line];
	}

	const lines: string[] = [];
	let current = '';
	const tokens = line.split(/(\s+)/);

	const flush = () => {
		if (current.length > 0) {
			lines.push(current);
			current = '';
		}
	};

	for (const token of tokens) {
		if (token.length === 0) {
			continue;
		}

		const candidate = current + token;

		if (fitsInWidth(candidate, maxWidth, measureStyle)) {
			current = candidate;
			continue;
		}

		flush();

		if (/^\s+$/.test(token)) {
			continue;
		}

		if (fitsInWidth(token, maxWidth, measureStyle)) {
			current = token;
			continue;
		}

		const chunks = breakOversizedToken(token, maxWidth, measureStyle);

		for (let i = 0; i < chunks.length; i++) {
			const chunk = chunks[i]!;

			if (i < chunks.length - 1) {
				lines.push(chunk);
			} else {
				current = chunk;
			}
		}
	}

	flush();

	return lines.length > 0 ? lines : [''];
};

/** Parte por \\n y aplica soft-wrap por width. */
export const buildPreviewTextLines = (
	content: string,
	width: number,
	style: PreviewTextMeasureStyle | number,
): string[] => {
	const measureStyle: PreviewTextMeasureStyle =
		typeof style === 'number' ? { fontSize: style } : style;
	const hardLines = content.split('\n');
	const lines: string[] = [];

	for (const hardLine of hardLines) {
		lines.push(...wrapPreviewLine(hardLine, width, measureStyle));
	}

	return lines.length > 0 ? lines : [''];
};

const toPreviewTexts = (
	texts: TextBlock[] | null | undefined,
): PagePreviewText[] => {
	return (texts ?? []).map((text) => {
		return {
			lines: buildPreviewTextLines(text.content, text.width, {
				fontSize: text.fontSize,
				fontWeight: text.fontWeight,
				fontStyle: text.fontStyle,
			}),
			x: text.left,
			y: text.top + text.fontSize,
			fontSize: text.fontSize,
			lineHeight:
				typeof text.lineHeight === 'number' && text.lineHeight > 0
					? text.lineHeight
					: DEFAULT_TEXT_LINE_HEIGHT,
			fill: text.fill,
			fontWeight: text.fontWeight,
			fontStyle: text.fontStyle,
			underline: text.underline,
			linethrough: text.linethrough,
			stroke: text.stroke,
			strokeWidth: text.strokeWidth,
			textAlign: text.textAlign,
			width: text.width,
			angle: text.angle,
			originX: text.left,
			originY: text.top,
		};
	});
};

/** Modelo de preview ligero (paneles + imágenes + textos) desde shapes de dominio. */
export const buildPagePreview = (
	width: number,
	height: number,
	shapes: ShapeLike[] | null | undefined,
	texts?: TextBlock[] | null,
): PagePreviewModel => {
	const safeWidth = Math.max(1, width);
	const safeHeight = Math.max(1, height);
	const panels: PagePreviewPanel[] = [];
	const images: PagePreviewImage[] = [];

	for (const shape of shapes ?? []) {
		const clipPoints =
			shape.points.length >= 3 ? toSvgPoints(shape.points) : '';

		if (clipPoints) {
			panels.push({
				points: clipPoints,
				strokeWidth: Math.max(1, shape.strokeWidth),
				whiteFill: Boolean(shape.whiteFill),
			});
		}

		const imageJson = toImageJson(shape.image);

		if (imageJson && clipPoints) {
			const placed = imagePlacement(imageJson, clipPoints);

			if (placed) {
				images.push(placed);
			}
		}
	}

	return {
		width: safeWidth,
		height: safeHeight,
		panels,
		images,
		texts: toPreviewTexts(texts),
	};
};
