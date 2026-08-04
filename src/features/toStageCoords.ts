import type { PageOverlayPosition } from '@/types/panel';

/** Page coords → stage (page × zoom), sin escalar el UI. */
export const toStageCoords = (
	position: PageOverlayPosition | null,
	zoomFactor: number,
): { left: number | null; top: number | null } => {
	if (!position) {
		return { left: null, top: null };
	}

	return {
		left: position.left * zoomFactor,
		top: position.top * zoomFactor,
	};
};
