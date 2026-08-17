import { controlsUtils, util } from 'fabric';
import type { TransformActionHandler } from 'fabric';

const ROTATE_SNAP_DEGREES = 22.5;

/** Redondea a múltiplos de 22.5° en [0, 360). */
export const snapRotationAngle = (angle: number): number => {
	if (!Number.isFinite(angle)) {
		return 0;
	}

	const snapped = Math.round(angle / ROTATE_SNAP_DEGREES) * ROTATE_SNAP_DEGREES;

	return ((snapped % 360) + 360) % 360;
};

const rotateObjectWithShiftSnap: TransformActionHandler = (
	eventData,
	{ target, ex, ey, theta, originX, originY },
	x,
	y,
) => {
	if (target.lockRotation) {
		return false;
	}

	const pivotPoint = target.getPositionByOrigin(originX, originY);
	const lastAngle = Math.atan2(ey - pivotPoint.y, ex - pivotPoint.x);
	const curAngle = Math.atan2(y - pivotPoint.y, x - pivotPoint.x);
	let angle = util.radiansToDegrees(curAngle - lastAngle + theta);

	if (eventData.shiftKey) {
		angle = snapRotationAngle(angle);
	} else if (angle < 0) {
		angle = 360 + angle;
	}

	angle %= 360;

	const hasRotated = target.angle !== angle;

	target.angle = angle;

	return hasRotated;
};

export const rotationWithShiftSnap = controlsUtils.wrapWithFireEvent(
	'rotating',
	controlsUtils.wrapWithFixedAnchor(rotateObjectWithShiftSnap),
);
