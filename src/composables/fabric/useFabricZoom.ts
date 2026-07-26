import { computed, nextTick, watch } from 'vue';
import { useEventListener } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import {
	ZOOM_WHEEL_FACTOR,
	clampZoomPercent,
	zoomFactorFromPercent,
} from '@/lib/zoom';
import { useEditorStore } from '@/stores/editor';
import type { FabricZoomDeps, ScrollAnchor } from '@/types/zoom';

/**
 * Zoom de documento vía CSS scale + stage fantasma (page × zoom).
 * El backstore Fabric sigue en coords de página; calcOffset mantiene el hit-test.
 */
export const useFabricZoom = ({
	fabricCanvas,
	rootEl,
	pageSize,
}: FabricZoomDeps) => {
	const editorStore = useEditorStore();
	const { zoomPercent } = storeToRefs(editorStore);

	let pendingAnchor: ScrollAnchor | null = null;

	const zoomFactor = computed(() => {
		return zoomFactorFromPercent(zoomPercent.value);
	});

	const stageStyle = computed(() => {
		return {
			width: `${pageSize.value.width * zoomFactor.value}px`,
			height: `${pageSize.value.height * zoomFactor.value}px`,
		};
	});

	const scaleStyle = computed(() => {
		return {
			width: `${pageSize.value.width}px`,
			height: `${pageSize.value.height}px`,
			transform: `scale(${zoomFactor.value})`,
		};
	});

	const syncCanvasOffset = () => {
		void nextTick(() => {
			fabricCanvas.value?.calcOffset();
		});
	};

	const adjustScrollAfterZoom = (oldPercent: number, nextPercent: number) => {
		const root = rootEl.value;

		if (!root || oldPercent <= 0 || oldPercent === nextPercent) {
			syncCanvasOffset();

			return;
		}

		const ratio = nextPercent / oldPercent;
		const anchor = pendingAnchor;

		pendingAnchor = null;

		if (anchor) {
			root.scrollLeft = anchor.contentX * ratio - anchor.viewX;
			root.scrollTop = anchor.contentY * ratio - anchor.viewY;
		} else {
			const centerX = root.scrollLeft + root.clientWidth / 2;
			const centerY = root.scrollTop + root.clientHeight / 2;

			root.scrollLeft = centerX * ratio - root.clientWidth / 2;
			root.scrollTop = centerY * ratio - root.clientHeight / 2;
		}

		syncCanvasOffset();
	};

	const resetZoomView = () => {
		pendingAnchor = null;

		void nextTick(() => {
			const root = rootEl.value;

			if (root) {
				root.scrollLeft = 0;
				root.scrollTop = 0;
			}

			fabricCanvas.value?.calcOffset();
		});
	};

	const onWheel = (event: WheelEvent) => {
		if (!event.ctrlKey && !event.metaKey) {
			return;
		}

		event.preventDefault();

		const root = rootEl.value;

		if (!root) {
			return;
		}

		const oldPercent = zoomPercent.value;
		const nextPercent = clampZoomPercent(
			oldPercent *
				(event.deltaY < 0 ? ZOOM_WHEEL_FACTOR : 1 / ZOOM_WHEEL_FACTOR),
		);

		if (nextPercent === oldPercent) {
			return;
		}

		const rect = root.getBoundingClientRect();

		pendingAnchor = {
			contentX: event.clientX - rect.left + root.scrollLeft,
			contentY: event.clientY - rect.top + root.scrollTop,
			viewX: event.clientX - rect.left,
			viewY: event.clientY - rect.top,
		};

		editorStore.setZoomPercent(nextPercent);
	};

	watch(zoomPercent, (percent, oldPercent) => {
		if (typeof oldPercent === 'number') {
			adjustScrollAfterZoom(oldPercent, percent);
		} else {
			syncCanvasOffset();
		}
	});

	watch(
		() => {
			return fabricCanvas.value;
		},
		(canvas) => {
			if (canvas) {
				syncCanvasOffset();
			}
		},
	);

	// rootEl reactivo: se reengancha solo; cleanup al desmontar.
	useEventListener(rootEl, 'wheel', onWheel, { passive: false });

	return {
		stageStyle,
		scaleStyle,
		zoomFactor,
		resetZoomView,
	};
};
