import {
	DEFAULT_STROKE_COLOR,
	DEFAULT_STROKE_WIDTH,
	clampStrokeWidth,
} from '@/lib/page/pageLimits';
import type { ShapeStroke } from '@/types/page';

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

export const normalizeStrokeColor = (
	value: unknown,
	fallback = DEFAULT_STROKE_COLOR,
): string => {
	if (typeof value !== 'string') {
		return fallback;
	}

	const trimmed = value.trim();

	if (HEX_COLOR_RE.test(trimmed)) {
		return trimmed.toLowerCase();
	}

	if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
		const [, r, g, b] = trimmed;

		return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
	}

	return fallback;
};

export const createStroke = (
	width = DEFAULT_STROKE_WIDTH,
	color = DEFAULT_STROKE_COLOR,
): ShapeStroke => {
	return {
		width: clampStrokeWidth(width),
		color: normalizeStrokeColor(color),
	};
};

/** Un trazo por arista (`count` = número de vértices del polígono). */
export const createUniformStrokes = (
	count: number,
	width = DEFAULT_STROKE_WIDTH,
	color = DEFAULT_STROKE_COLOR,
): ShapeStroke[] => {
	const stroke = createStroke(width, color);

	return Array.from({ length: Math.max(0, count) }, () => {
		return { ...stroke };
	});
};

/**
 * Ajusta una lista de trazos (posiblemente incompleta o inválida) al número
 * de aristas. Las faltantes heredan `fallback`; JSON antiguos sin `strokes`
 * pasan por aquí con el stroke de capa como fallback.
 */
export const normalizeShapeStrokes = (
	count: number,
	strokes: unknown,
	fallback: ShapeStroke = createStroke(),
): ShapeStroke[] => {
	const source = Array.isArray(strokes) ? strokes : [];

	return Array.from({ length: Math.max(0, count) }, (_, index) => {
		const raw = source[index] as Partial<ShapeStroke> | undefined;

		return {
			width: clampStrokeWidth(
				typeof raw?.width === 'number' ? raw.width : fallback.width,
			),
			color: normalizeStrokeColor(raw?.color, fallback.color),
		};
	});
};

/** Trazo común a todas las aristas, o `null` si difieren. */
export const uniformStroke = (
	strokes: readonly ShapeStroke[],
): ShapeStroke | null => {
	const first = strokes[0];

	if (!first) {
		return null;
	}

	const same = strokes.every((stroke) => {
		return stroke.width === first.width && stroke.color === first.color;
	});

	return same ? { ...first } : null;
};

export const maxStrokeWidth = (strokes: readonly ShapeStroke[]): number => {
	return strokes.reduce((max, stroke) => {
		return Math.max(max, stroke.width);
	}, 0);
};

export const cloneStrokes = (
	strokes: readonly ShapeStroke[],
): ShapeStroke[] => {
	return strokes.map((stroke) => {
		return { ...stroke };
	});
};
