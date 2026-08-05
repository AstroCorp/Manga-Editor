import type { PagePoint } from '@/types/page';

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
