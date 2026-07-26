export const DEFAULT_PAGE_WIDTH = 1753;
export const DEFAULT_PAGE_HEIGHT = 2480;
export const DEFAULT_GRID_COLS = 80;
export const DEFAULT_GRID_ROWS = 120;
export const DEFAULT_MARGIN = 20;
export const DEFAULT_STROKE_WIDTH = 3;
export const MIN_GRID_POINTS = 2;
export const MAX_GRID_POINTS = 200;
export const MIN_STROKE_WIDTH = 1;
export const MAX_STROKE_WIDTH = 40;
export const MIN_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 10000;
const MAX_MARGIN_RATIO = 0.2;

/**
 * Acota el número de columnas/filas de la rejilla al rango válido.
 * Si el valor no es finito, cae al mínimo.
 */
export const clampGridSize = (value: number): number => {
	if (!Number.isFinite(value)) {
		return MIN_GRID_POINTS;
	}

	// Redondea y fuerza el valor entre MIN y MAX.
	return Math.min(
		MAX_GRID_POINTS,
		Math.max(MIN_GRID_POINTS, Math.round(value)),
	);
};

/**
 * Acota el ancho/alto de la página al rango válido.
 * Si el valor no es finito, cae al mínimo.
 */
export const clampPageSize = (value: number): number => {
	if (!Number.isFinite(value)) {
		return MIN_PAGE_SIZE;
	}

	// Redondea y fuerza el valor entre MIN y MAX.
	return Math.min(
		MAX_PAGE_SIZE,
		Math.max(MIN_PAGE_SIZE, Math.round(value)),
	);
};

/**
 * Acota un margen en función del tamaño de página.
 * El máximo es el 20% del lado menor: deja al menos ~60% de área útil
 * aunque los dos márgenes opuestos vayan al tope.
 */
export const clampMargin = (value: number, pageWidth: number, pageHeight: number): number => {
	if (!Number.isFinite(value)) {
		return 0;
	}

	// Tope por lado: 20% del eje más corto (redondeado hacia abajo).
	const max = Math.max(
		0,
		Math.floor(Math.min(pageWidth, pageHeight) * MAX_MARGIN_RATIO),
	);

	// Fuerza el valor entre 0 y el tope calculado.
	return Math.min(max, Math.max(0, Math.round(value)));
};

/**
 * Acota el grosor de trazo al rango válido.
 * Si el valor no es finito, usa el default.
 */
export const clampStrokeWidth = (value: number): number => {
	if (!Number.isFinite(value)) {
		return DEFAULT_STROKE_WIDTH;
	}

	// Redondea y fuerza el valor entre MIN y MAX.
	return Math.min(
		MAX_STROKE_WIDTH,
		Math.max(MIN_STROKE_WIDTH, Math.round(value)),
	);
};
