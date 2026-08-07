import type { OverlayPlacement } from '@/types/panel';

export type CustomSelectOption<T extends string = string> = {
	value: T;
	label: string;
	icon?: string;
};

export type ScrollPagedSliceOptions = {
	initial?: number;
	pageSize?: number;
	distance?: number;
	/**
	 * Si true (default), carga más cuando el contenido no desborda el contenedor
	 * (VueUse). Con masonry async hay que usar `false` + sentinel en el scroll.
	 */
	loadWhenNarrow?: boolean;
	/**
	 * No paginar hasta `notifyLayoutReady()` (p. ej. tras masonry `@redraw`).
	 * Evita cascadas mientras el muro está vacío a media reconstrucción.
	 */
	waitForLayoutReady?: boolean;
};

export type OverlayScrollClampInput = {
	anchorLeft: number;
	anchorTop: number;
	overlayWidth: number;
	overlayHeight: number;
	placement: OverlayPlacement;
	stageRect: Pick<DOMRect, 'left' | 'top'>;
	portRect: Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom'>;
	padding?: number;
};

export type OverlayAnchorSource = {
	left: number | null;
	top: number | null;
	placement: OverlayPlacement;
};

export type NumberInputVariant = 'toolbar' | 'field';

export type NumberInputProps = {
	modelValue: number | null;
	min?: number;
	max?: number;
	step?: number;
	decimals?: number;
	/** Valor base para nudge/focus cuando `modelValue` es null (p. ej. estilos mixed). */
	fallbackValue?: number;
	mixedLabel?: string;
	variant?: NumberInputVariant;
	/** Clases de ancho del input (p. ej. `w-8`). */
	inputWidthClass?: string;
	/** Emite mientras se escribe si el valor parsea y está en rango. */
	commitOnInput?: boolean;
	inputmode?: 'numeric' | 'decimal';
	ariaLabel: string;
	increaseLabel?: string;
	decreaseLabel?: string;
	title?: string;
	suffix?: string;
};
