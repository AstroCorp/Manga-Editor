import {
	Intersection,
	Point,
	util,
	type Canvas,
	type FabricObject,
	type Polygon,
} from 'fabric';
import {
	findPanelById,
	getPanelId,
	isPanelImage,
} from '@/lib/fabric/isGuide';
import type { CanvasTargetFind } from '@/types/fabric';

/** Vértices del panel en coords de escena (página). */
export const getPanelScenePoints = (panel: FabricObject): Point[] => {
	const polygon = panel as Polygon;
	const points = polygon.points;

	if (!Array.isArray(points) || points.length < 3) {
		return panel.getCoords();
	}

	const matrix = panel.calcTransformMatrix();
	const offsetX = polygon.pathOffset?.x ?? 0;
	const offsetY = polygon.pathOffset?.y ?? 0;

	return points.map((point) => {
		return util.transformPoint(
			new Point(point.x - offsetX, point.y - offsetY),
			matrix,
		);
	});
};

export const panelContainsScenePoint = (panel: FabricObject, point: Point): boolean => {
	return Intersection.isPointInPolygon(point, getPanelScenePoints(panel));
};

/**
 * Hace que las panelImage solo reciban hits dentro del polígono del panel.
 * (perPixelTargetFind + clip absoluto no basta de forma fiable en Fabric 7.)
 */
export const installPanelImageTargetFind = (canvas: Canvas): void => {
	const targetCanvas = canvas as unknown as CanvasTargetFind;
	const originalCheckTarget = targetCanvas._checkTarget.bind(canvas);

	targetCanvas._checkTarget = (obj: FabricObject, pointer: Point): boolean => {
		if (!isPanelImage(obj)) {
			return originalCheckTarget(obj, pointer);
		}

		if (!obj.visible || !obj.evented) {
			return false;
		}

		const panelId = getPanelId(obj);

		if (!panelId) {
			return originalCheckTarget(obj, pointer);
		}

		const panel = findPanelById(canvas, panelId);

		if (!panel) {
			return originalCheckTarget(obj, pointer);
		}

		return panelContainsScenePoint(panel, pointer);
	};
};
