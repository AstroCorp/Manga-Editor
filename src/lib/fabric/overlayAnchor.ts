import type { FabricObject } from 'fabric';
import type { PageOverlayAnchor } from '@/types/panel';
import { ROTATE_ICON_SIZE, ROTATE_OFFSET_Y } from '@/lib/fabric/fabricSetup';

const MENU_GAP = 8;
/** Holgura extra cuando el asa de rotación queda por encima del bbox. */
const ROTATE_TOP_CLEARANCE = ROTATE_OFFSET_Y + ROTATE_ICON_SIZE / 2;

/**
 * Ancla la toolbar encima del bbox. Si el asa de rotación (borde inferior
 * local) queda arriba, sube un poco más para no solaparse.
 */
export const getObjectOverlayAnchor = (
	object: FabricObject,
	gap = MENU_GAP,
): PageOverlayAnchor => {
	object.setCoords?.();

	const bounds = object.getBoundingRect();
	const centerY = bounds.top + bounds.height / 2;
	const aCoords = object.aCoords;
	const bottomMidY = aCoords
		? (aCoords.bl.y + aCoords.br.y) / 2
		: bounds.top + bounds.height;
	const rotateOnTop = bottomMidY <= centerY;
	const extra = rotateOnTop ? ROTATE_TOP_CLEARANCE : 0;

	return {
		left: bounds.left + bounds.width / 2,
		top: Math.max(0, bounds.top - gap - extra),
		placement: 'above',
	};
};
