import { onBeforeUnmount } from 'vue';

const DEFAULT_DELAY_MS = 400;
const DEFAULT_INTERVAL_MS = 55;
const FAST_INTERVAL_MS = 30;
const FAST_AFTER_MS = 900;

type HoldRepeatOptions = {
	delayMs?: number;
	intervalMs?: number;
	fastIntervalMs?: number;
	fastAfterMs?: number;
};

/**
 * Dispara `action` al pointerdown y, si se mantiene pulsado,
 * repite con intervalo (más rápido tras un rato).
 */
export const useHoldRepeat = (
	action: () => void,
	options: HoldRepeatOptions = {},
) => {
	const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
	const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
	const fastIntervalMs = options.fastIntervalMs ?? FAST_INTERVAL_MS;
	const fastAfterMs = options.fastAfterMs ?? FAST_AFTER_MS;

	let delayId: ReturnType<typeof setTimeout> | null = null;
	let intervalId: ReturnType<typeof setInterval> | null = null;
	let fastId: ReturnType<typeof setTimeout> | null = null;
	let activePointerId: number | null = null;

	const clearTimers = () => {
		if (delayId !== null) {
			clearTimeout(delayId);
			delayId = null;
		}

		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}

		if (fastId !== null) {
			clearTimeout(fastId);
			fastId = null;
		}
	};

	const stop = () => {
		clearTimers();
		activePointerId = null;
		window.removeEventListener('pointerup', onPointerUp);
		window.removeEventListener('pointercancel', onPointerUp);
	};

	const onPointerUp = (event: PointerEvent) => {
		if (activePointerId !== null && event.pointerId !== activePointerId) {
			return;
		}

		stop();
	};

	const startRepeat = (periodMs: number) => {
		if (intervalId !== null) {
			clearInterval(intervalId);
		}

		intervalId = setInterval(() => {
			action();
		}, periodMs);
	};

	const onPointerDown = (event: PointerEvent) => {
		// 0 = primario; en tests sintéticos a veces viene undefined.
		if (event.button !== undefined && event.button !== 0) {
			return;
		}

		event.preventDefault();
		stop();
		activePointerId =
			typeof event.pointerId === 'number' ? event.pointerId : null;
		action();

		window.addEventListener('pointerup', onPointerUp);
		window.addEventListener('pointercancel', onPointerUp);

		delayId = setTimeout(() => {
			startRepeat(intervalMs);
			fastId = setTimeout(() => {
				startRepeat(fastIntervalMs);
			}, fastAfterMs);
		}, delayMs);
	};

	onBeforeUnmount(stop);

	return {
		onPointerDown,
		stop,
	};
};
