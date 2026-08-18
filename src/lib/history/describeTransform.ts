import { HISTORY_LABEL } from '@/lib/history/historyEnums';

type TransformKind = 'rotate' | 'scale' | 'move';

type TransformPose = {
	left: number;
	top: number;
	angle?: number;
	scaleX?: number;
	scaleY?: number;
	width?: number;
};

const ANGLE_EPS = 0.5;
const SCALE_EPS = 0.001;
const SIZE_EPS = 0.5;

const normalizeAngle = (angle: number): number => {
	const wrapped = angle % 360;

	return wrapped < 0 ? wrapped + 360 : wrapped;
};

const shortestAngleDelta = (from: number, to: number): number => {
	const delta = normalizeAngle(to) - normalizeAngle(from);

	if (delta > 180) {
		return delta - 360;
	}

	if (delta < -180) {
		return delta + 360;
	}

	return delta;
};

/**
 * Prioridad: rotar > escalar > mover.
 * Fabric suele desplazar left/top al rotar; el ángulo manda.
 */
export const describeTransform = (
	before: TransformPose,
	after: TransformPose,
): TransformKind => {
	const angleDelta = shortestAngleDelta(before.angle ?? 0, after.angle ?? 0);

	if (Math.abs(angleDelta) > ANGLE_EPS) {
		return 'rotate';
	}

	const scaleChanged =
		Math.abs((after.scaleX ?? 1) - (before.scaleX ?? 1)) > SCALE_EPS ||
		Math.abs((after.scaleY ?? 1) - (before.scaleY ?? 1)) > SCALE_EPS ||
		(before.width != null &&
			after.width != null &&
			Math.abs(after.width - before.width) > SIZE_EPS);

	if (scaleChanged) {
		return 'scale';
	}

	return 'move';
};

export const transformHistoryLabel = (
	kind: TransformKind,
	target: 'text' | 'image',
): string => {
	if (kind === 'rotate') {
		return target === 'text'
			? HISTORY_LABEL.RotateText
			: HISTORY_LABEL.RotateImage;
	}

	if (kind === 'scale') {
		return target === 'text'
			? HISTORY_LABEL.ScaleText
			: HISTORY_LABEL.ScaleImage;
	}

	return target === 'text' ? HISTORY_LABEL.MoveText : HISTORY_LABEL.MoveImage;
};
