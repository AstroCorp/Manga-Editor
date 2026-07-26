import { shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { Point, type Canvas, type TPointerEvent, type TPointerEventInfo } from 'fabric';
import { isPanel } from '@/lib/fabric/isGuide';
import { panelContainsScenePoint } from '@/lib/fabric/panelHitTest';
import { snapToGridPoint } from '@/lib/panel/panelGeometry';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';
import type { GridPoint } from '@/types/geometry';
import type { GridPointHoverDeps, PageOverlayPosition } from '@/types/panel';

const LABEL_OFFSET_X = 12;
const LABEL_OFFSET_Y = 12;

export const formatGridPointLabel = (point: GridPoint): string => {
	return `(${point.col}x, ${point.row}y)`;
};

const isInsideAnyPanel = (canvas: Canvas, x: number, y: number): boolean => {
	const point = new Point(x, y);

	return canvas.getObjects().some((object) => {
		return isPanel(object) && panelContainsScenePoint(object, point);
	});
};

export const useGridPointHover = ({ fabricCanvas }: GridPointHoverDeps) => {
	const editorStore = useEditorStore();
	const mangaStore = useMangaStore();
	const { showGridGuides } = storeToRefs(editorStore);
	const { layout } = storeToRefs(mangaStore);

	const hoverPoint = shallowRef<GridPoint | null>(null);
	const labelPosition = shallowRef<PageOverlayPosition | null>(null);

	const clearHover = () => {
		hoverPoint.value = null;
		labelPosition.value = null;
	};

	const onCanvasMouseMove = (event: TPointerEventInfo<TPointerEvent>) => {
		const canvas = fabricCanvas.value;

		if (!showGridGuides.value || !canvas) {
			clearHover();

			return;
		}

		const { x, y } = event.scenePoint;

		// Dentro de un panel/imagen no hace falta el label de rejilla.
		if (isInsideAnyPanel(canvas, x, y)) {
			clearHover();

			return;
		}

		const point = snapToGridPoint(x, y, layout.value);

		hoverPoint.value = point;
		labelPosition.value = {
			left: x + LABEL_OFFSET_X,
			top: y + LABEL_OFFSET_Y,
		};
	};

	const onCanvasMouseOut = () => {
		clearHover();
	};

	const bindCanvasEvents = (canvas: Canvas) => {
		canvas.on('mouse:move', onCanvasMouseMove);
		canvas.on('mouse:out', onCanvasMouseOut);
	};

	const unbindCanvasEvents = (canvas: Canvas) => {
		canvas.off('mouse:move', onCanvasMouseMove);
		canvas.off('mouse:out', onCanvasMouseOut);
	};

	watch(showGridGuides, (visible) => {
		if (!visible) {
			clearHover();
		}
	});

	watch(
		fabricCanvas,
		(canvas, _previous, onCleanup) => {
			if (!canvas) {
				clearHover();

				return;
			}

			bindCanvasEvents(canvas);

			onCleanup(() => {
				unbindCanvasEvents(canvas);
				clearHover();
			});
		},
		{ immediate: true },
	);

	return {
		hoverPoint,
		labelPosition,
		formatGridPointLabel,
	};
};
