import { DEFAULT_STROKE_COLOR } from '@/lib/page/pageLimits';
import { normalizeStrokeColor } from '@/lib/page/shapeStrokes';
import type { PanelFillOptions } from '@/types/fabric';

/**
 * Tokens de color del editor Fabric (guías, draft, paneles).
 */
export const ACCENT_COLOR = '#2563eb';
export const GUIDE_STROKE_COLOR = ACCENT_COLOR;

/** Devuelve el color hex inverso (`#rrggbb`); si no es hex válido invierte el blanco. */
export const invertHexColor = (color: string): string => {
	const hex = normalizeStrokeColor(color, '#ffffff').slice(1);
	const inverted = (0xffffff ^ Number.parseInt(hex, 16))
		.toString(16)
		.padStart(6, '0');

	return `#${inverted}`;
};

/** Los puntos de la rejilla se pintan con el inverso del fondo de la página para que siempre contrasten. */
export const gridGuideDotColor = (pageBackground: string): string => {
	return invertHexColor(pageBackground);
};
export const DRAFT_STROKE_COLOR = '#222222';
/** Color por defecto de los bordes de panel (cada arista puede sobrescribirlo). */
export const PANEL_STROKE_COLOR = DEFAULT_STROKE_COLOR;

/**
 * Sin relleno visible. Alpha mínimo para que perPixelTargetFind
 * siga registrando clics en el interior del polígono.
 */
const PANEL_FILL_NONE = 'rgba(255,255,255,0.01)';
const PANEL_FILL_WHITE = '#ffffff';

export const panelFillColor = (
	whiteFill: boolean,
	options: PanelFillOptions = {},
): string => {
	if (options.hasImage) {
		return PANEL_FILL_NONE;
	}

	return whiteFill ? PANEL_FILL_WHITE : PANEL_FILL_NONE;
};
