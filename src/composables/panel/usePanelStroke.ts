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
import {
	collectPanelIdsWithImage,
	getPanelId,
	isGuide,
	isPanel,
	isPanelImage,
} from '@/lib/fabric/isGuide';
import {
	DRAFT_STROKE_COLOR,
	GUIDE_STROKE_COLOR,
} from '@/lib/fabric/fabricColors';
import { Shape } from '@/models/Shape';
import { useMangaStore } from '@/stores/manga';
import { useEditorStore } from '@/stores/editor';
import type { GridPoint } from '@/types/geometry';
import type { GuidedPolyline } from '@/types/fabric';
import type { StrokeDeps } from '@/types/panel';

export const usePanelStroke = ({ fabricCanvas }: StrokeDeps) => {
	const editorStore = useEditorStore();
	const mangaStore = useMangaStore();
	const { showGridGuides } = storeToRefs(editorStore);
	const { layout, strokeWidth, shapes } = storeToRefs(mangaStore);

	// path = puntos de rejilla ya clicados (fuente de verdad del trazo).
	const path = shallowRef<GridPoint[]>([]);
	// draft = línea sólida entre esos puntos; rubber (línea azul discontinua) = preview al ratón.
	const draftLine = shallowRef<GuidedPolyline | null>(null);
	const rubberBand = shallowRef<GuidedPolyline | null>(null);

	// El rubber band (línea azul discontinua) se actualiza como máximo 1 vez por frame (rAF).
	let rubberFrameId: number | null = null;
	let pendingHover: GridPoint | null = null;

	/**
	 * Modo interacción según haya trazo abierto o no:
	 * - dibujando → sin selección, cursor crosshair, paneles no clicables
	 * - idle → se puede seleccionar paneles (bloqueados en posición)
	 */
	const syncInteractionMode = () => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		const drawing = path.value.length > 0;
		const filledPanelIds = drawing
			? new Set<string>()
			: collectPanelIdsWithImage(canvas);

		// Mientras dibujas: no hay marquee de selección.
		canvas.selection = !drawing;
		canvas.defaultCursor = drawing ? 'crosshair' : 'default';

		canvas.forEachObject((object) => {
			// Guías (rejilla, draft, rubber (línea azul discontinua)): nunca seleccionables.
			if (isGuide(object)) {
				object.selectable = false;
				object.evented = false;

				return;
			}

			// En dibujo, el resto del canvas no debe “comerse” los clicks.
			if (drawing) {
				object.selectable = false;
				object.evented = false;

				return;
			}

			// En idle: paneles clicables pero fijos (sin mover/escalar).
			// Si el panel ya tiene imagen, la imagen es lo seleccionable.
			if (isPanel(object)) {
				const panelId = getPanelId(object);
				const filled = Boolean(panelId && filledPanelIds.has(panelId));

				object.selectable = !filled;
				object.evented = !filled;
				object.lockMovementX = true;
				object.lockMovementY = true;
				object.lockRotation = true;
				object.lockScalingX = true;
				object.lockScalingY = true;
				object.hasControls = false;

				return;
			}

			if (isPanelImage(object)) {
				object.selectable = true;
				object.evented = true;
				object.lockMovementX = false;
				object.lockMovementY = false;
				object.lockRotation = false;
				object.lockScalingX = false;
				object.lockScalingY = false;
				object.hasControls = true;
				object.perPixelTargetFind = true;

				return;
			}

			object.selectable = true;
			object.evented = true;
		});

		canvas.requestRenderAll();
	};

	/** Quita del canvas el draft y el rubber band (línea azul discontinua). */
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

	/** Aborta el trazo en curso y vuelve al modo selección. */
	const cancelStroke = () => {
		// Cancela un rAF pendiente del rubber band (línea azul discontinua).
		if (rubberFrameId !== null) {
			cancelAnimationFrame(rubberFrameId);
			rubberFrameId = null;
		}

		pendingHover = null;
		path.value = [];

		clearDraftGraphics();
		syncInteractionMode();
	};

	/** Polígonos ya cerrados (para no cruzarlos / no dibujar dentro). */
	const existingPolygons = () => {
		return shapes.value
			.map((shape) => shape.points)
			.filter((points) => points.length >= 3);
	};

	/** ¿Se puede añadir este punto al path según panelGeometry? */
	const canExtendPathTo = (point: GridPoint): boolean => {
		return canExtendStrokePath(
			path.value,
			point,
			layout.value,
			existingPolygons(),
		);
	};

	/** Redibuja la línea sólida del path (≥2 puntos). */
	const updateDraftLine = () => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		// Siempre recreamos: más simple que mutar puntos a mano.
		if (draftLine.value) {
			canvas.remove(draftLine.value);
			draftLine.value = null;
		}

		// Con 0–1 puntos no hay segmento que pintar.
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

		// isGuide: refreshGuides no la borra (solo quita isGridGuide).
		line.isGuide = true;

		canvas.add(line);

		draftLine.value = line;

		canvas.requestRenderAll();
	};

	/**
	 * Pinta o actualiza el rubber band (línea azul discontinua) último-punto → hover.
	 * Si el hover no es válido, se oculta.
	 */
	const applyRubberBand = (hover: GridPoint | null) => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		// Sin hover o sin path: no hay preview.
		if (!hover || path.value.length === 0) {
			if (rubberBand.value) {
				canvas.remove(rubberBand.value);
				rubberBand.value = null;
				canvas.requestRenderAll();
			}

			return;
		}

		const last = path.value[path.value.length - 1];

		// Hover inválido (cruce, dentro de panel, etc.) → sin rubber (línea azul discontinua).
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

		// Ya existe: solo actualizamos extremos (más barato que recrear).
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

		// Primera vez: creamos la Polyline discontinua.
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

	/** Encola el hover y aplica el rubber (línea azul discontinua) en el próximo animation frame. */
	const updateRubberBand = (hover: GridPoint | null) => {
		pendingHover = hover;

		// Ya hay un frame pendiente: solo actualizamos pendingHover.
		if (rubberFrameId !== null) {
			return;
		}

		rubberFrameId = requestAnimationFrame(() => {
			rubberFrameId = null;
			applyRubberBand(pendingHover);
		});
	};

	/** Cierra el path: guarda el panel y lo pinta como Polygon permanente. */
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

		// El draft ya no hace falta: el panel lo sustituye.
		clearDraftGraphics();

		path.value = [];

		// Shape de dominio → store (Page) + Polygon Fabric.
		const shape = Shape.create(points, strokeWidth.value);

		mangaStore.addShape(shape);

		const panel = shapeToPolygon(shape);

		canvas.add(panel);
		canvas.bringObjectToFront(panel);

		// Volvemos a modo selección.
		syncInteractionMode();
	};

	/** Intenta añadir un punto de rejilla al path (o cerrar si vuelve al inicio). */
	const addPoint = (point: GridPoint) => {
		// Reglas de geometría: si no vale, el click no hace nada.
		if (!canExtendPathTo(point)) {
			return;
		}

		// Primer punto: arranca el trazo.
		if (path.value.length === 0) {
			path.value = [point];

			fabricCanvas.value?.discardActiveObject();

			syncInteractionMode();
			updateDraftLine();
			updateRubberBand(null);

			return;
		}

		// Puntos siguientes: alargamos el path y el draft.
		const nextPath = [...path.value, point];

		path.value = nextPath;

		updateDraftLine();
		updateRubberBand(null);

		// Si cerramos (último = primero con ≥4 puntos), commit del panel.
		if (isClosed(nextPath)) {
			commitPanel();
		}
	};

	/** Click del ratón → GridPoint más cercano (snap a la rejilla). */
	const pointFromEvent = (
		event: TPointerEventInfo<TPointerEvent>,
	): GridPoint => {
		return snapToGridPoint(
			event.scenePoint.x,
			event.scenePoint.y,
			layout.value,
		);
	};

	const onCanvasMouseDown = (event: TPointerEventInfo<TPointerEvent>) => {
		const canvas = fabricCanvas.value;

		// Trazo en curso: cualquier click intenta añadir punto.
		if (path.value.length > 0) {
			addPoint(pointFromEvent(event));

			return;
		}

		const target = event.target;

		// Click sobre un panel/imagen existente → dejar selección (no empezar trazo).
		// Con perPixelTargetFind, fuera de la forma el target ya no es la imagen.
		if (target && (isPanel(target) || isPanelImage(target))) {
			return;
		}

		// Hace falta ver la guía para empezar a dibujar.
		if (!showGridGuides.value) {
			return;
		}

		// Si Fabric aún tenía una imagen activa por bbox, soltarla al empezar trazo.
		const active = canvas?.getActiveObject();

		if (active && isPanelImage(active)) {
			canvas?.discardActiveObject();
		}

		addPoint(pointFromEvent(event));
	};

	const onCanvasMouseMove = (event: TPointerEventInfo<TPointerEvent>) => {
		// Solo hay rubber band (línea azul discontinua) si ya hay trazo abierto.
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

	// Cuando aparece el canvas: enganchamos eventos y aplicamos el modo idle.
	watch(
		fabricCanvas,
		(canvas, _previous, onCleanup) => {
			if (!canvas) {
				return;
			}

			bindCanvasEvents(canvas);
			syncInteractionMode();

			onCleanup(() => {
				unbindCanvasEvents(canvas);
			});
		},
		{ immediate: true },
	);

	// Ocultar la guía aborta el trazo (no se puede seguir dibujando a ciegas).
	watch(showGridGuides, (visible) => {
		if (!visible) {
			cancelStroke();
		}
	});

	// Cambio de geometría: contentResetEpoch → applyActivePage → cancelStroke.

	onBeforeUnmount(() => {
		if (rubberFrameId !== null) {
			cancelAnimationFrame(rubberFrameId);
			rubberFrameId = null;
		}

		const canvas = fabricCanvas.value;

		if (canvas) {
			unbindCanvasEvents(canvas);
		}

		cancelStroke();
	});

	return {
		path,
		cancelStroke,
		syncInteractionMode,
	};
};
