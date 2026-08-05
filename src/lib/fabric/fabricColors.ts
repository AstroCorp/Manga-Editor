/**
 * Tokens de color del editor Fabric (guías, draft, paneles).
 */
export const ACCENT_COLOR = '#2563eb';
export const GUIDE_STROKE_COLOR = ACCENT_COLOR;
export const DRAFT_STROKE_COLOR = '#222222';
export const PANEL_STROKE_COLOR = '#111111';

/**
 * Sin relleno visible. Alpha mínimo para que perPixelTargetFind
 * siga registrando clics en el interior del polígono.
 */
const PANEL_FILL_NONE = 'rgba(255,255,255,0.01)';
const PANEL_FILL_WHITE = '#ffffff';

export const panelFillColor = (whiteFill: boolean): string => {
	return whiteFill ? PANEL_FILL_WHITE : PANEL_FILL_NONE;
};
