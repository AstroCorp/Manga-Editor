import { shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { Point, type Canvas, type TPointerEvent, type TPointerEventInfo } from 'fabric';
import { isPanel } from '@/lib/fabric/isGuide';
import { panelContainsScenePoint } from '@/lib/fabric/panelHitTest';
import { sameGridPoint, snapToGridPoint } from '@/lib/panel/panelGeometry';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';
import type { GridPoint } from '@/types/geometry';
import type {
	GridLineDelta,
	GridPointHoverDeps,
	PageOverlayPosition,
} from '@/types/panel';

const LABEL_OFFSET_X = 12;
const LABEL_OFFSET_Y = 12;

/**
 * Longitud en puntos de rejilla (incluye origen y destino).
 * De col 0→3 = 4x; misma fila = 1y.
 */
export const gridLineDelta = (from: GridPoint, to: GridPoint): GridLineDelta => {
	return {
		x: Math.abs(from.col - to.col) + 1,
		y: Math.abs(from.row - to.row) + 1,
	};
};

export const formatGridLineDelta = (delta: GridLineDelta): string => {
	return `${delta.x}x, ${delta.y}y`;
};

const isInsideAnyPanel = (canvas: Canvas, x: number, y: number): boolean => {
	const point = new Point(x, y);

	return canvas.getObjects().some((object) => {
		return isPanel(object) && panelContainsScenePoint(object, point);
	});
};

export const useGridPointHover = ({
	fabricCanvas,
	strokePath,
}: GridPointHoverDeps) => {
	const editorStore = useEditorStore();
	const mangaStore = useMangaStore();
	const { showGridGuides } = storeToRefs(editorStore);
	const { layout } = storeToRefs(mangaStore);

	const lineDelta = shallowRef<GridLineDelta | null>(null);
	const labelPosition = shallowRef<PageOverlayPosition | null>(null);

	const clearHover = () => {
		lineDelta.value = null;
		labelPosition.value = null;
	};

	const onCanvasMouseMove = (event: TPointerEventInfo<TPointerEvent>) => {
		const canvas = fabricCanvas.value;
		const path = strokePath.value;
		const last = path[path.length - 1];

		if (!showGridGuides.value || !canvas || !last) {
			clearHover();

			return;
		}

		const { x, y } = event.scenePoint;

		if (isInsideAnyPanel(canvas, x, y)) {
			clearHover();

			return;
		}

		const hover = snapToGridPoint(x, y, layout.value);

		if (sameGridPoint(last, hover)) {
			clearHover();

			return;
		}

		lineDelta.value = gridLineDelta(last, hover);
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

	watch(strokePath, (path) => {
		if (path.length === 0) {
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
		lineDelta,
		labelPosition,
	};
};
