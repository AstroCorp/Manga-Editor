import {
	nextTick,
	onBeforeUnmount,
	onMounted,
	ref,
	watch,
	type Ref,
} from 'vue';
import {
	computeOverlayScrollClamp,
	findScrollParent,
} from '@/lib/dom/clampOverlayToScrollPort';
import type { OverlayAnchorSource } from '@/types/ui';

export const useOverlayScrollClamp = (
	overlayEl: Ref<HTMLElement | null>,
	getAnchor: () => OverlayAnchorSource,
) => {
	const shiftX = ref(0);
	const shiftY = ref(0);

	let scrollParent: HTMLElement | null = null;
	let resizeObserver: ResizeObserver | null = null;

	const clearShift = () => {
		shiftX.value = 0;
		shiftY.value = 0;
	};

	const updateClamp = () => {
		const el = overlayEl.value;
		const { left, top, placement } = getAnchor();

		if (!el || left === null || top === null) {
			clearShift();

			return;
		}

		const stage = el.offsetParent as HTMLElement | null;
		const port = findScrollParent(el);

		if (!stage || !port) {
			clearShift();

			return;
		}

		const next = computeOverlayScrollClamp({
			anchorLeft: left,
			anchorTop: top,
			overlayWidth: el.offsetWidth,
			overlayHeight: el.offsetHeight,
			placement,
			stageRect: stage.getBoundingClientRect(),
			portRect: port.getBoundingClientRect(),
		});

		shiftX.value = next.x;
		shiftY.value = next.y;
	};

	const scheduleClamp = () => {
		void nextTick(() => {
			updateClamp();
		});
	};

	const bindScrollParent = () => {
		const next = findScrollParent(overlayEl.value);

		if (scrollParent === next) {
			return;
		}

		scrollParent?.removeEventListener('scroll', updateClamp);
		scrollParent = next;
		scrollParent?.addEventListener('scroll', updateClamp, { passive: true });
	};

	onMounted(() => {
		bindScrollParent();
		window.addEventListener('resize', updateClamp);

		if (typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver(() => {
				bindScrollParent();
				updateClamp();
			});

			if (overlayEl.value) {
				resizeObserver.observe(overlayEl.value);
			}
		}

		scheduleClamp();
	});

	onBeforeUnmount(() => {
		scrollParent?.removeEventListener('scroll', updateClamp);
		scrollParent = null;
		window.removeEventListener('resize', updateClamp);
		resizeObserver?.disconnect();
		resizeObserver = null;
	});

	watch(
		() => {
			const anchor = getAnchor();

			return [anchor.left, anchor.top, anchor.placement, overlayEl.value] as const;
		},
		(values, previous) => {
			const el = values[3];
			const prevEl = previous?.[3];

			if (el && el !== prevEl && resizeObserver) {
				if (prevEl) {
					resizeObserver.unobserve(prevEl);
				}

				resizeObserver.observe(el);
			}

			bindScrollParent();
			scheduleClamp();
		},
	);

	return {
		shiftX,
		shiftY,
		updateClamp,
	};
};
