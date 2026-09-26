import { shallowRef, watch } from 'vue';
import { Polyline, type Canvas, type FabricImage, type FabricObject } from 'fabric';
import { GUIDE_STROKE_COLOR, panelFillColor } from '@/lib/fabric/fabricColors';
import {
	findPanelById,
	findPanelImageById,
	getPanelId,
	isGuide,
	isPanel,
	isPanelImage,
	removeObjectsByPanelId,
} from '@/lib/fabric/isGuide';
import { getObjectOverlayAnchor } from '@/lib/fabric/overlayAnchor';
import {
	hasGrayscaleFilter,
	setGrayscaleFilter,
} from '@/lib/fabric/panelImageFilters';
import { shapeImageFromFabric } from '@/lib/fabric/panelImageFabric';
import {
	isImageFile,
	placeImageFileInPanel,
} from '@/lib/fabric/panelImagePlace';
import { asPanelPolygonShape } from '@/lib/fabric/PanelPolygon';
import { cloneStrokes } from '@/lib/page/shapeStrokes';
import { useMangaStore } from '@/stores/manga';
import type { ShapeStroke, ShapeStrokePatch } from '@/types/page';
import type { GuidedPolyline } from '@/types/fabric';
import type {
	OverlayPlacement,
	PageOverlayPosition,
	ShapeActionMenuDeps,
} from '@/types/panel';

/** Halo azul sobre la arista: más ancho que el trazo para que se vea encima. */
const EDGE_HIGHLIGHT_EXTRA = 8;
const EDGE_HIGHLIGHT_MIN_WIDTH = 10;

const highlightStrokeWidth = (edgeWidth: number): number => {
	return Math.max(edgeWidth + EDGE_HIGHLIGHT_EXTRA, EDGE_HIGHLIGHT_MIN_WIDTH);
};

export const useShapeActionMenu = ({
	fabricCanvas,
	onChanged,
}: ShapeActionMenuDeps) => {
	const mangaStore = useMangaStore();

	const panelId = shallowRef<string | null>(null);
	const hasImage = shallowRef(false);
	const isGrayscale = shallowRef(false);
	const isFlipX = shallowRef(false);
	const isFlipY = shallowRef(false);
	const whiteFill = shallowRef(false);
	const strokes = shallowRef<ShapeStroke[]>([]);
	const position = shallowRef<PageOverlayPosition | null>(null);
	const placement = shallowRef<OverlayPlacement>('above');
	const highlightedEdge = shallowRef<number | null>(null);
	const highlightLine = shallowRef<GuidedPolyline | null>(null);

	const removeHighlightLine = () => {
		const line = highlightLine.value;

		if (!line) {
			return;
		}

		const owner = line.canvas ?? fabricCanvas.value;

		highlightLine.value = null;
		owner?.remove(line);
		owner?.requestRenderAll();
	};

	const syncEdgeHighlight = () => {
		const canvas = fabricCanvas.value;
		const edgeIndex = highlightedEdge.value;
		const id = panelId.value;
		const shape = id
			? mangaStore.shapes.find((item) => {
					return item.id === id;
				})
			: undefined;
		const start = edgeIndex === null ? undefined : shape?.points[edgeIndex];
		const end =
			shape && edgeIndex !== null
				? shape.points[(edgeIndex + 1) % shape.points.length]
				: undefined;

		if (!canvas || !shape || !start || !end || edgeIndex === null) {
			removeHighlightLine();

			return;
		}

		const points = [
			{ x: start.x, y: start.y },
			{ x: end.x, y: end.y },
		];
		const strokeWidth = highlightStrokeWidth(
			shape.strokes[edgeIndex]?.width ?? 0,
		);
		const current = highlightLine.value;

		if (current) {
			current.set({ points, strokeWidth });
			current.setCoords();
			current.dirty = true;
			canvas.bringObjectToFront(current);
			canvas.requestRenderAll();

			return;
		}

		const line = new Polyline(points, {
			fill: 'transparent',
			stroke: GUIDE_STROKE_COLOR,
			strokeWidth,
			strokeLineCap: 'square',
			selectable: false,
			evented: false,
			excludeFromExport: true,
			objectCaching: false,
		}) as GuidedPolyline;

		// Guía: el export y el hit-test la ignoran; no es parte del panel.
		line.isGuide = true;

		canvas.add(line);
		canvas.bringObjectToFront(line);
		highlightLine.value = line;
		canvas.requestRenderAll();
	};

	/** `null` quita el resalte. La línea no se guarda en el documento. */
	const highlightEdge = (edgeIndex: number | null) => {
		highlightedEdge.value = edgeIndex;
		syncEdgeHighlight();
	};

	const clearMenu = () => {
		panelId.value = null;
		hasImage.value = false;
		isGrayscale.value = false;
		isFlipX.value = false;
		isFlipY.value = false;
		whiteFill.value = false;
		strokes.value = [];
		position.value = null;
		placement.value = 'above';
		highlightedEdge.value = null;
		removeHighlightLine();
	};

	const resolvePanelId = (active: FabricObject | null): string | null => {
		if (!active || isGuide(active)) {
			return null;
		}

		if (isPanel(active) || isPanelImage(active)) {
			return getPanelId(active) ?? null;
		}

		return null;
	};

	const refreshMenu = () => {
		const canvas = fabricCanvas.value;
		const active = canvas?.getActiveObject() as FabricObject | null;
		const nextPanelId = resolvePanelId(active ?? null);

		if (!canvas || !active || !nextPanelId) {
			clearMenu();

			return;
		}

		const shape = mangaStore.shapes.find((item) => {
			return item.id === nextPanelId;
		});
		const anchor = getObjectOverlayAnchor(active);

		panelId.value = nextPanelId;
		hasImage.value = Boolean(shape?.image);
		isGrayscale.value = Boolean(shape?.image?.grayscale);
		isFlipX.value = Boolean(shape?.image?.flipX);
		isFlipY.value = Boolean(shape?.image?.flipY);
		whiteFill.value = Boolean(shape?.whiteFill);
		strokes.value = shape ? cloneStrokes(shape.strokes) : [];
		position.value = { left: anchor.left, top: anchor.top };
		placement.value = anchor.placement;
	};

	/**
	 * Actualiza una arista en el store y en el polígono Fabric. `record`
	 * distingue el arrastre del color picker (sin historial) del valor final.
	 */
	const applyEdgeStroke = (
		edgeIndex: number,
		patch: ShapeStrokePatch,
		record: boolean,
	) => {
		const canvas = fabricCanvas.value;
		const id = panelId.value;

		if (!canvas || !id) {
			return;
		}

		const changed = record
			? mangaStore.setShapeEdgeStroke(id, edgeIndex, patch)
			: mangaStore.updateShapeEdgeStroke(id, edgeIndex, patch);

		if (!changed) {
			return;
		}

		const shape = mangaStore.shapes.find((item) => {
			return item.id === id;
		});
		const panel = asPanelPolygonShape(findPanelById(canvas, id));

		if (shape && panel) {
			panel.setEdgeStrokes(shape.strokes);
		}

		canvas.requestRenderAll();
		refreshMenu();
		syncEdgeHighlight();
	};

	const setEdgeStroke = (edgeIndex: number, patch: ShapeStrokePatch) => {
		applyEdgeStroke(edgeIndex, patch, true);
	};

	const previewEdgeStroke = (edgeIndex: number, patch: ShapeStrokePatch) => {
		applyEdgeStroke(edgeIndex, patch, false);
	};

	const deleteShape = () => {
		const canvas = fabricCanvas.value;
		const id = panelId.value;

		if (!canvas || !id) {
			return;
		}

		mangaStore.removeShape(id);
		removeObjectsByPanelId(canvas, id);
		canvas.discardActiveObject();
		clearMenu();
		onChanged?.();
		canvas.requestRenderAll();
	};

	const clearImage = () => {
		const canvas = fabricCanvas.value;
		const id = panelId.value;

		if (!canvas || !id || !hasImage.value) {
			return;
		}

		mangaStore.setShapeImage(id, null);

		canvas
			.getObjects()
			.filter((object) => {
				return isPanelImage(object) && getPanelId(object) === id;
			})
			.forEach((object) => {
				canvas.remove(object);
			});

		const panel = findPanelById(canvas, id);
		const shape = mangaStore.shapes.find((item) => {
			return item.id === id;
		});

		if (panel) {
			panel.evented = true;
			panel.selectable = true;
			panel.set({ fill: panelFillColor(Boolean(shape?.whiteFill)) });
			canvas.setActiveObject(panel);
		} else {
			canvas.discardActiveObject();
			clearMenu();
		}

		onChanged?.();
		canvas.requestRenderAll();
		refreshMenu();
	};

	const placeImage = async (file: File): Promise<boolean> => {
		const canvas = fabricCanvas.value;
		const id = panelId.value;

		if (!canvas || !id || !isImageFile(file)) {
			return false;
		}

		const placed = await placeImageFileInPanel({
			canvas,
			panelId: id,
			file,
		});

		if (!placed) {
			return false;
		}

		onChanged?.();
		refreshMenu();

		return true;
	};

	const toggleGrayscale = () => {
		const canvas = fabricCanvas.value;
		const id = panelId.value;

		if (!canvas || !id || !hasImage.value) {
			return;
		}

		const fabricImage = findPanelImageById(canvas, id) as FabricImage | null;

		if (!fabricImage) {
			return;
		}

		const next = !hasGrayscaleFilter(fabricImage);

		setGrayscaleFilter(fabricImage, next);
		mangaStore.setShapeImage(id, shapeImageFromFabric(fabricImage));
		onChanged?.();
		canvas.requestRenderAll();
		refreshMenu();
	};

	const toggleFlip = (axis: 'flipX' | 'flipY') => {
		const canvas = fabricCanvas.value;
		const id = panelId.value;

		if (!canvas || !id || !hasImage.value) {
			return;
		}

		const fabricImage = findPanelImageById(canvas, id) as FabricImage | null;

		if (!fabricImage) {
			return;
		}

		fabricImage.set({ [axis]: !fabricImage[axis] });
		fabricImage.setCoords();
		mangaStore.setShapeImage(id, shapeImageFromFabric(fabricImage));
		onChanged?.();
		canvas.requestRenderAll();
		refreshMenu();
	};

	const toggleWhiteFill = () => {
		const canvas = fabricCanvas.value;
		const id = panelId.value;

		if (!canvas || !id) {
			return;
		}

		const next = !whiteFill.value;

		mangaStore.setShapeWhiteFill(id, next);

		const panel = findPanelById(canvas, id);

		if (panel) {
			panel.set({
				fill: panelFillColor(next, { hasImage: hasImage.value }),
			});
		}

		onChanged?.();
		canvas.requestRenderAll();
		refreshMenu();
	};

	const bindCanvasEvents = (canvas: Canvas) => {
		canvas.on('selection:created', refreshMenu);
		canvas.on('selection:updated', refreshMenu);
		canvas.on('selection:cleared', clearMenu);
		canvas.on('object:modified', refreshMenu);
		canvas.on('object:moving', refreshMenu);
		canvas.on('object:scaling', refreshMenu);
	};

	const unbindCanvasEvents = (canvas: Canvas) => {
		canvas.off('selection:created', refreshMenu);
		canvas.off('selection:updated', refreshMenu);
		canvas.off('selection:cleared', clearMenu);
		canvas.off('object:modified', refreshMenu);
		canvas.off('object:moving', refreshMenu);
		canvas.off('object:scaling', refreshMenu);
	};

	watch(
		fabricCanvas,
		(canvas, _previous, onCleanup) => {
			if (!canvas) {
				clearMenu();

				return;
			}

			bindCanvasEvents(canvas);

			onCleanup(() => {
				unbindCanvasEvents(canvas);
				clearMenu();
			});
		},
		{ immediate: true },
	);

	return {
		hasImage,
		isGrayscale,
		isFlipX,
		isFlipY,
		whiteFill,
		strokes,
		position,
		placement,
		deleteShape,
		clearImage,
		placeImage,
		toggleGrayscale,
		toggleFlipX: () => toggleFlip('flipX'),
		toggleFlipY: () => toggleFlip('flipY'),
		toggleWhiteFill,
		setEdgeStroke,
		previewEdgeStroke,
		highlightEdge,
		clearMenu,
	};
};
