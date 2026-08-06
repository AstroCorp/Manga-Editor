import type { PagePoint } from '@/types/page';

export type PageRect = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export const getVisiblePageCenter = (
	rootEl: HTMLElement,
	pageWidth: number,
	pageHeight: number,
	zoomFactor: number,
): PagePoint => {
	const stage = rootEl.firstElementChild as HTMLElement | null;

	if (!stage || zoomFactor <= 0) {
		return {
			x: pageWidth / 2,
			y: pageHeight / 2,
		};
	}

	const rootRect = rootEl.getBoundingClientRect();
	const stageRect = stage.getBoundingClientRect();
	const pageX = (rootRect.left + rootEl.clientWidth / 2 - stageRect.left) / zoomFactor;
	const pageY = (rootRect.top + rootEl.clientHeight / 2 - stageRect.top) / zoomFactor;

	return {
		x: Math.min(Math.max(0, pageX), pageWidth),
		y: Math.min(Math.max(0, pageY), pageHeight),
	};
};

/**
 * Desplaza el stage para centrar un rectángulo en coords de página
 * (p. ej. el AABB de un texto tras align-to-page).
 */
export const scrollPageRectIntoView = (
	rootEl: HTMLElement,
	rect: PageRect,
	zoomFactor: number,
) => {
	const stage = rootEl.firstElementChild as HTMLElement | null;

	if (!stage || zoomFactor <= 0) {
		return;
	}

	const pageCenterX = rect.left + rect.width / 2;
	const pageCenterY = rect.top + rect.height / 2;
	const rootRect = rootEl.getBoundingClientRect();
	const stageRect = stage.getBoundingClientRect();
	/** Origen del stage en coords del contenido scrolleable. */
	const stageContentLeft =
		rootEl.scrollLeft + (stageRect.left - rootRect.left);
	const stageContentTop = rootEl.scrollTop + (stageRect.top - rootRect.top);
	const targetLeft =
		stageContentLeft + pageCenterX * zoomFactor - rootEl.clientWidth / 2;
	const targetTop =
		stageContentTop + pageCenterY * zoomFactor - rootEl.clientHeight / 2;
	const maxScrollLeft = Math.max(0, rootEl.scrollWidth - rootEl.clientWidth);
	const maxScrollTop = Math.max(0, rootEl.scrollHeight - rootEl.clientHeight);

	rootEl.scrollTo({
		left: Math.min(maxScrollLeft, Math.max(0, targetLeft)),
		top: Math.min(maxScrollTop, Math.max(0, targetTop)),
		behavior: 'auto',
	});
};
