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
