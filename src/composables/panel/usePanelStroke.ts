import { storeToRefs } from 'pinia';
import { onBeforeUnmount, shallowRef, watch } from 'vue';
import {
	Polyline,
	type Canvas,
	type TPointerEvent,
	type TPointerEventInfo,
} from 'fabric';
import {
	canExtendStrokePath,
	isClosed,
	snapToGridPoint,
	toCanvasPoint,
} from '@/lib/panel/panelGeometry';
import { shapeToPolygon } from '@/lib/fabric/shapeFabric';
import { isGuide, isPanel } from '@/lib/fabric/isGuide';
import {
	DRAFT_STROKE_COLOR,
	GUIDE_STROKE_COLOR,
} from '@/lib/fabric/fabricColors';
import { createId } from '@/lib/id';
import { useEditorStore } from '@/stores/editor';
import type { GridPoint } from '@/types/geometry';
import type { PanelShape } from '@/types/fabric';
import type { GuidedPolyline, StrokeDeps } from '@/types/stroke';

export const usePanelStroke = ({ fabricCanvas }: StrokeDeps) => {
	const editorStore = useEditorStore();
	const { showGridGuides, layout, strokeWidth, panels } =storeToRefs(editorStore);

	const path = shallowRef<GridPoint[]>([]);
	const draftLine = shallowRef<GuidedPolyline | null>(null);
	const rubberBand = shallowRef<GuidedPolyline | null>(null);

	let rubberFrameId: number | null = null;
	let pendingHover: GridPoint | null = null;

	/** Mientras hay trazo abierto: sin selección, cursor crosshair. */
	const syncInteractionMode = () => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		const drawing = path.value.length > 0;

		canvas.selection = !drawing;
		canvas.defaultCursor = drawing ? 'crosshair' : 'default';

		canvas.forEachObject((object) => {
			if (isGuide(object)) {
				object.selectable = false;
				object.evented = false;

				return;
			}

			if (drawing) {
				object.selectable = false;
				object.evented = false;

				return;
			}

			if (isPanel(object)) {
				object.selectable = true;
				object.evented = true;
				object.lockMovementX = true;
				object.lockMovementY = true;
				object.lockRotation = true;
				object.lockScalingX = true;
				object.lockScalingY = true;
				object.hasControls = false;

				return;
			}

			object.selectable = true;
			object.evented = true;
		});

		canvas.requestRenderAll();
	};

	const clearDraftGraphics = () => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		if (draftLine.value) {
			canvas.remove(draftLine.value);
			draftLine.value = null;
		}

		if (rubberBand.value) {
			canvas.remove(rubberBand.value);
			rubberBand.value = null;
		}
	};

	const existingPolygons = () => {
		return panels.value
			.map((panel) => panel.points)
			.filter((points) => points.length >= 3);
	};

	const canExtendPathTo = (point: GridPoint): boolean => {
		return canExtendStrokePath(
			path.value,
			point,
			layout.value,
			existingPolygons(),
		);
	};

	const updateDraftLine = () => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		if (draftLine.value) {
			canvas.remove(draftLine.value);
			draftLine.value = null;
		}

		if (path.value.length < 2) {
			canvas.requestRenderAll();
			return;
		}

		const points = path.value.map((point) => {
			return toCanvasPoint(point, layout.value);
		});

		const line = new Polyline(points, {
			fill: 'transparent',
			stroke: DRAFT_STROKE_COLOR,
			strokeWidth: strokeWidth.value,
			selectable: false,
			evented: false,
			excludeFromExport: true,
			objectCaching: false,
		}) as GuidedPolyline;

		line.isGuide = true;

		canvas.add(line);

		draftLine.value = line;

		canvas.requestRenderAll();
	};

	const applyRubberBand = (hover: GridPoint | null) => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		if (!hover || path.value.length === 0) {
			if (rubberBand.value) {
				canvas.remove(rubberBand.value);
				rubberBand.value = null;
				canvas.requestRenderAll();
			}

			return;
		}

		const last = path.value[path.value.length - 1];

		if (last === undefined || !canExtendPathTo(hover)) {
			if (rubberBand.value) {
				canvas.remove(rubberBand.value);
				rubberBand.value = null;
				canvas.requestRenderAll();
			}

			return;
		}

		const points = [
			toCanvasPoint(last, layout.value),
			toCanvasPoint(hover, layout.value),
		];

		if (rubberBand.value) {
			rubberBand.value.set({
				points,
				strokeWidth: strokeWidth.value,
			});

			rubberBand.value.setCoords();

			rubberBand.value.dirty = true;

			canvas.requestRenderAll();

			return;
		}

		const line = new Polyline(points, {
			fill: 'transparent',
			stroke: GUIDE_STROKE_COLOR,
			strokeWidth: strokeWidth.value,
			strokeDashArray: [6, 4],
			selectable: false,
			evented: false,
			excludeFromExport: true,
			objectCaching: false,
		}) as GuidedPolyline;

		line.isGuide = true;

		canvas.add(line);

		rubberBand.value = line;

		canvas.requestRenderAll();
	};

	const updateRubberBand = (hover: GridPoint | null) => {
		pendingHover = hover;

		if (rubberFrameId !== null) {
			return;
		}

		rubberFrameId = requestAnimationFrame(() => {
			rubberFrameId = null;
			applyRubberBand(pendingHover);
		});
	};

	const commitPanel = () => {
		const canvas = fabricCanvas.value;

		if (!canvas || !isClosed(path.value)) {
			return;
		}

		// El cierre repite el primer punto; el polígono no lo necesita.
		const openPath = path.value.slice(0, -1);
		const points = openPath.map((point) => {
			return toCanvasPoint(point, layout.value);
		});

		clearDraftGraphics();

		path.value = [];

		const shape: PanelShape = {
			id: createId(),
			points,
			strokeWidth: strokeWidth.value,
		};

		editorStore.addPanel(shape);

		const panel = shapeToPolygon(shape);

		canvas.add(panel);
		canvas.bringObjectToFront(panel);

		syncInteractionMode();
	};

	const addPoint = (point: GridPoint) => {
		if (!canExtendPathTo(point)) {
			return;
		}

		if (path.value.length === 0) {
			path.value = [point];

			fabricCanvas.value?.discardActiveObject();

			syncInteractionMode();
			updateDraftLine();
			updateRubberBand(null);

			return;
		}

		const nextPath = [...path.value, point];

		path.value = nextPath;

		updateDraftLine();
		updateRubberBand(null);

		if (isClosed(nextPath)) {
			commitPanel();
		}
	};

	const pointFromEvent = (event: TPointerEventInfo<TPointerEvent>): GridPoint => {
		return snapToGridPoint(
			event.scenePoint.x,
			event.scenePoint.y,
			layout.value,
		);
	};

	const onCanvasMouseDown = (event: TPointerEventInfo<TPointerEvent>) => {
		// Trazo en curso: cualquier click intenta añadir punto.
		if (path.value.length > 0) {
			addPoint(pointFromEvent(event));
			return;
		}

		// Click sobre un panel existente → dejar selección (no empezar trazo).
		if (event.target && isPanel(event.target)) {
			return;
		}

		// Hace falta ver la guía para empezar a dibujar.
		if (!showGridGuides.value) {
			return;
		}

		addPoint(pointFromEvent(event));
	};

	const onCanvasMouseMove = (event: TPointerEventInfo<TPointerEvent>) => {
		if (path.value.length === 0) {
			return;
		}

		updateRubberBand(pointFromEvent(event));
	};

	const bindCanvasEvents = (canvas: Canvas) => {
		canvas.on('mouse:down', onCanvasMouseDown);
		canvas.on('mouse:move', onCanvasMouseMove);
	};

	const unbindCanvasEvents = (canvas: Canvas) => {
		canvas.off('mouse:down', onCanvasMouseDown);
		canvas.off('mouse:move', onCanvasMouseMove);
	};

	watch(
		fabricCanvas,
		(canvas, _previous, onCleanup) => {
			if (!canvas) {
				return;
			}
			bindCanvasEvents(canvas);
			onCleanup(() => {
				unbindCanvasEvents(canvas);
			});
		},
		{ immediate: true },
	);

	onBeforeUnmount(() => {
		if (rubberFrameId !== null) {
			cancelAnimationFrame(rubberFrameId);
			rubberFrameId = null;
		}
		
		const canvas = fabricCanvas.value;

		if (canvas) {
			unbindCanvasEvents(canvas);
		}

		clearDraftGraphics();
	});

	return {
		path,
		syncInteractionMode,
	};
};
