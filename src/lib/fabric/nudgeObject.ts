import type { FabricObject } from 'fabric';

export const NUDGE_STEP_PX = 1;
export const NUDGE_REPEAT_STEP_PX = 4;

export type NudgeDelta = {
	dx: number;
	dy: number;
};

/** Delta en px de página para flechas; null si la tecla no aplica. */
export const nudgeDeltaForArrowKey = (
	key: string,
	repeat = false,
): NudgeDelta | null => {
	const step = repeat ? NUDGE_REPEAT_STEP_PX : NUDGE_STEP_PX;

	switch (key) {
		case 'ArrowLeft':
			return { dx: -step, dy: 0 };
		case 'ArrowRight':
			return { dx: step, dy: 0 };
		case 'ArrowUp':
			return { dx: 0, dy: -step };
		case 'ArrowDown':
			return { dx: 0, dy: step };
		default:
			return null;
	}
};

/** Mueve left/top del objeto y refresca coords (sin persistir). */
export const nudgeFabricObject = (
	object: FabricObject,
	delta: NudgeDelta,
) => {
	object.set({
		left: (object.left ?? 0) + delta.dx,
		top: (object.top ?? 0) + delta.dy,
	});
	object.setCoords();
};
