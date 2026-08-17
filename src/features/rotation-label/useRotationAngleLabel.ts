import { shallowRef, watch } from 'vue';
import type {
	Canvas,
	FabricObject,
	TPointerEvent,
	TPointerEventInfo,
} from 'fabric';
import type {
	PageOverlayPosition,
	RotationAngleLabelDeps,
} from '@/types/panel';

const LABEL_OFFSET_X = 12;
const LABEL_OFFSET_Y = 12;

type PointerLike = {
	x: number;
	y: number;
};

type RotatingEvent = {
	target?: FabricObject | null;
	pointer?: PointerLike | null;
};

/** Ángulo en [0, 360) con un decimal como máximo. */
export const formatRotationAngle = (angle: number): string => {
	if (!Number.isFinite(angle)) {
		return '0°';
	}

	const normalized = ((angle % 360) + 360) % 360;
	const rounded = Math.round(normalized * 10) / 10;
	const wrapped = rounded === 360 ? 0 : rounded;
	const label = Number.isInteger(wrapped) ? String(wrapped) : wrapped.toFixed(1);

	return `${label}°`;
};

const pointerPosition = (
	pointer: PointerLike | null | undefined,
): PageOverlayPosition | null => {
	if (!pointer) {
		return null;
	}

	return {
		left: pointer.x + LABEL_OFFSET_X,
		top: pointer.y + LABEL_OFFSET_Y,
	};
};

export const useRotationAngleLabel = ({
	fabricCanvas,
}: RotationAngleLabelDeps) => {
	const angle = shallowRef<number | null>(null);
	const position = shallowRef<PageOverlayPosition | null>(null);

	const clearLabel = () => {
		angle.value = null;
		position.value = null;
	};

	const showLabel = (
		target: FabricObject | null | undefined,
		pointer: PointerLike | null | undefined,
	) => {
		if (!target) {
			return;
		}

		const nextPosition = pointerPosition(pointer);

		if (!nextPosition) {
			return;
		}

		angle.value = target.angle ?? 0;
		position.value = nextPosition;
	};

	const onMouseDown = (
		event: TPointerEventInfo<TPointerEvent> & {
			transform?: { action?: string } | null;
		},
	) => {
		if (event.transform?.action !== 'rotate') {
			return;
		}

		showLabel(event.target, event.scenePoint);
	};

	const onRotating = (event: RotatingEvent) => {
		showLabel(event.target, event.pointer);
	};

	const bindCanvasEvents = (canvas: Canvas) => {
		canvas.on('mouse:down', onMouseDown);
		canvas.on('object:rotating', onRotating);
		canvas.on('mouse:up', clearLabel);
		canvas.on('selection:cleared', clearLabel);
	};

	const unbindCanvasEvents = (canvas: Canvas) => {
		canvas.off('mouse:down', onMouseDown);
		canvas.off('object:rotating', onRotating);
		canvas.off('mouse:up', clearLabel);
		canvas.off('selection:cleared', clearLabel);
	};

	watch(
		fabricCanvas,
		(canvas, _previous, onCleanup) => {
			if (!canvas) {
				clearLabel();

				return;
			}

			bindCanvasEvents(canvas);

			onCleanup(() => {
				unbindCanvasEvents(canvas);
				clearLabel();
			});
		},
		{ immediate: true },
	);

	return {
		angle,
		position,
	};
};
